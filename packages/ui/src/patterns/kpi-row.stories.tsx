import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { activeSubscribers, churnPercent, mrrCents, signups } from "../fixtures/admin"
import { KpiCard } from "./kpi-card"
import { KpiRow } from "./kpi-row"

/* KpiRow (R12-08): the admin home's two rows. Three `lg` cards across, then five `compact` ones
   (number, delta, a small sparkline; the window said once by the row's caption). Desktop-first:
   designed at 1280 and 1440, collapsing on narrower screens (3 → 1; 5 → 3 → 2). The cards a
   person sees are chosen later (not built). Story numbers are invented at the customer
   profile's scale. */
const trials = [64, 51, 88, 79, 74, 70, 82, 77, 71, 85, 80, 41]
const cancellations = [38, 41, 35, 47, 44, 40, 46, 43, 52, 49, 55, 27]
const pastDue = [31, 29, 34, 30, 28, 33, 27, 26, 30, 25, 24, 22, 21]
const failedRuns = [9, 7, 12, 6, 5, 8, 4, 6, 3, 5, 4, 2]
const sum = (vs: number[]) => vs.reduce((a, b) => a + b, 0)

function Three() {
  return (
    <KpiRow columns={3} label="Headline numbers">
      <KpiCard size="lg" label="Active subscribers" window="Last 12 months" value={2333} format={{ kind: "count" }} delta={{ previous: 1984, kind: "net", basis: "level" }} trend={{ values: activeSubscribers }} />
      <KpiCard size="lg" label="MRR" window="Last 12 months" value={mrrCents.at(-1)!} format={{ kind: "currency" }} delta={{ previous: mrrCents[0], kind: "percent", basis: "level" }} trend={{ values: mrrCents }} />
      <KpiCard size="lg" label="Signups" window="Last 12 months" value={sum(signups.slice(1))} format={{ kind: "count" }} delta={{ previous: 1890, kind: "percent" }} trend={{ values: signups.slice(1), variant: "bar", partialLast: true }} />
    </KpiRow>
  )
}
function Five() {
  return (
    <KpiRow columns={5} label="More numbers" caption="Last 12 months">
      <KpiCard size="compact" label="Monthly churn" window="Last 12 months" value={churnPercent.at(-1)!} format={{ kind: "percent" }} delta={{ previous: churnPercent[0], kind: "points", basis: "level", good: "down" }} trend={{ values: churnPercent }} />
      <KpiCard size="compact" label="Trials started" window="Last 12 months" value={sum(trials)} format={{ kind: "count" }} delta={{ previous: 790, kind: "percent" }} trend={{ values: trials, variant: "bar", partialLast: true }} />
      <KpiCard size="compact" label="Cancellations" window="Last 12 months" value={sum(cancellations)} format={{ kind: "count" }} delta={{ previous: 498, kind: "percent", good: "down" }} trend={{ values: cancellations, variant: "bar", partialLast: true }} />
      <KpiCard size="compact" label="Past due" window="Last 12 months" value={pastDue.at(-1)!} format={{ kind: "count" }} delta={{ previous: pastDue[0], kind: "net", basis: "level", good: "down" }} trend={{ values: pastDue }} />
      <KpiCard size="compact" label="Failed job runs" window="Last 12 months" value={sum(failedRuns)} format={{ kind: "count" }} delta={{ previous: 96, kind: "net", good: "down" }} trend={{ values: failedRuns, variant: "bar", partialLast: true }} />
    </KpiRow>
  )
}

const meta = {
  component: KpiRow,
  parameters: { layout: "fullscreen" },
  // The admin page's surface and gutter, so the white cards read as they do on a page.
  decorators: [(S) => <div data-surface="page" className="bg-surface-page p-6"><S /></div>],
  tags: ["r12-08"],
} satisfies Meta<typeof KpiRow>

export default meta
type Story = StoryObj<typeof meta>

/** One line of cards per row (read at the story's width). */
const oneLine = (row: HTMLElement) => new Set([...row.querySelectorAll<HTMLElement>('[data-slot="kpi-card"]')].map((el) => Math.round(el.getBoundingClientRect().top))).size

export const ThreeLarge: Story = {
  name: "Three lg (row 1)",
  args: { columns: 3, label: "Headline numbers", children: null },
  render: () => <Three />,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByRole("region", { name: "Headline numbers" })
    await expect(row.querySelectorAll('[data-slot="kpi-card"][data-size="lg"]')).toHaveLength(3)
    // The lg number is 40px; each card keeps its window line.
    await expect(getComputedStyle(row.querySelector('[data-slot="stat-value"]')!).fontSize).toBe("40px")
    await expect(within(row).getAllByText("Last 12 months")[0]).toBeVisible()
  },
}
export const FiveCompact: Story = {
  name: "Five compact (row 2)",
  args: { columns: 5, label: "More numbers", children: null },
  render: () => <Five />,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByRole("region", { name: "More numbers" })
    await expect(row.querySelectorAll('[data-slot="kpi-card"][data-size="compact"]')).toHaveLength(5)
    // No window line on a compact card (the caption says it once); screen readers still get it.
    const card = row.querySelector<HTMLElement>('[data-slot="kpi-card"]')!
    await expect(within(card).getByText("Last 12 months")).toHaveClass("sr-only")
    await expect(within(row).getByText("Last 12 months", { selector: "p" })).toBeVisible()
  },
}
export const BothRows: Story = {
  name: "Both rows (the admin home's top)",
  args: { columns: 3, label: "Headline numbers", children: null },
  render: () => (
    <div className="flex flex-col gap-section">
      <Three />
      <Five />
    </div>
  ),
}
export const BothAt1280: Story = {
  name: "Both rows at 1280",
  tags: ["!autodocs", "r13-14"],
  args: BothRows.args,
  render: BothRows.render,
  globals: { viewport: { value: "w1280" } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(oneLine(c.getByRole("region", { name: "Headline numbers" }))).toBe(1)
    await expect(oneLine(c.getByRole("region", { name: "More numbers" }))).toBe(1)
    // Compact level cards say the short comparison, whole (R13-14, GAPS #126).
    const more = c.getByRole("region", { name: "More numbers" })
    for (const el of within(more).getAllByText("vs 1y ago")) await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth)
    await expect(within(more).queryByText("vs a year ago")).toBeNull()
  },
}
export const BothAt1440: Story = { tags: ["!autodocs"], name: "Both rows at 1440", args: BothRows.args, render: BothRows.render, globals: { viewport: { value: "w1440" } }, play: BothAt1280.play }
export const Narrow: Story = {
  tags: ["!autodocs"],
  name: "Narrow (1024: 3 across, then 3 + 2)",
  args: BothRows.args,
  render: BothRows.render,
  globals: { viewport: { value: "w1024" } },
}
export const Loading: Story = {
  args: { columns: 5, label: "More numbers", caption: "Last 12 months", children: null },
  render: (args) => (
    <KpiRow {...args}>
      {Array.from({ length: 5 }, (_, i) => (
        <KpiCard key={i} size="compact" loading label="Loading" window="Last 12 months" value={null} format={{ kind: "count" }} trend={{ values: [] }} />
      ))}
    </KpiRow>
  ),
}
