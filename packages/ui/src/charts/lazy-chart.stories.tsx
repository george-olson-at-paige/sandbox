import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"

import { activeSubscribers, MONTHS } from "../fixtures/admin"
import { LazyChart } from "./lazy-chart"

/* LazyChart (R8-06, R8-09): the entry pages use. The chart module and Recharts load when the
   chart first renders; a same-height skeleton holds the space meanwhile. */
const meta = {
  component: LazyChart,
  args: {
    kind: "line",
    data: MONTHS.map((month, i) => ({ month, active: activeSubscribers[i] })),
    x: "month",
    series: [{ key: "active", label: "Active subscribers" }],
    format: { kind: "count" },
    label: "Active subscribers, last 12 months",
  },
  decorators: [(S) => <div className="max-w-3xl rounded-xl border bg-card p-5"><S /></div>],
  tags: ["r8-06", "r8-09"],
} satisfies Meta<typeof LazyChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-slot="chart"][data-kind="line"]')).not.toBeNull())
    await expect(within(canvasElement).getByRole("table", { name: "Active subscribers, last 12 months" })).toBeInTheDocument()
  },
}
export const Loading: Story = { args: { loading: true } }
