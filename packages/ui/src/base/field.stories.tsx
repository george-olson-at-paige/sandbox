import type { Meta, StoryObj } from "@storybook/react-vite"

import { Checkbox } from "./checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field"
import { Input } from "./input"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Field. */
const meta = {
  component: Field,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="bf-name">Full legal name</FieldLabel>
      <Input id="bf-name" defaultValue="Maya Elena Reyes" />
      <FieldDescription>As it appears on your passport.</FieldDescription>
    </Field>
  ),
}

export const Error: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="bf-dob">Date of birth</FieldLabel>
      <Input id="bf-dob" aria-invalid defaultValue="31/02/1984" />
      <FieldError>That date doesn’t exist.</FieldError>
    </Field>
  ),
}

export const FieldSetWithChoices: Story = {
  name: "FieldSet · legend · checkbox",
  render: () => (
    <FieldSet>
      <FieldLegend>Who lives with you?</FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        <Field orientation="horizontal">
          <Checkbox id="bf-partner" defaultChecked />
          <FieldLabel htmlFor="bf-partner">A partner</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="bf-kids" aria-label="Children" />
          <FieldContent>
            <FieldTitle>Children</FieldTitle>
            <FieldDescription>Including step-children.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldSeparator>or</FieldSeparator>
    </FieldSet>
  ),
}
