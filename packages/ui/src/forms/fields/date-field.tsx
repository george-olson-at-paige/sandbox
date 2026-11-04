"use client"

import { useState, type ComponentProps, type KeyboardEvent } from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Calendar as UiCalendar, CalendarDayButton as UiCalendarDayButton } from "../../base/calendar"
import { Popover as UiPopover, PopoverContent as UiPopoverContent, PopoverTrigger as UiPopoverTrigger } from "../../base/popover"
import { DEFAULT_LOCALE } from "../../lib/locale"
import { addYears, formatDate, formatDateLong, fromLocalDate, normalizeIso, rangeStatus, toLocalDate, todayIso, type IsoDate } from "../../lib/dates"
import { FieldAction } from "./field-action"
import { fieldMessages } from "../messages"
import { HiddenValue, useFormatHint, type FieldControlProps } from "../internal/field-support"
import { useTypedDate } from "../internal/date-input"
import { Input } from "../../components/inputs/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"
import { useCoarsePointer } from "../../components/internal/pointer"
import { POPOVER_SIDE_OFFSET, popoverContent } from "../../components/internal/popover-surface"

/* @archetype Control (ARCHETYPES.md).
   DateField (R4-12, George 2026-10-19: "finally fix some of those controls").
   - Value: an ISO date string ("2026-03-04") or "". Never a JS Date: a Date is an instant and
     turns into the wrong day across time zones (the old app's off-by-one dates). An ISO
     date-time passed in is read as its written date.
   - Fine pointer: a typed input in the locale's order (en-US MM/DD/YYYY, the default and the only
     locale built and tested, R5-01; `locale` changes it). It accepts what people type (3/4/26, 03042026, March 4 2026, 4 Mar 2026,
     2026-03-04; two-digit years within 80 years back and 20 ahead), never reformats while you
     type (so the caret never moves) and rewrites to the locale format on blur.
     The calendar button (a FieldAction, R5-03; or Alt+Down in the input) opens shadcn's Calendar (react-day-picker)
     in a popover, on the current value or today. Month and year are dropdowns, so a year is one
     choice away (typing "1952" in the year list jumps there), and the grid has the WAI-ARIA
     date-grid keys from react-day-picker: arrows by day and week, Home/End for the week,
     PageUp/PageDown by month, Shift+PageUp/PageDown by year, Enter or Space to choose, Escape
     to close. Choosing a day fills the input, closes the popover and returns focus to the
     button. `min`/`max` disable days outside the range and bound the year list.
   - Coarse pointer (touch): the browser's own date input (the R3-16 rule), with the same
     value, min and max; the phone's picker does the rest.
   - Errors: text that isn't a date ("2/30/2026", "3/4") or a date outside min/max reports a
     message through onValidate on blur or Enter, and the input goes aria-invalid. Partial text
     is never cleared.
   For a date of birth use DateOfBirthField (no calendar). */
type DateFieldProps = FieldControlProps & {
  /** "YYYY-MM-DD" or "". */
  value?: IsoDate
  defaultValue?: IsoDate
  /** "YYYY-MM-DD" when the text is a real date inside min/max, "" otherwise. */
  onValueChange?: (value: IsoDate) => void
  /** Earliest allowed date, "YYYY-MM-DD" (inclusive). */
  min?: IsoDate
  /** Latest allowed date, "YYYY-MM-DD" (inclusive). */
  max?: IsoDate
  /** Order, separators and month names. Default "en-US", the only locale built and tested (R5-01). */
  locale?: string
  /** "auto" (default): typed + calendar on a fine pointer, the native date input on touch. */
  presentation?: "auto" | "typed" | "native"
  /** Calendar open (controlled), for stories and tests. Typed presentation only. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Default: the locale pattern (MM/DD/YYYY). */
  placeholder?: string
  /** Override the error messages for this use; the defaults are `fieldMessages.date` (forms/messages.ts). */
  messages?: { invalid?: string; beforeMin?: string; afterMax?: string }
}

/** A calendar date: typed in the locale's order or picked from a calendar; its value is "YYYY-MM-DD". */
function DateField({
  value,
  defaultValue,
  onValueChange,
  onValidate,
  min,
  max,
  locale = DEFAULT_LOCALE,
  presentation = "auto",
  open: openProp,
  onOpenChange,
  placeholder,
  messages,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
  onKeyDown,
  className,
  ...input
}: DateFieldProps) {
  const coarse = useCoarsePointer()
  const native = presentation === "native" || (presentation === "auto" && coarse)
  const lo = normalizeIso(min) || undefined
  const hi = normalizeIso(max) || undefined
  const date = useTypedDate({
    value,
    defaultValue,
    onValueChange,
    onValidate,
    locale,
    pivot: "window",
    invalidMessage: messages?.invalid ?? fieldMessages.date.invalid(formatDate(todayIso(), locale)),
    check: (iso) => {
      const status = rangeStatus(iso, lo, hi)
      if (status === "before-min") return messages?.beforeMin ?? fieldMessages.date.beforeMin(formatDate(lo!, locale))
      if (status === "after-max") return messages?.afterMax ?? fieldMessages.date.afterMax(formatDate(hi!, locale))
      return undefined
    },
  })
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  const { hintId, describedBy } = useFormatHint(ariaDescribedBy)
  const invalid = ariaInvalid || date.error !== undefined || undefined
  const range =
    lo && hi
      ? fieldMessages.date.rangeBetween(formatDateLong(lo, locale), formatDateLong(hi, locale))
      : lo
        ? fieldMessages.date.rangeFrom(formatDateLong(lo, locale))
        : hi
          ? fieldMessages.date.rangeTo(formatDateLong(hi, locale))
          : ""

  if (native) {
    return (
      <div data-slot="date-field" className="relative w-full">
        <Input
          {...input}
          type="date"
          value={date.iso}
          min={lo}
          max={hi}
          onChange={(e) => date.pick(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={className}
        />
        <span id={hintId} className="sr-only">{fieldMessages.date.nativeHint(range)}</span>
        <HiddenValue name={name} value={date.value} />
      </div>
    )
  }

  const today = todayIso()
  const opening = date.iso || (hi && today > hi ? hi : lo && today < lo ? lo : today)
  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") date.commit()
    if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault()
      setOpen(true)
    }
    onKeyDown?.(e)
  }
  return (
    <InputGroup data-slot="date-field" className={className}>
      <InputGroupInput
        {...input}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={date.text}
        placeholder={placeholder ?? date.pattern}
        onChange={(e) => date.change(e.target.value)}
        onBlur={(e) => {
          date.commit()
          onBlur?.(e)
        }}
        onKeyDown={onInputKey}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <span id={hintId} className="sr-only">{fieldMessages.date.hint(date.pattern, range)}</span>
      <HiddenValue name={name} value={date.value} />
      <UiPopover open={open} onOpenChange={setOpen}>
        {/* The Popover root draws nothing, so the addon is still the group's own child. */}
        <InputGroupAddon align="inline-end">
          <UiPopoverTrigger asChild>
            <FieldAction
              disabled={input.disabled}
              icon={<CalendarIcon />}
              aria-label={date.iso ? fieldMessages.date.change(formatDateLong(date.iso, locale)) : fieldMessages.date.choose}
            />
          </UiPopoverTrigger>
        </InputGroupAddon>
        <UiPopoverContent
          align="end"
          sideOffset={POPOVER_SIDE_OFFSET}
          className={cn(popoverContent, "w-auto")}
        >
          <UiCalendar
            mode="single"
            required={false}
            autoFocus
            captionLayout="dropdown"
            selected={toLocalDate(date.iso)}
            defaultMonth={toLocalDate(opening)}
            startMonth={toLocalDate(lo ?? addYears(today, -120))}
            endMonth={toLocalDate(hi ?? addYears(today, 50))}
            disabled={[...(lo ? [{ before: toLocalDate(lo)! }] : []), ...(hi ? [{ after: toLocalDate(hi)! }] : [])]}
            formatters={{ formatMonthDropdown: (d) => d.toLocaleString(locale, { month: "short" }) }}
            components={{ DayButton: DayButton }}
            onSelect={(d: Date | undefined) => {
              if (d) {
                date.pick(fromLocalDate(d))
                setOpen(false)
              }
            }}
          />
        </UiPopoverContent>
      </UiPopover>
    </InputGroup>
  )
}

/* The day cell: Paige's focus ring (the outline utility) in place of upstream's 3px ring, and a
   relative hover (R4-01). */
function DayButton({ className, ...props }: ComponentProps<typeof UiCalendarDayButton>) {
  return (
    <UiCalendarDayButton
      className={cn(
        "cursor-pointer rounded-md hover:layer-hover focus-ring focus-visible:ring-0 group-data-[focused=true]/day:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { DateField }
export type { DateFieldProps }
