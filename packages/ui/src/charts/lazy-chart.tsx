"use client"

import type { ComponentProps } from "react"
import { lazy, Suspense } from "react"

import { cn } from "../lib/utils"
import { chartHeight } from "./internal/heights"

import type { ChartProps } from "./chart"

/* @archetype Chart (ARCHETYPES.md).
   LazyChart (R8-06, R8-09): the charts entry pages use. The chart module (and Recharts with it)
   is a dynamic import, so it loads only when a chart renders: not in a customer page's bundle
   (they never import charts/), and not in an admin page's first load either. While it loads, the
   fallback is a skeleton at the chart's height, so nothing shifts. Same props as Chart.
   The skeleton is drawn here rather than imported from ./chart, which would pull the module (and
   Recharts) back into the eager bundle. */
const HEIGHT = chartHeight // the same map Chart reads (T-05), so the skeleton is the chart's height
const LoadedChart = lazy(() => import("./chart").then((m) => ({ default: m.Chart })))

/** A Chart that loads the chart library only when it renders, with a same-height skeleton meanwhile. */
function LazyChart(props: ChartProps) {
  const fallback = (
    <div data-slot="chart" data-state="loading" aria-busy className={cn("w-full animate-pulse rounded-lg bg-track motion-reduce:animate-none", HEIGHT[props.height ?? "md"], props.className)}>
      <span className="sr-only">Loading {props.label}</span>
    </div>
  )
  return <Suspense fallback={fallback}>{props.loading ? fallback : <LoadedChart {...props} />}</Suspense>
}

export { LazyChart }
export type { ChartProps }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type LazyChartProps = ComponentProps<typeof LazyChart>
