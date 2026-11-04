import type { ComponentProps } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { Field, FieldLabel } from "./field"
import { FieldGroup } from "./field-group"
import { FieldLegend, FieldSet } from "./field-set"

/* FieldSet is a fieldset: related fields under one legend. */
type Args = ComponentProps<typeof FieldSet> & { appearance: "eyebrow" | "title" }

const meta = {
  component: FieldSet,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  args: { disabled: false, appearance: "eyebrow" },
  argTypes: {
    disabled: { control: "boolean" },
    appearance: {
      name: "legend",
      control: "inline-radio",
      options: ["eyebrow", "title"],
      table: { defaultValue: { summary: "eyebrow" } },
    },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A fieldset. The legend names the fields inside it, and disabling the set disables every control.",
          "",
          "The legend sits on a row with a rule centered on the type, then step 8 before the fields. A label beside a radio or checkbox is a Field.",
        ].join("\n"),
      },
    },
  },
  render: ({ disabled, appearance }) => (
    <FieldSet disabled={disabled}>
      <FieldLegend appearance={appearance}>Home address</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel>Street</FieldLabel>
          <Input defaultValue="1842 Grove Street" />
        </Field>
        <Field>
          <FieldLabel>City</FieldLabel>
          <Input defaultValue="Oakland" />
        </Field>
        <Field>
          <FieldLabel>State</FieldLabel>
          <Select presentation="native" defaultValue="CA" options={[{ value: "CA", label: "California" }, { value: "OR", label: "Oregon" }]} />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

/** The legend in the eyebrow style. It names the fields. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("group", { name: "Home address" })).toBeVisible()
  },
}

/** The legend at heading size. */
export const Title: Story = {
  name: "Heading-sized legend",
  args: { appearance: "title" },
}

/** The set is locked, so every field in it is too. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("textbox", { name: "Street" })).toBeDisabled()
  },
}
