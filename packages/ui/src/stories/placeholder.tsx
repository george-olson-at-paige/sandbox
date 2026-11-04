import { useEffect, useRef, useState, type ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ImageIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Guides } from "./guides"

/* Placeholder: a calm, labelled block that stands in for a slot (card header, body, rail
   panel) in layout stories (R1-07). No shimmer: it is not a loading state. Under the label,
   an optional detail line says what matters about the slot; `measure` adds its rendered
   width × height, live, so a layout story shows what each slot gets at each viewport.
   Drawn as a plan cell (REVIEW-18 § Guides; the standard, George 2026-10-30: "sooo much
   better"): no dashed border; Guides' hairlines run 8px past the corners with a mark on each
   crossing, so a Wireframe reads as a drawing rather than a stack of grey boxes. The xs size (a
   line of text) draws the lines without marks, which would be more than half its height.
   `plan={false}` keeps the dashed box for the odd story where lines would collide. */
const PLAN = "relative rounded-none border-transparent"
const planLines = (size: VariantProps<typeof placeholderVariants>["size"]) => (
  <Guides extend="sm" marks={size === "xs" ? "none" : "corners"} />
)
const placeholderVariants = cva(
  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted px-3 text-center",
  {
    variants: {
      size: {
        xs: "h-6",
        sm: "h-10",
        md: "h-20",
        lg: "h-40",
        xl: "h-64",
        /** Fills its container's height (grid cells, flex children). */
        fill: "h-full min-h-10",
      },
    },
    defaultVariants: { size: "md" },
  }
)

/** The element's rendered size in whole pixels, or null before the first layout. */
function useRenderedSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0]
      setSize({ width: Math.round(box.inlineSize), height: Math.round(box.blockSize) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

/** A labelled dashed block that stands in for a slot in layout stories. */
function Placeholder({
  label,
  detail,
  measure = false,
  size,
  plan = true,
  as: Comp = "div",
  className,
}: {
  /** What the slot stands for, e.g. "Card header". */
  label?: string
  /** A second line under the label: what matters about the slot ("Half the wide column"). Needs size md or taller. */
  detail?: ReactNode
  /** Add the slot's rendered width × height in px to the detail line, updated as the viewport changes. Needs size md or taller. */
  measure?: boolean
  /** Height: xs 24 · sm 40 · md 80 (default) · lg 160 · xl 256 px, or fill (the container's height). */
  size?: VariantProps<typeof placeholderVariants>["size"]
  /** The plan cell (default): Guides' hairlines past the corners, a mark on each crossing. `false` keeps the dashed box. */
  plan?: boolean
  /** "span" for a slot inside inline content (a title, a line of text), so the markup stays valid. Default "div". */
  as?: "div" | "span"
  className?: string
}) {
  const [ref, rendered] = useRenderedSize<HTMLDivElement & HTMLSpanElement>()
  return (
    <Comp ref={ref} data-slot="placeholder" data-plan={plan || undefined} className={cn(placeholderVariants({ size }), plan && PLAN, className)}>
      {plan && planLines(size)}
      {label && <span className="eyebrow max-w-full truncate">{label}</span>}
      <PlaceholderDetail detail={detail} rendered={measure ? rendered : null} />
    </Comp>
  )
}

function PlaceholderDetail({ detail, rendered }: { detail?: ReactNode; rendered: { width: number; height: number } | null }) {
  const line = [detail, rendered && `${rendered.width} × ${rendered.height}`].filter(Boolean)
  if (line.length === 0) return null
  return (
    <span data-slot="placeholder-detail" className="text-xs text-muted-foreground tabular-nums">
      {line.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {part}
        </span>
      ))}
    </span>
  )
}

/* PlaceholderImage: Placeholder's companion for an image or illustration slot. Same dashed
   block, an image glyph above the label, and its shape set by an aspect ratio rather than a
   height, so it scales with the column the way the image will. */
const ASPECT = { square: "aspect-square", video: "aspect-video" } as const

/** A labelled dashed block that stands in for an image or illustration in layout stories. */
function PlaceholderImage({
  label = "Image",
  detail,
  measure = false,
  aspect = "video",
  plan = true,
  className,
}: {
  /** What the image is, e.g. "Illustration". It is also the block's accessible name. Default "Image". */
  label?: string
  /** A second line under the label: what matters about the image. */
  detail?: ReactNode
  /** Add the block's rendered width × height in px to the detail line, updated as the viewport changes. */
  measure?: boolean
  /** Shape: square (1:1) · video (16:9, default). The width comes from the container. */
  aspect?: keyof typeof ASPECT
  /** The plan cell (default), as Placeholder's `plan`. */
  plan?: boolean
  className?: string
}) {
  const [ref, rendered] = useRenderedSize<HTMLDivElement>()
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-slot="placeholder-image"
      data-plan={plan || undefined}
      className={cn(placeholderVariants({ size: null }), "w-full", ASPECT[aspect], plan && PLAN, className)}
    >
      {plan && planLines(null)}
      <ImageIcon aria-hidden className="size-6 text-muted-foreground" />
      <span className="eyebrow max-w-full truncate">{label}</span>
      <PlaceholderDetail detail={detail} rendered={measure ? rendered : null} />
    </div>
  )
}

export { Placeholder, PlaceholderImage }
