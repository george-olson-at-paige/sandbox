"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"

import { cn } from "../lib/utils"
import { ErrorSummary, type ErrorSummaryItem } from "./error-summary"
import { FormContext, fieldControlId, type FieldErrors, type FormContextValue, type FormStatus } from "./internal/form-context"
import { sameValue } from "./internal/same-value"
import { formMessages } from "./messages"

/* @archetype Frame (ARCHETYPES.md).
   Form (R7-03): owns the submit, so screens don't. idle → pending (the submit is disabled and
   says "Saving…"; a second submit does nothing) → success (onSubmit navigates or shows the
   result in place; no success banner) or failure (ErrorSummary at the top takes focus and is
   announced, every field keeps its input, the submit is ready to try again).
   Values: the caller holds them (its own state, typed) and Form hands them to `onSubmit` and
   `validate` as given; the form-state library is Engineering's call when the first save
   endpoint lands (R2-38) and doesn't change this API.
   Errors, by Field `name`: a typed field's own (it reports on blur; a submit waits for it to be
   fixed), `validate`'s (shown after the first try, updated as values change), and the server's
   (`errors`, or the `{ errors, error }` onSubmit returns, kept until the next submit). Each
   shows in its Field's FieldError; ErrorSummary lists them with links that focus each field.
   A form-level failure (`error`, or onSubmit throwing) shows in ErrorSummary only.
   The footer: FormFooter inside the form; FlowFooter (setup steps) inside it or, when the
   template puts the footer outside the <form>, fed by `useForm(...).submitProps`.
   Unsaved changes (R8-01, GAPS #102; product-engineering step 7): the form is dirty while its
   values differ (structurally) from where they started: `initialValues`, else the values on the
   first render, and after a successful submit the values just saved. While dirty and not
   submitting, leaving warns: a tab close or reload asks through the browser's own
   `beforeunload` prompt (browsers ignore our words there), and a click on a link to another page
   (a Next <Link>, FlowFooter's Back, a plain <a>) asks `formMessages.unsaved` and stays if the
   person says no. Back asks the same (R9-02, GAPS #107): while dirty the form keeps a guard
   history entry on top of this page's, so Back lands on this page first and asks; No puts the
   guard back, Yes goes back for real. A submit takes the guard entry off before onSubmit runs, and
   unmounting on this page does too (R10-13, GAPS #114), so after a save that navigates, Back
   from the next page passes this one in one press. Code that navigates on its own (a Cancel button) asks first with
   `handle.confirmLeave()`. `warnUnsaved={false}` turns it off for a form that saves as you go. */

/** What onSubmit may return: field errors by name, and a form-level error. */
type FormResult = { errors?: FieldErrors; error?: string } | void | undefined

type FormOptions<T> = {
  /** The values, as the caller holds them; passed to onSubmit and validate. */
  values: T
  /** Saves. Return `{ errors }` / `{ error }` for a failure the server reported; throwing shows the generic failure. Navigate here on success. */
  onSubmit: (values: T) => FormResult | Promise<FormResult>
  /** Client-side rules (a required answer, a cross-field rule): field errors by name. Shown after the first submit. */
  validate?: (values: T) => FieldErrors | undefined
  /** Field errors held outside (a server response the caller kept). */
  errors?: FieldErrors
  /** A form-level error held outside. */
  error?: string
  /** Disables the submit before the form can be sent (a required answer is missing). */
  disabled?: boolean
  /** The <form>'s id; FlowFooter outside the form submits it by this id. Default generated. */
  id?: string
  /** The values that count as unchanged. Default: the values on the first render (then the values last saved). */
  initialValues?: T
  /** Warn before leaving with unsaved changes (link clicks, back and forward, tab close, reload). Default true; false for a form that autosaves. */
  warnUnsaved?: boolean
}

type FormHandle<T> = {
  id: string
  status: FormStatus
  /** For FlowFooter's `submit` when it sits outside the <form> (SetupBeat's footer). */
  submitProps: { form: string; pending: boolean; disabled: boolean }
  /** The values differ from where they started (or were last saved). */
  dirty: boolean
  /** Before navigating in code (a Cancel button): true when there's nothing unsaved or the person agrees to leave. */
  confirmLeave: () => boolean
  /** @internal what Form renders from. */
  view: { context: FormContextValue; onSubmit: (e: FormEvent<HTMLFormElement>) => void; summary: { items: ErrorSummaryItem[]; error?: string; focusKey: number } }
  /** @internal keeps T on the handle. */
  _values?: T
}

/** The flag on the guard history entry (R9-02) and whether the current entry carries it. */
const GUARD = "__paigeUnsavedGuard"
const onGuard = () => typeof window !== "undefined" && Boolean((window.history.state as Record<string, unknown> | null)?.[GUARD])

const hasAny = (e: FieldErrors | undefined) => Boolean(e && Object.values(e).some(Boolean))
const compact = (e: FieldErrors | undefined) => Object.fromEntries(Object.entries(e ?? {}).filter(([, m]) => Boolean(m))) as FieldErrors

/** A form's state, for a footer that sits outside the <form>: pass the result to `<Form form={…}>`. */
function useForm<T>(options: FormOptions<T>): FormHandle<T> {
  const { values, onSubmit, validate, errors, error, disabled = false, initialValues, warnUnsaved = true } = options
  const auto = useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = options.id ?? `form-${auto}`
  const [status, setStatus] = useState<FormStatus>("idle")
  const [attempted, setAttempted] = useState(false)
  const [own, setOwn] = useState<FieldErrors>({})
  const [server, setServer] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [focusKey, setFocusKey] = useState(0)
  const [names, setNames] = useState<string[]>([])
  const focusers = useRef(new Map<string, () => void>())
  const pending = useRef(false)
  const [saved, setSaved] = useState<{ v: T } | null>(null)
  const [first] = useState(() => values)
  const baseline = saved ? saved.v : initialValues !== undefined ? initialValues : first
  const dirty = !sameValue(values, baseline)
  const guard = warnUnsaved && dirty && status !== "pending"
  const leaving = useRef(false)
  /** Set while the form takes its own guard entry off (R10-13), so that popstate isn't a Back to ask about. */
  const dropping = useRef(false)
  const statusRef = useRef(status)
  statusRef.current = status
  const confirmLeave = useCallback(() => {
    if (!guard) return true
    const ok = window.confirm(formMessages.unsaved)
    if (ok) leaving.current = true
    return ok
  }, [guard])
  useEffect(() => {
    if (!guard) return
    leaving.current = false
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leaving.current) return
      e.preventDefault()
      e.returnValue = ""
    }
    // Capture phase on the document: runs before React's root listeners, so stopping it here
    // also stops a Next <Link>'s client-side navigation.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return
      const to = new URL(a.href, window.location.href)
      const here = window.location
      if (to.origin === here.origin && to.pathname === here.pathname && to.search === here.search) return // same page (a hash link)
      if (window.confirm(formMessages.unsaved)) leaving.current = true
      else {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    // Back and forward (R9-02, GAPS #107). popstate can't be cancelled, and on window the
    // listeners run in the order they were added, so a router that registered first (Next's App
    // Router does, at the root) has already moved by the time we hear it. So the guard keeps a
    // history entry of its own: while dirty, a copy of this page's entry (same URL, its state
    // with Next's tree, plus a flag) sits on top. Back takes the person off it onto this same
    // page, which the router restores in place (the form and its values stay), and then we ask:
    // stay puts the guard entry back; leave goes back once more, for real. Forward past this
    // page is dropped once the form is dirty (the guard entry replaces it).
    const pushGuard = () => window.history.pushState({ ...(window.history.state ?? {}), [GUARD]: true }, "", window.location.href)
    if (!onGuard()) pushGuard()
    const onPopState = () => {
      if (leaving.current || dropping.current || onGuard()) return
      if (window.confirm(formMessages.unsaved)) {
        leaving.current = true
        window.history.back()
      } else pushGuard()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      // Clean again while staying on the page (typed back), or unmounted on this page: take the
      // guard entry off, so Back means Back. A submit has already taken it off (dropGuard, R10-13);
      // not while leaving.
      if (!leaving.current && !dropping.current && statusRef.current !== "pending" && onGuard()) window.history.back()
    }
  }, [guard])

  const validated = useMemo(() => (attempted && validate ? compact(validate(values)) : {}), [attempted, validate, values])
  const errorFor = useCallback((name: string) => validated[name] ?? server[name] ?? errors?.[name], [validated, server, errors])
  const setOwnError = useCallback((name: string, message: string | undefined) => {
    setOwn((o) => (o[name] === message ? o : { ...o, [name]: message }))
  }, [])
  const register = useCallback((name: string, focus: () => void) => {
    focusers.current.set(name, focus)
    setNames((n) => (n.includes(name) ? n : [...n, name]))
    return () => {
      focusers.current.delete(name)
      setNames((n) => n.filter((x) => x !== name))
    }
  }, [])

  /** Takes the guard entry off before a submit (R10-13, GAPS #114): an onSubmit that navigates
      then pushes over this page's own entry, so Back from the next page passes this one in one
      press. If the submit fails and the form is still dirty, the guard effect puts it back. */
  const dropGuard = () =>
    new Promise<void>((resolve) => {
      if (!onGuard()) return resolve()
      dropping.current = true
      const done = () => {
        window.removeEventListener("popstate", done)
        window.clearTimeout(timer)
        dropping.current = false
        resolve()
      }
      // A history move that never reports (a host that swallows popstate) mustn't hang the submit.
      const timer = window.setTimeout(done, 500)
      window.addEventListener("popstate", done)
      window.history.back()
    })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending.current || disabled) return
    setAttempted(true)
    setServer({})
    setFormError(undefined)
    const blocking = { ...compact(own), ...compact(validate?.(values)) }
    if (hasAny(blocking)) {
      setStatus("failure")
      setFocusKey((k) => k + 1)
      return
    }
    pending.current = true
    await dropGuard()
    setStatus("pending")
    try {
      const result = await onSubmit(values)
      if (result && (hasAny(result.errors) || result.error)) {
        setServer(compact(result.errors))
        setFormError(result.error)
        setStatus("failure")
        setFocusKey((k) => k + 1)
      } else {
        setSaved({ v: values })
        setStatus("success")
      }
    } catch {
      // Never the raw exception text: it can carry internals.
      setFormError(formMessages.failed)
      setStatus("failure")
      setFocusKey((k) => k + 1)
    } finally {
      pending.current = false
    }
  }

  const shown = attempted || hasAny(errors) || Boolean(error)
  const items: ErrorSummaryItem[] = []
  if (shown) {
    const seen = new Set<string>()
    for (const name of names) {
      const message = own[name] ?? errorFor(name)
      seen.add(name)
      if (message) items.push({ id: fieldControlId(id, name), message, focus: focusers.current.get(name) })
    }
    // Errors for names no Field shows still get listed (without a link).
    for (const [name, message] of Object.entries({ ...compact(errors), ...server, ...validated }))
      if (message && !seen.has(name)) items.push({ message })
  }

  const context = useMemo<FormContextValue>(
    () => ({ id, status, attempted, errorFor, setOwnError, register, disabled }),
    [id, status, attempted, errorFor, setOwnError, register, disabled]
  )
  return {
    id,
    status,
    submitProps: { form: id, pending: status === "pending", disabled },
    dirty,
    confirmLeave,
    view: { context, onSubmit: handleSubmit, summary: { items, error: shown ? (formError ?? error) : undefined, focusKey } },
  }
}

type FormProps<T> = {
  children: ReactNode
  className?: string
  /** ErrorSummary's heading. Default from forms/messages.ts. */
  summaryTitle?: string
  /** The form's accessible name, when the page heading doesn't already say what it is. */
  "aria-label"?: string
} & ({ form: FormHandle<T> } | (FormOptions<T> & { form?: never }))

/** A form that owns its submit: pending, no double submit, field and server errors, and an ErrorSummary that takes focus on failure. */
function Form<T>(props: FormProps<T>) {
  if (props.form) return <FormView {...props} form={props.form} />
  return <OwnForm {...(props as FormOptions<T> & Omit<FormProps<T>, "form">)} />
}

function OwnForm<T>({ children, className, summaryTitle, "aria-label": ariaLabel, ...options }: FormOptions<T> & Omit<FormProps<T>, "form">) {
  const form = useForm(options as FormOptions<T>)
  return <FormView form={form} className={className} summaryTitle={summaryTitle} aria-label={ariaLabel}>{children}</FormView>
}

function FormView<T>({ form, children, className, summaryTitle, "aria-label": ariaLabel }: Omit<FormProps<T>, "form"> & { form: FormHandle<T> }) {
  const { context, onSubmit, summary } = form.view
  return (
    <FormContext.Provider value={context}>
      <form
        id={form.id}
        noValidate
        onSubmit={onSubmit}
        aria-label={ariaLabel}
        aria-busy={form.status === "pending" || undefined}
        data-status={form.status}
        className={cn("flex flex-col", className)}
      >
        <ErrorSummary title={summaryTitle} items={summary.items} error={summary.error} focusKey={summary.focusKey} className="mb-6" />
        {children}
      </form>
    </FormContext.Provider>
  )
}

export { Form, useForm }
export type { FieldErrors, FormHandle, FormOptions, FormResult, FormStatus }
export type { FormProps }
