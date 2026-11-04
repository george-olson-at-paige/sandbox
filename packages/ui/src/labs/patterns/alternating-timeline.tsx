import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md (George 2026-11-04: Memories needs the
   alternating timeline, a view of its own beside the grid). Entries on one rail down the
   middle, taking turns left and right, in the caller's order (newest first, say), under group
   marks on the rail (a year). The library's Timeline is the other kind: a rail at the start,
   for an activity log; this one is for a life told in moments.
   - From md: the rail in a 40 column between two halves (`grid-cols-timeline`); an entry sits in
     its half against the rail, a dot on the rail at its top, its date over it, aligned to the
     rail's side. The turns run across the groups, so a group never starts on the same side by
     rule; a group's mark sits on the rail, centred.
   - Below md: one column, the rail at the start (16 in), every entry to its right; the date
     over the entry, the dot on the rail.
   An entry is the caller's (a MemoryCard); the timeline draws the rail, the marks, the dots and
   the dates. It is a list of lists (`ol` of groups, each an `ol` of entries) for assistive tech:
   the group's mark labels its list. */

export type TimelineEntry = { id: string; date: string; content: ReactNode }
export type TimelineGroup = { id: string; label: string; entries: TimelineEntry[] }

/** Entries on a rail down the middle, taking turns left and right, under group marks (years); one column below md. */
export function AlternatingTimeline({
  groups,
  label,
}: {
  groups: TimelineGroup[]
  /** The whole timeline's name ("Memories, by year"). */
  label: string
}) {
  let turn = 0
  return (
    <ol data-slot="alternating-timeline" aria-label={label} className="relative flex flex-col gap-8 py-2">
      {/* The rail: at the start below md, down the middle from md. */}
      <span aria-hidden className="absolute inset-y-0 left-4 w-px bg-border md:left-1/2" />
      {groups.map((g) => (
        <li key={g.id} className="relative flex flex-col gap-6">
          <span
            data-slot="alternating-timeline-mark"
            className="relative z-raised inline-flex h-7 items-center self-start rounded-full border border-border bg-background px-3 text-xs font-bold tabular-nums md:self-center"
          >
            {g.label}
          </span>
          <ol aria-label={g.label} className="flex flex-col gap-6">
            {g.entries.map((e) => {
              const left = turn++ % 2 === 0
              return (
                <li
                  key={e.id}
                  data-slot="alternating-timeline-entry"
                  data-side={left ? "left" : "right"}
                  className="relative pl-10 md:grid md:grid-cols-timeline md:pl-0"
                >
                  <span
                    aria-hidden
                    className="absolute top-1.5 left-4 z-raised size-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary md:static md:col-start-2 md:row-start-1 md:mt-1.5 md:translate-x-0 md:justify-self-center"
                  />
                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-2 md:row-start-1",
                      left ? "md:col-start-1 md:items-end md:text-right" : "md:col-start-3",
                    )}
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{e.date}</span>
                    <div className="w-full text-left">{e.content}</div>
                  </div>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}

export type AlternatingTimelineProps = ComponentProps<typeof AlternatingTimeline>
