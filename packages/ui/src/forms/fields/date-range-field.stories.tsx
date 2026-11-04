import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import type { DateRange } from "../../lib/date-range"
import { typeKeys, leave } from "../../stories/typing"
import { Field, FieldDescription, FieldLabel } from "../field"
import { DateRangeField } from "./date-range-field"

/* DateRangeField (R13-06): presets (last 7, 30, 90 days, this year) or two dates, each typed or
   picked from its calendar (the native date input on touch, R3-16). The value is { from, to } in
   ISO dates; either side may be open. Today is pinned to 2026-10-20 here. */
const TODAY = "2026-10-20"

function Harness({ initial = { from: "", to: "" } }: { initial?: DateRange }) {
  const [value, setValue] = useState<DateRange>(initial)
  return (
    <div className="flex w-96 flex-col gap-2">
      <Field>
        <FieldLabel>Last active</FieldLabel>
        <DateRangeField value={value} onValueChange={setValue} today={TODAY} />
        <FieldDescription>Either date can be left open.</FieldDescription>
      </Field>
      <span data-testid="value" className="text-xs text-muted-foreground">
        {JSON.stringify(value)}
      </span>
    </div>
  )
}

const meta = {
  component: DateRangeField,
  args: { value: { from: "", to: "" }, onValueChange: fn(), today: TODAY },
  tags: ["r13-06"],
} satisfies Meta<typeof DateRangeField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "A preset, then dates typed",
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const group = c.getByRole("group", { name: "Last active" })
    const value = c.getByTestId("value")
    await userEvent.click(within(group).getByRole("button", { name: "Last 30 days" }))
    await expect(value).toHaveTextContent('{"from":"2026-09-21","to":"2026-10-20"}')
    await expect(within(group).getByRole("button", { name: "Last 30 days" })).toHaveAttribute("aria-pressed", "true")
    // Pressing it again clears.
    await userEvent.click(within(group).getByRole("button", { name: "Last 30 days" }))
    await expect(value).toHaveTextContent('{"from":"","to":""}')
    // Typed dates; the preset pills stay unpressed for a custom range.
    const from = within(group).getByRole("textbox", { name: "From" })
    await typeKeys(from, "1/5/26")
    await leave(from)
    await waitFor(() => expect(value).toHaveTextContent('"from":"2026-01-05"'))
    await expect(within(group).getByRole("button", { name: "This year" })).toHaveAttribute("aria-pressed", "false")
  },
}

export const ToBeforeFrom: Story = {
  name: "To before From: the field says so",
  render: () => <Harness initial={{ from: "2026-03-01", to: "" }} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const to = c.getByRole("textbox", { name: "To" })
    await typeKeys(to, "2/1/26")
    await leave(to)
    await waitFor(() => expect(to).toHaveAttribute("aria-invalid", "true"))
    await expect(c.getByTestId("value")).toHaveTextContent('"to":""')
  },
}

export const Set: Story = { name: "A set range", render: () => <Harness initial={{ from: "2026-01-05", to: "2026-03-31" }} /> }

export const NoPresets: Story = { name: "Without presets", args: { presets: false, "aria-label": "Created" }, render: (args) => <div className="w-96"><DateRangeField {...args} /></div> }
