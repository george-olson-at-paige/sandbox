import type { ComponentProps } from "react"

import { cn } from "../lib/utils"

/* Guides: layout lines drawn like a technical plan around a Wireframe's slots (REVIEW-18 § Guides;
   INTAKE.md I-04: a story helper, never product UI). Hairlines at a box's edges that can run past
   the corners, bleed to the page's edges or fade in from nothing; a second pair inside with a
   hatched or dotted gutter between; a plus, a dot or a square where two lines cross. Decoration
   only: aria-hidden and pointer-events-none, it fills its nearest `relative` ancestor and sits
   just outside its edges, so it never covers the padding. Put it first in the box: positioned
   content after it paints over the lines. Placeholder's `plan` wears it, so a Wireframe adopts
   the lines with one word.
   @from www.shadcn.io/r/guides.json (shadcn.io/ui/guides) · 2026-10-30 · a free item: free-account
   terms, no stated open-source licence (REVIEW-18 § Guides).
   changed: arbitrary values → `guides-*` utilities (stories/guides.css, story-only); the lines'
   colour explicit (`border-border`; was the base layer's default) and the gutters' `--border`
   kept; `variant` → `lineStyle` (retired word); RTL mark flips dropped (en-US only, R5-01);
   `border-0` on the root dropped (our base layer sets only the border colour); interface → type,
   exports at the foot, house formatting. */

/** How far the side lines run past the top and bottom corners. */
const EXTEND_Y = { none: "-inset-y-px", sm: "-inset-y-2", md: "-inset-y-4", lg: "-inset-y-14" } as const
/** How far the rules run past the side corners (unless `bleed`). */
const EXTEND_X = { none: "-inset-x-px", sm: "-inset-x-2", md: "-inset-x-4", lg: "-inset-x-14" } as const
const FADE = { none: "", top: "guides-fade-top", bottom: "guides-fade-bottom", both: "guides-fade-both" } as const
const INSET = { sm: "guides-inset-sm", md: "guides-inset-md", lg: "guides-inset-lg" } as const
const GUTTER = { none: "", hatch: "guides-gutter-hatch", dots: "guides-gutter-dots" } as const
const MARK = {
  "top-start": "guides-mark-top-start",
  "top-end": "guides-mark-top-end",
  "bottom-start": "guides-mark-bottom-start",
  "bottom-end": "guides-mark-bottom-end",
} as const
type Corner = keyof typeof MARK
const CORNERS: Record<"none" | "start" | "top" | "bottom" | "corners", Corner[]> = {
  none: [],
  start: ["top-start"],
  top: ["top-start", "top-end"],
  bottom: ["bottom-start", "bottom-end"],
  corners: ["top-start", "top-end", "bottom-start", "bottom-end"],
}

type GuidesProps = ComponentProps<"div"> & {
  /** Lets the rules run past the sides to the edges of the nearest ancestor that clips (give the section `overflow-x-clip`). Default false. */
  bleed?: boolean
  /** How far the lines run past the corners: none (default) · sm 8 · md 16 · lg 56 px. */
  extend?: keyof typeof EXTEND_Y
  /** Fades the side lines, inner lines and gutters in from nothing at the top, the bottom or both ends. Default none. */
  fade?: keyof typeof FADE
  /** Fills the band between the sides and the inner lines: hatch (diagonal) · dots. Default none. */
  gutter?: keyof typeof GUTTER
  /** A second pair of side lines, `inset` from the sides: solid · dashed. Default none. */
  inner?: "none" | "solid" | "dashed"
  /** How far the inner lines and gutters sit from the sides: sm 12 · md 16, 32 from sm (default) · lg 24, 48 from sm. */
  inset?: keyof typeof INSET
  /** The marks' shape: plus (default) · dot · square (filled with the background, so it sits on the lines). */
  markShape?: "plus" | "dot" | "square"
  /** Which corners get a mark: none (default) · start (top-start) · top · bottom · corners (all four). */
  marks?: keyof typeof CORNERS
  /** Which horizontal edges get a rule. A section in a stack draws only its `top` rule, so two never double a line. Default both. */
  rules?: "both" | "top" | "bottom" | "none"
  /** The two side lines. Default true. */
  sides?: boolean
  /** The outer lines: solid (default) · dashed. */
  lineStyle?: "solid" | "dashed"
}

/** Plan lines around a box: hairlines at its edges, optional inner lines and gutters, a mark on each crossing. Decoration only. */
function Guides({
  bleed = false,
  extend = "none",
  fade = "none",
  gutter = "none",
  inner = "none",
  inset = "md",
  markShape = "plus",
  marks = "none",
  rules = "both",
  sides = true,
  lineStyle = "solid",
  className,
  ...rest
}: GuidesProps) {
  const dashed = lineStyle === "dashed" && "border-dashed"
  const rulesX = bleed ? "guides-bleed" : EXTEND_X[extend]
  const line = "absolute border-border"
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", INSET[inset], className)} data-slot="guides" {...rest}>
      {gutter !== "none" && (
        <>
          <div className={cn("absolute inset-y-0 start-0 w-(--guides-inset)", GUTTER[gutter], FADE[fade])} data-slot="guides-gutter" />
          <div className={cn("absolute inset-y-0 end-0 w-(--guides-inset)", GUTTER[gutter], FADE[fade])} data-slot="guides-gutter" />
        </>
      )}
      {inner !== "none" && (
        <>
          <div className={cn(line, "inset-y-0 start-(--guides-inset) w-px border-s", inner === "dashed" && "border-dashed", FADE[fade])} data-slot="guides-line" />
          <div className={cn(line, "inset-y-0 end-(--guides-inset) w-px border-s", inner === "dashed" && "border-dashed", FADE[fade])} data-slot="guides-line" />
        </>
      )}
      {sides && (
        <>
          <div className={cn(line, "-start-px w-px border-s", EXTEND_Y[extend], FADE[fade], dashed)} data-slot="guides-line" />
          <div className={cn(line, "-end-px w-px border-s", EXTEND_Y[extend], FADE[fade], dashed)} data-slot="guides-line" />
        </>
      )}
      {(rules === "both" || rules === "top") && <div className={cn(line, "-top-px h-px border-t", rulesX, dashed)} data-slot="guides-line" />}
      {(rules === "both" || rules === "bottom") && <div className={cn(line, "-bottom-px h-px border-t", rulesX, dashed)} data-slot="guides-line" />}
      {CORNERS[marks].map((corner) => (
        <svg
          key={corner}
          aria-hidden
          className={cn("absolute size-3.5 text-muted-foreground", MARK[corner])}
          data-slot="guides-mark"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          viewBox="0 0 14 14"
        >
          {markShape === "plus" && <path d="M7 0v14M0 7h14" />}
          {markShape === "dot" && <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" />}
          {markShape === "square" && <rect className="fill-background" x="4.5" y="4.5" width="5" height="5" />}
        </svg>
      ))}
    </div>
  )
}

export { Guides }
export type { GuidesProps }
