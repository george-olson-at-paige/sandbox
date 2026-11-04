"use client"

import { PHONE_US, phoneDigits, phoneStatus, toE164 } from "../../lib/mask"
import { fieldMessages } from "../messages"
import { useFieldError, type FieldControlProps } from "../internal/field-support"
import { MaskedInput, useMaskedValue } from "../internal/masked-input"

/* @archetype Control (ARCHETYPES.md).
   PhoneField (R4-12): a US phone number, formatted as it's typed: (555) 123-4567.
   - Value: E.164 ("+15551234567") once the number is complete, else "". A stored E.164 value
     (or any phone text) shows formatted; the old app's model was bare national digits.
   - Accepts typing, paste and autofill in any shape: +1 (555) 123-4567, 5551234567,
     555.123.4567, 1 555 123 4567. A leading country code 1 is dropped once there are more than
     ten digits.
   - The caret stays after the digit just typed, Backspace after a separator deletes the digit
     before it, and a full field ignores extra digits (lib/mask.ts; tested there).
   - A half-typed number is kept (never cleared on blur); on blur it reports "Enter a 10-digit
     US phone number". An area code starting 0 or 1 is reported too.
   - inputMode="tel" (the phone keypad), autocomplete="tel".
   US only (GAPS #95: international numbers need a country picker and libphonenumber's rules). */
type PhoneFieldProps = FieldControlProps & {
  /** E.164 ("+15551234567") or "". */
  value?: string
  defaultValue?: string
  /** E.164 when the number is complete, "" otherwise. */
  onValueChange?: (value: string) => void
  /** Default "(555) 555-0100". */
  placeholder?: string
  /** Override the error message for this use; the default is `fieldMessages.phone.invalid` (forms/messages.ts). */
  invalidMessage?: string
}

/** A US phone number, formatted as you type; its value is E.164 (+15551234567). */
function PhoneField({ value, defaultValue, onValueChange, onValidate, placeholder = "(555) 555-0100", invalidMessage, ...rest }: PhoneFieldProps) {
  const { sig, change } = useMaskedValue(value, defaultValue, phoneDigits, toE164, onValueChange)
  const { error, report, revise } = useFieldError(onValidate)
  const messageFor = (digits: string) => {
    const status = phoneStatus(digits)
    return status === "partial" || status === "invalid" ? (invalidMessage ?? fieldMessages.phone.invalid) : undefined
  }
  return (
    <MaskedInput
      {...rest}
      mask={PHONE_US}
      sig={sig}
      onSigChange={(next) => {
        change(next)
        revise(messageFor(next))
      }}
      formValue={toE164(sig)}
      hint={fieldMessages.phone.hint}
      invalid={error !== undefined}
      placeholder={placeholder}
      inputMode="tel"
      autoComplete="tel"
      onBlur={(e) => {
        report(messageFor(sig))
        rest.onBlur?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") report(messageFor(sig))
        rest.onKeyDown?.(e)
      }}
    />
  )
}

export { PhoneField }
export type { PhoneFieldProps }
