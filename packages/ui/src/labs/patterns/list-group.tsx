import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for patterns/).
   ListGroup: a heading with a count over the rows that belong under it — Documents' "Needs you 4"
   and "Ready 1" (v0). Nothing about what the rows are; a list is one or more groups. A group with
   no rows isn't drawn (the caller leaves it out), so a heading never sits over nothing.
   The heading is small caps in the muted ink, the count at its right; the rows follow with no
   frame of their own (flat rows, ruled by the row). */

/** A heading with a count over the rows under it: one group of a list. */
function ListGroup({
  label,
  count,
  gutter = true,
  children,
}: {
  /** The group's name ("Needs you"). It labels the list of rows under it. */
  label: string
  /** How many rows are in it; shown at the heading's right. */
  count: number
  /** Inset to the workspace gutter (a WorkspacePage list). Off in a page's reading column, where the column is the edge. */
  gutter?: boolean
  /** The rows. */
  children: ReactNode
}) {
  return (
    <section data-slot="list-group" aria-label={`${label}, ${count}`}>
      <h3 data-slot="list-group-heading" className={cn("flex items-center justify-between pt-3 pb-1 eyebrow text-muted-foreground", gutter ? "gutter-workspace" : "")}>
        <span>{label}</span>
        <span className="font-semibold tracking-normal tabular-nums">{count}</span>
      </h3>
      <ul data-slot="list-group-rows" className="flex flex-col">
        {children}
      </ul>
    </section>
  )
}

export { ListGroup }

export type ListGroupProps = ComponentProps<typeof ListGroup>
