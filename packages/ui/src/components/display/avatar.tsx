import type { ComponentProps } from "react"
import { cva } from "class-variance-authority"
import { CheckIcon, PawPrintIcon, PencilIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Dot, type DotSize } from "./dot"
import {
  Avatar as UiAvatar,
  AvatarFallback as UiAvatarFallback,
  AvatarGroup as UiAvatarGroup,
  AvatarGroupCount as UiAvatarGroupCount,
  AvatarImage as UiAvatarImage,
} from "../../base/avatar"

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()

/* @archetype Media (ARCHETYPES.md).
   Paige Avatar over upstream Avatar: one component from a name (and an optional photo).
   size sm 24 · md 34 (R11-08: the prototype's nav size, was 36; the header avatar) · lg 40 ·
   xl 48 · 2xl 74 (R11-08: the account menu's heading); variant person · pet.
   Decided (George, 2026-10-19, REVIEW-3 group D):
   - A photo always has a border (R13-13, George 2026-10-20; superseding R3-07's bare image and
     R4-03's opt-in `subtle` ring): drawn inside the circle over the photo's edge, in the theme's
     border colour, 2px up to md and 3px from lg, on every photo (the sample photos too, now that
     the border is gone from the image files). Initials and the pet's paw never have one. The rule
     is inside Avatar (`has-[img]:` on the frame: Radix renders the <img> only once it has loaded,
     so a photo that fails falls back to initials without a border); no caller turns it on or off.
   - A ring is drawn outside the image, as the prototype's
     graph avatars (setup.css:223,239): `ring="default"` is 3px white with a soft shadow, for an
     avatar on a busy background; `ring="me"` is 3px blue, the owner. `selected` draws the same
     blue ring (it means selected, not focused: R1-09). The nav avatar has neither.
   - `ring="subtle"` (R4-03, R11-08) is gone: the photo border gives the header avatar its edge.
   - When focus styling returns (R1-01), focus draws outside the ring with an offset and never
     replaces it (R3-09), so a selected avatar can show both.
   - A pet without a photo shows a paw by default; `fallback="letter"` shows its initial (R3-08).
     A person always shows initials.
   - `badge` is a typed choice (R3-11): "check" (set up, chosen) or "edit" (a pickable photo,
     R3-12; the prototype shows it on hover, which comes later). At lg and xl it draws its
     icon (2xl uses xl's badge); at sm and md it is a plain dot (R5-06: no icon that small lands on whole pixels).
   The badge sits on a wrapper outside the image's clip. */
const avatarVariants = cva("", {
  variants: {
    size: { sm: "size-6", md: "size-8.5", lg: "size-10", xl: "size-12", "2xl": "size-18.5" },
    ring: {
      none: "",
      default: "shadow-avatar ring-3 ring-white",
      me: "shadow-avatar ring-3 ring-primary",
    },
  },
  defaultVariants: { size: "md", ring: "none" },
})

type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl"
type AvatarRing = "default" | "me"

/** Upstream knows sm · default · lg; md, xl and 2xl use "default" so upstream's lg rules (40px) don't apply. */
const UPSTREAM_SIZE = { sm: "sm", md: "default", lg: "lg", xl: "default", "2xl": "default" } as const satisfies Record<AvatarSize, string>
/* The photo border (R13-13): an inset circle over the photo's edge, only while an <img> is shown. */
const photoBorder = {
  sm: "has-[img]:after:border-2",
  md: "has-[img]:after:border-2",
  lg: "has-[img]:after:border-3",
  xl: "has-[img]:after:border-3",
  "2xl": "has-[img]:after:border-3",
} as const satisfies Record<AvatarSize, string>
const initialsText = { sm: "text-xs", md: "text-sm", lg: "text-sm", xl: "text-base", "2xl": "text-2xl" } as const
/* The paw is a glyph on the icon scale (T-02) except at 2xl, where 36 is half the 74 avatar and
   off every scale, like the avatar's own 34 and 74 (D-07 decides them together). */
const pawSize = { sm: "size-icon-sm", md: "size-icon-lg", lg: "size-icon-lg", xl: "size-icon-xl", "2xl": "size-9" } as const
/* The badge is a Dot (R4-09): primary, ringed, 12 · 14 · 16 · 20.
   Its icon lands on whole device pixels at 100, 125 and 150% (R5-06, GAPS #92), by the R4-15
   rule: the icon and its centring offset, (dot − icon) / 2, are whole at 1.25x, so the icon is
   a multiple of 4 and dot − icon a multiple of 8. lg: 8 in 16 (offset 4; was 10, offset 3 →
   3.75 device px at 125%); xl: 12 in 20 (offset 4, unchanged). At sm (12) and md (14) no
   legible icon fits that rule, so the badge is the plain Dot, no icon: at 24-36px the mark is a
   dot either way, and its meaning is said by the text or control beside the avatar. */
const badgeSize = { sm: "sm", md: "md", lg: "lg", xl: "xl", "2xl": "xl" } as const satisfies Record<AvatarSize, DotSize>
const badgeIcon = { sm: null, md: null, lg: "[&>svg]:size-2", xl: "[&>svg]:size-icon-xs", "2xl": "[&>svg]:size-icon-xs" } as const satisfies Record<AvatarSize, string | null>
/* Decorative: what the badge means is said by the text next to the avatar or by the control
   that wraps it (an edit button's own label). */
const BADGE_ICON = {
  check: <CheckIcon strokeWidth={3} aria-hidden />,
  edit: <PencilIcon strokeWidth={2.5} aria-hidden />,
} as const

type AvatarCommon = {
  /** Used for the initials fallback. */
  name: string
  /** Photo URL. Decorative: the name is always shown or announced nearby. A photo always gets the border (R13-13). */
  src?: string
  /** sm 24 · md 34 (default; the header) · lg 40 · xl 48 · 2xl 74 (the account menu's heading). */
  size?: AvatarSize
  /** A ring outside the image: "default" white + soft shadow (busy backgrounds), "me" blue (the owner). */
  ring?: AvatarRing
  /** Selected: the blue ring ("me"). */
  selected?: boolean
  /** Bottom right, outside the clip: "check" (set up, chosen) or "edit" (a pickable photo). The icon shows at lg and xl; sm and md show a plain dot (R5-06). */
  badge?: "check" | "edit"
  className?: string
}

type AvatarProps = AvatarCommon &
  (
    | { variant?: "person"; fallback?: never }
    | {
        variant: "pet"
        /** Without a photo: a paw ("icon", default) or the pet's initial ("letter"). */
        fallback?: "icon" | "letter"
      }
  )

/** A person's or pet's photo, initials or paw, at five sizes, with an optional ring and badge. */
function Avatar({ name, src, size, ring, selected, badge, className, ...rest }: AvatarProps) {
  const s = size ?? "md"
  const variant = rest.variant ?? "person"
  const paw = rest.variant === "pet" && (rest.fallback ?? "icon") === "icon"
  return (
    <span data-slot="avatar-frame" data-size={s} className={cn("relative inline-flex shrink-0 rounded-full", className)}>
      <UiAvatar
        size={UPSTREAM_SIZE[s]}
        data-variant={variant}
        data-ring={selected ? "me" : ring}
        className={cn(
          avatarVariants({ size: s, ring: selected ? "me" : (ring ?? "none") }),
          "has-[img]:after:pointer-events-none has-[img]:after:absolute has-[img]:after:inset-0 has-[img]:after:rounded-full has-[img]:after:border-border",
          photoBorder[s]
        )}
      >
        {src && <UiAvatarImage src={src} alt="" className="object-cover" />}
        <UiAvatarFallback
          className={cn(
            "font-semibold",
            initialsText[s],
            variant === "pet" ? "bg-pet-subtle text-pet" : "bg-primary-subtle text-foreground-strong"
          )}
        >
          {paw ? <PawPrintIcon aria-hidden className={pawSize[s]} /> : initialsOf(name)}
        </UiAvatarFallback>
      </UiAvatar>
      {badge && (
        <Dot
          tone="primary"
          size={badgeSize[s]}
          ring
          data-slot="avatar-badge"
          data-badge={badge}
          className={cn("absolute -right-0.5 -bottom-0.5 z-raised", badgeIcon[s])}
        >
          {badgeIcon[s] && BADGE_ICON[badge]}
        </Dot>
      )}
    </span>
  )
}

type AvatarGroupPerson = { name: string; src?: string; variant?: "person" | "pet" }

/* The "+N" count matches the avatars' size (R3-13): upstream sizes it for its own 32px default
   (and 24 / 40 by data-size), so at md it was 32 next to the avatars. */
const countSize = {
  sm: "size-6 text-xs",
  md: "size-8.5 text-sm",
  lg: "size-10 text-sm",
  xl: "size-12 text-base",
  "2xl": "size-18.5 text-2xl",
} as const satisfies Record<AvatarSize, string>

/* AvatarGroup over upstream AvatarGroup + AvatarGroupCount (restored in R1-25): overlapping
   avatars for the people who share something, with "+N" past `max`. Data-driven like Avatar.
   The group is one image to screen readers, named by the people in it. */
/** Overlapping avatars for the people who share something, with a "+N" count the same size. */
function AvatarGroup({
  people,
  max = 4,
  size = "md",
  className,
}: {
  /** The people (or pets) in the group, in order. */
  people: AvatarGroupPerson[]
  /** Avatars shown before the "+N" count. */
  max?: number
  /** Avatar and count size: sm 24 · md 34 · lg 40 · xl 48 · 2xl 74. */
  size?: AvatarSize
  className?: string
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <UiAvatarGroup role="img" aria-label={people.map((p) => p.name).join(", ")} className={className}>
      {shown.map((p) =>
        p.variant === "pet" ? (
          <Avatar key={p.name} name={p.name} src={p.src} variant="pet" size={size} className="ring-2 ring-background" />
        ) : (
          <Avatar key={p.name} name={p.name} src={p.src} size={size} className="ring-2 ring-background" />
        )
      )}
      {rest > 0 && (
        <UiAvatarGroupCount className={cn("font-semibold", countSize[size])}>
          +{rest}
        </UiAvatarGroupCount>
      )}
    </UiAvatarGroup>
  )
}

export { Avatar, AvatarGroup, initialsOf }
export type { AvatarGroupPerson, AvatarProps, AvatarRing, AvatarSize }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AvatarGroupProps = ComponentProps<typeof AvatarGroup>
