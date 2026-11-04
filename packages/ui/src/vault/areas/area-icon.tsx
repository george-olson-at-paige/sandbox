import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { AreaGlyph, type AreaId } from "../../icons/area-glyphs"

/* @archetype Media (ARCHETYPES.md).
   AreaIcon: 7 prototype sizes (20/28/32/38/40/44/56) -> sm 20 · md 32 · lg 44 · xl 56.
   tone solid · soft, the same names as Badge (R1-04; was solid · tint); plain = glyph only (R1-21).
   Glyph sizes map to whole device pixels at 100, 125 and 150% display scaling (R4-15, GAPS #89):
   the glyph and its centring offset, (box − glyph) / 2, must both be whole at 1.25x, so box −
   glyph is a multiple of 8. sm 20/12 and md 32/16 already were; lg was 44/24 (offset 10 →
   12.5 device px at 125%) and xl 56/28 (offset 14 → 17.5), so lg's glyph is 20 (prototype 22)
   and xl's 24 (prototype 28). The boxes keep the prototype's sizes.
   Stroke (R5-07, GAPS #93): below 20px the glyph's own 1.85-unit stroke scales under 1.3px and
   fades, so sm (12) and md (16) hold it at 1.5 CSS px (`icon-stroke-small`, non-scaling); lg and
   xl keep the drawn stroke. */
const areaIconVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center",
  {
    variants: {
      size: {
        sm: "size-5 rounded-sm [&>svg]:size-icon-xs [&>svg]:icon-stroke-small",
        md: "size-8 rounded-md [&>svg]:size-icon [&>svg]:icon-stroke-small",
        lg: "size-11 rounded-lg [&>svg]:size-icon-lg",
        xl: "size-14 rounded-lg [&>svg]:size-icon-xl",
      },
      tone: {
        solid: "bg-area text-on-tone",
        soft: "bg-area-tint text-area",
        /* plain: the glyph alone in the area colour, no container, for tight spots like a Badge. */
        plain: "size-auto rounded-none bg-transparent text-area",
      },
    },
    defaultVariants: { size: "md", tone: "solid" },
  }
)

/** A Life Area's glyph on its area colour, with an optional set-up tick. */
function AreaIcon({
  area,
  size,
  tone,
  tick,
  className,
}: {
  /** Which Life Area: picks the glyph and the area colour. */
  area: AreaId
  /** Adds a success tick at the corner (the Area is set up). */
  tick?: boolean
  /** sm 20 · md 32 (default) · lg 44 · xl 56 px. */
  size?: VariantProps<typeof areaIconVariants>["size"]
  /** solid (default): area fill, white glyph · soft: area tint, area-coloured glyph · plain: the glyph alone, no background (inside a Badge). */
  tone?: VariantProps<typeof areaIconVariants>["tone"]
  className?: string
}) {
  return (
    <span data-slot="area-icon" data-area={area} className={cn(areaIconVariants({ size, tone }), className)}>
      <AreaGlyph area={area} />
      {tick && (
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-success text-on-tone">
          <CheckIcon className="size-icon-xs" strokeWidth={3} />
        </span>
      )}
    </span>
  )
}

export { AreaIcon, areaIconVariants }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AreaIconProps = ComponentProps<typeof AreaIcon>
