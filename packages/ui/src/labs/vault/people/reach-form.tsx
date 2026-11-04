"use client"

import type { ComponentProps } from "react"
import { useState, type KeyboardEvent } from "react"

import { Input } from "../../../components/inputs/input"
import { Field, FieldError, FieldLabel } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { PhoneField } from "../../../forms/fields/phone-field"
import { Form, useForm, type FieldErrors, type FormResult } from "../../../forms/form"
import { FormFooter } from "../../../forms/form-footer"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for vault/people/).
   How to reach someone, opened in place of "Add a phone or email" on their letterhead (v0):
   mobile and email side by side, one save for the two (never two half-saves), Form's four save
   states (FormFooter: idle · pending · failure with the input kept · done closes it). Enter
   saves; Escape cancels. At least one of the two is needed. An email field is Input type email
   until EmailField exists (VIEWS-PLAN.md §4). */

export type ReachDraft = { phone: string; email: string }

/** Mobile and email, one save: opened where the person's reach would show. */
export function ReachForm({
  who,
  onSave,
  onCancel,
  labels,
}: {
  /** Whose ("Rev. Ellen Hart"): names the form. */
  who: string
  /** Saves both. Nothing back: saved. `{ error }` / `{ errors }`: shown, input kept. */
  onSave: (draft: ReachDraft) => FormResult | Promise<FormResult>
  /** Cancel or Escape. */
  onCancel: () => void
  /** The form's words (the caller's copy). */
  labels: { form: string; phone: string; email: string; save: string; saving: string; cancel: string; needOne: string }
}) {
  const [draft, setDraft] = useState<ReachDraft>({ phone: "", email: "" })
  const form = useForm<ReachDraft>({
    values: draft,
    validate: (v): FieldErrors => ({ phone: v.phone || v.email.trim() ? undefined : labels.needOne }),
    onSubmit: (v) => onSave(v),
  })
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape" || e.defaultPrevented || form.status === "pending") return
    e.preventDefault()
    onCancel()
  }
  return (
    <div data-slot="reach-form" onKeyDown={onKeyDown} className="rounded-lg border border-divider p-4">
      <Form form={form} aria-label={`${labels.form} ${who}`}>
        <FieldGroup>
          <Field name="phone" span={6}>
            <FieldLabel>{labels.phone}</FieldLabel>
            <PhoneField autoFocus value={draft.phone} onValueChange={(phone) => setDraft((d) => ({ ...d, phone }))} />
            <FieldError />
          </Field>
          <Field name="email" span={6}>
            <FieldLabel>{labels.email}</FieldLabel>
            <Input type="email" autoComplete="off" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            <FieldError />
          </Field>
        </FieldGroup>
        <FormFooter submitLabel={labels.save} pendingLabel={labels.saving} cancel={{ label: labels.cancel, onClick: onCancel }} className="mt-4 pt-4" />
      </Form>
    </div>
  )
}

export type ReachFormProps = ComponentProps<typeof ReachForm>
