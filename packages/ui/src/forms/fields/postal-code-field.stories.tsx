import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, leave, pasteText, typeKeys } from "../../stories/typing"
import { PostalCodeField } from "./postal-code-field"

const meta = {
  component: PostalCodeField,
  args: { "aria-label": "ZIP code" },
  decorators: [(S) => <div className="max-w-60"><S /></div>],
  tags: ["r4-12"],
  parameters: {
    docs: {
      description: {
        component:
          "A US ZIP code: `12345`, or ZIP+4 `12345-6789` (the dash appears with the sixth digit). Paste and autofill in any shape; leading zeros kept. Numeric keypad, `autocomplete=\"postal-code\"`. **Value:** `\"12345\"` or `\"12345-6789\"` when complete, else `\"\"`.",
      },
    },
  },
} satisfies Meta<typeof PostalCodeField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "02134" } }
export const FilledPlus4: Story = { name: "Filled (ZIP+4)", args: { defaultValue: "02134-1234" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "02134", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "02134", disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="ZIP code" description="Five digits, or ZIP+4.">
      {(wiring) => <PostalCodeField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing label="ZIP code" defaultValue="02134" onSave={() => {}} renderControl={(c) => <PostalCodeField {...c} />} />
    </div>
  ),
}

/** Typing, caret and paste. */
export const TypingAndPasting: Story = {
  name: "Typing, caret and paste",
  args: { onValueChange: fn(), onValidate: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "ZIP code" }) as HTMLInputElement
    await expect(input).toHaveAttribute("inputmode", "numeric")
    await typeKeys(input, "02134")
    await expect(input).toHaveValue("02134")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("02134")
    await typeKeys(input, "1")
    await expect(input).toHaveValue("02134-1")
    await expect(input.selectionStart).toBe(7)
    await leave(input)
    await expect(args.onValidate).toHaveBeenLastCalledWith("Enter a 5-digit ZIP code, or ZIP+4.")
    await typeKeys(input, "{Backspace}", 7)
    await expect(input).toHaveValue("02134")
    await expect(args.onValidate).toHaveBeenLastCalledWith(undefined)
    await clearText(input)
    await pasteText(input, "021341234")
    await expect(input).toHaveValue("02134-1234")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("02134-1234")
  },
}
