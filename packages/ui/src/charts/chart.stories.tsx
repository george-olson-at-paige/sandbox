import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { activeSubscribers, MONTHS, mrrCents, signups } from "../fixtures/admin"
import { Chart } from "./chart"

/* Chart (R8-09): line and bar in the theme's series colours, a formatted axis and tooltip, and a
   hidden data table for screen readers. Pages use LazyChart (same props). */
const subscribers = MONTHS.map((month, i) => ({ month, active: activeSubscribers[i] }))
const perMonth = MONTHS.map((month, i) => ({ month, member: Math.round(signups[i] * 0.62), partner: signups[i] - Math.round(signups[i] * 0.62) }))
const revenue = MONTHS.map((month, i) => ({ month, mrr: mrrCents[i], target: 1_400_000 + i * 20_000 }))

const meta = {
  component: Chart,
  args: { kind: "line", data: subscribers, x: "month", series: [{ key: "active", label: "Active subscribers" }], format: { kind: "count" }, label: "Active subscribers at each month end, last 12 months" },
  decorators: [(S) => <div className="max-w-3xl rounded-xl border bg-card p-5"><S /></div>],
  tags: ["r8-09"],
} satisfies Meta<typeof Chart>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole("table", { name: /Active subscribers at each month end/ })
    await expect(within(table).getAllByRole("row")).toHaveLength(14)
    await expect(table).toHaveTextContent("2,333")
  },
}
export const Bar: Story = {
  name: "Bar, two series stacked",
  args: { kind: "bar", data: perMonth, series: [{ key: "member", label: "Member-billed" }, { key: "partner", label: "Partner-billed" }], stacked: true, label: "New subscribers per month by who is billed" },
}
export const Currency: Story = {
  name: "Line, currency, two series",
  args: { data: revenue, series: [{ key: "mrr", label: "MRR" }, { key: "target", label: "Plan", color: 3 }], format: { kind: "currency" }, label: "MRR against plan" },
}
export const Loading: Story = { args: { loading: true } }
export const Empty: Story = {
  name: "No data",
  args: { data: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("No data for this period")).toBeInTheDocument()
  },
}
