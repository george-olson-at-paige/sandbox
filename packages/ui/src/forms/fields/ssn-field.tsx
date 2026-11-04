"use client"

import { useRef, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { SSN_US, significant, ssnMaskOptions, ssnReveal, ssnStatus } from "../../lib/mask"
import { FieldAction } from "./field-action"
import { fieldMessages } from "../messages"
import { useFieldError, useKeptSelection, type FieldControlProps } from "../internal/field-support"
import { MaskedInput, useMaskedValue } from "../internal/masked-input"

/* @archetype Control (ARCHETYPES.md).
   SsnField (R4-12): a US Social Security number.
   - Shows •••-••-6789 whenever it isn't focused. While focused it shows the full number only
     with `revealOnFocus`; otherwise typing shows dots for the first five digits too (the caret
     still tracks: lib/mask.ts maps each dot back to its digit). The full number is never in the
     visible input's text while masked, so copy, screenshots and screen sharing get dots.
   - Reveal (R5-02): a FieldAction toggle ("Show SSN" with aria-pressed; the label never changes,
     R6-01 / GAPS #98, WAI-ARIA's toggle-button pattern: one label, the state in aria-pressed,
     so a reader hears "Show SSN, toggle button, pressed"; the icon still swaps) shows the
     whole number until focus leaves the field (input and toggle both), then it masks again
     (lib/mask.ts ssnReveal). A click keeps focus, caret and selection in the input (a dot and
     its digit sit at the same index, so the caret means the same digit). `reveal={false}`
     drops the toggle.
   - Value: the digits only ("123456789") when complete, else "".
   - Never logged: this component logs nothing, and callers must not log the value or put it in
     telemetry, URLs or error reports. `name` adds a hidden input with the digits for a form
     post; leave it off unless the form really posts it.
   - autocomplete="off" and the password-manager opt-outs (1Password, LastPass, Bitwarden), as
     the old field had: an SSN is not a credential to save or suggest.
   - On blur: fewer than 9 digits, or a never-issued number (000, 666 or 9xx area; 00 group;
     0000 serial), reports an error.
   - inputMode="numeric". */
type SsnFieldProps = FieldControlProps & {
  /** Nine digits, or "". */
  value?: string
  defaultValue?: string
  /** The digits when complete and valid-looking, "" otherwise. */
  onValueChange?: (value: string) => void
  /** Show the whole number while the field has focus. Off by default: only the last four show unless the toggle reveals it. */
  revealOnFocus?: boolean
  /** The show/hide toggle (R5-02). Default true. */
  reveal?: boolean
  /** Default "123-45-6789". */
  placeholder?: string
  /** Override the error messages for this use; the defaults are `fieldMessages.ssn` (forms/messages.ts). */
  messages?: { incomplete?: string; invalid?: string }
}

const ssnDigits = (text: string) => significant(SSN_US, text).slice(0, 9)
const ssnValue = (digits: string) => (ssnStatus(digits) === "complete" ? digits : "")

/** A US Social Security number, masked to the last four; its value is the nine digits. */
function SsnField({ value, defaultValue, onValueChange, onValidate, revealOnFocus = false, reveal = true, placeholder = "123-45-6789", messages, ...rest }: SsnFieldProps) {
  const { sig, change } = useMaskedValue(value, defaultValue, ssnDigits, ssnValue, onValueChange)
  const { error, report, revise } = useFieldError(onValidate)
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keep = useKeptSelection(inputRef)
  const messageFor = (digits: string) => {
    const status = ssnStatus(digits)
    if (status === "partial") return messages?.incomplete ?? fieldMessages.ssn.incomplete
    if (status === "invalid") return messages?.invalid ?? fieldMessages.ssn.invalid
    return undefined
  }
  return (
    <MaskedInput
      {...rest}
      mask={SSN_US}
      sig={sig}
      onSigChange={(next) => {
        change(next)
        revise(messageFor(next))
      }}
      ref={inputRef}
      maskOptions={ssnMaskOptions({ revealed, focused, revealOnFocus })}
      formValue={ssnValue(sig)}
      hint={
        revealOnFocus ? fieldMessages.ssn.hintRevealOnFocus : reveal ? fieldMessages.ssn.hintToggle : fieldMessages.ssn.hintMasked
      }
      invalid={error !== undefined}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="off"
      inputProps={{ "data-1p-ignore": true, "data-lpignore": "true", "data-bwignore": true }}
      onLeave={() => setRevealed((r) => ssnReveal(r, "leave"))}
      action={
        reveal && (
          <FieldAction
            pressed={revealed}
            aria-label={fieldMessages.ssn.reveal}
            icon={revealed ? <EyeOffIcon /> : <EyeIcon />}
            disabled={rest.disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              keep()
              setRevealed((r) => ssnReveal(r, "toggle"))
            }}
          />
        )
      }
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        setFocused(false)
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

export { SsnField }
export type { SsnFieldProps }
