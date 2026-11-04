import type { ReactNode } from "react"

import { cn } from "../../lib/utils"
import type { Shape } from "../../lib/vocabulary"
import { dataFill, type DataColor } from "../internal/data-color"

/* @archetype Chart (ARCHETYPES.md).
   Legend (R21-09): what the marks in a bar or a column mean, as a row of swatches and labels —
   "▬ Reached  ▬ Most people's time  ▏Median" above the Journeys table, and "● On to What they'd
   need 60 · ● Left Setup 24" under a ShareBar. It sits in Display, not Charts, so the inline
   marks (MeterBar, RangeBar, ShareBar) and a chart can both use it; DagLegend may adopt it later.
   - Each item is a swatch, a label and an optional value (bold, tabular: a ShareBar's counts).
     The swatch's `shape` matches the mark it explains — `block` (a 14 × 10 bar: a fill, a box),
     `line` (a 2px upright: a tick) or `dot` (a 10px circle: a share) — and its `color` is a data
     colour (`components/internal/data-color.ts`), the same name the mark was drawn with, so they
     can't drift apart.
   - A list (`ul`, `aria-label`): the swatches are aria-hidden, the labels are the text. A legend
     is never the only way to tell marks apart; the marks carry their own text summaries.
   - 12px muted labels by default (a key above a table); `size="sm"` is 14px in the body ink (the
     legend under a ShareBar, where the counts are the content). It wraps. Server-safe. */

/** One entry: the swatch's shape and colour, a label and an optional value. */
type LegendItem = {
  label: string
  /** The data colour the mark is drawn in. */
  color: DataColor
  /** block (a bar or box; default) · line (a tick) · dot (a share). */
  shape?: Extract<Shape, "block" | "line" | "dot">
  /** A value after the label ("60"), bold and tabular. */
  value?: ReactNode
}

const SHAPE = {
  block: "h-2.5 w-3.5 rounded-xs",
  line: "h-3 w-0.5 rounded-full",
  dot: "size-2.5 rounded-full",
} as const

const SIZE = { xs: "gap-x-4 gap-y-1 text-xs text-muted-foreground", sm: "gap-x-5 gap-y-2 text-sm text-card-foreground" } as const

/** A row of swatches and labels saying what each mark in a bar, a column or a chart means. */
function Legend({
  items,
  label,
  size = "xs",
  className,
}: {
  /** The entries, in the marks' order. */
  items: readonly LegendItem[]
  /** The list's accessible name ("Key"). */
  label: string
  /** xs (default): 12px muted, a key above a table · sm: 14px body ink, under a ShareBar. */
  size?: keyof typeof SIZE
  /** Placement, not restyling. */
  className?: string
}) {
  return (
    <ul aria-label={label} data-slot="legend" className={cn("flex flex-wrap items-center", SIZE[size], className)}>
      {items.map((item) => (
        <li key={item.label} data-slot="legend-item" className="inline-flex items-center gap-1.5">
          <span aria-hidden data-shape={item.shape ?? "block"} className={cn("shrink-0", SHAPE[item.shape ?? "block"], dataFill[item.color])} />
          <span>{item.label}</span>
          {item.value !== undefined && <span className="font-bold text-foreground-strong tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}

export { Legend }
export type { LegendItem, DataColor }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type LegendProps = Parameters<typeof Legend>[0]
