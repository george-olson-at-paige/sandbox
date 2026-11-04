/* The chart scale's classes (T-05; theme.css `--spacing-chart-*`, `--spacing-dag-*`), in one
   place that a component and its lazy skeleton both import, so the skeleton is the height the
   real one will be and the page doesn't jump when it loads. Nothing else lives here: the lazy
   wrappers must not import ./chart or ./dag-frame, which would pull Recharts or dagre into the
   eager bundle. `height="auto"` on DagFrame is its own ladder (dag-shape.ts). */

/** Chart's `height` prop → class: sm 160 · md 256 · lg 320. */
export const chartHeight = { sm: "h-chart-sm", md: "h-chart", lg: "h-chart-lg" } as const

/** DagFrame's fixed `height` prop → class: md 448 · lg 640. */
export const dagHeight = { md: "h-dag", lg: "h-dag-lg" } as const
