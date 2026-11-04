import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { InlineEdit } from "../inline-edit"
import { formatDateLong } from "../../lib/dates"
import { FieldFrame } from "../../stories/field-frame"
import { clearText, enter, leave, pasteText, typeKeys } from "../../stories/typing"
import { DateField } from "./date-field"

const meta = {
  component: DateField,
  args: { "aria-label": "Date signed", presentation: "typed" },
  argTypes: { presentation: { control: "select", options: ["auto", "typed", "native"] } },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r4-12"],
  parameters: {
    docs: {
      description: {
        component:
          "A calendar date. **Accepts** what people type, in the owner's locale order (en-US: `3/4/26`, `03042026`, `March 4 2026`, `4 Mar 2026`, `2026-03-04`; two-digit years land within 80 years back and 20 ahead), never reformats while typing, and rewrites to the locale format (`03/04/2026`) on blur. The calendar button (a FieldAction: muted icon, no chrome) or **Alt+Down** opens a calendar on the value or today, with month and year dropdowns and the WAI-ARIA grid keys (arrows, Home/End, PageUp/PageDown by month, Shift+PageUp/PageDown by year). `min`/`max` disable days outside the range. On touch it is the native date input. **Value:** an ISO date string `\"YYYY-MM-DD\"`, or `\"\"` while the text isn't a whole, real date inside the range. Never a JS `Date`. Errors come out through `onValidate` on blur or Enter for the Field's error slot. For a date of birth use DateOfBirthField.",
      },
    },
  },
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "2026-03-04" } }
export const Error: Story = { name: "Error (aria-invalid)", args: { defaultValue: "2026-03-04", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "2026-03-04", disabled: true } }
export const CalendarActionHover: Story = {
  name: "Calendar action · hover",
  tags: ["r5-03"],
  args: { defaultValue: "2026-03-04" },
  parameters: { pseudo: { hover: ["[data-slot=field-action]"] } },
}
export const Native: Story = { name: "Native (touch)", args: { presentation: "native", defaultValue: "2026-03-04" } }
/* R5-01: en-US is the only locale built and tested; this shows the plumbing still works. */
export const DayFirstLocale: Story = { name: "Locale en-GB (plumbing only, untested)", tags: ["r5-01"], args: { locale: "en-GB", defaultValue: "2026-03-04" } }

export const InField: Story = {
  name: "In a Field (label, description, error)",
  render: (args) => (
    <FieldFrame label="Date signed" description="The date on the last page of the will.">
      {(wiring) => <DateField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

export const MinMax: Story = {
  name: "Min and max",
  args: { min: "2026-01-01", max: "2026-12-31" },
  render: (args) => (
    <FieldFrame label="Review date" description="Any day in 2026.">
      {(wiring) => <DateField {...args} aria-label={undefined} {...wiring} />}
    </FieldFrame>
  ),
}

/* Single-story view only (R3-17): an open popover stays off the docs page. */
export const CalendarOpen: Story = {
  name: "Calendar open (min and max)",
  tags: ["!autodocs"],
  args: { defaultValue: "2026-03-04", min: "2026-03-02", max: "2026-03-27", open: true },
  decorators: [(S) => <div className="min-h-96"><S /></div>],
}

export const InInlineEdit: Story = {
  name: "In InlineEdit",
  render: () => (
    <div className="max-w-xl">
      <InlineEdit control="field" defaultEditing formatValue={(v) => formatDateLong(v)} label="Date signed" defaultValue="2026-03-04" onSave={() => {}} renderControl={(c) => <DateField presentation="typed" {...c} />} />
    </div>
  ),
}

/* Typing: short forms reformat on blur and report the ISO value; 2/30 is an error, not a date. */
export const TypingAndPasting: Story = {
  name: "Typing and pasting",
  args: { onValueChange: fn(), onValidate: fn() },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Date signed" })
    await typeKeys(input, "3/4/26")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-03-04")
    await expect(input).toHaveValue("3/4/26") // never reformatted while typing
    await leave(input)
    await expect(input).toHaveValue("03/04/2026")
    await clearText(input)
    await expect(args.onValueChange).toHaveBeenLastCalledWith("")
    await pasteText(input, "4 Mar 2026")
    await leave(input)
    await expect(input).toHaveValue("03/04/2026")
    await clearText(input)
    await typeKeys(input, "2/30/2026")
    await leave(input)
    await expect(args.onValidate).toHaveBeenLastCalledWith("Enter a real date, like " + new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()) + ".")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveValue("2/30/2026") // kept for fixing
  },
}

/* Keyboard: Alt+Down opens the calendar on the value, arrows move by day, Enter chooses, focus
   returns to the calendar button. */
export const CalendarKeyboard: Story = {
  name: "Calendar by keyboard",
  tags: ["!autodocs"],
  args: { defaultValue: "2026-03-04", onValueChange: fn() },
  decorators: [(S) => <div className="min-h-96"><S /></div>],
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Date signed" })
    await enter(input)
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}")
    const body = within(canvasElement.ownerDocument.body)
    const grid = await body.findByRole("grid")
    await waitFor(() => expect(grid.contains(canvasElement.ownerDocument.activeElement)).toBe(true))
    await userEvent.keyboard("{ArrowRight}{ArrowDown}{Enter}")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-03-12")
    await expect(input).toHaveValue("03/12/2026")
  },
}
