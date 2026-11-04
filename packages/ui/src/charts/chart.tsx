"use client"

import type { ComponentProps } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { cn } from "../lib/utils"
import { formatMetric, type MetricFormat } from "../lib/metrics"
import { chartHeight } from "./internal/heights"
import { useReducedMotion } from "./internal/reduced-motion"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../base/chart"

/* @archetype Chart (ARCHETYPES.md).
   Paige Chart over upstream chart (shadcn, Recharts) (R8-09). This module imports Recharts, so a
   page should load it through charts/lazy-chart.tsx (React.lazy): the library then arrives only
   when a chart renders, and customer pages, which never import charts/, never get it (R8-06,
   checked on the Next build). One component, two kinds: `line` (a level over time) and `bar`
   (counts per period, optionally stacked).
   Tokens, not Recharts defaults: series colours are the theme's --chart-1…5 in order (or a set
   index), the grid is horizontal hairlines only (--chart-grid), axes have no lines or ticks and
   muted labels (--chart-axis), no entry animation under reduced motion, the y axis and the tooltip format values with lib/metrics.ts
   (compact counts, currency from minor units, percent), the tooltip names each series with its
   colour (a series is never told apart by colour alone; a legend shows from two series).
   Accessible: the drawing is hidden from screen readers and a visually hidden table carries the
   same data under the chart's `label` (Recharts' own keyboard layer is off so nothing focusable
   sits inside a hidden region). States: `loading` (a skeleton the chart's height) and empty
   ("No data for this period"). Not exposed until needed: area, pie, radar, Sankey, DAG
   (ORGANIZATION.md § Admin readiness). */
const HEIGHT = chartHeight // the chart scale (T-05), shared with LazyChart's skeleton
const SWATCH = { 1: "bg-chart-1", 2: "bg-chart-2", 3: "bg-chart-3", 4: "bg-chart-4", 5: "bg-chart-5" } as const

type ChartSeries = {
  /** The data key holding this series' values. */
  key: string
  label: string
  /** Theme series colour 1–5; default by position. */
  color?: keyof typeof SWATCH
}

type ChartRow = Record<string, string | number | null>

type ChartProps = {
  /** line: a level over time · bar: counts per period. */
  kind: "line" | "bar"
  /** One row per x value, oldest first. */
  data: ReadonlyArray<ChartRow>
  /** The key of the x value (a period label: "Mar", "2026-03"). */
  x: string
  series: ChartSeries[]
  /** How the values read (axis and tooltip). */
  format: MetricFormat
  /** What the chart shows, for screen readers and the data table's caption. */
  label: string
  /** sm 160 · md 256 (default) · lg 320. */
  height?: keyof typeof HEIGHT
  /** bar only: stack the series. */
  stacked?: boolean
  /** A skeleton the chart's height. */
  loading?: boolean
  className?: string
}

/** A line or bar chart in the theme's colours, with a formatted axis and tooltip, a hidden data table, and loading and empty states. */
function Chart({ kind, data, x, series, format, label, height = "md", stacked = false, loading = false, className }: ChartProps) {
  const animate = !useReducedMotion()
  const box = cn("w-full", HEIGHT[height], className)
  if (loading) return <ChartSkeleton height={height} className={className} label={label} />
  if (data.length === 0 || series.length === 0)
    return (
      <div data-slot="chart" data-state="empty" className={cn(box, "grid place-items-center rounded-lg border border-dashed text-sm font-medium text-muted-foreground")}>
        No data for this period
      </div>
    )

  const colorOf = (s: ChartSeries, i: number) => s.color ?? (((i % 5) + 1) as keyof typeof SWATCH)
  const config: ChartConfig = Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: `var(--chart-${colorOf(s, i)})` }]))
  const fmt = (v: unknown) => (typeof v === "number" ? formatMetric(v, format) : String(v ?? "—"))
  const axis = { tickLine: false, axisLine: false, tick: { fill: "var(--color-chart-axis)" } } as const
  const tooltip = (
    <ChartTooltip
      cursor={kind === "line" ? { stroke: "var(--color-border)" } : { fill: "var(--color-muted)" }}
      content={
        <ChartTooltipContent
          formatter={(value, name, _item, index) => {
            const s = series.find((x) => x.key === name) ?? series[index]
            return (
              <span className="flex w-full items-center gap-2">
                <span aria-hidden className={cn("size-2.5 shrink-0 rounded-sm", SWATCH[colorOf(s, series.indexOf(s))])} />
                <span className="text-muted-foreground">{s?.label ?? name}</span>
                <span className="ml-auto font-medium text-foreground tabular-nums">{fmt(value)}</span>
              </span>
            )
          }}
        />
      }
    />
  )
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
      <XAxis dataKey={x} {...axis} tickMargin={8} minTickGap={16} />
      <YAxis {...axis} width={56} tickMargin={4} tickFormatter={(v: number) => formatMetric(v, format)} />
      {tooltip}
      {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
    </>
  )
  const rows = data as ChartRow[]

  return (
    <figure data-slot="chart" data-kind={kind} className="m-0">
      <ChartContainer config={config} className={cn(box, "aspect-auto")} aria-hidden>
        {kind === "line" ? (
          <LineChart data={rows} accessibilityLayer={false} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {common}
            {series.map((s) => (
              <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={animate} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} accessibilityLayer={false} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {common}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={`var(--color-${s.key})`}
                stackId={stacked ? "stack" : undefined}
                radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={animate}
              />
            ))}
          </BarChart>
        )}
      </ChartContainer>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{x}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{String(r[x] ?? "")}</th>
              {series.map((s) => (
                <td key={s.key}>{fmt(r[s.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** The chart's loading placeholder, at the chart's height (also lazy-chart's fallback). */
function ChartSkeleton({ height = "md", label, className }: { height?: keyof typeof HEIGHT; label?: string; className?: string }) {
  return (
    <div data-slot="chart" data-state="loading" aria-busy className={cn("w-full animate-pulse rounded-lg bg-track motion-reduce:animate-none", HEIGHT[height], className)}>
      <span className="sr-only">{label ? `Loading ${label}` : "Loading chart"}</span>
    </div>
  )
}

export { Chart, ChartSkeleton }
export type { ChartProps, ChartRow, ChartSeries }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ChartSkeletonProps = ComponentProps<typeof ChartSkeleton>
