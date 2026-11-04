"use client"

import { useId, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Popover as UiPopover, PopoverContent as UiPopoverContent, PopoverTrigger as UiPopoverTrigger } from "../../base/popover"
import { Checkbox } from "./checkbox"
import { controlBox, controlFocus, controlHeight, controlInvalid, controlValue } from "../internal/control"
import { useFieldContext, useFieldControl } from "../internal/field-context"
import { POPOVER_SIDE_OFFSET, popoverContent } from "../internal/popover-surface"

/* @archetype Control (ARCHETYPES.md).
   MultiSelect (R13-06): several choices from a short list, as a checkbox list in a popover.
   - The trigger has Select's look (44, the value at 500, the placeholder at 400, the caret) and
     says what's chosen: the placeholder when nothing is ("Any plan"), the one label when one is,
     the labels joined and truncated when more are, with the count in a badge ("Direct,
     Sponsored… 3"), so the number is readable even when the names are cut.
   - The list is real checkboxes with labels, in the tab order (no roving focus or typeahead:
     it's a short list, like Menu's standalone form); each change applies at once (the value is
     the caller's); Escape or a click outside closes it and focus goes back to the trigger.
     "Clear" at the foot while anything is chosen.
   - Inside a Field it takes the Field's id, description and error (the trigger is the labelled
     control). The value is the chosen option values, in option order.
   Lists longer than ~12 options want a search box; none does yet. Touch keeps the popover (a
   phone's multiple <select> is clumsier than a checkbox list). */

/** One option of a MultiSelect. */
type MultiSelectOption = { value: string; label: string; disabled?: boolean }

type MultiSelectProps = {
  options: readonly MultiSelectOption[]
  /** The chosen values (any order in; option order out). */
  value: readonly string[]
  onValueChange: (value: string[]) => void
  /** What the trigger says while nothing is chosen ("Any plan"). */
  placeholder?: string
  /** Names the list for screen readers when there's no Field label ("Plan"). */
  "aria-label"?: string
  id?: string
  disabled?: boolean
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  /** Placement and width, not restyling. */
  className?: string
}

/** Several choices from a short list: a checkbox list in a popover; the trigger shows what's chosen and how many. */
function MultiSelect(own: MultiSelectProps) {
  const inField = useFieldContext() !== null
  const { options, value, onValueChange, placeholder = "Any", id, disabled, className, "aria-label": label, "aria-describedby": describedBy, "aria-invalid": invalid } = useFieldControl(own)
  const [open, setOpen] = useState(false)
  const listId = useId()
  const chosen = options.filter((o) => value.includes(o.value))
  const set = (v: string, on: boolean) => onValueChange(options.map((o) => o.value).filter((x) => (x === v ? on : value.includes(x))))
  const summary = chosen.map((o) => o.label).join(", ")
  return (
    <UiPopover open={open} onOpenChange={setOpen}>
      <UiPopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-controls={open ? listId : undefined}
          // Outside a Field the name is the label and what's shown ("Status: Any status"), so it
          // contains the visible text (WCAG 2.5.3); inside one, the Field's label names it.
          aria-label={inField || !label ? undefined : `${label}: ${chosen.length ? summary : placeholder}`}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          data-slot="multi-select"
          data-placeholder={chosen.length === 0 || undefined}
          className={cn(
            "flex w-full min-w-0 cursor-pointer items-center gap-2 border text-left disabled:cursor-not-allowed disabled:opacity-disabled",
            controlBox,
            controlHeight,
            controlValue,
            "data-[placeholder]:font-normal data-[placeholder]:text-placeholder",
            controlFocus,
            controlInvalid,
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate">{chosen.length ? summary : placeholder}</span>
          {chosen.length > 1 && (
            <span data-slot="multi-select-count" className="shrink-0 rounded-full bg-primary px-1.5 text-xs leading-5 font-semibold text-primary-foreground tabular-nums">
              {chosen.length}
              <span className="sr-only"> chosen</span>
            </span>
          )}
          <ChevronDownIcon aria-hidden className="size-icon shrink-0 text-muted-foreground" />
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent
        id={listId}
        align="start"
        sideOffset={POPOVER_SIDE_OFFSET}
        aria-label={label}
        className={cn(popoverContent, "w-(--radix-popover-trigger-width) max-h-80 min-w-menu-wide overflow-auto bg-popover")}
      >
        <div role="group" aria-label={label} className="flex flex-col">
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-card-foreground hover:layer-hover",
                o.disabled && "pointer-events-none opacity-disabled"
              )}
            >
              <Checkbox checked={value.includes(o.value)} disabled={o.disabled} onCheckedChange={(on) => set(o.value, on)} />
              {o.label}
            </label>
          ))}
        </div>
        {chosen.length > 0 && (
          <div className="-mx-2 mt-2 border-t border-divider-tint px-2 pt-2">
            <button
              type="button"
              onClick={() => onValueChange([])}
              className="w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm font-semibold text-primary focus-ring hover:layer-hover"
            >
              Clear
            </button>
          </div>
        )}
      </UiPopoverContent>
    </UiPopover>
  )
}

export { MultiSelect }
export type { MultiSelectOption, MultiSelectProps }
