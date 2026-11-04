import type { ElementType, ReactNode } from "react"

import { cn } from "../lib/utils"
import { Flex } from "./flex"

/* @archetype Frame (ARCHETYPES.md).
   Stack: vertical rhythm (R1-05). Gap from the spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 px.
   A preset of Flex (R4-10): direction column, children stretch by default, min-w-0. */
type StackProps = {
  /** Space between children, on the spacing scale: 0 · 1 = 4px … 12 = 48px. Default 4 (16px). */
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12
  /** Cross-axis alignment. Default "stretch" (children fill the width). */
  align?: "stretch" | "start" | "center"
  /** Element to render. Default "div"; use "ul"/"ol" with `li` children for lists, "section" for regions. */
  as?: ElementType
  className?: string
  children?: ReactNode
  id?: string
  "aria-label"?: string
  [key: `data-${string}`]: string | undefined
}

/** A vertical column with a gap from the spacing scale. */
function Stack({ gap = 4, align = "stretch", className, ...props }: StackProps) {
  return <Flex data-slot="stack" direction="column" gap={gap} align={align} className={cn("min-w-0", className)} {...props} />
}

export { Stack }
export type { StackProps }
