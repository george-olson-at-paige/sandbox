"use client"

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { CheckIcon, PencilIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../components/actions/button"
import { Eyebrow } from "../components/display/eyebrow"
import { Spinner } from "../components/feedback/spinner"
import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { Switch } from "../components/inputs/switch"
import { Textarea } from "../components/inputs/textarea"
import { formMessages } from "./messages"

/* @archetype Composite (ARCHETYPES.md).
   InlineEdit (R11-04, rebuilt from the round-4 edit-only version). The design pass, after
   Atlassian's inline edit, GitHub's in-place edits, Linear and Notion properties and Polaris
   (which has none and sends edits to a page or a modal); the full rationale is REVIEW-11 R11-04.
   - Two states. Read: the label (an Eyebrow, `hideLabel` when the page shows one) over the value
     as one button (value, then a pencil; its name is the value plus "Edit <label>"). Edit: the
     control with its actions, then the error if any. Read and edit share one box: the read row
     is the control's height (44, or the textarea's) with the control's border width, padding and
     text style, so the value sits exactly where the typed text will. Both boxes are pulled out
     by that padding (R12-04), so the value and the typed text line up with the label and the
     error and actions below. The actions sit in the flow, never floating, so they never cover
     the next field (Atlassian floats its buttons over it).
   - Actions, `sm`, Save then Cancel (GitHub's order), in one of two places (`actions`, R20-06).
     `inline` (the default for input and select): the control takes
     the row and the buttons sit at its right on its centre line, so editing swaps the pencil
     for Save and Cancel without growing the page; if the row would leave the control under 12rem
     (a phone beside a long Save label) the buttons wrap under it, left-aligned. `below`
     (always for a textarea, whose buttons beside a tall box would float mid-height, and the
     default for a typed field, whose popover button already sits at its right edge): the buttons
     open under the control and the error, left-aligned, the same at every width (Atlassian's
     place). The error shows under the row in both. Everything else, the keys, the pending
     state, the retry, is the same either way. George 2026-10-31: the control is shorter than
     the full width and the buttons are inline on the right "when we can".
   - Keys: Enter saves (input, a closed select with a value, a typed field with no error);
     Textarea keeps Enter for new lines and saves on Ctrl/⌘+Enter. Escape cancels and puts the
     saved value back. After a save or a cancel focus returns to the read button. Blur does
     nothing: a click on Save must not race a blur, and half-typed text is never saved for you.
   - onSave may return nothing (done), `{ error }`, or a promise of either. While a promise is
     out: Save says "Saving…", both actions are aria-disabled (focus stays on them), the control
     is read-only, a second Save or Enter does nothing. `{ error }` or a rejection: the message
     shows under the control (aria-invalid, described by it), focus goes back to the control,
     the input is kept, Save is ready to retry. Success: the read state with the new value and a
     "Saved" check in place for a moment, announced politely. No banner (George's rule).
   - control="switch": a switch takes effect when flipped (that's what a switch means), so it
     has no Save, no Cancel and no read/edit split: label above, the switch with its On/Off text.
     The flip shows at once and calls onSave(boolean); while it's pending a spinner sits beside
     it and further flips wait; a failure flips it back and shows the error under it. The switch
     is its own undo (flip it again), so there's no undo toast.
   - With a Select (R4-17, GAPS #91): Enter saves once a value is chosen and the list is closed;
     Escape cancels; the list opens with Space, Alt+Down (or the arrow keys) or a click. Enter
     with nothing chosen still opens the list.
   - With a field (R4-12): `renderControl` draws a typed field (DateField, PhoneField, …) wired to
     InlineEdit's value. The field reports its own error through onValidate (on blur or Enter);
     while one stands, Save and Enter don't save and the field stays aria-invalid. Enter saves
     only from the field's input, never from inside its calendar popover or its calendar button.
     `formatValue` draws the read state (a phone number formatted, an SSN masked). */

/** What InlineEdit hands a field drawn by `renderControl`. Spread it onto the field. */
type InlineEditControlProps = {
  value: string
  onValueChange: (value: string) => void
  onValidate: (message: string | undefined) => void
  "aria-label": string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  autoFocus: true
}

/** What onSave may return: nothing when saved, or the message to show when it wasn't. */
type InlineEditResult = void | { error?: string }

type CommonProps = {
  /** The value's name: the visible label (an Eyebrow) and the control's accessible name. */
  label: string
  /** The page shows the label itself (FactField's eyebrow): keep it as the accessible name only. */
  hideLabel?: boolean
  /** Extra classes for placement (margin, width), not restyling. */
  className?: string
}

type TextProps = CommonProps & {
  /** input (default; Enter saves) · select (Enter saves once a value is chosen and the list is closed) · textarea (Enter adds a line, Ctrl/⌘+Enter saves) · field (a typed field from `renderControl`; Enter saves when it has no error) · switch (saves on the flip; no Save or Cancel). Escape cancels in all the text kinds. */
  control?: "input" | "select" | "textarea" | "field"
  /** With control="field": draws the field, given the value, change and validation handlers and the label. `(c) => <DateField {...c} />` */
  renderControl?: (control: InlineEditControlProps) => ReactNode
  /** The saved value to start from. */
  defaultValue?: string
  /** Draws the read state's value (a formatted phone number, a masked SSN). Default: the value as text, a select's option label. */
  formatValue?: (value: string) => ReactNode
  /** What the read state says with no value (muted, italic). Default formMessages.inlineEdit.empty ("Nothing here yet"); FactField shows the owner's answer there (R12-06). */
  emptyText?: ReactNode
  /** Where Save and Cancel sit in the edit state: `inline` (at the control's right) or `below` (under it and the error). Default: inline for input and select, below for a typed field; a textarea is always below. */
  actions?: "inline" | "below"
  /** Placeholder for input and textarea. */
  placeholder?: string
  /** [value, label] pairs for the select control. */
  options?: Array<[value: string, label: string]>
  /** Called with the value on Save or Enter. Return `{ error }` (or a promise of it) when it didn't save. */
  onSave: (value: string) => InlineEditResult | Promise<InlineEditResult>
  /** Called on Cancel or Escape, after the saved value is put back. */
  onCancel?: () => void
  /** Open in the edit state (a story, a value the person just chose to add). */
  defaultEditing?: boolean
  /** Controlled edit state, with onEditingChange: the caller opens the editor from its own action too (FactField's Add) and knows when it's open. InlineEdit still draws the read state. */
  editing?: boolean
  /** Told when InlineEdit wants to enter or leave the edit state. */
  onEditingChange?: (editing: boolean) => void
}

type SwitchProps = CommonProps & {
  control: "switch"
  /** On or off to start from. */
  defaultValue?: boolean
  /** Called with the new state on every flip. Return `{ error }` (or a promise of it) to flip it back and say why. */
  onSave: (value: boolean) => InlineEditResult | Promise<InlineEditResult>
}

type InlineEditProps = TextProps | SwitchProps

/** Run onSave: synchronous results resolve now (no pending flash), promises report pending. */
async function run<V>(
  onSave: (v: V) => InlineEditResult | Promise<InlineEditResult>,
  value: V,
  setPending: (p: boolean) => void
): Promise<string | undefined> {
  try {
    const r = onSave(value)
    if (r instanceof Promise) {
      setPending(true)
      const done = await r
      return done?.error
    }
    return r?.error
  } catch {
    return formMessages.inlineEdit.failed
  } finally {
    setPending(false)
  }
}

/** The "Saved" mark: shown for a moment after a save, then the pencil (or nothing) again. */
function useSavedFlash() {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const flash = useCallback(() => {
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 2500)
  }, [])
  return [saved, flash] as const
}

/** Edit one value in place: a read state that opens a control, with Save and Cancel at its right (under it for a textarea); a switch saves on the flip. */
function InlineEdit(props: InlineEditProps) {
  return props.control === "switch" ? <InlineSwitch {...props} /> : <InlineText {...props} />
}

function InlineSwitch({ label, hideLabel, className, defaultValue = false, onSave }: SwitchProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const errorId = `${uid}-error`
  const [on, setOn] = useState(defaultValue)
  const [pending, setPendingState] = useState(false)
  const pendingRef = useRef(false)
  const setPending = (p: boolean) => {
    pendingRef.current = p
    setPendingState(p)
  }
  const [error, setError] = useState<string | undefined>()
  const [saved, flash] = useSavedFlash()
  const [announce, setAnnounce] = useState("")

  const flip = async (next: boolean) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setError(undefined)
    setOn(next)
    const message = await run(onSave, next, setPending)
    if (message !== undefined) {
      setOn(!next)
      setError(message)
      setAnnounce("")
    } else {
      flash()
      setAnnounce(formMessages.inlineEdit.saved)
    }
  }

  return (
    <div data-slot="inline-edit" data-control="switch" data-state={pending ? "pending" : error ? "error" : "read"} className={className}>
      {!hideLabel && (
        <Eyebrow as="div" id={labelId} className="mb-1">
          {label}
        </Eyebrow>
      )}
      <div className="flex min-h-control items-center gap-3">
        <Switch
          checked={on}
          onCheckedChange={(v) => void flip(v)}
          aria-labelledby={hideLabel ? undefined : labelId}
          aria-label={hideLabel ? label : undefined}
          aria-busy={pending || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <span aria-hidden className="text-sm font-medium text-card-foreground">
          {on ? formMessages.inlineEdit.on : formMessages.inlineEdit.off}
        </span>
        {pending ? (
          <Spinner size="sm" label={formMessages.pending} className="text-muted-foreground" />
        ) : (
          saved && <SavedMark />
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-error">
          {error}
        </p>
      )}
      <span role="status" className="sr-only">
        {announce}
      </span>
    </div>
  )
}

function SavedMark() {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success-foreground">
      <CheckIcon className="size-icon" />
      {formMessages.inlineEdit.saved}
    </span>
  )
}

function InlineText({
  control = "input",
  renderControl,
  label,
  hideLabel,
  defaultValue = "",
  formatValue,
  emptyText,
  actions: actionsPlace,
  placeholder,
  options,
  onSave,
  onCancel,
  defaultEditing = false,
  editing: controlledEditing,
  onEditingChange,
  className,
}: TextProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const errorId = `${uid}-error`
  const [saved, setSaved] = useState(defaultValue)
  const [value, setValue] = useState(defaultValue)
  const [ownEditing, setOwnEditing] = useState(defaultEditing)
  const editing = controlledEditing ?? ownEditing
  const setEditing = (e: boolean) => {
    if (controlledEditing === undefined) setOwnEditing(e)
    onEditingChange?.(e)
  }
  const [pending, setPendingState] = useState(false)
  const pendingRef = useRef(false)
  const setPending = (p: boolean) => {
    pendingRef.current = p
    setPendingState(p)
  }
  const [error, setError] = useState<string | undefined>()
  const [justSaved, flash] = useSavedFlash()
  const [announce, setAnnounce] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  /** Set when leaving the edit state, so the read button takes focus once it's back. */
  const returnFocus = useRef(false)
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false
      triggerRef.current?.focus()
    }
  }, [editing])

  /* The field's own error (control="field"). A ref too: the field reports on Enter in the same
     keydown that reaches the wrapper, before a state update would land. */
  const fieldError = useRef<string | undefined>(undefined)
  const [fieldInvalid, setFieldInvalid] = useState(false)
  const onValidate = (message: string | undefined) => {
    fieldError.current = message
    setFieldInvalid(message !== undefined)
  }

  const focusControl = () =>
    requestAnimationFrame(() => boxRef.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, [role=combobox], [contenteditable=true]")?.focus())

  const open = () => {
    setValue(saved)
    setError(undefined)
    setAnnounce("")
    setEditing(true)
  }
  const save = async () => {
    if (pendingRef.current) return
    if (control === "field" && fieldError.current !== undefined) return
    pendingRef.current = true
    setError(undefined)
    const message = await run(onSave, value, setPending)
    if (message !== undefined) {
      setError(message)
      focusControl()
      return
    }
    setSaved(value)
    returnFocus.current = true
    setEditing(false)
    flash()
    setAnnounce(formMessages.inlineEdit.saved)
  }
  const cancel = () => {
    if (pendingRef.current) return
    setValue(saved)
    setError(undefined)
    returnFocus.current = true
    setEditing(false)
    onCancel?.()
  }

  /* Field keys: only from the field's own input (not a portalled popover, not its buttons). */
  const onFieldKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (!e.currentTarget.contains(target)) return
    if (e.key === "Enter" && target.tagName === "INPUT") {
      e.preventDefault()
      void save()
    }
    if (e.key === "Escape") cancel()
  }
  const onTextKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (control !== "textarea" || e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void save()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      cancel()
    }
  }
  /* Select (R4-17): keys inside the open list (portalled, but in React's tree) belong to the
     list: Enter picks an option, Escape closes the list. With the list closed, Enter saves
     when a value is chosen; it is caught in the capture phase and stopped, so the trigger
     (Radix opens on Enter) or the native select never sees it. Escape cancels. */
  const inList = (e: KeyboardEvent) => (e.target as HTMLElement).closest("[role=listbox]") !== null
  const onSelectKeyCapture = (e: KeyboardEvent) => {
    if (e.key === "Enter" && value !== "" && !inList(e)) {
      e.preventDefault()
      e.stopPropagation()
      void save()
    }
  }
  const onSelectKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !inList(e)) cancel()
  }

  const invalid = Boolean(error) || fieldInvalid
  const describedBy = error ? errorId : undefined
  const optionLabel = (v: string) => options?.find(([o]) => o === v)?.[1] ?? v
  const shown = saved === "" ? null : formatValue ? formatValue(saved) : control === "select" ? optionLabel(saved) : saved
  const multiline = control === "textarea"
  /* R20-06: a textarea is always below; a typed field is below unless asked; input and select are inline. */
  const inline = !multiline && (actionsPlace ?? (control === "field" ? "below" : "inline")) === "inline"

  const actionRow = (
    <div className={cn("flex items-center gap-2", inline ? "shrink-0" : "mt-2 flex-wrap")}>
      <Button size="sm" aria-disabled={pending || undefined} onClick={() => void save()}>
        {pending ? formMessages.pending : formMessages.inlineEdit.save}
      </Button>
      <Button size="sm" variant="secondary" aria-disabled={pending || undefined} onClick={cancel}>
        {formMessages.inlineEdit.cancel}
      </Button>
    </div>
  )

  return (
    <div
      data-slot="inline-edit"
      data-control={control}
      data-state={editing ? (pending ? "pending" : error ? "error" : "editing") : "read"}
      aria-busy={pending || undefined}
      className={cn("min-w-0", className)}
    >
      {!hideLabel && (
        <Eyebrow as="div" id={labelId} className="mb-1">
          {label}
        </Eyebrow>
      )}
      {!editing ? (
        // R12-04 (GAPS #123): the row is pulled out by its own padding (-mx-3), so the value
        // lines up with the label and the hover box hangs just outside the column; the edit
        // control below is pulled out the same way, so its text still starts where the value did.
        <div className="-mx-3">
          <button
            ref={triggerRef}
            type="button"
            onClick={open}
            className={cn(
              // The control's box: same border width, padding, height and text, so nothing moves.
              // Focus (R15-17): no outline, which looked like the open text box. The row's own cue,
              // made stronger: the hover wash plus the pencil in brand blue.
              "group flex w-full cursor-pointer gap-2 rounded-md border border-transparent px-3 text-left text-base font-medium text-card-foreground outline-none hover:layer-hover focus-visible:layer-hover active:layer-press md:text-sm",
              multiline ? "min-h-textarea items-start py-2" : "min-h-control items-center py-2"
            )}
          >
            <span className={cn("min-w-0 flex-1 break-words", multiline && "whitespace-pre-wrap", shown === null && "font-normal text-muted-foreground italic")}>
              {shown ?? emptyText ?? formMessages.inlineEdit.empty}
              <span className="sr-only">, {formMessages.inlineEdit.edit(label)}</span>
            </span>
            <span aria-hidden data-slot="inline-edit-pencil" className={cn("flex h-5 shrink-0 items-center text-muted-foreground group-hover:text-card-foreground group-focus-visible:text-primary")}>
              {justSaved ? <SavedMark /> : <PencilIcon className="size-icon" />}
            </span>
          </button>
        </div>
      ) : (
        <div>
          <div className={inline ? "flex flex-wrap items-center gap-2" : undefined}>
            <div
              ref={boxRef}
              className={inline ? "-ml-3 min-w-48 flex-1" : "-mx-3"}
              onKeyDownCapture={control === "select" ? onSelectKeyCapture : undefined}
              onKeyDown={control === "select" ? onSelectKey : control === "field" ? onFieldKey : undefined}
            >
              {control === "field" ? (
                renderControl?.({
                  value,
                  onValueChange: setValue,
                  onValidate,
                  "aria-label": label,
                  "aria-invalid": invalid || undefined,
                  "aria-describedby": describedBy,
                  autoFocus: true,
                })
              ) : control === "select" ? (
                <Select
                  aria-label={label}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  autoFocus
                  placeholder="Choose"
                  value={value}
                  disabled={pending}
                  onValueChange={setValue}
                  options={options?.map(([v, l]) => ({ value: v, label: l }))}
                />
              ) : control === "textarea" ? (
                <Textarea
                  aria-label={label}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  autoFocus
                  readOnly={pending}
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onTextKey}
                />
              ) : (
                <Input
                  aria-label={label}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  autoFocus
                  readOnly={pending}
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onTextKey}
                />
              )}
            </div>
            {inline && actionRow}
          </div>
          {error && (
            <p id={errorId} className="mt-1.5 text-sm font-medium text-error">
              {error}
            </p>
          )}
          {!inline && actionRow}
        </div>
      )}
      <span role="status" className="sr-only">
        {announce}
      </span>
    </div>
  )
}

export { InlineEdit }
export type { InlineEditControlProps, InlineEditProps, InlineEditResult }
