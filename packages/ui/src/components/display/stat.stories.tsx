import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { activeSubscribers, churnPercent, MONTH_LABELS, mrrCents, signups } from "../../fixtures/admin"
import { Stat } from "./stat"

/* Stat (R8-08): one number, one delta and one sparkline over one window. The delta's colour
   follows whether the change is good (`good`), not its sign. */
const meta = {
  component: Stat,
  args: {
    label: "Active subscribers",
    window: "Last 12 months",
    value: 2333,
    format: { kind: "count" },
    delta: { previous: 1984, kind: "percent", basis: "level" },
    trend: { values: activeSubscribers, labels: MONTH_LABELS },
  },
  decorators: [(S) => <div className="w-72"><S /></div>],
  tags: ["r8-08", "r11-07", "r12-05", "gaps-124", "r15-16"],
} satisfies Meta<typeof Stat>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const group = c.getByRole("group", { name: "Active subscribers" })
    await expect(group).toHaveTextContent("2,333")
    // R11-07: the visible delta is the number and the comparison on one line; the sentence is
    // for screen readers (and the tooltip). R12-05: a level says when it compares with.
    const delta = group.querySelector<HTMLElement>('[data-slot="stat-delta"]')!
    await expect(delta).toHaveAttribute("data-tone", "better")
    await expect(delta).toHaveAttribute("data-basis", "level")
    await expect(delta.querySelector("[aria-hidden]")).toHaveTextContent("+18%vs a year ago")
    await expect(delta.querySelector(".sr-only")).toHaveTextContent("Up 18% compared with a year ago, better")
    await expect(delta.getBoundingClientRect().height).toBeLessThan(24)
  },
}

/* A narrow card: the delta stays on one line (the comparison truncates before it wraps). */
export const Narrow: Story = {
  name: "Narrow (one line)",
  tags: ["r11-07"],
  decorators: [(S) => <div className="w-40"><S /></div>],
}
export const Currency: Story = {
  name: "Currency (compact, exact on hover)",
  args: { label: "MRR", value: mrrCents.at(-1)!, format: { kind: "currency" }, delta: { previous: mrrCents[0], kind: "net", basis: "level" }, trend: { values: mrrCents } },
  play: async ({ canvasElement }) => {
    const value = canvasElement.querySelector('[data-slot="stat-value"]')
    await expect(value).toHaveTextContent("$16.3K")
    await expect(value).toHaveAttribute("title", "$16,349")
  },
}
export const LowerIsBetter: Story = {
  name: "Lower is better (churn up reads worse)",
  args: { label: "Monthly churn", value: churnPercent.at(-1)!, format: { kind: "percent" }, delta: { previous: churnPercent[0], kind: "points", basis: "level", good: "down" }, trend: { values: churnPercent } },
  play: async ({ canvasElement }) => {
    const delta = canvasElement.querySelector('[data-slot="stat-delta"]')
    await expect(delta).toHaveTextContent("+1 pts")
    await expect(delta).toHaveAttribute("data-tone", "worse")
    await expect(delta).toHaveTextContent("worse")
  },
}
export const Flow: Story = {
  name: "A flow (bars, running month): vs prior",
  args: { label: "Signups", window: "Last 30 days", value: 176, delta: { previous: 181, kind: "percent" }, trend: { values: signups, variant: "bar", partialLast: true } },
  play: async ({ canvasElement }) => {
    const delta = canvasElement.querySelector<HTMLElement>('[data-slot="stat-delta"]')!
    await expect(delta).toHaveAttribute("data-basis", "flow")
    await expect(delta.querySelector("[aria-hidden]")).toHaveTextContent("vs prior")
    await expect(delta.querySelector(".sr-only")).toHaveTextContent("Down 2.8% compared with the previous 30 days")
  },
}
/* R12-05: a level over a window that isn't "Last N …" names its comparison date. */
export const LevelSince: Story = {
  name: "Level · vs a date",
  args: { window: "Year to date", delta: { previous: 2102, kind: "net", basis: "level", since: "Jan 1" } },
  play: async ({ canvasElement }) => {
    const delta = canvasElement.querySelector<HTMLElement>('[data-slot="stat-delta"]')!
    await expect(delta.querySelector("[aria-hidden]")).toHaveTextContent("+231vs Jan 1")
    await expect(delta.querySelector(".sr-only")).toHaveTextContent("Up 231 compared with Jan 1, better")
  },
}
export const NoComparison: Story = { name: "No earlier value", args: { delta: { previous: null, kind: "percent", basis: "level" } } }
export const Flat: Story = { args: { value: 2333, delta: { previous: 2333, kind: "percent" } } }
export const Large: Story = { args: { size: "lg" } }
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("group")).toHaveAttribute("aria-busy", "true")
  },
}
/** R15-16: a muted "—" in the value's place (never 0), a fixed placeholder line where the delta
    and sparkline go, and a "No data" pill on it; screen readers hear "No data for this window". */
export const Empty: Story = {
  name: "No data for the window",
  args: { value: null, delta: { previous: null, kind: "percent" }, trend: { values: [] } },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: "Active subscribers" })
    await expect(group).toHaveAttribute("data-state", "empty")
    const value = group.querySelector<HTMLElement>('[data-slot="stat-value"]')!
    await expect(value).toHaveTextContent("—")
    await expect(value).not.toHaveTextContent("0")
    await expect(within(group).getByText("No data for this window")).toHaveClass("sr-only")
    // The placeholder and the pill are decorative: hidden from screen readers, no sparkline image.
    const ghost = group.querySelector<HTMLElement>('[data-slot="stat-no-data"]')!
    await expect(ghost).toHaveAttribute("aria-hidden", "true")
    await expect(ghost.querySelector('[data-slot="stat-no-data-badge"]')).toHaveTextContent("No data")
    await expect(within(group).queryByRole("img")).toBeNull()
  },
}

/** R15-16: each size with data and without, side by side: the empty card keeps the ready card's
    height, so nothing shifts when data arrives. */
export const EmptyKeepsHeight: Story = {
  name: "No data · same height",
  decorators: [(S) => <div className="w-180"><S /></div>],
  render: (args) => (
    <div className="grid grid-cols-2 gap-6">
      {(["md", "lg", "compact"] as const).flatMap((size) => [
        <Stat key={`${size}-ready`} {...args} size={size} label={`Ready ${size}`} className="border border-divider p-3" />,
        <Stat key={`${size}-empty`} {...args} size={size} label={`Empty ${size}`} value={null} trend={{ values: [] }} delta={{ previous: null, kind: "percent", basis: "level" }} className="border border-divider p-3" />,
      ])}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    for (const size of ["md", "lg", "compact"]) {
      const ready = c.getByRole("group", { name: `Ready ${size}` }).getBoundingClientRect().height
      const empty = c.getByRole("group", { name: `Empty ${size}` }).getBoundingClientRect().height
      await expect(Math.abs(ready - empty)).toBeLessThanOrEqual(2)
    }
  },
}
