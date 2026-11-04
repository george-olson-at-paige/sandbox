import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { formatDateLong } from "../../lib/dates"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, leave, pasteText, typeKeys } from "../../stories/typing"
import { DateOfBirthField } from "./date-of-birth-field"

const meta = {
  component: DateOfBirthField,
  args: { "aria-label": "Date of birth" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r4-12"],
  parameters: {
    docs: {
      description: {
        component:
          "A date of birth, **typed, with no calendar** (paging a calendar back decades is the classic bad pattern). One input rather than month/day/year parts: the same parser as DateField (`4/5/52`, `04051952`, `April 5 1952`, `1952-04-05`), whole-date autofill (`autocomplete=\"bday\"`) and paste, one tab stop. Two-digit years are always in the past (`52` → 1952). Rejects a future date, and with `minAge`/`maxAge` an age outside the range, each with its own message through `onValidate`. Stays a typed input on touch too. **Value:** an ISO date string `\"YYYY-MM-DD\"`, or `\"\"`. Never a JS `Date`.",
      },
    },
  },
} satisfies Meta<typeof DateOfBirthField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "1952-04-05" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "1952-04-05", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "1952-04-05", disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="Date of birth" description="As it appears on your ID.">
      {(wiring) => <DateOfBirthField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const AgeRange: Story = {
  name: "Age range (18 or older)",
  args: { minAge: 18 },
  render: (args) => (
    <FieldFrame label="Executor’s date of birth" description="An executor must be 18 or older.">
      {(wiring) => <DateOfBirthField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing formatValue={(v) => formatDateLong(v)} label="Date of birth" defaultValue="1952-04-05" onSave={() => {}} renderControl={(c) => <DateOfBirthField {...c} />} />
    </div>
  ),
}

/* Typing, pasting, a future date and an age range. */
export const TypingAndPasting: Story = {
  name: "Typing · future and age",
  args: { minAge: 18, onValueChange: fn(), onValidate: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Date of birth" })
    await expect(input).toHaveAttribute("autocomplete", "bday")
    await typeKeys(input, "4/5/52")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("1952-04-05")
    await leave(input)
    await expect(input).toHaveValue("04/05/1952")
    await clearText(input)
    await pasteText(input, "April 5 1952")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("1952-04-05")
    await clearText(input)
    const next = new Date().getFullYear() + 1
    await typeKeys(input, `1/1/${next}`)
    await leave(input)
    await expect(args.onValidate).toHaveBeenLastCalledWith("A date of birth can’t be in the future.")
    await clearText(input)
    await typeKeys(input, `1/1/${next - 10}`)
    await leave(input)
    await expect(args.onValidate).toHaveBeenLastCalledWith("Enter a date of birth for someone 18 or older.")
    await expect(input).toHaveAttribute("aria-invalid", "true")
  },
}
