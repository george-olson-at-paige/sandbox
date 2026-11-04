"use client"

import type { ComponentProps } from "react"

import { cn } from "../../lib/utils"
import { InputGroup as UiInputGroup, InputGroupAddon as UiInputGroupAddon } from "../../base/input-group"
import { Input } from "./input"

/* @archetype Control (ARCHETYPES.md).
   Paige InputGroup over upstream InputGroup (U-02): a control with something beside the text, a
   leading glyph (a search box) or a trailing action (FieldAction: show/hide, the calendar, clear).
   Before it, five sites placed the adornment by hand (`absolute` in a `relative` box, the input
   padded 36 or 40px on that side so its text never ran under it). The base gives the row (the addon's
   order, the input's inset beside it, a click on the addon focusing the input) and the group
   states read from the control inside (`has-[…:focus-visible]`, `has-[[aria-invalid]]`); this
   layer moves the Paige control box from the input onto the group, so the pair reads as one
   field: the input border, card shadow, md radius; focus the brand border with the halo (R15-17);
   invalid the error border; disabled the package's opacity and the not-allowed cursor.
   - `size`: md (44, `--spacing-control`, a field) · sm (36, a toolbar's search).
   - InputGroupInput is the Paige Input with its box taken off (so a Field's ids and error state
     still reach it through useFieldControl); InputGroupAddon is the base addon with Paige's
     insets (12px before a leading glyph, 10px after a trailing action) and the muted glyph ink.
   An InputGroup with no addon is just a field; AddressField uses one so its spinner has a slot. */

const SIZE = { sm: "h-control-sm", md: "h-control" } as const

type InputGroupProps = Omit<ComponentProps<typeof UiInputGroup>, "style"> & {
  /** md (44, a field; default) · sm (36, a toolbar's search). */
  size?: keyof typeof SIZE
}

/** A field with a glyph or an action beside its text, drawn as one control (the box, focus and error states are the group's). */
function InputGroup({ size = "md", className, ...props }: InputGroupProps) {
  return (
    <UiInputGroup
      data-size={size}
      className={cn(
        SIZE[size],
        "bg-background shadow-card",
        // Focus (R15-17): the brand border and the 3px halo, read from the control inside.
        "has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-focus-halo",
        // Invalid (R1-02, R2-01): the error border, darkened on hover and focus; the halo stays blue.
        "has-[[data-slot][aria-invalid=true]]:border-error-border has-[[data-slot][aria-invalid=true]]:ring-focus-halo has-[[data-slot][aria-invalid=true]]:hover:border-error has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:border-error",
        // Disabled: the package's opacity, the not-allowed cursor, on the whole group.
        "has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:opacity-disabled",
        className
      )}
      {...props}
    />
  )
}

/** The control inside an InputGroup: the Paige Input (a Field's ids and error reach it) with its own box taken off. */
function InputGroupInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn("h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:opacity-100", className)}
      {...props}
    />
  )
}

type InputGroupAddonProps = Omit<ComponentProps<typeof UiInputGroupAddon>, "style">

/** What sits beside the text: a glyph before it (`inline-start`, default) or an action after it (`inline-end`). */
function InputGroupAddon({ align = "inline-start", className, ...props }: InputGroupAddonProps) {
  return (
    <UiInputGroupAddon
      align={align}
      className={cn(
        "text-muted-foreground [&>svg]:size-icon",
        // Paige's insets: 12px before a leading glyph; a trailing FieldAction 10px from the edge, no pull-in.
        align === "inline-start" && "pl-3 has-[>button]:ml-0",
        align === "inline-end" && "pr-2.5 has-[>button]:mr-0",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupInput }
export type { InputGroupAddonProps, InputGroupProps }
