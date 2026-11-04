"use client"

import type { ComponentProps } from "react"

import { cn } from "../../lib/utils"
import { Switch as UiSwitch } from "../../base/switch"
import { useFieldControl } from "../internal/field-context"

/* @archetype Control (ARCHETYPES.md).
   Paige Switch over upstream Switch (R11-04). A switch means "this takes effect now" (Apple's
   HIG, NN/g's toggle-switch guideline, Linear and Notion properties, GitHub's settings): use it
   only where flipping it applies the change at once; a choice that waits for a Save is a
   checkbox or a radio. InlineEdit's `control="switch"` saves on the flip for that reason.
   Sizes: a 40 × 22 track with a 20px thumb (the base's `default` size scaled up: its 1px inset and
   calc(100% − 2px) travel, so a 20px thumb lands 1px from each end; the base's `sm` isn't used); the row it sits in gives the 44px touch target. Off is the muted ink (3:1 against white, WCAG 1.4.11), on is the
   brand blue; the thumb is white in both. Keyboard focus is the package's outline ring (R1-01
   deferred). Inside a Field it takes the Field's id and description ids. */
type SwitchProps = Pick<
  ComponentProps<typeof UiSwitch>,
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
  | "disabled"
  | "required"
  | "name"
  | "value"
  | "id"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-invalid"
  | "aria-busy"
  | "className"
>

/** An on/off control that takes effect at once (never one that waits for a Save). */
function Switch(own: SwitchProps) {
  const { className, ...props } = useFieldControl(own)
  return (
    <UiSwitch
      className={cn(
        "data-[size=default]:h-5.5 data-[size=default]:w-10 cursor-pointer shadow-none focus-ring focus-visible:border-transparent focus-visible:ring-0 data-[state=unchecked]:bg-muted-foreground",
        // The thumb (the base's only child): 20px, lifted, still under reduced motion.
        "*:group-data-[size=default]/switch:size-5 *:shadow-card motion-reduce:*:transition-none",
        className
      )}
      {...props}
    />
  )
}

export { Switch }
export type { SwitchProps }
