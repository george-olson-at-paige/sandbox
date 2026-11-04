import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Badge } from "../components/display/badge"
import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { Input } from "../components/inputs/input"

/* FieldLabel is the label inside a field (R1-17), in the eyebrow text style. */
const meta = {
  tags: ["r1-10", "gaps-30", "r8-04", "gaps-105", "r8-05", "gaps-106"],
  component: Field,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  argTypes: {
    name: { table: { disable: true } },
    id: { table: { disable: true } },
    span: { table: { disable: true } },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    label: { control: "text" },
    description: { control: "text" },
    errors: { control: "object" },
    required: { control: "boolean" },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A form field: label, control, description and error, wired together.",
          "",
          "### Anatomy",
          "",
          "- **Label.** A field uses a label. Pass `label`, or put a FieldLabel inside. Eyebrow: 12px, semibold, uppercase, 0.05em tracking, muted.",
          "- **Caption.** Pass `description`, or put a FieldDescription inside, under the control: 12px, medium, muted. Disabled fades the label and the caption, so the hint does not stay looking live.",
          "- **Error.** Pass `errors`, the messages under the control. CircleAlert leads each message. `required` adds “Enter a value.” `invalid` marks the field without a message of its own.",
          "- **Spacing.** Step 2 between the label and the control, including when the label sits beside it, and between the control, the caption, and the error. Those under the control are inset one step on each side. The error eases open. Horizontal centers the label on the control.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: "Full legal name",
    description: "As it appears on your passport or driver’s licence.",
    errors: [],
    required: false,
    invalid: false,
    disabled: false,
    orientation: "vertical",
  },
  render: ({ label, description, errors, required, invalid, disabled, orientation }) => (
    <Field
      id="f-name"
      label={label}
      description={description}
      errors={errors}
      required={required}
      invalid={invalid}
      disabled={disabled}
      orientation={orientation}
    >
      <Input value={required ? "" : "Maya Elena Reyes"} onChange={() => {}} />
    </Field>
  ),
}

export const Optional: Story = {
  name: "Optional marker (Badge xs)",
  render: () => (
    <Field id="f-pref">
      <FieldLabel>
        Preferred name
        <Badge tone="neutral" size="xs" className="ml-auto normal-case">Optional</Badge>
      </FieldLabel>
      <Input placeholder="What friends call you" />
    </Field>
  ),
}

export const Error: Story = {
  tags: ["r1-02"],
  render: () => (
    <Field id="f-dob" invalid>
      <FieldLabel>Date of birth</FieldLabel>
      <Input aria-invalid defaultValue="31/02/1984" />
      <FieldError>That date doesn’t exist. Check the day and month.</FieldError>
    </Field>
  ),
}

export const ErrorList: Story = {
  name: "Error (several messages)",
  render: () => (
    <Field id="f-email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input aria-invalid defaultValue="maya@" />
      <FieldError errors={[{ message: "Add the part after the @." }, { message: "We use this to sign you in." }]} />
    </Field>
  ),
}

/** Say why it is locked. The caption under the control is the usual place. Another element on the page can say it when the reason already lives there. */
export const Disabled: Story = {
  render: () => (
    <Field id="f-acc" disabled>
      <FieldLabel>Account email</FieldLabel>
      <Input disabled defaultValue="maya@example.com" />
      <FieldDescription>Change this from Settings.</FieldDescription>
    </Field>
  ),
}

/* R8-04: the description and error ids are in aria-describedby from the first render (the server
   HTML too), because Field finds its parts in its children while rendering. */
export const DescribedOnFirstRender: Story = {
  name: "Described from the first render",
  render: () => (
    <Field invalid>
      <FieldLabel>Email</FieldLabel>
      <Input defaultValue="maya@" />
      <FieldDescription>We send the sign-in link here.</FieldDescription>
      <FieldError>Enter an email address with a domain, like maya@example.com.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Email" })
    await expect(input).toHaveAccessibleDescription("We send the sign-in link here. Enter an email address with a domain, like maya@example.com.")
  },
}

/* R8-05: the Field owns the id. A control's own id is ignored (a dev-only console warning says to
   set it on Field), so the label still names the control; check:layers (FIELDID) flags it in source. */
export const ControlIdIgnored: Story = {
  name: "An id on the control is ignored",
  render: () => (
    <Field>
      <FieldLabel>Preferred name</FieldLabel>
      {/* check:layers FIELDID would flag this line outside a story that shows the footgun on purpose. */}
      <Input {...{ id: "preferred" }} placeholder="What friends call you" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Preferred name" })
    await expect(input).not.toHaveAttribute("id", "preferred")
  },
}
