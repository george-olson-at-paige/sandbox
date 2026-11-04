"use client"

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"

import { CircleAlertIcon } from "lucide-react"

import { cn } from "../lib/utils"
import {
  Field as UiField,
  FieldDescription as UiFieldDescription,
  FieldError as UiFieldError,
  FieldLabel as UiFieldLabel,
} from "../base/field"
import { FieldContext, useFieldContext, type FieldContextValue } from "../components/internal/field-context"
import { fieldControlId, useFormContext } from "./internal/form-context"
import { formMessages } from "./messages"

/* @archetype Frame (ARCHETYPES.md).
   Paige Field over upstream Field: Field (name, span, invalid, disabled, required), FieldLabel
   (the eyebrow text style; R1-17), FieldDescription and FieldError (the error colour; R1-02).
   FieldGroup places fields. FieldSet is a fieldset: related fields under one legend. Upstream's Content/Title/Separator are not exposed until a screen needs them. Label is not wrapped: inside a field it is always FieldLabel.

   Field wires its control (R7-03, the Primer FormControl model). It owns the control's id, its
   FieldLabel's id, and the ids of its FieldDescription and FieldError, and shares them through
   context (components/internal/field-context.tsx): Input, Textarea, Select and every typed
   field take the id, `aria-describedby` (only the parts on screen) and `aria-invalid` from it,
   and FieldLabel's `htmlFor` points at the id. A caller writes none of them. A control's own
   props still win.
   Errors: `errors` is the messages under the control, and `required` adds "Enter a value."
   A typed field still reports its own message (after blur or Enter); inside a Form a named
   Field also shows the form's error for its name (validate, or the server's) through a
   FieldError child. `invalid` marks the field too.
   First paint (R8-04, GAPS #105): the ids are derived from the Field's own id (useId, stable
   between the server and the client), and Field finds its FieldDescription and FieldError in its
   children while it renders (through plain elements and fragments; a part inside another
   component is found once it mounts, as before), so the server HTML already carries
   `aria-describedby`. An error counts only while it has something to say.
   The id is the Field's (R8-05, GAPS #106): a control's own `id` inside a Field is ignored with
   a dev-only warning; set it on Field.
   Label for non-form controls (R2-32, GAPS #81): a <label for> names and focuses only form
   elements, not the rich Textarea (a contenteditable). The rich Textarea picks up the label id
   as aria-labelledby and registers a focus function, which a click on the label calls.
   Client file for the context; no cva helper is exported from it (R2-33). */

/** What FieldDescription and FieldError read beyond the controls' context. */
type FieldParts = {
  descriptionId: string
  errorId: string
  /** The field's own error, else the form's for its name. */
  message: string | undefined
  /** A description or error on screen joins aria-describedby while mounted. */
  mount: (part: "description" | "error") => () => void
}
const useFieldParts = () => useFieldContext() as (FieldContextValue & Partial<FieldParts>) | null

/** Marks FieldDescription, FieldError, and an adornment so Field can find them in its children while rendering. */
type PartMarker = { fieldPart?: "description" | "error" | "adornment" }

/** Which parts the Field's children render, found without mounting (R8-04): what the server HTML needs. */
function partsIn(children: ReactNode, message: string | undefined) {
  const found = { description: false, error: false }
  const walk = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (!isValidElement<{ children?: ReactNode; errors?: Array<{ message?: string } | undefined> }>(child)) return
      const part = (child.type as PartMarker).fieldPart
      if (part === "description") found.description = true
      else if (part === "error") {
        const { children: own, errors } = child.props
        const listed = Boolean(errors?.some((e) => e?.message))
        if (Boolean(own ?? (listed ? undefined : message)) || listed) found.error = true
      } else if (typeof child.type === "string" || child.type === Fragment) walk(child.props.children)
    })
  walk(children)
  return found
}

/** The control stays with the label. Caption, adornment, and error, passed as children, sit under it. */
function splitFieldChildren(nodes: ReactNode) {
  const control: ReactNode[] = []
  const after: ReactNode[] = []
  const walk = (items: ReactNode) => {
    Children.forEach(items, (child) => {
      if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        walk(child.props.children)
        return
      }
      const part = isValidElement(child) ? (child.type as PartMarker).fieldPart : undefined
      if (part === "description" || part === "error" || part === "adornment") after.push(child)
      else control.push(child)
    })
  }
  walk(nodes)
  return { control, after }
}

/* Complete class names so Tailwind keeps them. Applied from md; below that the group is one column. */
const FIELD_SPAN = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
} as const

/** A form field: label, control, description and error, wired together. */
function Field({
  label,
  description,
  errors,
  required,
  invalid,
  disabled,
  orientation = "vertical",
  name,
  id,
  span = 12,
  className,
  children,
}: {
  /** The label. Eyebrow: 12px, semibold, uppercase, 0.05em, muted. */
  label?: string
  /** The caption under the control: 12px, medium, muted. */
  description?: string
  /** Messages under the control. `required` adds its own. */
  errors?: string[]
  /** Shows "Enter a value." under the control and marks the field. */
  required?: boolean
  /** Marks the field as an error. Messages do this too. */
  invalid?: boolean
  /** Disables the control. */
  disabled?: boolean
  /** vertical stacks the label, control, caption, and error at step 2. horizontal places the label beside the control at that same step. Caption, error, and anything else under the control are inset one step on each side. */
  orientation?: "vertical" | "horizontal"
  /** The value's key in the Form: the control's id becomes `<form id>-<name>`, and the form's error for it shows here. */
  name?: string
  /** The control's id, when something outside links to it (default generated, or `<form id>-<name>` in a Form). Set it here, not on the control, so FieldLabel follows. */
  id?: string
  /** How many columns of a FieldGroup this field takes, from the md breakpoint. 12 is the whole row. 6 and 6 share a row. 7 and 5 is about 60/40. Below md the field is the full width. */
  span?: keyof typeof FIELD_SPAN
  className?: string
  children?: ReactNode
}) {
  const form = useFormContext()
  const uid = useId()
  const controlId = id ?? (form && name ? fieldControlId(form.id, name) : `${uid}control`)
  const labelId = `${uid}label`
  const descriptionId = `${uid}description`
  const errorId = `${uid}error`
  const focusControl = useRef<(() => void) | null>(null)
  const [ownError, setOwnError] = useState<string | undefined>(undefined)
  const [parts, setParts] = useState({ description: 0, error: 0 })
  const message = ownError ?? (name ? form?.errorFor(name) : undefined)
  // todo: come back to the required message. It shows whenever `required` is on, because Field
  // does not read the control's value, so a filled field still says "Enter a value."
  const messages = [
    ...(required ? [formMessages.required] : []),
    ...(errors ?? []).filter((m) => m),
  ]
  const isInvalid = Boolean(invalid) || message !== undefined || messages.length > 0

  // Tell the form about the field's own error, and register for ErrorSummary's links.
  const setFormOwnError = form?.setOwnError
  useEffect(() => {
    if (!name || !setFormOwnError) return
    setFormOwnError(name, ownError)
    return () => setFormOwnError(name, undefined)
  }, [name, ownError, setFormOwnError])
  const register = form?.register
  useEffect(() => {
    if (!name || !register) return
    return register(name, () => {
      if (focusControl.current) focusControl.current()
      else document.getElementById(controlId)?.focus()
    })
  }, [name, register, controlId])

  const mount = useCallback((part: "description" | "error") => {
    setParts((p) => ({ ...p, [part]: p[part] + 1 }))
    return () => setParts((p) => ({ ...p, [part]: p[part] - 1 }))
  }, [])

  // Parts found in the children (server and first paint) or mounted (a part inside another component).
  const seen = partsIn(children, message)
  const hasDescription = seen.description || parts.description > 0 || Boolean(description)
  const showMessages = messages.length > 0 && !seen.error
  const hasError = seen.error || parts.error > 0 || showMessages
  const context = useMemo<FieldContextValue & FieldParts>(
    () => ({
      labelId,
      controlId,
      describedBy: [hasDescription && descriptionId, hasError && errorId].filter(Boolean).join(" ") || undefined,
      invalid: isInvalid,
      disabled: Boolean(disabled),
      required: Boolean(required),
      focusControl,
      reportError: setOwnError,
      descriptionId,
      errorId,
      message,
      mount,
    }),
    [labelId, controlId, hasDescription, hasError, descriptionId, errorId, isInvalid, disabled, required, message, mount]
  )
  const horizontal = orientation === "horizontal"
  const placed = splitFieldChildren(children)
  return (
    <FieldContext.Provider value={context}>
      <UiField
        orientation="vertical"
        data-orientation={orientation}
        data-invalid={isInvalid ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        className={cn(
          "data-[invalid=true]:text-error",
          // todo: horizontal labels on one form should share one width, so the boxes line up.
          FIELD_SPAN[span],
          horizontal ? "flex-row items-start gap-2 [&>*]:w-auto" : "gap-2",
          className,
        )}
      >      
        {label ? <FieldLabel className={horizontal ? "h-control w-auto shrink-0" : undefined}>{label}</FieldLabel> : null}
        <div className={cn("flex min-w-0 flex-col gap-2", horizontal && "flex-1")}>
          <div className="flex flex-col gap-2">{placed.control}</div>
          {/* Under the control, inset one tick on each side. Empty while a FieldError has nothing to say. */}
          <div data-slot="field-after" className="flex flex-col px-1 empty:hidden">
            {placed.after}
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            {showMessages ? <FieldError errors={messages.map((m) => ({ message: m }))} /> : null}
          </div>
        </div>
      </UiField>
    </FieldContext.Provider>
  )
}

/** The field's label, in the eyebrow text style; it points at the Field's control. An adornment (Badge size xs) can follow the text. */
function FieldLabel({ className, id, htmlFor, ...props }: Pick<ComponentProps<typeof UiFieldLabel>, "htmlFor" | "id" | "className" | "children">) {
  const field = useFieldContext()
  return (
    <UiFieldLabel
      id={id ?? field?.labelId}
      htmlFor={htmlFor ?? field?.controlId}
      onClick={() => field?.focusControl.current?.()}
      className={cn("eyebrow w-full items-center", "group-data-[invalid=true]/field:text-error", className)}
      {...props}
    />
  )
}

/** A hint under the control; the control is described by it. */
function FieldDescription({ className, children }: { className?: string; children: ReactNode }) {
  const field = useFieldParts()
  const mount = field?.mount
  // Layout effect: the control is described before the first paint (and before a play reads it).
  useLayoutEffect(() => mount?.("description"), [mount])
  // 500, as the prototype's field hints (setup.css .vf-in > span; R2-17). 12px: a caption sits a
  // step below the value it describes (the control's 14px); George 2026-10-28.
  return (
    <UiFieldDescription id={field?.descriptionId} className={cn("text-xs font-medium nth-last-2:mt-0 group-data-[disabled=true]/field:opacity-disabled", className)}>
      {children}
    </UiFieldDescription>
  )
}

/** The field's error: its children, else `errors`, else the field's own or the form's message. The control is described by it while it shows. */
function FieldError({
  className,
  children,
  errors,
}: {
  className?: string
  children?: ReactNode
  errors?: Array<{ message?: string } | undefined>
}) {
  const field = useFieldParts()
  const messages = (errors ?? []).flatMap((e) => (e?.message ? [e.message] : []))
  const lines = children != null && children !== false && children !== ""
    ? [children]
    : messages.length > 0 ? messages : field?.message ? [field.message] : []
  const hasContent = lines.length > 0
  const mount = field?.mount
  useLayoutEffect(() => (hasContent ? mount?.("error") : undefined), [hasContent, mount])
  if (!hasContent) return null
  return (
    <UiFieldError id={field?.errorId} className={cn("field-reveal text-xs font-medium text-error", className)}>
      <span className="field-error-clip">
        <span className="flex flex-col gap-2">
          {lines.map((line, i) => (
            <span key={i} className="flex items-start gap-1">
              <CircleAlertIcon aria-hidden className="size-icon shrink-0" />
              <span className="ml-1 min-w-0">{line}</span>
            </span>
          ))}
        </span>
      </span>
    </UiFieldError>
  )
}

;(FieldDescription as PartMarker).fieldPart = "description"
;(FieldError as PartMarker).fieldPart = "error"

export { Field, FieldDescription, FieldError, FieldLabel }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FieldProps = ComponentProps<typeof Field>
export type FieldDescriptionProps = ComponentProps<typeof FieldDescription>
export type FieldErrorProps = ComponentProps<typeof FieldError>
export type FieldLabelProps = ComponentProps<typeof FieldLabel>
