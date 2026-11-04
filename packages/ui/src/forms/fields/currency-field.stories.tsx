import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { formatMoney } from "../../lib/mask"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, enter, leave, pasteText, typeKeys } from "../../stories/typing"
import { CurrencyField } from "./currency-field"

const meta = {
  component: CurrencyField,
  args: { "aria-label": "Monthly payment" },
  decorators: [(S) => <div className="max-w-60"><S /></div>],
  tags: ["r4-12"],
  parameters: {
    docs: {
      description: {
        component:
          "An amount of money. Plain text while you type (`1234.5`, no grouping commas to push the caret around), the money format on blur (`$1,234.50`). Paste is cleaned (`$1,234.50` → 1234.50); letters are ignored; digits past the currency's minor units are dropped; a minus only with `allowNegative`. USD by default (`currency`, `locale`). Decimal keypad. **Value:** an integer in minor units (cents: `123450`), or `null` when empty. Never a float.",
      },
    },
  },
} satisfies Meta<typeof CurrencyField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: 123450 } }
export const Negative: Story = { name: "Negative allowed", args: { defaultValue: -2500, allowNegative: true } }
export const Euro: Story = { name: "EUR, de-DE", args: { defaultValue: 123450, currency: "EUR", locale: "de-DE" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: 123450, "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: 123450, disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description)",
  render: (args) => (
    <FieldFrame label="Monthly payment" description="What you pay each month, before any discount.">
      {(wiring) => <CurrencyField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit
        control="field" defaultEditing formatValue={(v) => formatMoney(Number(v))}
        label="Monthly payment"
        defaultValue="123450"
        onSave={() => {}}
        onCancel={() => {}}
        renderControl={({ value, onValueChange, onValidate: _v, ...c }) => (
          <CurrencyField {...c} value={value === "" ? null : Number(value)} onValueChange={(m) => onValueChange(m === null ? "" : String(m))} />
        )}
      />
    </div>
  ),
}

/** Typing, caret and paste. */
export const TypingAndPasting: Story = {
  name: "Typing, caret and paste",
  args: { onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Monthly payment" }) as HTMLInputElement
    await expect(input).toHaveAttribute("inputmode", "decimal")
    await typeKeys(input, "1234.5")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(123450)
    await leave(input)
    await expect(input).toHaveValue("$1,234.50")
    await enter(input)
    await expect(input).toHaveValue("1234.50")
    // A letter typed mid-number is ignored and the caret stays.
    await typeKeys(input, "x", 2)
    await expect(input).toHaveValue("1234.50")
    await expect(input.selectionStart).toBe(2)
    await clearText(input)
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null)
    await pasteText(input, "$1,999.99")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(199999)
    await typeKeys(input, "-", 0)
    await expect(input).toHaveValue("1999.99") // negative not allowed here
  },
}
