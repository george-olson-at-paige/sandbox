import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import type { AreaId } from "../../icons/area-glyphs"
import { Badge as UiBadge } from "../../base/badge"

/* @archetype Mark (ARCHETYPES.md).
   Paige Badge over upstream Badge: tone (six) × appearance (soft, outline) × size. Also called
   a lozenge elsewhere (Atlassian, Orbit); Badge kept as shadcn's word for it (R4-13).
   No asChild: a badge is never a link here (R1-10). Size xs is for field adornments: 16px
   tall, the line height of the eyebrow it sits next to, so adding one never shifts layout.
   `neutral outline` is one look for three prototype chips (R2-12, George 2026-10-18; Matt to
   confirm): the role tag (vault.css:157), the answered/source chip (vault.css:179-180) and the
   partial chip (ItemRow.tsx:484). Text is 12px at size sm (the floor for text, R2-08); size xs
   uses text-2xs, 11px at 600 with +0.02em tracking (R3-02), the adornment step: 12px looked
   crammed inside the 16px height.
   `area` sets data-area on the badge itself (R2-26, GAPS #35), as AreaIcon does, so a badge
   can wear a different area's tone from its container without a wrapper. */
const badgeVariants = cva("rounded-full font-semibold", {
  variants: {
    tone: { neutral: "", info: "", success: "", warning: "", attention: "", area: "" },
    appearance: { soft: "border-transparent", outline: "bg-transparent" },
    size: {
      sm: "px-2 py-0.5",
      xs: "h-4 gap-0.5 px-1.5 py-0 text-2xs leading-none [&>svg]:size-2.5",
    },
  },
  compoundVariants: [
    { tone: "neutral", appearance: "soft", className: "bg-muted text-muted-foreground" },
    { tone: "neutral", appearance: "outline", className: "border-border text-foreground" },
    { tone: "info", appearance: "soft", className: "bg-info-subtle text-info-foreground" },
    { tone: "info", appearance: "outline", className: "border-info-border text-info-foreground" },
    { tone: "success", appearance: "soft", className: "bg-success-subtle text-success-foreground" },
    { tone: "success", appearance: "outline", className: "border-success-border text-success-foreground" },
    { tone: "warning", appearance: "soft", className: "bg-warning-subtle text-warning-foreground" },
    { tone: "warning", appearance: "outline", className: "border-warning-border text-warning-foreground" },
    { tone: "attention", appearance: "soft", className: "bg-attention-subtle text-attention-foreground" },
    { tone: "attention", appearance: "outline", className: "border-attention-border text-attention-foreground" },
    { tone: "area", appearance: "soft", className: "bg-area-tint text-area-ink" },
    { tone: "area", appearance: "outline", className: "border-area text-area-ink" },
  ],
  defaultVariants: { tone: "neutral", appearance: "soft", size: "sm" },
})

type BadgeProps = VariantProps<typeof badgeVariants> & {
  /** Leading icon (lucide). */
  icon?: ReactNode
  /** The Life Area whose tone `tone="area"` uses. Default: the nearest data-area ancestor. */
  area?: AreaId
  children?: ReactNode
  className?: string
} & Pick<ComponentProps<"span">, "id" | "title" | "aria-label">

/** A short status or category label (tone; soft or outline). Never a link. */
function Badge({ tone, appearance, size, icon, area, className, children, ...props }: BadgeProps) {
  return (
    <UiBadge
      variant="outline"
      data-tone={tone ?? "neutral"}
      data-area={area}
      className={cn(badgeVariants({ tone, appearance, size }), className)}
      {...props}
    >
      {icon}
      {children}
    </UiBadge>
  )
}

export { Badge }
export type { BadgeProps }
