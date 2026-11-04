"use client"

import type { ComponentProps } from "react"
import { useEffect, useState, type KeyboardEvent } from "react"

import { Input } from "../../components/inputs/input"
import { Select } from "../../components/inputs/select"
import { Textarea } from "../../components/inputs/textarea"
import { Field, FieldError, FieldLabel } from "../../forms/field"
import { FieldGroup } from "../../forms/field-group"
import { DateOfBirthField } from "../../forms/fields/date-of-birth-field"
import { PhoneField } from "../../forms/fields/phone-field"
import { Form, useForm, type FieldErrors, type FormResult } from "../../forms/form"
import { FormFooter } from "../../forms/form-footer"
import type { IsoDate } from "../../forms/values"
import { contactFieldsFor, kinOf, type ContactFieldRule, CONTACT_FIELD_RULES } from "../stack-rules"

/** What the add form hands up: only the fields it asked for are set. */
export type PersonDraft = {
  name: string
  kinship: string
  dateOfBirth?: IsoDate
  phone?: string
  email?: string
  note?: string
}

/** A kinship the form offers, and how it reads. */
export type KinshipChoice = { value: string; label: string }

/* @archetype Composite (ARCHETYPES.md).
   PersonAddForm (ADR 0076 amendment rules 5 and 7): the "someone new" form of a stack's Add
   region. The fields come from one rule set keyed by kinship and role (`contactFieldsFor(kinship,
   "create", { role })`, data in stack-rules.ts), never a per-screen list: change the kinship and
   the fields follow (a pet asks a note, not a date of birth; a guardian asks no date of birth).
   - Four save states, through Form (R7-03): idle; saving (the submit is off and says "Adding…",
     no double submit); saved (onSave returns nothing: the stack closes the form and moves focus
     to the new entry); failed (onSave returns `{ error }` or `{ errors }`: the message shows,
     the input is kept, the submit is ready to try again).
   - Keys: Enter saves (a form submit); Escape cancels (`onCancel`; the stack returns focus to
     what opened the form). The name takes focus when the form opens.
   - Unsaved input: `onDirtyChange` tells the stack, which asks "Discard changes?" before anything
     else closes the form (rule 1); Form's own guard covers leaving the page (R8-01, R9-02).
   - Setup's follow-ups ("Under 18?", "Do you help look after them?", a pet's kind, the
     Delegate's email) are not here yet: they land as rules in CONTACT_FIELD_RULES. */
/** The add-someone-new form of a stack: fields by kinship and role, four save states, Enter saves and Escape cancels. */
function PersonAddForm({
  kinship: initialKinship,
  kinships,
  role,
  rules = CONTACT_FIELD_RULES,
  onSave,
  onCancel,
  onDirtyChange,
  submitLabel = "Add",
  pendingLabel = "Adding…",
}: {
  /** The kinship a quick add set; the person can still change it. None: they choose. */
  kinship?: string
  /** The kinships this stack can take (already filtered for caps). */
  kinships: readonly KinshipChoice[]
  /** Why they are here (the stack's role), for the field rules. */
  role?: string
  /** The field rules; default the shared set. */
  rules?: readonly ContactFieldRule[]
  /** Saves. Nothing back: saved (the stack closes the form). `{ error }` / `{ errors }`: shown, input kept. */
  onSave: (draft: PersonDraft) => FormResult | Promise<FormResult>
  /** Cancel or Escape. */
  onCancel: () => void
  /** The form has (or no longer has) unsaved input. */
  onDirtyChange?: (dirty: boolean) => void
  /** The submit's label. Default "Add". */
  submitLabel?: string
  /** The submit's label while saving. Default "Adding…". */
  pendingLabel?: string
}) {
  const [draft, setDraft] = useState<PersonDraft>({ name: "", kinship: initialKinship ?? "", dateOfBirth: "", phone: "", email: "", note: "" })
  const fields = contactFieldsFor(draft.kinship || undefined, "create", { role }, rules)
  const asks = (k: (typeof fields)[number]) => fields.includes(k)
  const isPet = kinOf(draft.kinship) === "pet"

  const form = useForm<PersonDraft>({
    values: draft,
    validate: (v): FieldErrors => ({
      name: v.name.trim() ? undefined : isPet ? "Enter their name." : "Enter their first and last name.",
      kinship: asks("relationship") && v.kinship === "" ? "Choose who they are to you." : undefined,
    }),
    onSubmit: (v) => onSave(only(v, fields)),
  })

  useEffect(() => onDirtyChange?.(form.dirty), [form.dirty, onDirtyChange])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape" || e.defaultPrevented || form.status === "pending") return
    e.preventDefault()
    onCancel()
  }

  const set = (patch: Partial<PersonDraft>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <div data-slot="person-add-form" onKeyDown={onKeyDown}>
      <Form form={form} aria-label="Someone new">
        <FieldGroup>
          {asks("name") && (
            <Field name="name" span={asks("relationship") ? 6 : 12} required>
              <FieldLabel>Name</FieldLabel>
              <Input autoFocus autoComplete="off" placeholder={isPet ? "" : "First and last name"} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
              <FieldError />
            </Field>
          )}
          {asks("relationship") && (
            <Field name="kinship" span={6} required>
              <FieldLabel>Who they are to you</FieldLabel>
              <Select placeholder="Choose" options={[...kinships]} value={draft.kinship} onValueChange={(kinship) => set({ kinship })} />
              <FieldError />
            </Field>
          )}
          {asks("dateOfBirth") && (
            <Field name="dateOfBirth" span={6}>
              <FieldLabel>Date of birth</FieldLabel>
              <DateOfBirthField value={draft.dateOfBirth} onValueChange={(dateOfBirth) => set({ dateOfBirth })} />
              <FieldError />
            </Field>
          )}
          {asks("phone") && (
            <Field name="phone" span={6}>
              <FieldLabel>Mobile number</FieldLabel>
              <PhoneField value={draft.phone} onValueChange={(phone) => set({ phone })} />
              <FieldError />
            </Field>
          )}
          {asks("email") && (
            <Field name="email" span={6}>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" autoComplete="off" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
              <FieldError />
            </Field>
          )}
          {asks("note") && (
            <Field name="note">
              <FieldLabel>Note</FieldLabel>
              <Textarea value={draft.note} onChange={(e) => set({ note: e.target.value })} />
              <FieldError />
            </Field>
          )}
        </FieldGroup>
        <FormFooter submitLabel={submitLabel} pendingLabel={pendingLabel} cancel={{ label: "Cancel", onClick: onCancel }} className="mt-4 pt-4" />
      </Form>
    </div>
  )
}

/** The draft with only the fields the form asked for (empty answers left out). */
function only(v: PersonDraft, fields: readonly string[]): PersonDraft {
  const out: PersonDraft = { name: v.name.trim(), kinship: v.kinship }
  if (fields.includes("dateOfBirth") && v.dateOfBirth) out.dateOfBirth = v.dateOfBirth
  if (fields.includes("phone") && v.phone) out.phone = v.phone
  if (fields.includes("email") && v.email?.trim()) out.email = v.email.trim()
  if (fields.includes("note") && v.note?.trim()) out.note = v.note.trim()
  return out
}

export { PersonAddForm }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PersonAddFormProps = ComponentProps<typeof PersonAddForm>
