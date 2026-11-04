import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import type { ListFilter } from "../lib/list-query"
import { FiltersPopover } from "./filters-popover"

/* FiltersPopover (R13-06): one row per filter (a multi-select, a date range, a select), a draft
   until Apply; Reset empties the rows. */
type Row = { plan: string; status: string; lastActive: string | null; partner: string }
const filters: ListFilter<Row>[] = [
  {
    id: "plan",
    label: "Plan",
    multiple: true,
    placeholder: "Any plan",
    options: [
      { value: "direct", label: "Direct" },
      { value: "sponsored", label: "Sponsored" },
      { value: "trial", label: "Trial" },
    ],
    match: (r, v) => v.includes(r.plan),
  },
  {
    id: "status",
    label: "Status",
    multiple: true,
    placeholder: "Any status",
    options: [
      { value: "active", label: "Active" },
      { value: "past-due", label: "Past due" },
    ],
    match: (r, v) => v.includes(r.status),
  },
  { kind: "date-range", id: "lastActive", label: "Last active", date: (r) => r.lastActive },
  { id: "partner", label: "Partner", placeholder: "Any partner", options: [{ value: "cedar-trust", label: "Cedar Trust" }], match: (r, v) => v.includes(r.partner) },
]

function Harness({ initial = {} }: { initial?: Record<string, string[]> }) {
  const [values, setValues] = useState<Record<string, string[]>>(initial)
  return (
    <div className="flex flex-col gap-2">
      <FiltersPopover filters={filters} values={values} onApply={setValues} today="2026-10-20" />
      <span data-testid="values" className="text-xs text-muted-foreground">
        {JSON.stringify(values)}
      </span>
    </div>
  )
}

const meta = {
  component: FiltersPopover,
  args: { filters: filters as ListFilter<unknown>[], values: {}, onApply: fn(), today: "2026-10-20" },
  tags: ["r13-06"],
} satisfies Meta<typeof FiltersPopover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "Draft, Apply, Reset",
  render: () => <Harness initial={{ status: ["past-due"] }} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const values = c.getByTestId("values")
    await expect(c.getByRole("button", { name: /^Filters/ })).toHaveTextContent("1 applied")
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    const pop = await body.findByRole("dialog", { name: "Filters" })
    // Opens on what's applied.
    await expect(within(pop).getByRole("button", { name: "Status" })).toHaveTextContent("Past due")
    await userEvent.click(within(within(pop).getByRole("group", { name: "Last active" })).getByRole("button", { name: "Last 7 days" }))
    // Escape closes without applying.
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Filters" })).toBeNull())
    await expect(values).toHaveTextContent('{"status":["past-due"]}')
    // Again: Reset, then a preset, then Apply.
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    const again = await body.findByRole("dialog", { name: "Filters" })
    await userEvent.click(within(again).getByRole("button", { name: "Reset" }))
    await expect(within(again).getByRole("button", { name: "Status" })).toHaveTextContent("Any status")
    await userEvent.click(within(within(again).getByRole("group", { name: "Last active" })).getByRole("button", { name: "Last 7 days" }))
    await userEvent.click(within(again).getByRole("button", { name: "Apply" }))
    await expect(values).toHaveTextContent('{"lastActive":["2026-10-14..2026-10-20"]}')
  },
}

export const Open: Story = { tags: ["!autodocs"], render: () => <FiltersPopover filters={filters} values={{ plan: ["direct", "trial"] }} onApply={() => undefined} today="2026-10-20" defaultOpen /> }
