"use client"

import { createContext, useContext, type MutableRefObject } from "react"

/* The Field's context (R7-03), read by every control (Input, Textarea, Select, the rich
   Textarea, the typed fields in forms/fields). It lives here, under the controls, so a control
   never imports upward into src/forms; forms/field.tsx provides it.
   The Primer FormControl model: Field owns the ids and the error state, and a control inside it
   picks them up, so a caller never writes `id`, `aria-describedby` or `aria-invalid` by hand.
   A control's own props win (its own format hint joins the description ids, its own
   aria-invalid stands), except the id (R8-05, GAPS #106): inside a Field the Field owns the id,
   so a control's own `id` is ignored, with a dev-only warning saying to set it on Field. The
   alternative, adopting the control's id as the Field's, would only reach FieldLabel's `htmlFor`
   after a render, so the server HTML (and any label rendered before the control) would point at
   the wrong id: ignoring keeps the label link right on the first paint, every time.
   `check:layers` (FIELDID) catches the pattern in source before it runs. */
export type FieldContextValue = {
  /** The FieldLabel's id (aria-labelledby for controls a <label for> can't name). */
  labelId: string
  /** The control's id; FieldLabel's htmlFor points at it. */
  controlId: string
  /** The ids of the FieldDescription and FieldError that are on screen, space-separated (or undefined). */
  describedBy: string | undefined
  /** The field shows an error (the caller's `invalid`, the control's own, or the form's). */
  invalid: boolean
  disabled: boolean
  required: boolean
  /** Set by a control a <label for> can't focus (the rich Textarea); a label click calls it. */
  focusControl: MutableRefObject<(() => void) | null>
  /** A typed field reports its own error here (after blur or Enter) as well as to onValidate. */
  reportError: (message: string | undefined) => void
}

export const FieldContext = createContext<FieldContextValue | null>(null)

/** The enclosing Field's ids and state, or null outside a Field. */
export function useFieldContext() {
  return useContext(FieldContext)
}

type ControlAria = {
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"
}

const warned = new Set<string>()
const isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production"

/** The control's id (always the Field's), description ids, invalid, disabled and required, from its props first and the Field second. */
export function useFieldControl<P extends ControlAria>(props: P): P {
  const field = useFieldContext()
  if (!field) return props
  if (isDev && props.id && props.id !== field.controlId && !warned.has(props.id)) {
    warned.add(props.id)
    console.warn(
      `@paige/ui: a control inside a Field was given id="${props.id}"; the Field owns the id, so it is ignored. Set it on the Field instead: <Field id="${props.id}">.`
    )
  }
  const describedBy = [...new Set([props["aria-describedby"], field.describedBy].filter(Boolean).join(" ").split(" ").filter(Boolean))].join(" ")
  return {
    ...props,
    id: field.controlId,
    disabled: props.disabled ?? (field.disabled || undefined),
    required: props.required ?? (field.required || undefined),
    "aria-describedby": describedBy || undefined,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}
