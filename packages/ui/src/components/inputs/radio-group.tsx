import type { ComponentProps } from "react"

import { cn } from "../../lib/utils"
import { RadioGroup as UiRadioGroup, RadioGroupItem as UiRadioGroupItem } from "../../base/radio-group"

/* @archetype Control (ARCHETYPES.md).
   Paige RadioGroup over upstream RadioGroup. Only used inside ChoiceCard today. Focus is the
   gapped ring, like Checkbox (R15-17: a control you choose with, not one you type into). */
type RadioGroupProps = Pick<
  ComponentProps<typeof UiRadioGroup>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "name"
  | "disabled"
  | "required"
  | "orientation"
  | "id"
  | "aria-label"
  | "aria-labelledby"
  | "className"
  | "children"
>

/** Radio buttons. Used inside ChoiceCard today. */
function RadioGroup(props: RadioGroupProps) {
  return <UiRadioGroup {...props} />
}

type RadioGroupItemProps = Pick<
  ComponentProps<typeof UiRadioGroupItem>,
  "value" | "id" | "disabled" | "aria-label" | "aria-invalid" | "className"
>

function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <UiRadioGroupItem
      className={cn("border-input bg-background shadow-card focus-ring focus-visible:border-input focus-visible:ring-0", "aria-invalid:border-error-border", className)}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
export type { RadioGroupProps, RadioGroupItemProps }
