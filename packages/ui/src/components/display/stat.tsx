import type { ComponentProps } from "react"
import { useId } from "react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "../../lib/utils"
import { comparisonPhrase, comparisonShort, describeDelta, describeSeries, formatDelta, formatMetric, type DeltaKind, type GoodDirection, type MetricBasis, type MetricFormat } from "../../lib/metrics"
import { Skeleton } from "../feedback/skeleton"
import { Sparkline, sparklineHeight } from "./sparkline"
import { Tooltip } from "../overlays/tooltip"

/* @archetype Chart (ARCHETYPES.md).
   Stat (R8-08): one number, one delta and one sparkline, all over the same window. The admin's
   metric rule (George): a card is number + sparkline + one delta over one window, and a number
   that needs explaining is the wrong number, so Stat has no slot for a footnote, a second delta
   or a breakdown. The window is said once, under the label ("Last 30 days"), so the delta needs
   only the comparison (R11-07): "+18% vs prior", one line, so a row of cards stays even. The
   full sentence ("Up 18% compared with the previous 12 months", `describeDelta`) is what screen
   readers hear and the delta's tooltip shows. "Over 12 months" was rejected: it reads as growth
   across the window, which is a different number.
   Flow or level (R12-05, GAPS #124): the delta's `basis` decides the words. A flow (a total over
   the window) is compared with the previous window: "vs prior". A level (a count at a moment)
   is compared with the same count at the window's start, which "prior" misreads, so it says
   when that was: "vs a year ago" for "Last 12 months", "vs 30 days ago", or the comparison date
   (`since`) for any other window. The sentence follows ("compared with a year ago") unless
   `against` says otherwise. lib/metrics.ts (comparisonShort, comparisonPhrase), tested.

   The number: lib/metrics.ts formats (count compact past 10K, currency from minor units,
   percent, a quantity with a unit); a compacted value carries its exact value as a hover title.
   No value is "—", never 0.
   The delta: direction by sign (the arrow), colour by whether that's good (`good`: up for
   revenue, down for churn, neither for a mix), never by sign; screen readers hear "better" or
   "worse". Relative (`percent`), in the metric's own format (`net`) or percentage points
   (`points`). No earlier value: a muted dash in its place, so cards in a row stay aligned.
   The trend: Sparkline (inline SVG, no chart library), its summary built from the series.
   States: `loading` (skeletons in the same shape, aria-busy) and empty (no value and no
   series). Server-safe.
   No data (R15-16, the Cloudflare reference, George 2026-10-21): the value slot keeps its height
   with a muted "—" (never 0), so nothing shifts when data arrives; where the delta and the
   sparkline go, a fixed, gentle placeholder line in the border colour (decorative, aria-hidden,
   the same line every time, never random) with a small "No data" pill centred on it (white,
   hairline border, the pop shadow, muted 12px text). Screen readers hear "No data for this
   window" once, in place of the value. It replaces the old "No data for this window" text line.
   KpiCard and MetricCard get it through Stat.
   Type (R21-01, the Journeys mock and Vue's `.rpt-card`): the label is 12/600 in the muted ink
   and the number bold, tight, with no leading, so the number leads and the label names it (the
   label was 14/500 in the body ink, which competed with the number).
   Caption (R21-05, George 2026-10-31): one muted line under everything else, for what the number
   counts when the label alone can't say it ("people saw Welcome", "14% of those who started").
   Still no second number: a share is said in the caption, never beside the value ("14 · 14%" is
   14 with "14% of those who started" under it). One line, cut with an ellipsis, the whole text its
   title; screen readers hear it as part of the group. Not shown while loading (a text skeleton
   holds its place) or with no data. */
/* Sizes (R12-08): md the default card; lg a hero row (three across: a bigger number and a taller
   sparkline); compact a dense row (five across: the number, the delta and a small sparkline; the
   window line goes, said once for the whole row by its caption, and stays in the label's group
   for screen readers). */
const VALUE = { md: "text-3xl", lg: "text-4xl", compact: "text-2xl" } as const
/* The sparkline each size takes and the gap above it; its height is Sparkline's own
   (sparklineHeight, the chart scale's spark steps, T-05), never restated here. */
const SPARK = { md: { size: "md", gap: "mt-2" }, lg: { size: "lg", gap: "mt-3" }, compact: { size: "sm", gap: "mt-1.5" } } as const
/* The delta line's height (text-sm's line), which the no-data block keeps so the card is the same
   height with and without data. The block is laid out like the real rows (a delta line, then the
   sparkline with its gap), not as a pre-added height, so a change to either moves both. */
const DELTA_LINE = "h-5"
/* The placeholder line: one fixed, gentle curve (never random, so every empty card matches). */
const GHOST_PATH = "M0 18 C 10 18, 16 12, 26 12 S 42 17, 52 15 S 70 8, 80 9 S 94 12, 100 11"

const TONE = {
  better: "text-success-foreground",
  worse: "text-attention-foreground",
  neutral: "text-muted-foreground",
} as const

type StatDelta = {
  /** The value it's compared with (the start of the window, or the prior window's total); null when there is none. */
  previous: number | null
  /** percent: relative ("+12%") · net: in the metric's format ("+475") · points: between two percentages ("+2.5 pts"). */
  kind: DeltaKind
  /** flow (default): a total over the window, compared with the previous window ("vs prior") · level: a count at a moment, compared with the window's start ("vs a year ago"). R12-05. */
  basis?: MetricBasis
  /** level only: the comparison date, for a window that isn't "Last N days/weeks/months/years" ("Oct 2025"). */
  since?: string
  /** The comparison as a phrase for the full sentence ("Up 18% compared with …"). Default from `basis` and the window: "the previous 12 months" (flow), "a year ago" (level). */
  against?: string
  /** Overrides the visible comparison after the number (R11-07). Default from `basis` (R12-05). */
  short?: string
  /** Which direction is good: up (default) · down (churn, failures) · neither. Sets the colour, not the arrow. */
  good?: GoodDirection
}

type StatTrend = {
  /** The series over the window, oldest first (null is a gap). */
  values: ReadonlyArray<number | null>
  /** line (default) · bar (counts per period). */
  variant?: "line" | "bar"
  /** The last period is still running. */
  partialLast?: boolean
  /** A hover title per point. */
  labels?: ReadonlyArray<string>
}

/** One number with one delta and a sparkline, over one stated window; loading and no-data states built in. */
function Stat({
  label,
  window: span,
  value,
  format,
  delta,
  trend,
  caption,
  compact = true,
  size = "md",
  loading = false,
  className,
}: {
  /** What is counted, in a few words ("Active subscribers"). */
  label: string
  /** The window the number, delta and sparkline all cover ("Last 30 days", "March 2026"). */
  window: string
  /** The value over the window; null when there's no data. */
  value: number | null
  /** How the value reads (lib/metrics.ts MetricFormat). */
  format: MetricFormat
  /** The one comparison. Omit for a stat that has none. */
  delta?: StatDelta
  /** The sparkline over the same window. */
  trend?: StatTrend
  /** One muted line saying what the number counts ("people saw Welcome"); a share goes here, never a second number beside the value. R21-05. */
  caption?: string
  /** Compact large numbers (12.4K). Default true; the exact value is the hover title. */
  compact?: boolean
  /** md (default, 30px number) · lg (40px, a hero row of three) · compact (24px, no window line, a small sparkline: a dense row of five, R12-08). */
  size?: keyof typeof VALUE
  /** Shows skeletons in the stat's shape. */
  loading?: boolean
  className?: string
}) {
  const labelId = useId()
  const empty = !loading && value === null && !(trend?.values ?? []).some((v) => v !== null)
  const shown = formatMetric(value, format, { compact })
  const exact = formatMetric(value, format, { compact: false })
  const d = delta ? formatDelta(value, delta.previous, delta.kind, format, delta.good ?? "up") : null
  const Arrow = d?.direction === "up" ? TrendingUp : d?.direction === "down" ? TrendingDown : Minus
  const basis = delta?.basis ?? "flow"
  const against = delta ? (delta.against ?? comparisonPhrase(basis, span, delta.since)) : ""
  // A compact card says the short form ("vs 1y ago", R13-14); the sentence (tooltip, screen readers) is whole.
  const short = delta ? (delta.short ?? comparisonShort(basis, span, delta.since, { compact: size === "compact" })) : ""

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-busy={loading || undefined}
      data-slot="stat"
      data-size={size}
      data-state={loading ? "loading" : empty ? "empty" : "ready"}
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      {/* The window under the label, not beside it: a four-up row leaves ~220px, and the label wins. */}
      <div className="flex min-w-0 flex-col">
        <span id={labelId} title={label} className="truncate text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-xs text-muted-foreground", size === "compact" && "sr-only")}>{span}</span>
      </div>
      {loading ? (
        <>
          <Skeleton shape="number" width="1/2" className="my-0.5" />
          <Skeleton shape="text" width="3/4" />
          {trend && <Skeleton shape="block" className={cn(SPARK[size].gap, sparklineHeight[SPARK[size].size])} />}
          {caption && <Skeleton shape="text" width="1/2" />}
          <span className="sr-only">Loading {label}</span>
        </>
      ) : (
        <>
          <span
            data-slot="stat-value"
            title={shown !== exact ? exact : undefined}
            className={cn("leading-none font-bold tracking-tight text-foreground-strong tabular-nums", VALUE[size], empty && "text-muted-foreground")}
          >
            {empty ? (
              <>
                <span aria-hidden>—</span>
                <span className="sr-only">No data for this window</span>
              </>
            ) : (
              shown
            )}
          </span>
          {empty ? (
            <span aria-hidden data-slot="stat-no-data" className="relative flex flex-col">
              {/* The rows the real card would have: the delta line, then the sparkline (its gap and
                  height) with the ghost curve drawn in it; with no trend the curve stands in for the
                  delta line at the small sparkline's height. */}
              {trend && delta && <span className={DELTA_LINE} />}
              <svg
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                className={cn("block w-full overflow-visible text-border", trend ? cn(SPARK[size].gap, sparklineHeight[SPARK[size].size]) : sparklineHeight.sm)}
              >
                <path d={GHOST_PATH} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                <span data-slot="stat-no-data-badge" className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-pop">
                  No data
                </span>
              </span>
            </span>
          ) : delta ? (
            <Tooltip content={d ? describeDelta(d, against) : `No earlier value to compare with ${against}`} side="bottom" align="start">
              <span data-slot="stat-delta" data-tone={d?.tone ?? "none"} data-basis={basis} className={cn("flex w-fit max-w-full min-w-0 items-center gap-1 text-sm font-medium whitespace-nowrap", TONE[d?.tone ?? "neutral"])}>
                <span aria-hidden className="flex min-w-0 items-center gap-1">
                  {d ? (
                    <>
                      <Arrow className="size-icon shrink-0" />
                      <span className="tabular-nums">{d.text}</span>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                  <span className="truncate font-normal text-muted-foreground">{short}</span>
                </span>
                <span className="sr-only">
                  {d ? `${describeDelta(d, against)}${d.tone === "neutral" ? "" : `, ${d.tone}`}` : `No earlier value to compare with ${against}`}
                </span>
              </span>
            </Tooltip>
          ) : null}
          {trend && !empty && (
            <Sparkline
              className={SPARK[size].gap}
              size={SPARK[size].size}
              values={trend.values}
              variant={trend.variant}
              partialLast={trend.partialLast}
              labels={trend.labels}
              summary={`${label}, ${span}: ${describeSeries(trend.values, format)}${trend.partialLast ? " The last period is still running." : ""}`}
            />
          )}
          {caption && !empty && (
            <span data-slot="stat-caption" title={caption} className="truncate text-xs text-muted-foreground">
              {caption}
            </span>
          )}
        </>
      )}
    </div>
  )
}

export { Stat }
export type { StatDelta, StatTrend }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StatProps = ComponentProps<typeof Stat>
