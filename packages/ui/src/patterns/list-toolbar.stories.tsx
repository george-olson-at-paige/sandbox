import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { typeKeys } from "../stories/typing"
import { FilterChips } from "./filter-chips"
import { ListToolbar, type ToolbarFilter } from "./list-toolbar"

/* ListToolbar (R12-10, R13-04/06): debounced search (Escape clears), the Filters popover with the
   applied count, then the status line and the result count at the right. The applied filters are
   FilterChips on their own row under it (as ListPage arranges them). */
type Row = { plan: string; partner: string; created: string }
const filters: ToolbarFilter<Row>[] = [
  {
    id: "plan",
    label: "Plan",
    multiple: true,
    placeholder: "Any plan",
    options: [
      { value: "direct", label: "Direct" },
      { value: "sponsored", label: "Sponsored" },
      { value: "free", label: "Free" },
    ],
    match: (r, v) => v.includes(r.plan),
  },
  { kind: "date-range", id: "created", label: "Created", date: (r) => r.created },
  {
    id: "partner",
    label: "Partner",
    placeholder: "Any partner",
    options: [
      { value: "cedar-trust", label: "Cedar Trust" },
      { value: "northwind", label: "Northwind Financial" },
    ],
    match: (r, v) => v.includes(r.partner),
  },
]

function Harness({ status }: { status?: string }) {
  const [q, setQ] = useState("")
  const [values, setValues] = useState<Record<string, string[]>>({})
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <ListToolbar
        search={{ value: q, onChange: setQ, label: "Search people", placeholder: "Search by name or email" }}
        filters={filters}
        values={values}
        onFiltersChange={setValues}
        count="150 people"
        status={status}
        today="2026-10-20"
      />
      <FilterChips filters={filters} values={values} onChange={setValues} today="2026-10-20" />
      <span data-testid="state" className="text-xs text-muted-foreground">
        q={JSON.stringify(q)} filters={JSON.stringify(values)}
      </span>
    </div>
  )
}

const meta = {
  component: ListToolbar,
  args: { search: { value: "", onChange: fn(), label: "Search" }, values: {}, onFiltersChange: fn(), count: "150 people", today: "2026-10-20" },
  tags: ["r12-10", "r13-04", "r13-06"],
} satisfies Meta<typeof ListToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const state = c.getByTestId("state")
    const search = c.getByRole("searchbox", { name: "Search people" })
    // Debounced: the page hears the search after the typing stops.
    await typeKeys(search, "smith")
    await expect(state).toHaveTextContent('q=""')
    await waitFor(() => expect(state).toHaveTextContent('q="smith"'))
    // Escape clears at once.
    await userEvent.keyboard("{Escape}")
    await expect(state).toHaveTextContent('q=""')
    // Filters: a popover, applied together.
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    const pop = await body.findByRole("dialog", { name: "Filters" })
    await userEvent.click(within(pop).getByRole("button", { name: "Plan" }))
    await userEvent.click(within(await body.findByRole("group", { name: "Plan" })).getByRole("checkbox", { name: "Free" }))
    await userEvent.keyboard("{Escape}")
    await userEvent.click(within(within(pop).getByRole("group", { name: "Created" })).getByRole("button", { name: "This year" }))
    await expect(state).toHaveTextContent("filters={}")
    await userEvent.click(within(pop).getByRole("button", { name: "Apply" }))
    await expect(state).toHaveTextContent('"plan":["free"]')
    await expect(state).toHaveTextContent('"created":["2026-01-01..2026-10-20"]')
    await expect(c.getByRole("button", { name: /^Filters/ })).toHaveTextContent("2 applied")
    // The chips: their own row; removing one, then Clear all.
    await userEvent.click(c.getByRole("button", { name: "Remove filter Plan: Free" }))
    await expect(state).not.toHaveTextContent('"plan"')
    await expect(c.getByRole("button", { name: "Remove filter Created: This year" })).toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Clear all" }))
    await expect(state).toHaveTextContent("filters={}")
    await expect(c.queryByRole("group", { name: "Applied filters" })).toBeNull()
  },
}

export const WithStatus: Story = { name: "An action's result in place", render: () => <Harness status="Verification email sent to Ada Park." /> }
