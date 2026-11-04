"use client"

import type { ChangeEvent } from "react"

import { Badge } from "@paige/ui/components/display/badge"
import { Input } from "@paige/ui/components/inputs/input"
import { Select } from "@paige/ui/components/inputs/select"
import { Field, FieldDescription, FieldError, FieldLabel } from "@paige/ui/forms/field"
import { FieldGroup } from "@paige/ui/forms/field-group"
import { PhoneField } from "@paige/ui/forms/fields/phone-field"
import { Form, type FormHandle } from "@paige/ui/forms/form"
import { FormSection } from "@paige/ui/forms/form-section"

import type { SetupView } from "@/fixtures/types"

export type AboutYouValues = SetupView["about"]

/* The About you capture form (R7-03): the fields and their values; the beat (route) composes it
   with SetupBeat and owns navigation. Field wires each control's id, description and error
   (no hand-written ids or aria), PhoneField reports its own error to its Field, and Form lists
   anything still wrong in an ErrorSummary when the footer's submit is pressed. */

/** Step 1 · About you: legal and preferred name, mobile, and where the owner lives. */
export function AboutYouForm({
  form,
  values,
  onChange,
}: {
  /** From `useForm` in the beat: SetupBeat's footer sits outside the <form>. */
  form: FormHandle<AboutYouValues>
  values: AboutYouValues
  onChange: (values: AboutYouValues) => void
}) {
  const set = (k: keyof AboutYouValues) => (e: ChangeEvent<HTMLInputElement>) => onChange({ ...values, [k]: e.target.value })
  return (
    <Form form={form}>
      <FieldGroup>
        <Field name="legalName">
          <FieldLabel>Legal name</FieldLabel>
          <Input value={values.legalName} onChange={set("legalName")} placeholder="As it appears on your ID" />
          <FieldDescription>This is the name on your ID and your legal documents.</FieldDescription>
        </Field>
        <Field name="preferredName" span={6}>
          <FieldLabel>
            Preferred name
            <Badge tone="neutral" size="xs" className="ml-auto normal-case">Optional</Badge>
          </FieldLabel>
          <Input value={values.preferredName} onChange={set("preferredName")} placeholder="What should we call you?" />
          <FieldDescription>This is what we’ll call you.</FieldDescription>
        </Field>
        <Field name="mobile" span={6}>
          <FieldLabel>Mobile number</FieldLabel>
          {/* Value is E.164; PhoneField formats as you type and reports its own error on blur (R4-12). */}
          <PhoneField value={values.mobile} onValueChange={(mobile) => onChange({ ...values, mobile })} />
          <FieldDescription>The people you name will be able to reach you here.</FieldDescription>
          <FieldError />
        </Field>
      </FieldGroup>

      <FormSection title="Where you live">
        <FieldGroup>
          <Field name="address">
            <FieldLabel>Primary residence</FieldLabel>
            <Input value={values.address} onChange={set("address")} placeholder="Street address, city, state, ZIP" />
            <FieldDescription>We’ll check this against your licence when it arrives.</FieldDescription>
          </Field>
          <Field name="ownOrRent" span={6}>
            <FieldLabel>Do you own or rent?</FieldLabel>
            <Select
              placeholder="Choose one"
              options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]}
              value={values.ownOrRent}
              onValueChange={(ownOrRent) => onChange({ ...values, ownOrRent })}
            />
          </Field>
        </FieldGroup>
      </FormSection>
    </Form>
  )
}
