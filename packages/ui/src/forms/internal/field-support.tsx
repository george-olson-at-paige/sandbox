"use client"

import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from "react"

import { useFieldContext } from "../../components/internal/field-context"

/* Shared plumbing for the typed field controls (R4-12): DateField, DateOfBirthField, PhoneField,
   PostalCodeField, SsnField, CurrencyField, PasswordField (R5-02). Internal: no story, not in the catalog.

   Errors. Each field knows its own rules (a real date, ten digits, an age range) and reports a
   message through `onValidate`, which the caller shows in FieldError. A new error waits for blur
   (or Enter), so nobody is told off mid-word; once an error is showing, it updates on every
   change, so it clears the moment the input is fixed. The field also sets aria-invalid on
   itself while its own error stands. Required-ness is the caller's: an empty field reports no
   error. Inside a Field the message also goes to the Field (R7-03), which shows it in its
   FieldError, marks itself invalid and tells the Form, so a caller needs no error state. */

/** Props every typed field takes, passed to its input. */
export type FieldControlProps = {
  id?: string
  /** Form name: a hidden input carries the field's value (ISO date, E.164, digits, minor units), never the display text. */
  name?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  /** Accessible name when no FieldLabel points at the field. */
  "aria-label"?: string
  "aria-labelledby"?: string
  /** Joined with the field's own format hint. */
  "aria-describedby"?: string
  /** The caller's error state (a server error, say); the field adds its own. */
  "aria-invalid"?: boolean
  /** The field's own error message after blur or Enter (undefined when it clears). Show it in FieldError. */
  onValidate?: (message: string | undefined) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  /** Extra classes on the input, for placement. */
  className?: string
}

/** The field's own error: `report` shows (or clears) it, `revise` only updates one already showing. */
export function useFieldError(onValidate?: (message: string | undefined) => void) {
  const [error, setError] = useState<string | undefined>(undefined)
  const field = useFieldContext()
  const report = (message: string | undefined) => {
    setError(message)
    onValidate?.(message)
    field?.reportError(message)
  }
  const revise = (message: string | undefined) => {
    if (error !== undefined && message !== error) report(message)
  }
  return { error, report, revise }
}

/** A visually hidden format description ("Format: MM/DD/YYYY"), joined onto aria-describedby. */
export function useFormatHint(describedBy: string | undefined) {
  const hintId = useId()
  return { hintId, describedBy: [describedBy, hintId].filter(Boolean).join(" ") }
}

/** Carries the field's value in a form post, under `name`. */
export function HiddenValue({ name, value }: { name?: string; value: string }) {
  return name ? <input type="hidden" name={name} value={value} /> : null
}

/**
 * Keeps an input's caret and selection across a re-render that rewrites its text or its type
 * (the show/hide toggle, R5-02): React setting a new value, or the browser switching
 * password ↔ text, would otherwise put the caret at the end. Call the returned `keep()` just
 * before the state change; the selection comes back after the render, if the input still has focus.
 */
export function useKeptSelection(ref: RefObject<HTMLInputElement | null>) {
  const saved = useRef<[number, number, "forward" | "backward" | "none"] | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const s = saved.current
    if (!el || !s) return
    saved.current = null
    if (el.ownerDocument.activeElement !== el) return
    /* Chrome resets the selection to 0 when it next lays out an input whose type changed (seen on
       a real click, not a scripted one); laying it out now lets the restore below stick. */
    void el.offsetWidth
    el.setSelectionRange(s[0], s[1], s[2])
  })
  return () => {
    const el = ref.current
    if (!el) return
    const end = el.value.length
    saved.current = [el.selectionStart ?? end, el.selectionEnd ?? end, el.selectionDirection ?? "none"]
  }
}
