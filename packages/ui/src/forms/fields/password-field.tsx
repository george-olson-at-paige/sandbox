"use client"

import { useRef, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { FieldAction } from "./field-action"
import { fieldMessages } from "../messages"
import { useKeptSelection, type FieldControlProps } from "../internal/field-support"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"

/* @archetype Control (ARCHETYPES.md).
   PasswordField (R5-02, George 2026-10-19): a password on the Input chrome with a show/hide toggle.
   - The toggle is a FieldAction (R5-03): "Show password" with aria-pressed. The label stays the
     same pressed or not (R6-01, GAPS #98): WAI-ARIA's toggle-button pattern keeps one label and
     lets aria-pressed say the state; a label that flips to "Hide password" while pressed reads
     as two states ("Hide password, toggle button, pressed"). The icon still swaps. A click
     keeps focus in the input, and the caret and selection stay where they were (the browser
     would otherwise move them when the input switches between password and text).
   - `autoComplete` is "current-password" (sign-in, the default) or "new-password" (sign-up, a
     change): nothing else, so password managers always know which it is.
   - Never logged: this component logs nothing, and callers must not log the value or put it in
     telemetry, URLs or error reports.
   - No rules of its own: it never reports an error (`onValidate` is accepted so it drops into
     InlineEdit `control="field"`, and never called). Strength and match rules are the caller's.
   - `name` goes on the input itself, not a hidden copy, so password managers see the real field.
   - No spellcheck, autocorrect or autocapitalise: a password is not prose. */
type PasswordFieldProps = Omit<FieldControlProps, "onValidate"> & {
  /** The password (controlled). */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Accepted for InlineEdit; a password field reports no errors of its own. */
  onValidate?: (message: string | undefined) => void
  /** "current-password" (sign-in, default) or "new-password" (sign-up, change). */
  autoComplete?: "current-password" | "new-password"
  placeholder?: string
  /** Start revealed (stories); the toggle changes it after that. */
  defaultRevealed?: boolean
}

/** A password with a show/hide toggle; autocomplete is current-password or new-password. */
function PasswordField({
  value,
  defaultValue,
  onValueChange,
  onValidate: _onValidate,
  autoComplete = "current-password",
  defaultRevealed = false,
  className,
  disabled,
  ...input
}: PasswordFieldProps) {
  const [own, setOwn] = useState(defaultValue ?? "")
  const text = value ?? own
  const [revealed, setRevealed] = useState(defaultRevealed)
  const ref = useRef<HTMLInputElement>(null)
  const keep = useKeptSelection(ref)
  return (
    <InputGroup data-slot="password-field" className={className}>
      <InputGroupInput
        {...input}
        ref={ref}
        type={revealed ? "text" : "password"}
        value={text}
        onChange={(e) => {
          if (value === undefined) setOwn(e.target.value)
          onValueChange?.(e.target.value)
        }}
        disabled={disabled}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <InputGroupAddon align="inline-end">
        <FieldAction
          pressed={revealed}
          aria-label={fieldMessages.password.reveal}
          icon={revealed ? <EyeOffIcon /> : <EyeIcon />}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            keep()
            setRevealed((r) => !r)
          }}
        />
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordField }
export type { PasswordFieldProps }
