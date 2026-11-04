import type { CSSProperties } from "react"

import { cn } from "../../lib/utils"
import { formatMetric } from "../../lib/metrics"
import { dataFill, percentOf, type DataColor } from "../internal/data-color"

/* @archetype Chart (ARCHETYPES.md).
   MeterBar (R21-07): one quantity against its whole as a horizontal bar, at row size — "84 of 101
   people reached Your people" in the Journeys table, Vue's `.rpt-serve` rows and facet bars. Not
   Progress (Feedback), which is a task's completion; this is data.
   - Drawn in HTML, not SVG: a 14px track (`h-3.5`, `rounded-xs`) in the light blue wash
     (`bg-accent`) and a fill in a data colour (`brand` by default), its width the share. The width
     is the one data value that reaches the style, as a CSS variable (`--meter-fill`) read by
     `w-(--meter-fill)`, the way TabsPill's thumb and Sortable's transform are measurements, not
     design values; `percentOf` clamps it to 0–100%.
   - `showValue` prints the count at the right (14/700, tabular), the mock's look; the bar alone
     is fine where the number is elsewhere in the row.
   - Accessible: `role="meter"` with min, max and now, the `label` as its name and "84 of 101"
     (or `valueText`) as its value text; the printed number is hidden from assistive tech so it
     isn't read twice. No value (null) draws an empty track and a dash, and is an image named
     "… : no value" (a meter must have a value), never 0.
   - The track fills its container's width; the caller gives it room (a table cell, `flex-1`).
   Server-safe. */

/** One quantity against its whole as a bar, with its count at the right if asked; a `meter` for assistive tech. */
function MeterBar({
  value,
  max,
  label,
  valueText,
  showValue = false,
  color = "brand",
  className,
}: {
  /** The quantity; null when it isn't known. */
  value: number | null
  /** The whole it is measured against (the bar's full width). */
  max: number
  /** The meter's accessible name ("Reached Your people"). */
  label: string
  /** What a screen reader hears as its value; default "84 of 101". */
  valueText?: string
  /** Print the count at the bar's right. */
  showValue?: boolean
  /** The fill's data colour (brand by default). */
  color?: DataColor
  /** Placement, not restyling. */
  className?: string
}) {
  const known = value !== null && Number.isFinite(value)
  const count = known ? formatMetric(value, { kind: "count" }) : "—"
  const fill = { "--meter-fill": known ? percentOf(value, max) : "0%" } as CSSProperties
  return (
    <span data-slot="meter-bar" className={cn("flex min-w-0 items-center gap-2", className)}>
      <span
        // A meter needs a value; with none it is an image that says so.
        {...(known
          ? { role: "meter", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": value, "aria-valuetext": valueText ?? `${count} of ${formatMetric(max, { kind: "count" })}` }
          : { role: "img", "aria-label": `${label}: no value` })}
        className="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-xs bg-accent"
      >
        <span aria-hidden data-slot="meter-bar-fill" style={fill} className={cn("absolute inset-y-0 left-0 w-(--meter-fill) rounded-xs", dataFill[color])} />
      </span>
      {showValue && (
        <span aria-hidden data-slot="meter-bar-value" className="min-w-8 shrink-0 text-right text-sm font-bold text-foreground-strong tabular-nums">
          {count}
        </span>
      )}
    </span>
  )
}

export { MeterBar }
export type { DataColor }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type MeterBarProps = Parameters<typeof MeterBar>[0]
