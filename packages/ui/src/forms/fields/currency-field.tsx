"use client"

import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react"

import { DEFAULT_LOCALE } from "../../lib/locale"
import { amountToMinor, currencyDigits, formatMoney, minorToText, sanitizeAmount } from "../../lib/mask"
import { fieldMessages } from "../messages"
import { HiddenValue, useFormatHint, type FieldControlProps } from "../internal/field-support"
import { Input } from "../../components/inputs/input"

/* @archetype Control (ARCHETYPES.md).
   CurrencyField (R4-12): an amount of money.
   - Value: an integer in the currency's minor units (cents for USD), or null when empty. Never a
     float: 19.99 is 1999, so sums and comparisons are exact, and the API stores the same integer.
   - While focused it's plain text you can edit anywhere ("1234.5"); on blur it shows the money
     format for the locale ("$1,234.50"), and on focus goes back to plain text ("1234.50").
     Grouping commas never appear while typing, so they can't push the caret around.
   - Typing and paste are cleaned as they arrive ("$1,234.50" pastes as 1234.50; letters are
     ignored with the caret left where it was); digits past the currency's minor units are
     dropped. A minus (or an accounting "(12.50)" paste) only with `allowNegative`.
   - inputMode="decimal". USD by default; `currency` and `locale` change the symbol and the
     minor units (JPY has none). A decimal comma ("1.234,50") isn't read yet (GAPS #96). */
type CurrencyFieldProps = Omit<FieldControlProps, "onValidate"> & {
  /** Minor units (cents for USD) or null. */
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  /** ISO 4217 code. Default "USD". */
  currency?: string
  /** Formatting locale. Default "en-US", the only locale built and tested (R5-01). */
  locale?: string
  /** Accept negative amounts. Default false. */
  allowNegative?: boolean
  /** Default "0.00" (in the currency's minor units). */
  placeholder?: string
}

/** An amount of money: plain while typing, formatted on blur; its value is an integer in cents. */
function CurrencyField({
  value,
  defaultValue,
  onValueChange,
  currency = "USD",
  locale = DEFAULT_LOCALE,
  allowNegative = false,
  placeholder,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: CurrencyFieldProps) {
  const digits = useMemo(() => currencyDigits(currency, locale), [currency, locale])
  const currencyName = useMemo(() => {
    try {
      return new Intl.DisplayNames(locale, { type: "currency" }).of(currency) ?? currency
    } catch {
      return currency
    }
  }, [currency, locale])
  const initial = value !== undefined ? value : defaultValue
  const [text, setText] = useState(() => (initial == null ? "" : minorToText(initial, digits)))
  const [seen, setSeen] = useState(value)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)
  const { hintId, describedBy } = useFormatHint(ariaDescribedBy)

  const minor = amountToMinor(text, digits)
  if (value !== seen) {
    setSeen(value)
    if (value !== undefined && value !== minor) setText(value == null ? "" : minorToText(value, digits))
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const r = sanitizeAmount(el.value, el.selectionEnd ?? el.value.length, { allowNegative, fractionDigits: digits })
    if (r.text === text) {
      el.value = r.text
      el.setSelectionRange(r.caret, r.caret)
      return
    }
    caret.current = r.caret
    setText(r.text)
    const next = amountToMinor(r.text, digits)
    if (next !== minor) onValueChange?.(next)
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (el && caret.current !== null) {
      if (el.ownerDocument.activeElement === el) el.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  })

  const shown = focused ? text : minor === null ? "" : formatMoney(minor, currency, locale)
  return (
    <div data-slot="currency-field" className="relative w-full">
      <Input
        ref={ref}
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        placeholder={placeholder ?? (digits > 0 ? `0.${"0".repeat(digits)}` : "0")}
        onChange={onChange}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={describedBy}
        onFocus={() => {
          setFocused(true)
          caret.current = text.length
        }}
        onBlur={(e) => {
          setFocused(false)
          setText(minor === null ? "" : minorToText(minor, digits))
          rest.onBlur?.(e)
        }}
      />
      <span id={hintId} className="sr-only">{fieldMessages.currency.hint(currencyName, allowNegative)}</span>
      <HiddenValue name={name} value={minor === null ? "" : String(minor)} />
    </div>
  )
}

export { CurrencyField }
export type { CurrencyFieldProps }
