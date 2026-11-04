import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { FieldFrame } from "../../stories/field-frame"
import { leave, typeKeys } from "../../stories/typing"
import { PasswordField } from "./password-field"

/* Story values are obviously fake. */
const meta = {
  component: PasswordField,
  args: { "aria-label": "Password" },
  argTypes: { autoComplete: { control: "select", options: ["current-password", "new-password"] } },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r5-02"],
  parameters: {
    docs: {
      description: {
        component:
          "A password on the Input chrome with a show/hide toggle (a FieldAction labelled `\"Show password\"` whether on or off; `aria-pressed` carries the state, R6-01). A click on the toggle keeps focus, caret and selection in the input. `autoComplete` is `\"current-password\"` (default, sign-in) or `\"new-password\"` (sign-up, change), nothing else. `name` sits on the input itself so password managers see it. No rules of its own (strength and match are the caller's). **Never log the value**, or put it in telemetry, URLs or error reports.",
      },
    },
  },
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "correct-horse-battery" } }
export const Revealed: Story = { args: { defaultValue: "correct-horse-battery", defaultRevealed: true } }
export const NewPassword: Story = { name: "New password (sign-up)", args: { autoComplete: "new-password", placeholder: "At least 12 characters" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "short", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "correct-horse-battery", disabled: true } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="Password" description="At least 12 characters." showValue={false}>
      {(wiring) => <PasswordField {...args} aria-label={undefined} autoComplete="new-password" {...wiring} />}
    </FieldFrame>
  ),
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing formatValue={() => "••••••••"} label="Account password" defaultValue="correct-horse-battery" onSave={() => {}} renderControl={(c) => <PasswordField autoComplete="new-password" {...c} />} />
    </div>
  ),
}

/* Typing, then the toggle: the text shows and hides, the caret and selection stay put, focus
   stays in the input. */
export const ToggleKeepsCaret: Story = {
  name: "Reveal keeps the caret",
  parameters: {
    docs: {
      description: {
        story:
          "Covers the restore (`useKeptSelection` in `field-support.tsx`) on a scripted click. Chrome's own quirk, the caret going back to 0 on the first layout after the input's `type` changes, only shows on a **real** click (GAPS #99), so this play passes with or without the forced layout that fixes it. By hand in Chrome: type, select a few characters, click the eye with the mouse, then again; the selection must stay both ways. Safari and Firefox not yet checked. The same check is in the spike README § By-hand checks.",
      },
    },
  },
  args: { onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText("Password") as HTMLInputElement
    await expect(input).toHaveAttribute("type", "password")
    await expect(input).toHaveAttribute("autocomplete", "current-password")
    await typeKeys(input, "correct-horse")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("correct-horse")
    input.setSelectionRange(3, 7)
    await userEvent.click(canvas.getByRole("button", { name: "Show password" }))
    // One label in both states (R6-01, GAPS #98); aria-pressed says which.
    const toggle = canvas.getByRole("button", { name: "Show password" })
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
    await expect(input).toHaveAttribute("type", "text")
    await expect(input).toHaveValue("correct-horse")
    await expect(input).toHaveFocus()
    await expect([input.selectionStart, input.selectionEnd]).toEqual([3, 7])
    await userEvent.click(toggle)
    await expect(input).toHaveAttribute("type", "password")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await expect([input.selectionStart, input.selectionEnd]).toEqual([3, 7])
    await leave(input)
  },
}
