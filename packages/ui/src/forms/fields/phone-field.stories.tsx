import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { PHONE_US, renderMask } from "../../lib/mask"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, leave, pasteText, typeKeys } from "../../stories/typing"
import { PhoneField } from "./phone-field"

const meta = {
  component: PhoneField,
  args: { "aria-label": "Mobile number" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r4-12"],
  parameters: {
    docs: {
      description: {
        component:
          "A US phone number, formatted as you type: `(555) 123-4567`. **Accepts** typing, paste and autofill in any shape (`+1 (555) 123-4567`, `5551234567`, `555.123.4567`); a leading country code 1 is dropped. The caret stays after the digit you typed, Backspace just after a separator deletes the digit before it, a full field ignores extra digits, and a half-typed number is kept. Phone keypad (`inputMode=\"tel\"`), `autocomplete=\"tel\"`. **Value:** E.164 (`\"+15551234567\"`) once complete, else `\"\"`.",
      },
    },
  },
} satisfies Meta<typeof PhoneField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "+15551234567" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "+15551234567", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "+15551234567", disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="Mobile number" description="The people you name will be able to reach you here.">
      {(wiring) => <PhoneField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing formatValue={(v) => renderMask(PHONE_US, v.replace(/^\+1/, "")).text} label="Mobile number" defaultValue="+15551234567" onSave={() => {}} renderControl={(c) => <PhoneField {...c} />} />
    </div>
  ),
}

/* Typing, a mid-number edit (the caret stays put), Backspace over a separator, and the paste shapes. */
export const TypingAndPasting: Story = {
  name: "Typing, caret and paste",
  args: { onValueChange: fn(), onValidate: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Mobile number" }) as HTMLInputElement
    await expect(input).toHaveAttribute("inputmode", "tel")
    await typeKeys(input, "555123")
    await expect(input).toHaveValue("(555) 123")
    await expect(input.selectionStart).toBe(9)
    // Insert a digit after "(555": the caret follows it, not the end.
    await typeKeys(input, "9", 4)
    await expect(input).toHaveValue("(555) 912-3")
    await expect(input.selectionStart).toBe(7)
    // Backspace just after ") " deletes the 5 before it.
    await typeKeys(input, "{Backspace}", 6)
    await expect(input).toHaveValue("(559) 123")
    await expect(input.selectionStart).toBe(3)
    await leave(input)
    await expect(args.onValidate).toHaveBeenLastCalledWith("Enter a 10-digit US phone number.")
    for (const pasted of ["+1 (555) 123-4567", "5551234567", "555.123.4567"]) {
      await clearText(input)
      await pasteText(input, pasted)
      await expect(input).toHaveValue("(555) 123-4567")
      await expect(args.onValueChange).toHaveBeenLastCalledWith("+15551234567")
    }
    await expect(args.onValidate).toHaveBeenLastCalledWith(undefined)
  },
}
