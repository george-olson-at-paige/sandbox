import type { ElementType, ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   Flex (R4-10, George 2026-10-19; name and intent from Orbit's Flex): the general row/column
   primitive, kept small: direction, gap, align, justify, wrap. Reach for the named primitives
   first; they say what the layout is for:
   - Stack: a vertical column (Flex direction="column", children stretch).
   - Inline: a row of items that wraps (Flex direction="row" wrap, centred).
   - Grid: equal columns. Split: content plus actions that drop under it.
   Use Flex only for a row or column none of those covers (a row that must not wrap and pushes
   its last item to the end, a column centred on both axes). Stack and Inline are presets of it. */
const GAP = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8", 12: "gap-12" } as const
const ALIGN = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
} as const
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const

type FlexProps = {
  /** "row" (default) or "column". */
  direction?: "row" | "column"
  /** Space between children, on the spacing scale: 0 · 1 = 4px … 12 = 48px. Default 3 (12px). */
  gap?: keyof typeof GAP
  /** Cross-axis alignment. Default "stretch". */
  align?: keyof typeof ALIGN
  /** Main-axis distribution. Default "start". */
  justify?: keyof typeof JUSTIFY
  /** Wrap onto the next line when full. Default false. */
  wrap?: boolean
  /** Element to render. Default "div"; "ul"/"ol" with `li` children for lists. */
  as?: ElementType
  className?: string
  children?: ReactNode
  id?: string
  "aria-label"?: string
  [key: `data-${string}`]: string | undefined
}

/** A row or column with gap, alignment and wrap, for layouts Stack, Inline, Grid and Split don't cover. */
function Flex({
  direction = "row",
  gap = 3,
  align = "stretch",
  justify = "start",
  wrap = false,
  as: Comp = "div",
  className,
  children,
  ...props
}: FlexProps) {
  return (
    <Comp
      data-slot="flex"
      className={cn(
        "flex",
        direction === "column" ? "flex-col" : "flex-row",
        wrap ? "flex-wrap" : "flex-nowrap",
        GAP[gap],
        ALIGN[align],
        JUSTIFY[justify],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Flex }
export type { FlexProps }
