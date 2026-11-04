import type { ComponentProps } from "react"
import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/* @archetype Mark (ARCHETYPES.md).
   Dot (R4-09, George 2026-10-19; name and intent from Orbit's Dot, our own API): the generic
   small coloured circle. A tone and a size; an optional ring in the background colour that
   cuts it out of whatever it overlaps (the bell's unread dot, an avatar's badge); an optional
   centred child (a tick, a pencil) sized by the caller. Built on it: StatusDot (20px, the
   item and work statuses), NotificationBell's unread dot (8px, primary, ringed) and Avatar's
   badge (12-20px, primary, ringed, with an icon).
   Decorative by default (aria-hidden): what it means is said by the text or control beside
   it. Pass `label` only when the dot alone carries the meaning; it then has role="img". */
const dotVariants = cva("inline-flex shrink-0 items-center justify-center rounded-full", {
  variants: {
    tone: {
      /** No fill: the caller draws it (StatusDot's dashed and half-filled marks). */
      none: "",
      neutral: "bg-muted-foreground text-on-tone",
      primary: "bg-primary text-primary-foreground",
      info: "bg-info text-on-tone",
      success: "bg-success text-on-tone",
      warning: "bg-warning text-on-tone",
      attention: "bg-attention text-on-tone",
      /** The nearest [data-area] colour (neutral outside one, R3-15). */
      area: "bg-area text-on-tone",
    },
    size: { xs: "size-2", sm: "size-3", md: "size-3.5", lg: "size-4", xl: "size-5" },
    ring: { true: "ring-2 ring-background", false: "" },
  },
  defaultVariants: { tone: "primary", size: "xs", ring: false },
})

type DotTone = NonNullable<VariantProps<typeof dotVariants>["tone"]>
type DotSize = NonNullable<VariantProps<typeof dotVariants>["size"]>

/** A small coloured circle (tone, size, an optional cut-out ring and centred icon): the piece StatusDot, the unread dot and the avatar badge are built on. */
function Dot({
  tone = "primary",
  size = "xs",
  ring = false,
  label,
  children,
  className,
  ...data
}: {
  /** none (the caller draws it) · neutral · primary (default) · info · success · warning · attention · area. */
  tone?: DotTone
  /** xs 8 (default) · sm 12 · md 14 · lg 16 · xl 20 px. */
  size?: DotSize
  /** A 2px ring in the background colour, so the dot reads where it overlaps an icon or a photo. */
  ring?: boolean
  /** Accessible name. Without it the dot is decorative (aria-hidden). */
  label?: string
  /** A centred icon (decorative), sized by the caller. */
  children?: ReactNode
  /** Placement (absolute position, margin), and the extra marks a composite draws on it. */
  className?: string
  [key: `data-${string}`]: string | undefined
}) {
  return (
    <span
      data-slot="dot"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(dotVariants({ tone, size, ring }), className)}
      {...data}
    >
      {children}
    </span>
  )
}

export { Dot }
export type { DotSize, DotTone }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type DotProps = ComponentProps<typeof Dot>
