import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { activeSubscribers, churnPercent, MONTH_LABELS, mrrCents, signups } from "../fixtures/admin"
import { formatMetric } from "../lib/metrics"
import { Grid } from "../primitives/grid"
import { KpiCard } from "./kpi-card"

/* KpiCard (R8-08): a Stat on a card. A row of them is a Grid on the page. */
const meta = {
  component: KpiCard,
  args: {
    label: "Active subscribers",
    window: "Last 12 months",
    value: 2333,
    format: { kind: "count" },
    delta: { previous: 1984, kind: "percent", basis: "level" },
    trend: { values: activeSubscribers },
  },
  decorators: [(S) => <div className="max-w-xs"><S /></div>],
  tags: ["r8-08"],
} satisfies Meta<typeof KpiCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** R21-05: one caption line under the card saying what the number counts; a share goes here, never as a second number beside the value. */
export const Caption: Story = {
  name: "Caption · a summary card",
  tags: ["r21-05"],
  args: { label: "Reached the end", window: "Last 7 days", value: 14, delta: undefined, trend: undefined, size: "compact", caption: "14% of those who started" },
  play: async ({ canvasElement }) => {
    const caption = canvasElement.querySelector<HTMLElement>('[data-slot="stat-caption"]')!
    await expect(caption).toHaveTextContent("14% of those who started")
    // One line: the value is alone on its line (no second figure beside it).
    await expect(canvasElement.querySelector('[data-slot="stat-value"]')).toHaveTextContent(/^14$/)
    await expect(caption.getBoundingClientRect().height).toBeLessThan(20)
  },
}
/** A caption under a full card: it comes last, so a row of cards keeps its deltas and sparklines aligned. */
export const CaptionFull: Story = { name: "Caption · with delta and trend", tags: ["r21-05"], args: { caption: "Paying or sponsored, on the last day" } }
export const CaptionLoading: Story = { name: "Caption · loading", tags: ["r21-05"], args: { loading: true, caption: "people saw Welcome" } }
export const Loading: Story = { args: { loading: true } }
/** R15-16: Stat's no-data state on a card: "—", the placeholder line and the "No data" pill. */
export const Empty: Story = {
  name: "No data",
  tags: ["r15-16"],
  args: { value: null, delta: { previous: null, kind: "percent", basis: "level" }, trend: { values: [] } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="stat-no-data-badge"]')).toHaveTextContent("No data")
    await expect(within(canvasElement).getByText("No data for this window")).toBeInTheDocument()
  },
}
export const Row: Story = {
  name: "A row of four (md)",
  decorators: [(S) => <div className="max-w-none"><S /></div>],
  render: () => (
    <Grid columns={{ base: 1, md: 2, xl: 4 }}>
      <KpiCard label="Active subscribers" window="Last 12 months" value={2333} format={{ kind: "count" }} delta={{ previous: 1984, kind: "net", basis: "level" }} trend={{ values: activeSubscribers }} />
      <KpiCard label="MRR" window="Last 12 months" value={mrrCents.at(-1)!} format={{ kind: "currency" }} delta={{ previous: mrrCents[0], kind: "percent", basis: "level" }} trend={{ values: mrrCents }} />
      <KpiCard label="Signups" window="Last 12 months" value={signups.slice(1).reduce((a, b) => a + b, 0)} format={{ kind: "count" }} delta={{ previous: 1890, kind: "percent" }} trend={{ values: signups.slice(1), variant: "bar", partialLast: true }} />
      <KpiCard label="Monthly churn" window="Last 12 months" value={churnPercent.at(-1)!} format={{ kind: "percent" }} delta={{ previous: churnPercent[0], kind: "points", basis: "level", good: "down" }} trend={{ values: churnPercent }} />
    </Grid>
  ),
}

/* R12-08: the three sizes side by side. lg for the home's first row (three across), compact for
   its second (five across: no window line, a small sparkline). */
export const Sizes: Story = {
  name: "Sizes: md, lg, compact",
  tags: ["r12-08"],
  decorators: [(S) => <div className="max-w-none"><S /></div>],
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <div className="w-64"><KpiCard {...args} /></div>
      <div className="w-80"><KpiCard {...args} size="lg" /></div>
      <div className="w-48"><KpiCard {...args} size="compact" /></div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="kpi-card"]')]
    await expect(cards.map((c) => c.dataset.size)).toEqual(["md", "lg", "compact"])
    await expect(within(cards[2]).getByText("Last 12 months")).toHaveClass("sr-only")
  },
}

/* R20-16: the detail a card keeps off the screen. Which figures belong here is Product's call
   (REVIEW-20 D-08); the story shows all three candidates from the Pulse fixtures. */
const COUNT = { kind: "count" } as const
const count = (n: number) => formatMetric(n, COUNT, { compact: false })
const lastThree = activeSubscribers.slice(-3).map((value, i) => ({ month: MONTH_LABELS.slice(-3)[i], value }))
const activeDetail = (
  <div className="flex flex-col gap-3">
    <table className="w-full text-sm tabular-nums">
      <caption className="sr-only">Active subscribers, the last three months and a year ago</caption>
      <tbody>
        {lastThree.map((row) => (
          <tr key={row.month}>
            <th scope="row" className="py-1 text-left font-normal text-muted-foreground">{row.month}</th>
            <td className="py-1 text-right font-medium text-card-foreground">{count(row.value)}</td>
          </tr>
        ))}
        <tr className="border-t">
          <th scope="row" className="py-1 text-left font-normal text-muted-foreground">A year ago ({MONTH_LABELS[0]})</th>
          <td className="py-1 text-right font-medium text-card-foreground">{count(activeSubscribers[0])}</td>
        </tr>
      </tbody>
    </table>
    <p className="text-sm text-muted-foreground">Subscribers on a paid plan that hasn’t ended, counted on the last day of the month.</p>
  </div>
)

/** The info button in the corner opens a hover card: the last three months, the same count a year ago and what the number means. It opens on hover and on keyboard focus, and the card itself stays as it was: nothing more on screen. */
export const WithDetail: Story = {
  name: "With detail",
  tags: ["r20-16", "play-fn"],
  args: { detail: activeDetail },
  decorators: [(S) => <div className="min-h-80"><S /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    // The card shows no detail until asked.
    await expect(canvas.queryByRole("table")).toBeNull()
    await userEvent.tab()
    const trigger = canvas.getByRole("button", { name: "Details for Active subscribers" })
    await expect(trigger).toHaveFocus()
    const table = await body.findByRole("table", { name: "Active subscribers, the last three months and a year ago" })
    await expect(within(table).getByRole("rowheader", { name: MONTH_LABELS.at(-1) })).toBeInTheDocument()
    await expect(within(table).getByRole("cell", { name: count(activeSubscribers.at(-1)!) })).toBeInTheDocument()
    await waitFor(() => expect(body.getByText(/counted on the last day of the month/)).toBeVisible())
    // Escape closes it, and the button keeps focus.
    await userEvent.keyboard("{Escape}")
    await expect(trigger).toHaveFocus()
  },
}

/** A card with no `detail` has no button: nothing extra to tab to. */
export const WithoutDetail: Story = {
  name: "Without detail · no button",
  tags: ["r20-16", "play-fn"],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).toBeNull()
  },
}
