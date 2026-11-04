"use client"

import { useLayoutEffect, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type ReactNode, type Ref } from "react"

import { applyEdit, renderMask, type Mask, type MaskOptions } from "../../lib/mask"
import { HiddenValue, useFormatHint, type FieldControlProps } from "./field-support"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"

/* The input behind PhoneField, PostalCodeField and SsnField (R4-12). Internal: no story, not in
   the catalog. It holds no state: the field owns the significant characters (`sig`), this draws
   them through the mask and turns each browser edit back into significant characters with
   lib/mask.ts applyEdit, then puts the caret where applyEdit says. When an edit changes nothing
   (a letter in a digit field, a full field), React would leave the browser's text in place, so
   the input is put back by hand, caret included. */
type MaskedInputProps = FieldControlProps & {
  mask: Mask
  /** Significant characters (digits). */
  sig: string
  onSigChange: (sig: string) => void
  maskOptions?: MaskOptions
  /** The field's canonical value, for the hidden form input. */
  formValue: string
  /** The format, for screen readers ("US phone number, 10 digits"). */
  hint: string
  invalid?: boolean
  placeholder?: string
  inputMode?: ComponentProps<"input">["inputMode"]
  autoComplete?: string
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  /** Extra attributes for the input (password-manager opt-outs on SsnField). */
  inputProps?: Record<`data-${string}`, string | boolean>
  /** A FieldAction in the trailing slot (SsnField's reveal, R5-02): the InputGroup's trailing addon (U-02). */
  action?: ReactNode
  /** Focus left the field entirely (the input and its action). */
  onLeave?: () => void
  /** The visible input. */
  ref?: Ref<HTMLInputElement>
}

export function MaskedInput({
  mask,
  sig,
  onSigChange,
  maskOptions,
  formValue,
  hint,
  invalid,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onValidate: _onValidate,
  inputProps,
  action,
  onLeave,
  ref: outerRef,
  className,
  ...input
}: MaskedInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const setRef = (el: HTMLInputElement | null) => {
    ref.current = el
    if (typeof outerRef === "function") outerRef(el)
    else if (outerRef) outerRef.current = el
  }
  const caret = useRef<number | null>(null)
  const { hintId, describedBy } = useFormatHint(ariaDescribedBy)
  const text = renderMask(mask, sig, maskOptions).text

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const inputType = (e.nativeEvent as InputEvent).inputType
    const r = applyEdit(mask, { text, sig }, el.value, el.selectionEnd ?? el.value.length, inputType, maskOptions)
    if (r.sig === sig) {
      el.value = r.text
      el.setSelectionRange(r.caret, r.caret)
      return
    }
    caret.current = r.caret
    onSigChange(r.sig)
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (el && caret.current !== null) {
      if (el.ownerDocument.activeElement === el) el.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  })

  return (
    <InputGroup
      data-slot="masked-input"
      className={className}
      onBlur={onLeave ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave() } : undefined}
    >
      <InputGroupInput
        ref={setRef}
        {...input}
        {...inputProps}
        type="text"
        value={text}
        onChange={onChange}
        spellCheck={false}
        aria-invalid={ariaInvalid || invalid || undefined}
        aria-describedby={describedBy}
      />
      <span id={hintId} className="sr-only">{hint}</span>
      <HiddenValue name={name} value={formValue} />
      {action && <InputGroupAddon align="inline-end">{action}</InputGroupAddon>}
    </InputGroup>
  )
}

/**
 * A masked field's significant characters, kept in step with its value: `value` (controlled) or
 * `defaultValue`. A new `value` from outside replaces what was typed unless it is what the typed
 * characters already mean (a half-typed number means "", so the caller's "" leaves it alone).
 * `onValueChange` fires only when the meaning changes.
 */
export function useMaskedValue(
  value: string | undefined,
  defaultValue: string | undefined,
  toSig: (value: string) => string,
  toValue: (sig: string) => string,
  onValueChange?: (value: string) => void
) {
  const [sig, setSig] = useState(() => toSig(value ?? defaultValue ?? ""))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== undefined && value !== toValue(sig)) setSig(toSig(value))
  }
  const change = (next: string) => {
    const before = toValue(sig)
    setSig(next)
    const after = toValue(next)
    if (after !== before) onValueChange?.(after)
  }
  return { sig, change }
}
