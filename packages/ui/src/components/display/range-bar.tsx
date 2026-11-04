import type { CSSProperties } from "react"

import { cn } from "../../lib/utils"
import { percentOf } from "../internal/data-color"

/* @archetype Chart (ARCHETYPES.md).
   RangeBar (R21-08): a spread on a fixed scale at row size — the Journeys table's "time on
   screen": most people's time (the 25th to the 75th percentile) as a box, the median as a tick,
   and how far the slow tail runs (the 90th) as a whisker. A box plot cut down to one row: no
   axis of its own, because every row in the column shares one `domain` and the column's header
   names the scale ("Time on screen (0–5m)").
   - Parts, all positioned along `domain` (`[min, max]`, values clamped into it, so an outlier
     sits at the end rather than off the row): the box from `low` to `high` in the light blue
     (`brand-subtle`), the 2px tick at `mark` in the dark blue (`brand-ink`), and, with
     `whisker`, a 1px line from the box's end to it with a 1px cap, in the stronger neutral.
     Positions reach the style as CSS variables (`--range-low`, `--range-width`, `--range-mark`,
     `--range-high`, `--range-whisker`, `--range-tail`), measurements, not design values (as MeterBar's fill).
   - Its colours are Legend's `brand-subtle`, `brand-ink` and `neutral`, so a Legend above the
     column explains it ("Most people's time", "Median", "Slowest 10%").
   - Accessible: one image whose name is `summary` ("Most people 7s to 13s, median 8s, slowest
     10% 36s or longer"), which the caller writes in its own units; the marks are aria-hidden.
   - 14px tall, as MeterBar, so the two sit on one row line. Server-safe. */

/** A spread on a shared scale at row size: a box (low–high), a median tick and an optional whisker, with a text summary. */
function RangeBar({
  low,
  high,
  mark,
  whisker,
  domain,
  summary,
  className,
}: {
  /** The box's start (the 25th percentile). */
  low: number
  /** The box's end (the 75th percentile). */
  high: number
  /** The tick (the median). */
  mark: number
  /** How far the tail runs past the box (the 90th percentile); omit for no whisker. */
  whisker?: number
  /** The scale every row in the column shares, [min, max]. */
  domain: readonly [number, number]
  /** What the bar says, for screen readers (its name). */
  summary: string
  /** Placement, not restyling. */
  className?: string
}) {
  const [min, max] = domain
  const span = max - min
  const at = (v: number) => percentOf(v - min, span)
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - min) / span) * 100))
  const vars = {
    "--range-low": at(low),
    "--range-width": `${Math.max(1, pos(high) - pos(low))}%`,
    "--range-mark": at(mark),
    "--range-high": at(high),
    "--range-whisker": whisker === undefined ? "0%" : `${Math.max(0, pos(whisker) - pos(high))}%`,
    "--range-tail": whisker === undefined ? "0%" : at(whisker),
  } as CSSProperties
  return (
    <span role="img" aria-label={summary} data-slot="range-bar" style={vars} className={cn("relative block h-3.5 min-w-0", className)}>
      {whisker !== undefined && (
        <>
          <span aria-hidden data-slot="range-bar-whisker" className="absolute top-1/2 left-(--range-high) h-px w-(--range-whisker) bg-border-strong" />
          <span aria-hidden className="absolute inset-y-1 left-(--range-tail) w-px -translate-x-px bg-border-strong" />
        </>
      )}
      <span aria-hidden data-slot="range-bar-box" className="absolute inset-y-0.5 left-(--range-low) w-(--range-width) rounded-xs bg-primary-subtle" />
      <span aria-hidden data-slot="range-bar-mark" className="absolute inset-y-0 left-(--range-mark) w-0.5 -translate-x-1/2 rounded-full bg-info-foreground" />
    </span>
  )
}

export { RangeBar }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type RangeBarProps = Parameters<typeof RangeBar>[0]
