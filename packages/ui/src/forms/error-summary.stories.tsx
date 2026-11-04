import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Input } from "../components/inputs/input"
import { ErrorSummary } from "./error-summary"
import { Field, FieldError, FieldLabel } from "./field"

/* ErrorSummary (R7-03): Form renders it after a failed submit; shown here on its own. Each link
   moves focus into its field. */
const meta = {
  component: ErrorSummary,
  decorators: [(S) => <div className="flex max-w-xl flex-col gap-6"><S /></div>],
  tags: ["r7-03"],
} satisfies Meta<typeof ErrorSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { id: "es-name", message: "Enter your legal name." },
      { id: "es-mobile", message: "Enter all 10 digits of a US phone number." },
    ],
  },
  render: (args) => (
    <>
      <ErrorSummary {...args} />
      <Field id="es-name" invalid>
        <FieldLabel>Legal name</FieldLabel>
        <Input />
        <FieldError>Enter your legal name.</FieldError>
      </Field>
      <Field id="es-mobile" invalid>
        <FieldLabel>Mobile number</FieldLabel>
        <Input defaultValue="(555) 123" />
        <FieldError>Enter all 10 digits of a US phone number.</FieldError>
      </Field>
    </>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("link", { name: "Enter all 10 digits of a US phone number." }))
    await expect(c.getByRole("textbox", { name: "Mobile number" })).toHaveFocus()
  },
}

export const FormLevel: Story = {
  name: "Form-level error",
  args: { error: "We couldn’t save that. Your answers are still here; try again.", items: [] },
}

export const Unlinked: Story = {
  name: "An error with no field on screen",
  args: { items: [{ message: "This account can’t name more than four guardians." }] },
}
