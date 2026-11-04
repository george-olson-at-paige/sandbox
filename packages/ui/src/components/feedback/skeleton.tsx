import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"
import type { Shape } from "../../lib/vocabulary"
import { Skeleton as UiSkeleton } from "../../base/skeleton"

/* @archetype Mark (ARCHETYPES.md).
   Paige Skeleton over upstream Skeleton (R8-08): the loading placeholder for data that has a
   known shape (a number, a sparkline, table rows), so the layout doesn't shift when it lands.
   The track colour (neutral, not upstream's accent blue), a still block under reduced motion,
   and hidden from assistive tech: the region that's loading says so (aria-busy, or a Spinner's
   label), not each block. Shapes: `text` (a line of the given text size), `block` (fills the
   width at a set height), `circle`. Server-safe. */
const SHAPE = {
  text: "h-4 rounded-sm",
  number: "h-9 rounded-md",
  block: "h-full w-full rounded-md",
  circle: "rounded-full",
} as const
const WIDTH = { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", "1/3": "w-1/3", "1/4": "w-1/4" } as const

/** A placeholder block in the shape of content that's still loading; hidden from screen readers. */
function Skeleton({
  shape = "text",
  width = "full",
  className,
}: {
  shape?: Extract<Shape, keyof typeof SHAPE>
  width?: keyof typeof WIDTH
  className?: string
}) {
  return (
    <UiSkeleton
      aria-hidden
      data-shape={shape}
      className={cn("bg-track motion-reduce:animate-none", SHAPE[shape], shape !== "block" && shape !== "circle" && WIDTH[width], className)}
    />
  )
}

export { Skeleton }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SkeletonProps = ComponentProps<typeof Skeleton>
