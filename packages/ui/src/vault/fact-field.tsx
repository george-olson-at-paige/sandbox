"use client"

import type { ComponentProps } from "react"
import { useState, type ReactNode } from "react"
import { CheckIcon, PlusIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Badge } from "../components/display/badge"
import { Button } from "../components/actions/button"
import { Inline } from "../primitives/inline"
import { Eyebrow } from "../components/display/eyebrow"
import { ChoiceCardGroup, ChoiceCardOption } from "./choice-card"
import { InlineEdit } from "../forms/inline-edit"

export type FactFieldState =
  | { kind: "ordinary"; value: string; source?: string; sourceBadge?: string }
  | { kind: "autofilled"; value: string; source: string; confirmedSource: string }
  | { kind: "notFound"; expected: boolean; reason: string; addLabel: string; declineLabel?: string }
  | { kind: "conflict"; options: Array<{ id: string; value: string; source: string }>; preselected: string }
  | { kind: "answered"; value: string; source: string }

/* @archetype Composite (ARCHETYPES.md).
   FactField ("Key details"): ordinary · autofilled · notFound · conflict · answered · editing.
   Status is shown by tone (Badge), never by a new component.
   One read state for one value (R12-06, GAPS #125): the value is InlineEdit's read state (the
   value as one button with a pencil; a click opens the editor in the same box), and FactField
   adds only what's its own: the eyebrow with its status badge above, and under the value the
   source line and the state's actions (Confirm, Add, the decline). No Edit or Change link: the
   value is the way in. The InlineEdit stays mounted across ordinary, auto-filled, not found and
   answered (the first child in each), so after a save it keeps focus on the value and shows
   "Saved" there even when the state changes kind. Editing is controlled (`editing`,
   `onEditingChange`) so Add opens the same editor and the badge and source hide while it's open.
   - auto-filled: the value drawn highlighted (formatValue) until confirmed or edited.
   - not found: no value; the read state says "Nothing here yet" (InlineEdit's empty text), the
     reason under it, then Add (opens the editor) and the decline.
   - answered: no value; the read state shows the owner's answer (emptyText), so a click starts
     an empty editor, never one pre-filled with "I don't have one".
   - conflict: the choice cards and "Use this one"; no value to edit until one is chosen. */
/** One key detail with its status: ordinary, auto-filled, not found, conflict, answered, editing. */
function FactField({
  label,
  state: initial,
  wide,
  control = "input",
  options,
}: {
  /** The field's name, shown as the eyebrow and used as the editor's accessible name. */
  label: string
  /** Initial state: ordinary · autofilled · notFound · conflict · answered. The field keeps its own state after that (confirm, edit, choose). */
  state: FactFieldState
  /** Span both columns of a FactFieldGrid (long values). Conflicts always span. */
  wide?: boolean
  /** Editor for the value: input (default) · select · textarea. */
  control?: "input" | "select" | "textarea"
  /** [value, label] pairs for the select control. */
  options?: Array<[string, string]>
}) {
  const [state, setState] = useState<FactFieldState>(initial)
  const [editing, setEditing] = useState(false)
  const [choice, setChoice] = useState(initial.kind === "conflict" ? initial.preselected : "")
  const save = (v: string) => {
    if (v.trim()) setState({ kind: "ordinary", value: v, source: "Edited by you" })
  }

  /** The value: InlineEdit's read and edit states (the first child in every kind that has one, so it stays mounted). */
  const valueEditor = (opts: { value: string; highlight?: boolean; emptyText?: ReactNode }) => (
    <InlineEdit
      label={label}
      hideLabel
      editing={editing}
      onEditingChange={setEditing}
      control={control}
      options={options}
      defaultValue={opts.value}
      emptyText={opts.emptyText}
      formatValue={opts.highlight ? (v) => <Highlight>{v}</Highlight> : undefined}
      onSave={save}
    />
  )

  let badge: ReactNode = null
  let body: ReactNode
  if (state.kind === "ordinary") {
    if (state.sourceBadge) badge = <Badge tone="neutral" appearance="outline" size="xs">{state.sourceBadge}</Badge>
    body = (
      <>
        {valueEditor({ value: state.value })}
        {state.source && !editing && <Source>{state.source}</Source>}
      </>
    )
  } else if (state.kind === "autofilled") {
    badge = <Badge tone="success" size="xs" icon={<CheckIcon />}>Auto-filled</Badge>
    body = (
      <>
        {valueEditor({ value: state.value, highlight: true })}
        {!editing && (
          <Source>
            {state.source} ·{" "}
            <Button variant="link" size="inline" onClick={() => setState({ kind: "ordinary", value: state.value, source: state.confirmedSource })}>
              Confirm
            </Button>
          </Source>
        )}
      </>
    )
  } else if (state.kind === "notFound") {
    if (state.expected) badge = <Badge tone="warning" size="xs">Not found</Badge>
    body = (
      <>
        {valueEditor({ value: "" })}
        {!editing && (
          <>
            <Source>{state.reason}</Source>
            <Inline gap={4} className="mt-1.5 text-sm">
              <Button variant="link" size="inline" icon={<PlusIcon />} onClick={() => setEditing(true)}>
                {state.addLabel}
              </Button>
              {state.declineLabel && (
                <Button
                  variant="quiet"
                  size="inline"
                  onClick={() => setState({ kind: "answered", value: state.declineLabel!, source: "You told us this just now." })}
                >
                  {state.declineLabel}
                </Button>
              )}
            </Inline>
          </>
        )}
      </>
    )
  } else if (state.kind === "conflict") {
    badge = <Badge tone="attention" size="xs">Doesn’t match</Badge>
    body = (
      <>
        <Source className="mt-0">We have two values from two places, so pick the one that’s correct.</Source>
        <ChoiceCardGroup value={choice} onValueChange={setChoice} aria-label={label} className="mt-2">
          {state.options.map((o) => (
            <ChoiceCardOption key={o.id} value={o.id} selected={choice === o.id} title={o.value} description={o.source} />
          ))}
        </ChoiceCardGroup>
        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => {
              const o = state.options.find((x) => x.id === choice)
              if (o) setState({ kind: "ordinary", value: o.value, source: "Chosen by you" })
            }}
          >
            Use this one
          </Button>
        </div>
      </>
    )
  } else {
    badge = <Badge tone="neutral" appearance="outline" size="xs">Answered</Badge>
    body = (
      <>
        {valueEditor({ value: "", emptyText: state.value })}
        {!editing && <Source>{state.source}</Source>}
      </>
    )
  }

  return (
    <div
      data-slot="fact-field"
      data-state={editing ? "editing" : state.kind}
      className={cn("border-t border-divider py-3", (wide || state.kind === "conflict") && "col-span-full")}
    >
      {/* Badges are size xs: the row stays 16px tall with or without one (R1-10). */}
      <Inline gap={2} className="mb-1">
        <Eyebrow>{label}</Eyebrow>
        {!editing && badge}
      </Inline>
      {body}
    </div>
  )
}

/* The highlighted value (R2-28, GAPS #48; prototype vault.css:181): a tone-tinted underlay with
   an inset underline, marking a value Paige filled in that the owner hasn't confirmed. Drawn
   inside InlineEdit's read state through formatValue (R12-06). Status by tone, never a new
   component. */
function Highlight({ children }: { children: ReactNode }) {
  return (
    <span data-tone="success" className="-mx-1 rounded-sm border-b-2 border-success-border bg-success-subtle px-1">
      {children}
    </span>
  )
}

function Source({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1.5 text-xs font-medium text-muted-foreground", className)}>{children}</p>
}

/** Two-column grid of FactFields (prototype .vt-fields). */
function FactFieldGrid({
  children,
  columns = 2,
}: {
  /** FactFields, in reading order. */
  children: ReactNode
  /** 2 (default): two columns from md · 1: always one column. */
  columns?: 1 | 2
}) {
  return <div className={cn("grid gap-x-6", columns === 2 && "md:grid-cols-2")}>{children}</div>
}

export { FactField, FactFieldGrid }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FactFieldProps = ComponentProps<typeof FactField>
export type FactFieldGridProps = ComponentProps<typeof FactFieldGrid>
