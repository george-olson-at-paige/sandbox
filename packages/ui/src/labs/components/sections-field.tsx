"use client"

import type { ComponentProps } from "react"
import { useEffect, useRef } from "react"
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "../../components/actions/button"
import { IconButton } from "../../components/actions/icon-button"
import { Input } from "../../components/inputs/input"
import { Textarea } from "../../components/inputs/textarea"
import { Field } from "../../forms/field"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §3 (George 2026-11-04): a story told in parts
   — a memory's sections, each a title and the text under it. RepeatField's add-and-remove, plus:
   - Suggestions: the prompts the caller has (a memory's category's) as small buttons over Add,
     "Start a part with: Who was there · What we did". One starts a part with that title and puts
     focus in its text; a prompt already used as a title isn't offered again. A suggestion only
     fills the title; nothing keeps it tied to the prompt (the API's rule).
   - Order: ↑ and ↓ on each part (first can't go up, last can't go down); focus stays on the
     moved part's button, so the keyboard can keep moving it. Not drag: a long text is a poor
     thing to drag, and the arrows say what they do.
   - × takes a part out; focus goes to the part that takes its place, or to Add. */

export type Section = { id: string; title: string; text: string }

/** A story in titled parts: add (or start from a suggestion), reorder with ↑ ↓, remove; focus kept. */
export function SectionsField({
  sections,
  onChange,
  suggestions = [],
  newId,
  copy,
}: {
  sections: Section[]
  onChange: (sections: Section[]) => void
  /** Titles to start a part with (a category's prompts). */
  suggestions?: string[]
  /** A new part's id. */
  newId: () => string
  /** The words: a part's name, its fields, Add, the suggestions' lead, and the move and remove buttons' names. */
  copy: {
    row: (index: number) => string
    title: string
    text: string
    add: string
    suggestions: string
    up: (row: string) => string
    down: (row: string) => string
    remove: (row: string) => string
  }
}) {
  const list = useRef<HTMLOListElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const focus = useRef<{ index: number; on: "title" | "text" | "up" | "down" } | "add" | null>(null)
  useEffect(() => {
    const target = focus.current
    focus.current = null
    if (!target) return
    if (target === "add") return addRef.current?.focus()
    const part = list.current?.children[target.index] as HTMLElement | undefined
    part?.querySelector<HTMLElement>(`[data-focus=${target.on}]`)?.focus()
  })
  const used = new Set(sections.map((s) => s.title.trim().toLowerCase()))
  const offered = suggestions.filter((p) => !used.has(p.trim().toLowerCase()))
  const update = (i: number, patch: Partial<Section>) => onChange(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, by: -1 | 1) => {
    const next = [...sections]
    const [part] = next.splice(i, 1)
    next.splice(i + by, 0, part!)
    focus.current = { index: i + by, on: i + by === 0 ? "down" : i + by === sections.length - 1 ? "up" : by < 0 ? "up" : "down" }
    onChange(next)
  }
  const add = (title = "") => {
    focus.current = { index: sections.length, on: title ? "text" : "title" }
    onChange([...sections, { id: newId(), title, text: "" }])
  }
  return (
    <div data-slot="sections-field" className="flex flex-col gap-3">
      {sections.length > 0 && (
        <ol ref={list} className="flex flex-col gap-3">
          {sections.map((s, i) => {
            const row = copy.row(i)
            return (
              <li key={s.id} data-slot="sections-field-part" role="group" aria-label={row} className="flex items-start gap-2 rounded-lg border border-divider p-3">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <Field label={copy.title}>
                    <Input data-focus="title" value={s.title} onChange={(e) => update(i, { title: e.target.value })} />
                  </Field>
                  <Field label={copy.text}>
                    <Textarea data-focus="text" value={s.text} onChange={(e) => update(i, { text: e.target.value })} />
                  </Field>
                </div>
                <div className="flex flex-col gap-1">
                  <IconButton
                    type="button"
                    data-focus="up"
                    variant="ghost"
                    shape="rect"
                    icon={<ArrowUpIcon />}
                    aria-label={copy.up(row)}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <IconButton
                    type="button"
                    data-focus="down"
                    variant="ghost"
                    shape="rect"
                    icon={<ArrowDownIcon />}
                    aria-label={copy.down(row)}
                    disabled={i === sections.length - 1}
                    onClick={() => move(i, 1)}
                  />
                  <IconButton
                    type="button"
                    variant="ghost"
                    shape="rect"
                    icon={<XIcon />}
                    aria-label={copy.remove(row)}
                    onClick={() => {
                      focus.current = sections.length - 1 > i ? { index: i, on: "title" } : i > 0 ? { index: i - 1, on: "title" } : "add"
                      onChange(sections.filter((_, j) => j !== i))
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {offered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{copy.suggestions}</span>
          {offered.map((p) => (
            <Button key={p} type="button" variant="secondary" size="sm" shape="rect" icon={<PlusIcon />} onClick={() => add(p)}>
              {p}
            </Button>
          ))}
        </div>
      )}
      <Button ref={addRef} type="button" variant="secondary" size="sm" shape="rect" icon={<PlusIcon />} className="self-start" onClick={() => add()}>
        {copy.add}
      </Button>
    </div>
  )
}

export type SectionsFieldProps = ComponentProps<typeof SectionsField>
