"use client"

import { useMemo, useState } from "react"

import { dateOrder, datePattern, formatDate, monthNames, normalizeIso, parseDate, todayIso, type IsoDate, type YearPivot } from "../../lib/dates"
import { useFieldError } from "./field-support"

/* The typed-date core shared by DateField and DateOfBirthField (R4-12). Internal: no story,
   not in the catalog.

   The input holds free text and is never reformatted while you type, so the caret never moves
   (the old masked date inputs jumped it). Every keystroke is parsed (lib/dates.ts parseDate);
   the value is the ISO date the text means when it's a whole, real date the field's rules
   accept, else "". On blur (and Enter) a date that parsed is rewritten in the locale format
   (3/4/26 → 03/04/2026) and the field's error, if any, is reported. Text that doesn't parse
   stays as typed, so the person can fix it. */
export type TypedDateOptions = {
  value?: IsoDate
  defaultValue?: IsoDate
  onValueChange?: (value: IsoDate) => void
  onValidate?: (message: string | undefined) => void
  locale?: string
  pivot: YearPivot
  /** The field's rules for a parsed date: an error message, or undefined when it's acceptable. */
  check: (iso: IsoDate, today: IsoDate) => string | undefined
  /** The message for text that isn't a date. */
  invalidMessage: string
}

export function useTypedDate({ value, defaultValue, onValueChange, onValidate, locale, pivot, check, invalidMessage }: TypedDateOptions) {
  const order = useMemo(() => dateOrder(locale), [locale])
  const names = useMemo(() => monthNames(locale), [locale])
  const pattern = useMemo(() => datePattern(locale), [locale])
  const parse = (t: string) => parseDate(t, { order, pivot, monthNames: names, today: todayIso() })
  const canonical = (t: string) => {
    const iso = parse(t)
    return iso && !check(iso, todayIso()) ? iso : ""
  }
  const messageFor = (t: string) => {
    if (!t.trim()) return undefined
    const iso = parse(t)
    return iso ? check(iso, todayIso()) : invalidMessage
  }

  const [text, setText] = useState(() => formatDate(normalizeIso(value ?? defaultValue), locale))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== undefined && normalizeIso(value) !== canonical(text)) setText(formatDate(normalizeIso(value), locale))
  }
  const { error, report, revise } = useFieldError(onValidate)

  const emit = (before: string, after: string) => {
    if (after !== before) onValueChange?.(after)
  }
  /** The person typed. */
  const change = (next: string) => {
    emit(canonical(text), canonical(next))
    setText(next)
    revise(messageFor(next))
  }
  /** Blur or Enter: reformat what parsed, report the error. */
  const commit = () => {
    const iso = parse(text)
    if (iso) setText(formatDate(iso, locale))
    report(messageFor(text))
  }
  /** A date chosen in the calendar or the native picker ("" clears). */
  const pick = (iso: IsoDate) => {
    const next = iso ? formatDate(iso, locale) : ""
    emit(canonical(text), canonical(next))
    setText(next)
    report(messageFor(next))
  }

  return { text, iso: parse(text) ?? "", value: canonical(text), pattern, error, change, commit, pick }
}
