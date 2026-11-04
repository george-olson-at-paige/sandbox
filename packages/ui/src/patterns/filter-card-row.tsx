"use client"

import type { ComponentProps } from "react"
import { useId } from "react"
import { CircleCheck } from "lucide-react"

import { formatMetric } from "../lib/metrics"
import { Skeleton } from "../components/feedback/skeleton"
import { ToggleGroup, ToggleGroupItem } from "../components/inputs/toggle-group"
import { Tooltip } from "../components/overlays/tooltip"
import { Grid } from "../primitives/grid"

/* @archetype Composite (ARCHETYPES.md; §2 listed it as a Surface: each card is one, the row is a control made of them).
   FilterCardRow (R12-10, rationale in REVIEW-12): a list page's segments as a row of cards that
   look like the compact KPI row (KpiRow columns={5}: the same grid, a 24px count under the label)
   and act as one single-choice filter.
   - Each card is a named question with its count ("Trial · 18"). One is chosen at a time; "All"
     usually comes first. Counts are the caller's: what each segment would show under the current
     search and filters (lib/list-query.ts `deriveList`), so they follow the search.
   - A radio group: one tab stop (the chosen card), arrow keys move and choose, Home and End jump.
     Each card's name is its label and count; its description (if any) is its description.
     The group is a single ToggleGroup (U-04): the base gives the tab stop, the arrow keys, Home and
     End, the radio roles and `data-state`; this file adds only what a radio group has over a
     toggle group, that a card is chosen as focus reaches it and that the chosen one can't be
     unchosen (the base would clear the value on a second press).
   - States are the ToggleGroupItem `card` variant (R15-13 option C, quieted by R21-01 after
     George found these cards "much less clean" than the Journeys mock's): the compact Card on
     the admin page's hairline edge, flat at rest. Hover: the border one step up
     (`--hairline-strong`), never blue (blue means chosen). Pressed: the relative press. Chosen:
     still white, the brand border doubled by an inner 1px ring and a 16px check top-right, beside
     the label (so it isn't colour alone); no shadow, no label tint, and hovering it changes nothing.
   - Type (R21-01, the mock's and Vue's count card): the label 12/600 muted, the count 24/700
     tight with no leading, 4px apart, so the number leads and the label names it.
   - Even heights (R21-01): when any card has a description, every card keeps that line's room,
     so the row is even by its content rather than by the grid stretching the short ones.
   - Focus (R15-13, R15-17): no gapped outline. In this radio group focus always sits on the chosen
     card (arrow keys move and choose), so the only focused state is chosen + focus: the halo
     (brand blue at 50%) outside the chosen border, 2px off it (`cardFocus`, R21-01).
   - Five at most (the compact KPI row's grid: two, three from lg, five from xl); a sixth question
     belongs in the toolbar's Filters.
   - Loading: counts as skeletons. A count that couldn't be had (`null`) shows "—" and is read as
     "unknown". */

/** One segment card. */
type FilterCard = {
  id: string
  label: string
  /** How many rows it would show; null while unknown (an error). */
  count: number | null
  /** One short line under the count ("Past due, locked out or unverified"). */
  description?: string
}

const COLUMNS = {
  2: { base: 2 },
  3: { base: 2, lg: 3 },
  4: { base: 2, lg: 4 },
  5: { base: 2, lg: 3, xl: 5 },
} as const

/** A row of KPI-styled segment cards with counts: one chosen at a time, filtering the list below. */
function FilterCardRow({
  cards,
  value,
  onValueChange,
  label,
  loading = false,
  className,
}: {
  /** Two to five segments, in reading order. */
  cards: readonly FilterCard[]
  /** The chosen card's id. */
  value: string
  /** Called with the card chosen (click, arrow keys, Home/End). */
  onValueChange: (id: string) => void
  /** The group's accessible name ("Segments"). */
  label: string
  /** Counts as skeletons while the list loads. */
  loading?: boolean
  /** Placement, not restyling. */
  className?: string
}) {
  const idBase = useId()
  const n = Math.min(5, Math.max(2, cards.length)) as 2 | 3 | 4 | 5
  const described = cards.some((card) => card.description)

  return (
    <ToggleGroup
      type="single"
      role="radiogroup"
      aria-label={label}
      value={value}
      // The base clears the value when the pressed item is pressed again; a radio group keeps it.
      onValueChange={(id) => id && onValueChange(id)}
      data-slot="filter-card-row"
      className={className}
    >
      <Grid columns={COLUMNS[n]}>
        {cards.map((card) => {
          const checked = card.id === value
          const descId = card.description ? `${idBase}-${card.id}` : undefined
          const button = (
            <ToggleGroupItem
              key={card.id}
              value={card.id}
              variant="card"
              aria-describedby={descId}
              data-slot="filter-card"
              // A radio group chooses as focus moves (arrow keys, Home, End); the base only moves focus.
              onFocus={() => !checked && onValueChange(card.id)}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="truncate text-xs font-semibold text-muted-foreground">{card.label}</span>
                {/* Top-right, on the label's line: the non-colour cue for the chosen card. */}
                {checked && <CircleCheck aria-hidden data-slot="filter-card-check" className="size-icon shrink-0 text-primary" />}
              </span>
              {loading ? (
                <Skeleton width="1/2" className="h-6" />
              ) : (
                <span data-slot="filter-card-count" className="text-2xl leading-none font-bold tracking-tight text-foreground-strong tabular-nums">
                  {card.count === null ? (
                    <>
                      <span aria-hidden>—</span>
                      <span className="sr-only">unknown</span>
                    </>
                  ) : (
                    formatMetric(card.count, { kind: "count" })
                  )}
                </span>
              )}
              {card.description ? (
                // One line with an ellipsis (R13-07); the whole text is the card's description
                // (screen readers) and its Tooltip.
                <span id={descId} data-slot="filter-card-description" className="truncate text-xs font-medium text-muted-foreground">
                  {card.description}
                </span>
              ) : (
                // The line's room, so the row is even by content (R21-01).
                described && <span aria-hidden className="min-h-4" />
              )}
            </ToggleGroupItem>
          )
          return card.description ? (
            <Tooltip key={card.id} content={card.description} side="bottom">
              {button}
            </Tooltip>
          ) : (
            button
          )
        })}
      </Grid>
    </ToggleGroup>
  )
}

export { FilterCardRow }
export type { FilterCard }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FilterCardRowProps = ComponentProps<typeof FilterCardRow>
