import type { Meta, StoryObj } from "@storybook/react-vite"
import { CalendarIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { expect, fn, userEvent, within } from "storybook/test"

import { FieldAction } from "./field-action"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"

const meta = {
  component: FieldAction,
  args: { "aria-label": "Show password", icon: <EyeIcon />, onClick: fn() },
  /* R11-06: the field's text is short enough to read whole; the long case is its own story
     (an input scrolls its text, so a long value is cut at the padding, before the icon). */
  decorators: [
    (S, { parameters }) => (
      <InputGroup className="max-w-sm">
        <InputGroupInput aria-label="Field" defaultValue={parameters.fieldValue ?? "correct horse"} />
        <InputGroupAddon align="inline-end">
          <S />
        </InputGroupAddon>
      </InputGroup>
    ),
  ],
  tags: ["r5-03", "u-02"],
  parameters: {
    docs: {
      description: {
        component:
          "The one icon action inside a field: PasswordField's and SsnField's show/hide, DateField's calendar, HeaderSearch's clear. A real `<button type=\"button\">` with a required `aria-label`; a 16px icon in a 24px hit area; no background, border, pill or hover fill; pointer cursor, and the icon goes from muted to the field's text colour on hover (pointer devices only). `pressed` sets `aria-pressed` for a toggle, whose label stays the same in both states (\"Show password\", pressed or not; R6-01). It sits in an InputGroup's trailing addon (U-02), which keeps the text clear of it.",
      },
    },
  },
} satisfies Meta<typeof FieldAction>

export default meta
type Story = StoryObj<typeof meta>

export const Rest: Story = {}
export const Hover: Story = { parameters: { pseudo: { hover: true } } }
export const Pressed: Story = { name: "Pressed (toggle on)", args: { pressed: true, "aria-label": "Show password", icon: <EyeOffIcon /> } }
export const Disabled: Story = { args: { disabled: true } }
/* A value longer than the field: it's cut where the input ends (8px before the addon), never under
   the icon; the caret scrolls it as you type. */
export const LongValue: Story = {
  name: "Long value (cut before the icon)",
  tags: ["r11-06"],
  parameters: { fieldValue: "A value much longer than the field stops before the icon and scrolls" },
}
export const Calendar: Story = { name: "Calendar (plain action)", args: { "aria-label": "Choose date", icon: <CalendarIcon /> } }

/** A real button. */
export const Clicks: Story = {
  name: "A real button",
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Show password" })
    await expect(button).toHaveAttribute("type", "button")
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
