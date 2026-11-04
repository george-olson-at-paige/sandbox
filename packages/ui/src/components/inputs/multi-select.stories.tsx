import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { Field, FieldLabel } from "../../forms/field"
import { MultiSelect, type MultiSelectOption } from "./multi-select"

/* MultiSelect (R13-06): a checkbox list in a popover; the trigger shows what's chosen and, past
   one, how many. */
const plans: MultiSelectOption[] = [
  { value: "direct", label: "Direct" },
  { value: "sponsored", label: "Sponsored" },
  { value: "discounted", label: "Discounted" },
  { value: "free", label: "Free" },
  { value: "trial", label: "Trial" },
  { value: "no-plan", label: "No plan" },
  { value: "cancelled", label: "Cancelled" },
]

function Harness({ initial = [] }: { initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <div className="flex w-72 flex-col gap-2">
      <Field>
        <FieldLabel>Plan</FieldLabel>
        <MultiSelect options={plans} value={value} onValueChange={setValue} placeholder="Any plan" aria-label="Plan" />
      </Field>
      <span data-testid="value" className="text-xs text-muted-foreground">
        {JSON.stringify(value)}
      </span>
    </div>
  )
}

const meta = {
  component: MultiSelect,
  args: { options: plans, value: [], onValueChange: fn(), placeholder: "Any plan" },
  tags: ["r13-06"],
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "Choose several; the trigger counts them",
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = c.getByRole("button", { name: "Plan" })
    await expect(trigger).toHaveTextContent("Any plan")
    await userEvent.click(trigger)
    const list = await body.findByRole("group", { name: "Plan" })
    await userEvent.click(within(list).getByRole("checkbox", { name: "Trial" }))
    await expect(trigger).toHaveTextContent("Trial")
    await userEvent.click(within(list).getByRole("checkbox", { name: "Direct" }))
    // Option order, not click order; the count past one.
    await expect(c.getByTestId("value")).toHaveTextContent('["direct","trial"]')
    await expect(trigger).toHaveTextContent("Direct, Trial")
    await expect(trigger).toHaveTextContent("2 chosen")
    await userEvent.click(body.getByRole("button", { name: "Clear" }))
    await expect(c.getByTestId("value")).toHaveTextContent("[]")
    await userEvent.keyboard("{Escape}")
  },
}

export const ManyChosen: Story = { name: "Many chosen (truncated, counted)", render: () => <Harness initial={["direct", "sponsored", "discounted", "free"]} /> }

export const Bare: Story = { name: "Outside a Field (its own name)", args: { "aria-label": "Status", placeholder: "Any status" }, render: (args) => <div className="w-64"><MultiSelect {...args} /></div> }
