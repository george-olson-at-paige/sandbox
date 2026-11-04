"use client"

import type { ComponentProps } from "react"

import { cn } from "../../lib/utils"
import { Input as UiInput } from "../../base/input"
import { useFieldControl } from "../internal/field-context"
import { controlBox, controlFocus, controlHeight, controlInvalid, controlValue } from "../internal/control"

/* @archetype Control (ARCHETYPES.md).
   Paige Input over upstream Input: one size (md 44), value at 500 and placeholder at 400 (R3-01), the error border when
   aria-invalid. `compact` is not built (GAPS #61). Inside a Field it takes the Field's id,
   description ids and error state (R7-03), so callers don't wire them. */
/** A single-line text input (44px; error border when aria-invalid). */
function Input(own: Omit<ComponentProps<"input">, "style" | "size">) {
  const { className, ...props } = useFieldControl(own)
  return (
    <UiInput
      className={cn(controlBox, controlHeight, "py-1", controlValue, controlFocus, controlInvalid, className)}
      {...props}
    />
  )
}

export { Input }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type InputProps = ComponentProps<typeof Input>
