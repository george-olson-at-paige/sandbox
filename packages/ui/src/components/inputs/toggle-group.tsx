"use client"

import type { ComponentProps } from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import { ToggleGroup as UiToggleGroup, ToggleGroupItem as UiToggleGroupItem } from "../../base/toggle-group"
import { cardVariants } from "../display/card"
import { cardFocus } from "../internal/control"

/* @archetype Control (ARCHETYPES.md).
   Paige ToggleGroup over upstream ToggleGroup (U-04). What the base gives for free: one tab stop
   on the pressed item, arrow keys that move through the items and wrap, Home and End, disabled
   items skipped, `role="radio"` + `aria-checked` in single mode and `aria-pressed` in multiple,
   `data-state="on|off"` on every item. FilterCardRow wrote all of that by hand before.
   What the base draws, a joined bar of small grey toggles, isn't a Paige look, so the Paige item
   has variants of its own and the base's chrome is taken off underneath each:
   - `card`: a segment card (FilterCardRow; R15-13 option C, quieted by R21-01 to the Journeys
     mock's summary card). It is the compact Card (`cardVariants({ density: "compact" })`: 10px
     corner, 18 × 16 padding, the surface edge, which is the hairline tint on the admin page),
     drawn on Radix's own Item with `asChild` around a `<button>` (R21-01): the base's item is a
     36px toggle (`h-9`, `inline-flex`, `whitespace-nowrap`, its own ring), which the card had to
     undo class by class and which its look depended on the merge order to undo. Rest: flat (no
     shadow). Hover: the border one step up (`--hairline-strong`) and the card shadow at most,
     never blue (blue means chosen). Pressed: `layer-press` over the white (R4-01; it was the
     warm off-white, which broke the relative-press rule). Chosen: still white, the brand border
     doubled by an inner 1px ring (a 2px look) and nothing else (the pop shadow went: it made the
     chosen card float and glow); hovering or pressing it changes nothing. Focus is the halo
     outside the border (`cardFocus`), 2px away from it so it doesn't merge with the inner ring.
   - `icon` (R20-11, George 2026-10-31: the `card` ones "are more like category filters", he
     wanted the real toggle group): the joined bar of icon toggles that view switchers (grid /
     list) and formatting bars (bold / italic, `multiple`) use, and the one place the base's own
     look survives, in Paige's chrome. Items are 36px squares (`size-control-sm`) holding a 16px
     glyph; at rest they are Button `ghost` (no fill, the muted ink; hover is `layer-hover` and
     the body ink). On (`toggled:`, read from ARIA like `card`, since a Tooltip around an item
     overwrites `data-state`): the cool neutral fill (`bg-divider-tint`, the hairline tint: one
     step darker than `bg-muted`, so the chosen item reads stronger than the hover wash, R21-15)
     and the strong ink (`text-card-foreground`, what a control's value
     is drawn in). Not blue: blue says "chosen" on a card; on a bar the fill says "pressed".
     The bar is one hairline around the group, `rounded-sm` (8px), with 1px dividers between
     the items in the same `border` weight (the dividers are the outline carried across the
     cells, one level, not rows in a list). The joining is the base's own: `ToggleGroup
     variant="icon"` holds `spacing` at 0, so the base squares the items and drops their
     shadows, and the wrapper adds the outline, the dividers (`divide-x` on the root, one
     line per cell) and the outer corners at `rounded-sm` to match the group's. The root can't
     clip (no `overflow-hidden`: it would cut the focus ring), so the first and last items round
     their own outer corners. Focus is `focus-ring`, the gapped outline, on the item (a toggle
     is a button-like control; the group draws nothing of its own); the focused item is
     `focus-visible:z-raised` so its neighbours don't cover the ring. An icon item has no
     text, so `aria-label` is required by the type (`variant` is a discriminated union), and
     the caller wraps it in our Tooltip, as DagFrame does for its icon buttons: the component
     adds none, because a Tooltip is the caller's copy and the trigger must be the item
     itself (`<Tooltip content="List"><ToggleGroupItem …/></Tooltip>`).
     Which group: a toggle group holds a state; a ButtonGroup (Actions) is actions side by side.
   - `segment` (R21-04, the Journeys page's "how they came in": Everyone · Signed up · Came back;
     Vue's `.rpt-segments`): the `icon` bar's join, outline and dividers with text items, 36px
     tall (`h-control-sm`), 14/600 (`text-sm font-semibold`), 14px side padding. On:
     the muted fill and the strong ink, exactly as an `icon` item (George 2026-10-31: the muted
     fill, not the mock's dark ink, for consistency with the icon bar; R21-15 takes both bars to
     the hairline tint, since `bg-muted` read fainter than the hover wash). In single mode the root is
     a `radiogroup` (the base makes each item a `radio` with `aria-checked`); in multiple mode the
     items are `aria-pressed` buttons. The base clears a single group's value when the pressed
     item is pressed again; a segmented filter keeps one on, so the caller ignores an empty value
     (`onValueChange={(v) => v && set(v)}`), as FilterCardRow does. Focus is `focus-ring`.
     The bar never runs past its holder (R21-17, found at 375 on Journeys): `max-w-full`, 8px
     sides under `sm`, and as a last resort the items shrink and wrap their text.
   - A `chip` variant (GAPS #62, the picker pill as a toggle) is not built: PersonPicker's pills
     are actions, not a selection (its own rationale).
   Layout is the caller's for `card`: the root is a block, and a Grid (or Inline) inside it lays
   the items out; roving focus finds the items wherever they sit. `spacing` is held non-zero so
   the base doesn't join the items into one bar (shared corners, no shadows: its spacing-0
   look). The `icon` bar is the opposite: `spacing` 0, the items are its direct children, and
   the root is a flex row (`w-fit`). The group's `variant` and each item's must agree; the
   group's decides the layout (spacing, outline), the item's the look. */

/** Omit that keeps a union apart (the base's props are single | multiple, and `value` follows `type`). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** The root's chrome by variant: `card` is a plain block for the caller's layout, `icon` and `segment` the outlined, divided bar. */
const GROUP = {
  card: "block w-full rounded-none",
  icon: "w-fit rounded-sm border divide-x divide-border",
  segment: "w-fit max-w-full items-stretch rounded-sm border divide-x divide-border bg-card",
} as const

/** The base's `spacing` by variant: held off zero for `card` so nothing is joined, zero for the bars so the base joins them. */
const SPACING = { card: 4, icon: 0, segment: 0 } as const

type ToggleGroupVariant = keyof typeof GROUP

/** The base's props less its look (variant, size, spacing) and inline style, plus the Paige variant. */
type ToggleGroupProps = DistributiveOmit<ComponentProps<typeof UiToggleGroup>, "variant" | "size" | "spacing" | "style"> & {
  /** card: the caller lays segment cards out inside (default, FilterCardRow). icon: the joined, outlined bar of icon toggles. segment: the same bar with text items (a segmented control). The bars' items are direct children. */
  variant?: ToggleGroupVariant
}

/** A set of toggles with one tab stop and arrow keys (single: a radio group; multiple: pressed buttons). Items are ToggleGroupItem. */
function ToggleGroup({ variant = "card", className, ...props }: ToggleGroupProps) {
  return (
    <UiToggleGroup
      data-variant={variant}
      // A single segmented control is a radio group (its items are radios); the caller may override.
      role={variant === "segment" && props.type === "single" ? "radiogroup" : undefined}
      spacing={SPACING[variant]}
      className={cn(GROUP[variant], className)}
      {...(props as ComponentProps<typeof UiToggleGroup>)}
    />
  )
}

/** The segment card (R21-01): the compact Card, flat at rest; a hairline-strong hover, a relative press, the brand border and inner ring when chosen. */
const CARD = cn(
  cardVariants({ density: "compact" }),
  // A button laid out as a card: full width of its grid cell, lines from the left edge.
  "w-full min-w-0 cursor-pointer text-left transition",
  // Hover: the hairline one step up and the card shadow; never blue.
  "hover:border-hairline-strong hover:shadow-card",
  // Pressed: the relative press over the white, no shadow.
  "active:layer-press active:shadow-none",
  // Chosen (`toggled:`, read from ARIA: a Tooltip around the card overwrites data-state): the
  // brand border doubled by an inner 1px ring; hover and press change nothing.
  "toggled:border-primary toggled:inset-ring-1 toggled:inset-ring-primary toggled:hover:border-primary toggled:hover:shadow-none toggled:active:bg-none",
  // Focus: the halo outside the border, held 2px off it so it reads apart from the chosen ring.
  cardFocus,
  "focus-visible:ring-offset-2",
  // Disabled: the package's opacity.
  "disabled:cursor-not-allowed disabled:opacity-disabled"
)

/** The icon toggle (R20-11): a 36px square, ghost at rest, the neutral fill and strong ink when on, the gapped ring on focus. */
const ICON = cn(
  // A square on the control scale; the base's `px-3`/`min-w-0` and default size give way.
  "size-control-sm min-w-0 shrink-0 px-0 [&_svg:not([class*='size-'])]:size-icon",
  // Joined: the base squares an item at spacing 0; the two ends take the root's 8px corners
  // (the root can't clip, or it would cut the ring).
  "data-[spacing=0]:first:rounded-l-sm data-[spacing=0]:last:rounded-r-sm",
  // Rest and hover are Button ghost's: muted ink, the relative wash (R4-01), the body ink.
  "cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground hover:layer-hover active:layer-press",
  // On: the neutral fill and the strong ink. `data-[state=on]` is the base's own state (no
  // Tooltip); `toggled:` reads ARIA, which a Tooltip trigger can't overwrite. Both say the same,
  // and the hover rules are repeated so a hovered pressed item keeps its fill (the wash goes on top).
  "data-[state=on]:bg-divider-tint data-[state=on]:text-card-foreground data-[state=on]:hover:bg-divider-tint data-[state=on]:hover:text-card-foreground",
  "toggled:bg-divider-tint toggled:text-card-foreground toggled:hover:bg-divider-tint toggled:hover:text-card-foreground",
  // Focus: the gapped outline (a toggle is button-like, R15-17), the base's halo off, lifted above
  // its neighbours so the ring isn't clipped by them.
  "focus-ring focus-visible:relative focus-visible:z-raised focus-visible:border-transparent focus-visible:ring-0",
  // Disabled: the package's opacity on the glyph only. On the item it would fade the divider that
  // is the item's right border, and the bar would show one full line and one faint one.
  "disabled:opacity-100 disabled:[&>svg]:opacity-disabled"
)

/** The segment (R21-04): a text item in the joined bar, 36px tall; the `icon` item's states and joins. */
const SEGMENT = cn(
  // Never wider than its holder (R21-17): under `sm` the sides come in to 8px, and if the bar
  // still doesn't fit, the items shrink and their text wraps (the bar grows taller, every item
  // the same height) rather than running out of the page.
  "h-auto min-h-control-sm min-w-0 shrink px-2 py-1 text-center text-sm leading-tight font-semibold whitespace-normal sm:px-3.5",
  "data-[spacing=0]:first:rounded-l-sm data-[spacing=0]:last:rounded-r-sm",
  "cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground hover:layer-hover active:layer-press",
  "data-[state=on]:bg-divider-tint data-[state=on]:text-card-foreground data-[state=on]:hover:bg-divider-tint data-[state=on]:hover:text-card-foreground",
  "toggled:bg-divider-tint toggled:text-card-foreground toggled:hover:bg-divider-tint toggled:hover:text-card-foreground",
  "focus-ring focus-visible:relative focus-visible:z-raised focus-visible:border-transparent focus-visible:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-100 disabled:text-placeholder"
)

type CardItemProps = Omit<ComponentProps<typeof UiToggleGroupItem>, "variant" | "size" | "style"> & {
  /** card: a segment card with counts (FilterCardRow); its content is the caller's. */
  variant: "card"
}

type IconItemProps = Omit<ComponentProps<typeof UiToggleGroupItem>, "variant" | "size" | "style" | "aria-label"> & {
  /** icon: one glyph in a 36px square, for the joined bar; wrap it in a Tooltip for the name. */
  variant: "icon"
  /** The item's name: an icon has no text, so it is required (and the Tooltip's `content` repeats it). */
  "aria-label": string
}

type SegmentItemProps = Omit<ComponentProps<typeof UiToggleGroupItem>, "variant" | "size" | "style"> & {
  /** segment: a text item in the joined bar (a segmented control); its text is its name. */
  variant: "segment"
}

type ToggleGroupItemProps = CardItemProps | IconItemProps | SegmentItemProps

const VARIANT = { card: CARD, icon: ICON, segment: SEGMENT } as const satisfies Record<ToggleGroupVariant, string>

/** One toggle in a ToggleGroup, in a Paige look (`card` or `icon`); a card's content is the caller's, an icon item holds one glyph. */
function ToggleGroupItem({ variant, className, children, ...props }: ToggleGroupItemProps) {
  if (variant === "card") {
    // Radix's Item (the roving focus, the radio role, data-state) on a plain button wearing the
    // card: no toggle chrome underneath to undo (R21-01; PRIMITIVE_OK in check-layers).
    return (
      <ToggleGroupPrimitive.Item asChild {...props}>
        <button type="button" data-slot="toggle-group-item" data-variant="card" className={cn(CARD, className)}>
          {children}
        </button>
      </ToggleGroupPrimitive.Item>
    )
  }
  return (
    <UiToggleGroupItem data-variant={variant} className={cn(VARIANT[variant], className)} {...props}>
      {children}
    </UiToggleGroupItem>
  )
}

export { ToggleGroup, ToggleGroupItem }
export type { ToggleGroupProps, ToggleGroupItemProps, ToggleGroupVariant }
