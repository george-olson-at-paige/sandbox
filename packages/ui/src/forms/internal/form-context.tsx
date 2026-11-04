"use client"

import { createContext, useContext } from "react"

/* Form's context (R7-03): read by Field (ids and the form's error for its name), FormFooter
   and FlowFooter (pending, the submit state) and ErrorSummary. Internal: Form provides it. */

/** Field errors keyed by the Field's `name`. */
export type FieldErrors = Partial<Record<string, string>>

/** Where the form stands: idle → pending → success, or failure (input kept, ready to retry). */
export type FormStatus = "idle" | "pending" | "success" | "failure"

export type FormContextValue = {
  /** The <form>'s id; a control's id is `${id}-${name}`. */
  id: string
  status: FormStatus
  /** A submit has been tried: field errors from `validate` show, and ErrorSummary lists them. */
  attempted: boolean
  /** The error the form holds for a field (validate after a try, then the server's), if any. */
  errorFor: (name: string) => string | undefined
  /** A field reports (or clears) its own error, so a submit waits for it to be fixed. */
  setOwnError: (name: string, message: string | undefined) => void
  /** A named Field registers its focus, in mount (document) order, for ErrorSummary's links. */
  register: (name: string, focus: () => void) => () => void
  /** Disables the submit before the form can be sent (a required answer is missing). */
  disabled: boolean
}

export const FormContext = createContext<FormContextValue | null>(null)

/** The enclosing Form, or null outside one. */
export function useFormContext() {
  return useContext(FormContext)
}

/** The control id Field gives a named field inside a Form (ErrorSummary links to it). */
export const fieldControlId = (formId: string, name: string) => `${formId}-${name}`
