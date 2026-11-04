import type { CSSProperties } from "react"

import { cn } from "../../lib/utils"
import { formatMetric } from "../../lib/metrics"
import { dataFill, percentOf, type DataColor } from "../internal/data-color"
import { Legend } from "./legend"

/* @archetype Chart (ARCHETYPES.md).
   ShareBar (R21-13): how one whole splits, as one stacked bar with its Legend under it — the
   Journeys screen card's "What they did next: On to the end 14 · Back a screen or more 9 · Left
   Setup 30", Vue's `.rpt-subs` (subscriptions by kind) and `.rpt-funnel`.
   - The bar: a 14px rounded track (`bg-track`) holding one segment per share in its data colour
     (`components/internal/data-color.ts`), each as wide as its share of the total (the segments'
     sum, or `total` when some of the whole isn't shown), as a CSS variable (`--share`), as
     MeterBar's fill. Segments keep their order: put the one that matters most first.
   - The Legend under it (`size="sm"`, dots, each share's count) names every segment, so colour is
     never the only key, and is what assistive tech reads: the bar is then aria-hidden. With
     `legend={false}` the bar is an image whose name lists the shares ("On to the end 14, Left
     Setup 30, of 53").
   - A zero share is kept in the legend (it is an answer) and draws nothing in the bar. A total of
     zero draws an empty track. Server-safe. */

/** One share of the whole. */
type ShareSegment = {
  label: string
  value: number
  /** The data colour it is drawn in (and its legend dot). */
  color: DataColor
}

/** A segment's width, as the `--share` variable its class reads (a measurement, not a design value). */
const shareWidth = (value: number, whole: number) => ({ "--share": percentOf(value, whole) }) as CSSProperties

/** How one whole splits, as a stacked bar with a legend of each share and its count. */
function ShareBar({
  segments,
  label,
  total,
  legend = true,
  className,
}: {
  /** The shares, in the order to draw them. */
  segments: readonly ShareSegment[]
  /** The group's name ("What they did next"). */
  label: string
  /** The whole, when it is more than the segments' sum (the rest is the empty track). */
  total?: number
  /** Show the legend under the bar (default); without it the bar names its shares itself. */
  legend?: boolean
  /** Placement, not restyling. */
  className?: string
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0)
  const whole = total ?? sum
  const count = (n: number) => formatMetric(n, { kind: "count" })
  const spoken = `${segments.map((s) => `${s.label} ${count(s.value)}`).join(", ")}, of ${count(whole)}`
  return (
    <div role="group" aria-label={label} data-slot="share-bar" className={cn("flex flex-col gap-2", className)}>
      <div
        {...(legend ? { "aria-hidden": true } : { role: "img", "aria-label": spoken })}
        data-slot="share-bar-track"
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-track"
      >
        {segments.map((s) =>
          s.value > 0 ? (
            <span
              key={s.label}
              data-slot="share-bar-segment"
              style={shareWidth(s.value, whole)}
              className={cn("h-full w-(--share) shrink-0", dataFill[s.color])}
            />
          ) : null
        )}
      </div>
      {legend && <Legend label={label} size="sm" items={segments.map((s) => ({ label: s.label, color: s.color, shape: "dot" as const, value: count(s.value) }))} />}
    </div>
  )
}

export { ShareBar }
export type { ShareSegment, DataColor }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ShareBarProps = Parameters<typeof ShareBar>[0]
