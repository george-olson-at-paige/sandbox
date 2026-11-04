import type { ElementType, ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   Split: main content plus an aside (usually actions) that follows it on the same row and
   drops under the content when the row runs out of space (R1-06, R1-29). The content grows
   and wraps its text first; once the row is narrower than the content's minimum plus the
   aside, the aside moves below instead of squeezing it. Callout, PageHeader, PageIntro
   and FlowFooter use it (InlineEdit did until R11-04: its actions now always sit under the control). */
const GAP = { 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8" } as const
const ALIGN = { start: "items-start", center: "items-center", end: "items-end" } as const
/** Content minimum before the aside drops: 12 · 16 · 20 rem. */
const MIN = { sm: "basis-48", md: "basis-64", lg: "basis-80" } as const
/** How wide the aside may get: none (its content's width) · half (at most half the row; its
    items wrap inside that half, as the prototype's item rows cap actions at 46%; R2-15). */
const ASIDE_MAX = { none: "", half: "max-w-1/2 justify-end" } as const

type SplitProps = {
  /** The trailing part: buttons, a meta line. Its own items sit 8–12px apart and wrap. Nothing renders for it when empty. */
  aside: ReactNode
  /** Space between content and aside (and between the two rows once the aside drops): 2 = 8px … 8 = 32px. Default 3 (12px). */
  gap?: keyof typeof GAP
  /** Cross-axis alignment of content and aside while they share a row. Default "center". */
  align?: keyof typeof ALIGN
  /** How narrow the content may get before the aside drops below it: sm 12rem · md 16rem · lg 20rem. Default "md". */
  contentMin?: keyof typeof MIN
  /** Cap the aside's width: none (default) · half (long actions wrap within half the row). */
  asideMax?: keyof typeof ASIDE_MAX
  /** Element to render. Default "div". */
  as?: ElementType
  className?: string
  /** The main content. */
  children: ReactNode
}

/** Content plus actions that drop under the content when the row runs out of space. */
function Split({ aside, gap = 3, align = "center", contentMin = "md", asideMax = "none", as: Comp = "div", className, children }: SplitProps) {
  return (
    <Comp data-slot="split" className={cn("flex flex-wrap", GAP[gap], ALIGN[align], className)}>
      <div data-slot="split-content" className={cn("min-w-0 flex-1", MIN[contentMin])}>
        {children}
      </div>
      {aside != null && aside !== false && (
        /* max-w-full: once the aside has dropped onto its own row it never grows past it; its
           items wrap instead (found with LinkOut at 360px, R2-24). */
        <div data-slot="split-aside" className={cn("flex max-w-full shrink-0 flex-wrap items-center", gap <= 2 ? "gap-2" : "gap-3", ASIDE_MAX[asideMax])}>
          {aside}
        </div>
      )}
    </Comp>
  )
}

export { Split }
export type { SplitProps }
