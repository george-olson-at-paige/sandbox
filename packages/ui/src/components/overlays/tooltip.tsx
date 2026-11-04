"use client"

import type { ComponentProps } from "react"
import type { ReactElement } from "react"

import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger as UiTooltipTrigger,
} from "../../base/tooltip"
import type { PopoverAlign, PopoverSide } from "../internal/popover-surface"

/* @archetype Overlay (ARCHETYPES.md).
   Paige Tooltip over upstream Tooltip (Radix; R4-07, George 2026-10-19; name from Orbit).
   Rules, built in where they can be:
   - Short text only: `content` is a string, one line or two (max 16rem), no links or controls.
   - Never the only place information lives: it repeats or expands on something visible or
     already named (an icon button's aria-label). Radix links it with aria-describedby.
   - A delay on hover (500ms; moving between tooltips inside one provider skips it), and it
     shows on keyboard focus too, with no delay.
   - Never on touch-only controls: Radix doesn't open it from a touch press, so on a phone it
     never shows; put nothing in a tooltip that a phone user needs.
   Each Tooltip carries its own provider, so it needs no setup in the host. */
const DELAY_MS = 500

/** A short text hint on hover (after a delay) and on keyboard focus; never the only place the information lives. */
function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
}: {
  /** The hint: short text, one or two lines. */
  content: string
  /** The element it describes (a Button, a link); it receives the trigger's props. */
  children: ReactElement
  /** Side of the trigger it opens on (default top; flips when there is no room). */
  side?: PopoverSide
  /** How it lines up with the trigger (default centre). */
  align?: PopoverAlign
}) {
  return (
    <UiTooltipProvider delayDuration={DELAY_MS}>
      <UiTooltip>
        <UiTooltipTrigger asChild>{children}</UiTooltipTrigger>
        <UiTooltipContent side={side} align={align} sideOffset={4} className="max-w-64 px-2.5 py-1.5 text-xs font-medium">
          {content}
        </UiTooltipContent>
      </UiTooltip>
    </UiTooltipProvider>
  )
}

export { Tooltip }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type TooltipProps = ComponentProps<typeof Tooltip>
