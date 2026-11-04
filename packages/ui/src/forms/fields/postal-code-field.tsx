"use client"

import { ZIP_US, significant, zipValue } from "../../lib/mask"
import { fieldMessages } from "../messages"
import { useFieldError, type FieldControlProps } from "../internal/field-support"
import { MaskedInput, useMaskedValue } from "../internal/masked-input"

/* @archetype Control (ARCHETYPES.md).
   PostalCodeField (R4-12): a US ZIP code, 12345 or ZIP+4 12345-6789. The dash appears with the
   sixth digit, so a five-digit ZIP never shows a dangling dash (the old field's rule, kept).
   - Value: "12345" or "12345-6789" when complete, else "".
   - Paste and autofill in any shape (" 02134 ", "021341234"); leading zeros kept (it is text,
     never a number).
   - On blur, anything other than 5 or 9 digits reports "Enter a 5-digit ZIP code, or ZIP+4".
   - inputMode="numeric", autocomplete="postal-code".
   US only (GAPS #95). */
type PostalCodeFieldProps = FieldControlProps & {
  /** "12345", "12345-6789" or "". */
  value?: string
  defaultValue?: string
  /** The ZIP when complete (5 or 9 digits), "" otherwise. */
  onValueChange?: (value: string) => void
  /** Default "12345". */
  placeholder?: string
  /** Override the error message for this use; the default is `fieldMessages.postalCode.invalid` (forms/messages.ts). */
  invalidMessage?: string
}

const zipDigits = (text: string) => significant(ZIP_US, text).slice(0, 9)

/** A US ZIP or ZIP+4, formatted as you type; its value is "12345" or "12345-6789". */
function PostalCodeField({ value, defaultValue, onValueChange, onValidate, placeholder = "12345", invalidMessage, ...rest }: PostalCodeFieldProps) {
  const { sig, change } = useMaskedValue(value, defaultValue, zipDigits, zipValue, onValueChange)
  const { error, report, revise } = useFieldError(onValidate)
  const messageFor = (digits: string) =>
    digits !== "" && zipValue(digits) === "" ? (invalidMessage ?? fieldMessages.postalCode.invalid) : undefined
  return (
    <MaskedInput
      {...rest}
      mask={ZIP_US}
      sig={sig}
      onSigChange={(next) => {
        change(next)
        revise(messageFor(next))
      }}
      formValue={zipValue(sig)}
      hint={fieldMessages.postalCode.hint}
      invalid={error !== undefined}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="postal-code"
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

export { PostalCodeField }
export type { PostalCodeFieldProps }
