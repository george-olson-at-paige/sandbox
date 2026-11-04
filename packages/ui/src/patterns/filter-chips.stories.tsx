import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import type { ListFilter } from "../lib/list-query"
import { FilterChips } from "./filter-chips"

/* FilterChips (R13-04): the applied filters on their own row, one chip per value (a date range is
   one chip, named by its preset when it is one), Clear all at the end; absent when nothing is set. */
type Row = { plan: string; created: string }
const filters: ListFilter<Row>[] = [
  { id: "plan", label: "Plan", multiple: true, options: [{ value: "direct", label: "Direct" }, { value: "trial", label: "Trial" }], match: (r, v) => v.includes(r.plan) },
  { kind: "date-range", id: "created", label: "Created", date: (r) => r.created },
]

function Harness({ initial }: { initial: Record<string, string[]> }) {
  const [values, setValues] = useState(initial)
  return (
    <div className="flex w-160 flex-col gap-2">
      <FilterChips filters={filters} values={values} onChange={setValues} today="2026-10-20" />
      <span data-testid="values" className="text-xs text-muted-foreground">
        {JSON.stringify(values)}
      </span>
    </div>
  )
}

const meta = {
  component: FilterChips,
  args: { filters: filters as ListFilter<unknown>[], values: {}, onChange: fn(), today: "2026-10-20" },
  tags: ["r13-04"],
} satisfies Meta<typeof FilterChips>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "Chips, then Clear all",
  render: () => <Harness initial={{ plan: ["direct", "trial"], created: ["2026-09-21..2026-10-20"] }} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("button", { name: "Remove filter Created: Last 30 days" })).toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Remove filter Plan: Trial" }))
    await expect(c.getByTestId("values")).toHaveTextContent('"plan":["direct"]')
    await userEvent.click(c.getByRole("button", { name: "Clear all" }))
    await expect(c.getByTestId("values")).toHaveTextContent("{}")
    await expect(c.queryByRole("group", { name: "Applied filters" })).toBeNull()
  },
}

export const CustomRange: Story = { name: "A custom range", render: () => <Harness initial={{ created: ["2026-01-05..2026-03-31"] }} /> }

export const None: Story = { name: "Nothing applied (absent)", render: () => <Harness initial={{}} /> }
