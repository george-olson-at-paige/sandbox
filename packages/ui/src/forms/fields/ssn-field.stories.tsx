import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, enter, leave, pasteText, typeKeys } from "../../stories/typing"
import { SsnField } from "./ssn-field"

/* Story values are the SSA's never-valid demo style or obviously fake; never a real number. */
const meta = {
  component: SsnField,
  args: { "aria-label": "Social Security number" },
  decorators: [(S) => <div className="max-w-60"><S /></div>],
  tags: ["r4-12", "r5-02"],
  parameters: {
    docs: {
      description: {
        component:
          "A US Social Security number. Shows `•••-••-6789` whenever it isn't focused; while focused the whole number shows only with `revealOnFocus` (otherwise typing shows dots for the first five digits too). The full number is never in the visible text while masked. The **Show SSN** toggle (a FieldAction, `aria-pressed`) shows the whole number until focus leaves the field, then masks it again; a click keeps the caret where it was. `reveal={false}` drops the toggle. `autocomplete=\"off\"` and password-manager opt-outs. Rejects incomplete and never-issued numbers on blur. **Value:** the nine digits (`\"123456789\"`) when complete, else `\"\"`. **Never log it**, or put it in telemetry, URLs or error reports.",
      },
    },
  },
} satisfies Meta<typeof SsnField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { name: "Filled (masked)", args: { defaultValue: "123456789" } }
export const Hidden: Story = { name: "Hidden (toggle off)", args: { defaultValue: "123456789" } }
export const Revealed: Story = {
  name: "Revealed (toggle on)",
  args: { defaultValue: "123456789" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show SSN" }))
  },
}
export const NoToggle: Story = { name: "Without the toggle", args: { defaultValue: "123456789", reveal: false } }
export const RevealOnFocus: Story = { name: "Reveal on focus", args: { defaultValue: "123456789", revealOnFocus: true } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "123456789", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "123456789", disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="Social Security number" description="Only the last four digits show." showValue={false}>
      {(wiring) => <SsnField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing formatValue={(v) => `•••-••-${v.slice(5)}`} label="Social Security number" defaultValue="123456789" onSave={() => {}} renderControl={(c) => <SsnField {...c} />} />
    </div>
  ),
}

/** Masked typing and paste. */
export const TypingAndPasting: Story = {
  name: "Masked typing and paste",
  args: { onValueChange: fn(), onValidate: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Social Security number" }) as HTMLInputElement
    await expect(input).toHaveAttribute("autocomplete", "off")
    await typeKeys(input, "1234")
    await expect(input).toHaveValue("•••-•")
    await typeKeys(input, "56789")
    await expect(input).toHaveValue("•••-••-6789")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("123456789")
    // Backspace over the second dot removes the second digit; typing puts it back.
    await typeKeys(input, "{Backspace}2", 2)
    await expect(args.onValueChange).toHaveBeenLastCalledWith("123456789")
    await expect(input.selectionStart).toBe(2)
    await clearText(input)
    await pasteText(input, "123-45-678")
    await leave(input)
    await expect(input).toHaveValue("•••-••-678")
    await expect(args.onValidate).toHaveBeenLastCalledWith("Enter all 9 digits of the Social Security number.")
  },
}

/* Reveal (R5-02): the toggle shows the whole number with the caret where it was, hides it again,
   and leaving the field masks it even if it was left revealed. */
export const RevealAndLeave: Story = {
  name: "Reveal · leaving masks it",
  parameters: {
    docs: {
      description: {
        story:
          "Covers the restore (`useKeptSelection` in `field-support.tsx`) on a scripted click. What a real click does to the caret when the text is rewritten (dots ↔ digits) isn't visible to a play (GAPS #99: Chrome resets it only on a trusted click). By hand in Chrome: put the caret mid-number, click the eye with the mouse, then again; the caret must stay on the same digit both ways. Safari and Firefox not yet checked. The same check is in the spike README § By-hand checks.",
      },
    },
  },
  args: { defaultValue: "123456789" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox", { name: "Social Security number" }) as HTMLInputElement
    await enter(input)
    input.setSelectionRange(5, 5)
    await userEvent.click(canvas.getByRole("button", { name: "Show SSN" }))
    await expect(input).toHaveValue("123-45-6789")
    // One label in both states (R6-01, GAPS #98); aria-pressed says which.
    await expect(canvas.getByRole("button", { name: "Show SSN" })).toHaveAttribute("aria-pressed", "true")
    await expect(input).toHaveFocus()
    await expect(input.selectionStart).toBe(5)
    await userEvent.click(canvas.getByRole("button", { name: "Show SSN" }))
    await expect(input).toHaveValue("•••-••-6789")
    await expect(input.selectionStart).toBe(5)
    await userEvent.click(canvas.getByRole("button", { name: "Show SSN" }))
    await leave(input)
    await expect(input).toHaveValue("•••-••-6789")
    await expect(canvas.getByRole("button", { name: "Show SSN" })).toHaveAttribute("aria-pressed", "false")
  },
}
