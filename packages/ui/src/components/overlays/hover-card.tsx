"use client"

import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"
import {
  HoverCard as UiHoverCard,
  HoverCardContent as UiHoverCardContent,
  HoverCardTrigger as UiHoverCardTrigger,
} from "../../base/hover-card"
import { POPOVER_SIDE_OFFSET, popoverContent, type PopoverAlign, type PopoverSide } from "../internal/popover-surface"

/* @archetype Overlay (ARCHETYPES.md).
   Paige HoverCard over upstream HoverCard (Radix; R20-16): a small panel of extra detail that
   opens beside its trigger when a pointer rests on it or the trigger takes focus. It is
   compositional, `HoverCard` > `HoverCardTrigger` + `HoverCardContent`, so the trigger is
   whatever the screen already has (a term, a button) and nothing is wrapped that didn't need to
   be.

   THE RULE: a hover card is supplementary. The same detail must also be reachable some other
   way, and a hover card must never be the only way to get the information. Three reasons the
   component can't make that true by itself, so the caller has to:
   - Radix opens it on focus as well as hover, so a keyboard user gets it by tabbing to the
     trigger, and Escape closes it. That only works if the trigger is focusable: a link or a
     button (`asChild`), never a bare span.
   - It does not open on touch. A phone user taps the trigger and nothing happens, so what it
     says must live on a page, a row or a dialog too, never only here.
   - It holds no controls the person needs: the pointer leaving closes it, and it is not a
     dialog. Anything to press goes in a Popover (click to open, stays until dismissed).
   Use a Tooltip for a few words naming a control, a Popover for content with actions, and a
   HoverCard for a short read-only block (a definition, a small table) behind something that is
   already on screen.

   Look: the shared popover surface (popover-surface.ts: 12px radius, the pop shadow, 8px from
   the trigger, as Popover, DropdownMenu and Select) at `w-popover` with 16px of padding, since
   it holds prose rather than menu items. Delays: `openDelay` 300 (a pointer passing over the
   trigger doesn't flash it open) and `closeDelay` 150 (long enough to cross the gap to the
   card). Focus opens on the same delay. Controlled with `open` / `onOpenChange` when a story or
   screen needs it. */

/** A small read-only panel beside its trigger, opened by hover or focus: supplementary, never the only way to get the information. */
function HoverCard({
  openDelay = 300,
  closeDelay = 150,
  ...props
}: Pick<ComponentProps<typeof UiHoverCard>, "open" | "defaultOpen" | "onOpenChange" | "children"> & {
  /** Milliseconds a pointer (or focus) must rest on the trigger before the card opens. Default 300. */
  openDelay?: number
  /** Milliseconds after the pointer leaves, or focus moves away, before it closes. Default 150. */
  closeDelay?: number
}) {
  return <UiHoverCard openDelay={openDelay} closeDelay={closeDelay} {...props} />
}

/** The element that opens the card (asChild: a link or button, so a keyboard user can reach it). */
function HoverCardTrigger(props: Pick<ComponentProps<typeof UiHoverCardTrigger>, "asChild" | "children">) {
  return <UiHoverCardTrigger {...props} />
}

/** The panel: read-only detail, never controls. */
function HoverCardContent({
  side = "bottom",
  align = "center",
  className,
  children,
  ...props
}: Pick<ComponentProps<typeof UiHoverCardContent>, "id" | "aria-label" | "aria-labelledby"> & {
  /** Side of the trigger it opens on (default bottom; flips when there is no room). */
  side?: PopoverSide
  /** How it lines up with the trigger (default center). */
  align?: PopoverAlign
  /** Width and placement only (w-popover-wide), not restyling. */
  className?: string
  children: ReactNode
}) {
  return (
    <UiHoverCardContent
      side={side}
      align={align}
      sideOffset={POPOVER_SIDE_OFFSET}
      collisionPadding={16}
      className={cn(popoverContent, "w-popover bg-popover p-4", className)}
      {...props}
    >
      {children}
    </UiHoverCardContent>
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type HoverCardProps = ComponentProps<typeof HoverCard>
export type HoverCardContentProps = ComponentProps<typeof HoverCardContent>
export type HoverCardTriggerProps = ComponentProps<typeof HoverCardTrigger>
