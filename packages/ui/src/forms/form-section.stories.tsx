import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { Field, FieldLabel } from "./field"
import { FieldGroup } from "./field-group"
import { FormSection } from "./form-section"

/* FormSection (R7-03, GAPS #50): the titled group of fields the setup prototype draws as an
   eyebrow with a rule. */
const meta = {
  component: FormSection,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["r7-03", "gaps-50"],
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

const fields = (
  <FieldGroup>
    <Field>
      <FieldLabel>Primary residence</FieldLabel>
      <Input placeholder="Street address, city, state, ZIP" />
    </Field>
    <Field span={6}>
      <FieldLabel>Do you own or rent?</FieldLabel>
      <Select placeholder="Choose one" options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]} />
    </Field>
  </FieldGroup>
)

export const Default: Story = {
  args: { title: "Where you live", children: fields },
}

/** For a page that is one form, as a setup step: more space around the heading and between rows. */
export const Roomy: Story = {
  args: {
    title: "Where you live",
    density: "roomy",
    children: (
      <FieldGroup density="roomy">
        <Field>
          <FieldLabel>Primary residence</FieldLabel>
          <Input placeholder="Street address, city, state, ZIP" />
        </Field>
        <Field span={6}>
          <FieldLabel>Do you own or rent?</FieldLabel>
          <Select placeholder="Choose one" options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]} />
        </Field>
      </FieldGroup>
    ),
  },
}

export const WithDescription: Story = {
  name: "With a description",
  args: { title: "Where you live", description: "We’ll check this against your licence when it arrives.", children: fields },
}
