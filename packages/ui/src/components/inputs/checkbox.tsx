"use client"

import { cn } from "../../lib/utils"
import { Checkbox as UiCheckbox } from "../../base/checkbox"

/* @archetype Control (ARCHETYPES.md).
   Paige Checkbox over upstream Checkbox (R12-10): the box a table's selection column and a
   settings list use. Three states, `checked` true · false · "mixed" (a header box over a partly
   selected page draws a dash, and screen readers hear "mixed"). The box stays 16px; the 24px
   target comes from the caller's cell or label (a table cell is the target). Focus is the theme's
   focus-ring; a checked box is the brand blue. No label of its own: pass `aria-label`, or wrap it
   in a <label>. The box's corner is `rounded-xs` (4px, R20-01): `rounded-sm` is 8px and on a 16px
   box drew a circle. */
type CheckboxProps = {
  /** On, off, or mixed (some of a group). */
  checked: boolean | "mixed"
  /** Called with the next value (a mixed box turns on). */
  onCheckedChange: (checked: boolean) => void
  /** Its accessible name ("Select Ada Park"), unless a <label> wraps it. */
  "aria-label"?: string
  disabled?: boolean
  id?: string
  /** Placement, not restyling. */
  className?: string
}

/** A checkbox: on, off or mixed; the selection column's box. */
function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <UiCheckbox
      checked={checked === "mixed" ? "indeterminate" : checked}
      onCheckedChange={(c) => onCheckedChange(c === true)}
      className={cn(
        "cursor-pointer rounded-xs border-input bg-card shadow-none focus-ring focus-visible:ring-0",
        // Mixed: the brand box with a dash. The base's indicator always draws a check, so the
        // check hides and the dash is the box's own ::after.
        "data-[state=indeterminate]:grid data-[state=indeterminate]:place-content-center data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "data-[state=indeterminate]:[&_svg]:hidden data-[state=indeterminate]:after:block data-[state=indeterminate]:after:h-0.5 data-[state=indeterminate]:after:w-2 data-[state=indeterminate]:after:rounded-full data-[state=indeterminate]:after:bg-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }
export type { CheckboxProps }
