"use client"

import { type KeyboardEvent } from "react"

import { addDay, addYears, formatDate, type IsoDate } from "../../lib/dates"
import { DEFAULT_LOCALE } from "../../lib/locale"
import { fieldMessages } from "../messages"
import { HiddenValue, useFormatHint, type FieldControlProps } from "../internal/field-support"
import { useTypedDate } from "../internal/date-input"
import { Input } from "../../components/inputs/input"

/* @archetype Control (ARCHETYPES.md).
   DateOfBirthField (R4-12): a date of birth, typed. No calendar: paging a calendar back decades
   is the classic bad pattern (the old field drilled year → month → day to soften it).
   Typed, not three parts (month select, day, year), because one input:
   - takes the same parser as DateField (3/4/52, 03041952, April 5 1952, 1952-04-05), so there
     is one set of rules and one set of tests;
   - takes autofill whole: autocomplete="bday" fills a single input with a full date (in
     whatever shape the browser keeps it, ISO included, which the parser reads); split fields
     need bday-day / bday-month / bday-year and browsers fill those unevenly;
   - takes a paste of a whole date, which three boxes can't;
   - is one tab stop and one label for a screen reader, and doesn't move focus on its own.
   The cost is that the order isn't self-evident outside en-US, so the placeholder shows the
   locale pattern (MM/DD/YYYY) and the field reformats on blur so a misread order is visible.
   - Value: ISO "YYYY-MM-DD" or "". Two-digit years are always in the past (52 → 1952,
     05 → 2005).
   - Rejects a future date, and with `minAge` / `maxAge` an age outside the range, each with its
     own message through onValidate (on blur or Enter). Without `maxAge` a date more than 130
     years ago is rejected as a mistyped year.
   - Same caret rule as DateField: the text is never reformatted while you type. Same native
     rule does not apply: on touch it stays a typed input (the phone's date wheel or calendar
     is the pattern this field exists to avoid). */
type DateOfBirthFieldProps = FieldControlProps & {
  /** "YYYY-MM-DD" or "". */
  value?: IsoDate
  defaultValue?: IsoDate
  /** "YYYY-MM-DD" when the text is a real date inside the age range, "" otherwise. */
  onValueChange?: (value: IsoDate) => void
  /** Youngest allowed age in whole years (18 for an adult). */
  minAge?: number
  /** Oldest allowed age in whole years. Default 130. */
  maxAge?: number
  /** Order, separators and month names. Default "en-US", the only locale built and tested (R5-01). */
  locale?: string
  /** Default: the locale pattern (MM/DD/YYYY). */
  placeholder?: string
  /** Override the error messages for this use; the defaults are `fieldMessages.dateOfBirth` (forms/messages.ts). */
  messages?: { invalid?: string; future?: string; tooYoung?: string; tooOld?: string }
}

/** A date of birth, typed (no calendar), with an optional age range; its value is "YYYY-MM-DD". */
function DateOfBirthField({
  value,
  defaultValue,
  onValueChange,
  onValidate,
  minAge,
  maxAge,
  locale = DEFAULT_LOCALE,
  placeholder,
  messages,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onBlur,
  onKeyDown,
  ...input
}: DateOfBirthFieldProps) {
  const oldest = maxAge ?? 130
  const date = useTypedDate({
    value,
    defaultValue,
    onValueChange,
    onValidate,
    locale,
    pivot: "past",
    invalidMessage: messages?.invalid ?? fieldMessages.dateOfBirth.invalid(formatDate("1980-04-05", locale)),
    check: (iso, today) => {
      if (iso > today) return messages?.future ?? fieldMessages.dateOfBirth.future
      if (minAge !== undefined && iso > addYears(today, -minAge)) return messages?.tooYoung ?? fieldMessages.dateOfBirth.tooYoung(minAge)
      // Age ≤ oldest: born after the same day (oldest + 1) years ago.
      if (iso < addDay(addYears(today, -(oldest + 1)))) {
        return maxAge !== undefined
          ? (messages?.tooOld ?? fieldMessages.dateOfBirth.tooOld(maxAge))
          : (messages?.tooOld ?? fieldMessages.dateOfBirth.tooOldDefault)
      }
      return undefined
    },
  })
  const { hintId, describedBy } = useFormatHint(ariaDescribedBy)
  const ages =
    minAge !== undefined && maxAge !== undefined
      ? fieldMessages.dateOfBirth.agesBetween(minAge, maxAge)
      : minAge !== undefined
        ? fieldMessages.dateOfBirth.agesFrom(minAge)
        : maxAge !== undefined
          ? fieldMessages.dateOfBirth.agesTo(maxAge)
          : ""
  return (
    <div data-slot="date-of-birth-field" className="relative w-full">
      <Input
        {...input}
        type="text"
        autoComplete="bday"
        spellCheck={false}
        value={date.text}
        placeholder={placeholder ?? date.pattern}
        onChange={(e) => date.change(e.target.value)}
        onBlur={(e) => {
          date.commit()
          onBlur?.(e)
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") date.commit()
          onKeyDown?.(e)
        }}
        aria-invalid={ariaInvalid || date.error !== undefined || undefined}
        aria-describedby={describedBy}
      />
      <span id={hintId} className="sr-only">{fieldMessages.dateOfBirth.hint(date.pattern, ages)}</span>
      <HiddenValue name={name} value={date.value} />
    </div>
  )
}

export { DateOfBirthField }
export type { DateOfBirthFieldProps }
