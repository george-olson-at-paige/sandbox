import type { ElementType, ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   Grid: equal columns (R1-29). Either a fixed column count per breakpoint
   (`columns={{ base: 1, sm: 2, lg: 3 }}`) or as many columns as fit at a minimum item width
   (`minItemWidth="sm"`, auto-fit). Gap defaults to the grid token (gap-grid, 16px); "column"
   is the 24px main/rail gap. HomePage's tile grid is a Grid.
   Checked against Orbit's Grid (R4-11, 2026-10-19): Orbit's is a thin wrapper over CSS grid
   (template columns and rows, named areas, auto flow, gaps, and repeat/minmax helpers) with no
   span or placement prop on children. Ours keeps the two column shapes our screens use and
   adds neither: no spike screen spans cells, and the one named-area layout (AreaPage's main
   column and rail) is its own template utility (grid-cols-area-page). Add `span` when a screen
   needs a cell across columns. */
const GAP = { grid: "gap-grid", column: "gap-column", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8" } as const
const COLS = {
  base: { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" },
  sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" },
  md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" },
  lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" },
  xl: { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5" },
} as const
/** Minimum item width for auto-fit: xs 10rem · sm 14rem · md 18rem · lg 22rem (utilities in theme.css). */
const FIT = { xs: "grid-cols-fit-xs", sm: "grid-cols-fit-sm", md: "grid-cols-fit-md", lg: "grid-cols-fit-lg" } as const

/** Up to five (R12-08: the admin home's compact KPI row). */
type ColumnCount = 1 | 2 | 3 | 4 | 5
type Breakpoint = "sm" | "md" | "lg" | "xl"
/** Columns from each breakpoint up (theme.css breakpoints); a missing key keeps the one below. */
type ResponsiveColumns = { base?: ColumnCount } & Partial<Record<Breakpoint, ColumnCount>>

type GridBaseProps = {
  /** Space between cells. Default "grid" (16px, the tile/card grid token); "column" = 24px; or 2 · 3 · 4 · 6 · 8 on the spacing scale. */
  gap?: keyof typeof GAP
  /** Element to render. Default "div"; use "ul" with `li` children for lists. */
  as?: ElementType
  className?: string
  children?: ReactNode
  id?: string
  "aria-label"?: string
  [key: `data-${string}`]: string | undefined
}

type GridProps = GridBaseProps &
  (
    | {
        /** Fixed column count, or a count per breakpoint: `{ base: 1, sm: 2, lg: 3 }`. */
        columns: ColumnCount | ResponsiveColumns
        minItemWidth?: never
      }
    | {
        /** Auto-fit: as many columns as fit with each item at least this wide (xs 10rem · sm 14rem · md 18rem · lg 22rem). */
        minItemWidth: keyof typeof FIT
        columns?: never
      }
  )

function columnClasses(columns: ColumnCount | ResponsiveColumns) {
  if (typeof columns === "number") return COLS.base[columns]
  const { base = 1, ...up } = columns
  return [COLS.base[base], ...(Object.entries(up) as [Breakpoint, ColumnCount][]).map(([bp, n]) => COLS[bp][n])]
}

/** Equal columns: a count per breakpoint, or as many as fit at a minimum item width. */
function Grid({ columns, minItemWidth, gap = "grid", as: Comp = "div", className, children, ...props }: GridProps) {
  return (
    <Comp
      data-slot="grid"
      className={cn("grid", minItemWidth ? FIT[minItemWidth] : columnClasses(columns ?? 1), GAP[gap], className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Grid }
export type { GridProps, ResponsiveColumns }
