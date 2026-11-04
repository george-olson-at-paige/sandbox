import type { ComponentProps } from "react"
import { formatMetric, type DeltaKind, type GoodDirection, type MetricFormat } from "../lib/metrics"
import { KpiCard } from "../patterns/kpi-card"

/* @archetype Surface (ARCHETYPES.md).
   MetricCard (R8-08): the admin's headline metric as a KpiCard, with the same-window rule in the
   code instead of in a review comment. The caller hands over one series for the window; the
   number and the delta are derived from it, so the three can't disagree:
     - `level` (a stock: active subscribers, MRR): the number is the last point (where we are),
       the delta compares it with the first point (where the window started). A 12-month window
       is 13 month-end points.
     - `flow` (counts per period: signups, cancellations): the number is the window's total, the
       delta compares it with the prior window of the same length (`previousTotal`).
   If a metric needs a second number, a footnote or a breakdown to make sense, it's the wrong
   number (George); there is no slot for one. The kind also decides the delta's words (R12-05):
   a flow says "vs prior", a level says when its comparison point was ("vs a year ago", or the
   first point's period for a window that isn't "Last N …"); the sentence follows. Admin-only meaning lives here (admin/), the generic
   card in patterns/, the number and delta logic in lib/metrics.ts. */

/** One admin headline metric: a single series over one window. */
type AdminMetric = {
  id: string
  /** What is counted ("Active subscribers"). */
  label: string
  format: MetricFormat
  /** level: the number is the last point · flow: the number is the window's total. */
  kind: "level" | "flow"
  /** The series over the window, oldest first; `period` is the hover label ("Mar 2026"). */
  points: ReadonlyArray<{ period: string; value: number | null }>
  /** The window, said once ("Last 12 months"). */
  window: string
  /** Overrides the full sentence's comparison (the tooltip and screen readers). Default from `kind` (R12-05): "the previous 12 months" (flow), "a year ago" (level). */
  against?: string
  /** How the delta reads. */
  change: DeltaKind
  /** Which direction is good. */
  good: GoodDirection
  /** flow only: the prior window's total (null when there's none). */
  previousTotal?: number | null
  /** The last period is still running. */
  partialLast?: boolean
}

const known = (vs: ReadonlyArray<number | null>) => vs.filter((v): v is number => v !== null)

/** The number and the earlier value a metric's card shows, both from its one series. */
function metricValues(metric: AdminMetric): { value: number | null; previous: number | null } {
  const values = metric.points.map((p) => p.value)
  const k = known(values)
  if (k.length === 0) return { value: null, previous: null }
  if (metric.kind === "flow") return { value: k.reduce((a, b) => a + b, 0), previous: metric.previousTotal ?? null }
  return { value: k[k.length - 1], previous: k.length > 1 ? k[0] : null }
}

/** An admin headline metric on a card: the number and delta derived from its one series, so all three share the window. */
function MetricCard({
  metric,
  size,
  loading = false,
  className,
}: {
  /** The metric and its series. */
  metric: AdminMetric
  /** md (default) · lg (the admin home's first row) · compact (its second row, no window line). KpiCard's sizes, R12-08. */
  size?: "md" | "lg" | "compact"
  /** Skeletons while the metric loads. */
  loading?: boolean
  /** Extra classes for placement (grid spans). */
  className?: string
}) {
  const { value, previous } = metricValues(metric)
  return (
    <KpiCard
      className={className}
      size={size}
      loading={loading}
      label={metric.label}
      window={metric.window}
      value={value}
      format={metric.format}
      delta={{ previous, kind: metric.change, basis: metric.kind, since: metric.points[0]?.period, against: metric.against, good: metric.good }}
      trend={{
        values: metric.points.map((p) => p.value),
        variant: metric.kind === "flow" ? "bar" : "line",
        partialLast: metric.partialLast,
        labels: metric.points.map((p) => `${p.period}: ${formatMetric(p.value, metric.format, { compact: false })}`),
      }}
    />
  )
}

export { MetricCard, metricValues }
export type { AdminMetric }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type MetricCardProps = ComponentProps<typeof MetricCard>
