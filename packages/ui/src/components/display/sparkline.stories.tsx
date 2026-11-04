import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { activeSubscribers, churnPercent, MONTH_LABELS, signups } from "../../fixtures/admin"
import { Sparkline } from "./sparkline"

/* Sparkline (R8-08): a trend at card size. No axes; the last point marked; a running period
   dashed (line) or outlined (bar); one accessible name that summarises the trend. */
const meta = {
  component: Sparkline,
  args: { values: activeSubscribers, summary: "Active subscribers, last 12 months: trending up, from 1,984 to 2,333." },
  decorators: [(S) => <div className="w-64 rounded-xl border bg-card p-4"><S /></div>],
  tags: ["r8-08"],
} satisfies Meta<typeof Sparkline>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: /trending up/ })).toBeInTheDocument()
  },
}
export const Bars: Story = {
  name: "Bars, last period running",
  args: { values: signups, variant: "bar", partialLast: true, labels: MONTH_LABELS.map((m, i) => `${m}: ${signups[i]}`), summary: "Signups per month; October still running." },
}
export const RunningPeriod: Story = { name: "Line, last period running", args: { values: [...activeSubscribers.slice(0, 12), 2290], partialLast: true } }
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["brand", "neutral", "better", "worse"] as const).map((tone) => (
        <div key={tone} className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="w-14">{tone}</span>
          <Sparkline tone={tone} values={churnPercent} summary={`Churn, ${tone}`} />
        </div>
      ))}
    </div>
  ),
}
export const Gaps: Story = { name: "Gaps (no data for two months)", args: { values: [12, 14, null, null, 18, 17, 21, 20], summary: "Two months missing." } }
export const Flat: Story = { args: { values: [40, 40, 40, 40, 40], summary: "Unchanged at 40." } }
export const Empty: Story = {
  name: "No data",
  args: { values: [], summary: "No data." },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "No data." })).toHaveAttribute("data-empty")
  },
}
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Sparkline key={size} size={size} values={activeSubscribers} summary={`Size ${size}`} />
      ))}
    </div>
  ),
}
