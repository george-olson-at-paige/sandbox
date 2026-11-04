"use client"

import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"
import {
  Popover as UiPopover,
  PopoverAnchor as UiPopoverAnchor,
  PopoverContent as UiPopoverContent,
  PopoverTrigger as UiPopoverTrigger,
} from "../../base/popover"
import { POPOVER_SIDE_OFFSET, popoverContent, type PopoverAlign, type PopoverSide } from "../internal/popover-surface"

/* @archetype Overlay (ARCHETYPES.md).
   Paige Popover over upstream Popover (Radix; R11-10). A panel beside its trigger with the same
   surface, gap and shadow as DropdownMenu and Select (popover-surface.ts), for content that
   isn't a menu: the header's notifications, HeaderSearch's results. Radix gives the behaviour
   the header needs: a click outside or Escape closes it, focus goes back to the trigger, and
   it's non-modal (the page stays usable). Controlled with `open` / `onOpenChange` when several
   share one open state (the header: one popover at a time). `PopoverAnchor` positions it
   against something other than the trigger (HeaderSearch's field). */

/** A panel beside its trigger for content that isn't a menu: click outside or Escape closes it. */
function Popover(props: Pick<ComponentProps<typeof UiPopover>, "open" | "defaultOpen" | "onOpenChange" | "children">) {
  return <UiPopover {...props} />
}

/** The element that opens the popover (asChild: a Button). */
function PopoverTrigger(props: Pick<ComponentProps<typeof UiPopoverTrigger>, "asChild" | "children">) {
  return <UiPopoverTrigger {...props} />
}

/** What the popover lines up with when it isn't the trigger. */
function PopoverAnchor(props: Pick<ComponentProps<typeof UiPopoverAnchor>, "asChild" | "children" | "className">) {
  return <UiPopoverAnchor {...props} />
}

/** The panel. */
function PopoverContent({
  side = "bottom",
  align = "end",
  className,
  children,
  ...props
}: Pick<
  ComponentProps<typeof UiPopoverContent>,
  "id" | "aria-label" | "aria-labelledby" | "role" | "onOpenAutoFocus" | "onCloseAutoFocus" | "onInteractOutside" | "onEscapeKeyDown" | "onMouseDown"
> & {
  /** Side of the trigger it opens on (default bottom; flips when there is no room). */
  side?: PopoverSide
  /** How it lines up with the trigger (default end: the header's actions are at the right). */
  align?: PopoverAlign
  /** Width and placement only (w-popover-wide, w-dialog-sm), not restyling. */
  className?: string
  children: ReactNode
}) {
  return (
    <UiPopoverContent
      side={side}
      align={align}
      sideOffset={POPOVER_SIDE_OFFSET}
      collisionPadding={16}
      className={cn(popoverContent, "w-popover bg-popover", className)}
      {...props}
    >
      {children}
    </UiPopoverContent>
  )
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PopoverProps = ComponentProps<typeof Popover>
export type PopoverAnchorProps = ComponentProps<typeof PopoverAnchor>
export type PopoverContentProps = ComponentProps<typeof PopoverContent>
export type PopoverTriggerProps = ComponentProps<typeof PopoverTrigger>
