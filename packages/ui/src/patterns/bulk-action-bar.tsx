"use client"

import type { ComponentProps } from "react"
import { useId, useRef, type ElementType, type ReactNode } from "react"
import { CircleCheck, X } from "lucide-react"

import { formatMetric } from "../lib/metrics"
import { Button } from "../components/actions/button"
import { Tooltip } from "../components/overlays/tooltip"
import { orderActions, useListActionRunner, type ListAction, type RunnableAction } from "../components/internal/list-action"

/* @archetype Composite (ARCHETYPES.md).
   BulkActionBar (R12-10, rationale in REVIEW-12): what a list's toolbar row becomes while rows
   are selected (Polaris, Gmail): in the same place and height, so nothing shifts and nothing
   floats over the rows.
   - "3 people selected" first (announced politely as it changes).
   - Select all matching: once the whole page is selected and more rows match, a link-style
     button offers them all ("Select all 143 matching"); with all of them selected it says so.
   - The bulk actions (ListAction, the same type RowActions takes), as `sm` buttons, destructive
     last; each confirms when it says so (always for destructive), a reason when it's audited;
     an action that can't apply to any selected row is off, its reason the button's description and
     tooltip (one that applies to some says so in its confirm).
     Red only for irreversible ones (R2-03).
   - Clear (and Escape anywhere in the bar) ends the selection; the page puts focus back in the
     toolbar.
   The page clears the selection after an action works and shows the result in the toolbar's
   status line (ListPage `status`), never a banner. */

/** A list's toolbar row while rows are selected: the count, select-all-matching, the bulk actions and Clear. */
function BulkActionBar({
  count,
  noun,
  matching,
  pageAllSelected,
  onSelectAllMatching,
  onClear,
  actions,
  onDone,
  linkAs: Link = "a",
  status,
}: {
  /** How many rows are selected (on every page). */
  count: number
  /** What a row is, singular and plural ({ one: "person", other: "people" }). */
  noun: { one: string; other: string }
  /** How many rows match the list's current segment, search and filters. */
  matching: number
  /** Every row on the current page is selected (offers select-all-matching when more match). */
  pageAllSelected: boolean
  /** Selects every matching row. */
  onSelectAllMatching: () => void
  /** Ends the selection (Clear, Escape). */
  onClear: () => void
  /** The bulk actions, in order (destructive ones move last). */
  actions: readonly ListAction[]
  /** Hears each action that worked (after its confirm); the page clears the selection and shows the result. */
  onDone?: (action: RunnableAction) => void
  /** The app's router link for `link` actions. */
  linkAs?: ElementType
  /** A row action's result while the selection stands (the toolbar's status line is hidden then). */
  status?: ReactNode
}) {
  const bar = useRef<HTMLDivElement>(null)
  const idBase = useId()
  const { start, dialog } = useListActionRunner({ onDone, returnFocusTo: () => bar.current?.querySelector<HTMLElement>("[data-slot='bulk-clear']") })
  const word = (n: number) => (n === 1 ? noun.one : noun.other)
  const all = count >= matching
  return (
    <div
      ref={bar}
      data-slot="bulk-action-bar"
      role="group"
      aria-label="Bulk actions"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault()
          onClear()
        }
      }}
      className="flex min-h-control-sm flex-1 flex-wrap items-center gap-2"
    >
      <span aria-live="polite" className="mr-1 text-sm font-semibold text-foreground-strong tabular-nums">
        {formatMetric(count, { kind: "count" }, { compact: false })} {word(count)} selected
      </span>
      {pageAllSelected && !all && (
        <Button variant="link" size="inline" className="text-sm" onClick={onSelectAllMatching}>
          Select all {formatMetric(matching, { kind: "count" }, { compact: false })} matching
        </Button>
      )}
      {all && matching > 1 && <span className="text-sm font-medium text-muted-foreground">All {formatMetric(matching, { kind: "count" }, { compact: false })} matching</span>}
      <span aria-hidden className="mx-1 h-5 w-px bg-border" />
      {orderActions(actions).map((a) =>
        a.kind === "menu" ? null /* submenus are for row menus only */ : a.kind === "link" ? (
          <Button key={a.id} asChild variant="secondary" size="sm" icon={a.icon}>
            <Link href={a.href}>{a.label}</Link>
          </Button>
        ) : a.disabledReason ? (
          // Off for this selection: the reason is the button's description and its tooltip (the
          // wrapper takes the hover, since an aria-disabled button ignores the pointer).
          <Tooltip key={a.id} content={a.disabledReason}>
            <span className="inline-flex">
              <Button variant="secondary" size="sm" icon={a.icon} aria-disabled aria-describedby={`${idBase}-${a.id}`} data-kind={a.kind}>
                {a.label}
              </Button>
              <span id={`${idBase}-${a.id}`} className="sr-only">
                {a.disabledReason}
              </span>
            </span>
          </Tooltip>
        ) : (
          <Button
            key={a.id}
            variant={a.kind === "destructive" && a.irreversible ? "destructive" : "secondary"}
            size="sm"
            icon={a.icon}
            data-kind={a.kind}
            onClick={() => void start(a)}
          >
            {a.label}
          </Button>
        )
      )}
      <span role="status" data-slot="list-status" className="ml-auto flex items-center gap-1.5 text-sm font-medium text-success-foreground">
        {status && (
          <>
            <CircleCheck aria-hidden className="size-icon" />
            {status}
          </>
        )}
      </span>
      <Button data-slot="bulk-clear" variant="ghost" size="sm" icon={<X aria-hidden />} onClick={onClear}>
        Clear selection
      </Button>
      {dialog}
    </div>
  )
}

export { BulkActionBar }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type BulkActionBarProps = ComponentProps<typeof BulkActionBar>
