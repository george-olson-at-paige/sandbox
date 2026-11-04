import type { ElementType, ReactNode } from "react"

import { Flex } from "./flex"

/* @archetype Frame (ARCHETYPES.md).
   Inline: a horizontal row of items (R1-05, R1-29). Wraps onto the next line by default;
   `wrap={false}` keeps one line. Gap from the spacing scale (4 · 8 · 12 · 16 · 24 · 32 px).
   For content plus trailing actions that drop under it, use Split.
   A preset of Flex (R4-10): direction row, wrapping, centred by default. */
type InlineProps = {
  /** Space between items, on the spacing scale: 1 = 4px … 8 = 32px. Default 3 (12px). */
  gap?: 1 | 2 | 3 | 4 | 6 | 8
  /** Cross-axis alignment. Default "center"; "baseline" for text of different sizes. */
  align?: "start" | "center" | "baseline" | "end"
  /** Main-axis distribution. Default "start". */
  justify?: "start" | "between" | "end"
  /** Wrap onto the next line when the row is full. Default true; false keeps one line. */
  wrap?: boolean
  /** Element to render. Default "div"; use "ul" with `li` children for lists. */
  as?: ElementType
  className?: string
  children?: ReactNode
  id?: string
  "aria-label"?: string
  [key: `data-${string}`]: string | undefined
}

/** A horizontal row of items that wraps: tags, buttons, metadata. */
function Inline({ gap = 3, align = "center", justify = "start", wrap = true, ...props }: InlineProps) {
  return <Flex data-slot="inline" direction="row" gap={gap} align={align} justify={justify} wrap={wrap} {...props} />
}

export { Inline }
export type { InlineProps }
