import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Grid } from "../../primitives/grid"
import { Stack } from "../../primitives/stack"
import { Card } from "./card"
import { Eyebrow } from "./eyebrow"
import { Formatted, type FormattedProps } from "./formatted"

/* Story values are obviously fake. `today` is fixed so the year logic doesn't move with the clock. */
const TODAY = "2026-10-31"

const meta = {
  component: Formatted,
  args: { kind: "count", value: 1234 },
  argTypes: {
    kind: { control: "select", options: ["count", "currency", "percent", "date", "datetime", "duration", "fileSize"] },
    tone: { control: "inline-radio", options: [undefined, "strong", "muted", "attention"] },
  },
  tags: ["r20-21", "r21-10"],
  parameters: {
    docs: {
      description: {
        component:
          "A count, an amount, a percent, a date, a date-time, a duration or a file size written the way the package writes them, inline. A thin element over `lib/format.ts`, `lib/metrics.ts` and `lib/file-kind.ts`: `count` (1,234; `compact` 12.4K), `currency` (integer cents: $30.00), `percent` (0–100 in, one decimal: 42.5%), `date` (Mar 4, 2026; `today` drops the year inside its year), `datetime` (UTC), `duration` (seconds: 3 min, 1 h 12 min), `fileSize` (bytes: 2.4 MB). A date, date-time or duration is a `<time dateTime>`; numbers are `tabular-nums` spans. A `title` carries the full value whenever the text is shortened. An unknown value shows a dash, never 0.",
      },
    },
  },
} satisfies Meta<typeof Formatted>

export default meta
type Story = StoryObj<typeof meta>

/** One of each kind with the value it was given. */
const KINDS: { label: string; raw: string; props: FormattedProps }[] = [
  { label: "Count", raw: "1234", props: { kind: "count", value: 1234 } },
  { label: "Count · compact", raw: "12400", props: { kind: "count", value: 12400, compact: true } },
  { label: "Currency", raw: "3000 (cents)", props: { kind: "currency", value: 3000 } },
  { label: "Currency · compact", raw: "1234500 (cents)", props: { kind: "currency", value: 1234500, compact: true } },
  { label: "Percent", raw: "42.5", props: { kind: "percent", value: 42.5 } },
  { label: "Date", raw: "2026-03-04", props: { kind: "date", value: "2026-03-04" } },
  { label: "Date · this year", raw: "2026-11-03, today 2026-10-31", props: { kind: "date", value: "2026-11-03", today: TODAY } },
  { label: "Date and time", raw: "2026-03-04T15:15:00Z", props: { kind: "datetime", value: "2026-03-04T15:15:00Z" } },
  { label: "Duration · minutes", raw: "180 (seconds)", props: { kind: "duration", value: 180 } },
  { label: "Duration · hours", raw: "4320 (seconds)", props: { kind: "duration", value: 4320 } },
  { label: "File size", raw: "2516582 (bytes)", props: { kind: "fileSize", value: 2516582 } },
  { label: "No value", raw: "null", props: { kind: "count", value: null } },
]

/** Every kind, with its value beside it. */
export const AllKinds: Story = {
  name: "All kinds",
  render: () => (
    <Grid minItemWidth="sm" gap="grid" className="max-w-4xl">
      {KINDS.map(({ label, raw, props }) => (
        <Stack key={label} gap={1}>
          <Eyebrow>{label}</Eyebrow>
          <span className="text-lg text-foreground-strong">
            <Formatted {...props} />
          </span>
          <code className="text-xs text-muted-foreground">{raw}</code>
        </Stack>
      ))}
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const of = (kind: string) => [...canvasElement.querySelectorAll<HTMLElement>(`[data-slot="formatted"][data-kind="${kind}"]`)]
    await expect(of("count")[0]).toHaveTextContent("1,234")
    await expect(of("count")[0]).toHaveClass("tabular-nums")
    await expect(of("count")[0].tagName).toBe("SPAN")
    // Compact: the short text, the exact count as the title.
    await expect(of("count")[1]).toHaveTextContent("12.4K")
    await expect(of("count")[1]).toHaveAttribute("title", "12,400")
    await expect(of("currency")[0]).toHaveTextContent("$30.00")
    await expect(of("currency")[1]).toHaveTextContent("$12.3K")
    await expect(of("currency")[1]).toHaveAttribute("title", "$12,345.00")
    await expect(of("percent")[0]).toHaveTextContent("42.5%")
    // Dates are <time> with the ISO form; this year's drops the year and titles the full date.
    await expect(of("date")[0].tagName).toBe("TIME")
    await expect(of("date")[0]).toHaveAttribute("datetime", "2026-03-04")
    await expect(of("date")[0]).toHaveTextContent("Mar 4, 2026")
    await expect(of("date")[1]).toHaveTextContent(/^Nov 3$/)
    await expect(of("date")[1]).toHaveAttribute("title", "Nov 3, 2026")
    await expect(of("datetime")[0].tagName).toBe("TIME")
    await expect(of("datetime")[0]).toHaveAttribute("datetime", "2026-03-04T15:15:00Z")
    await expect(of("datetime")[0]).toHaveTextContent("Mar 4, 2026, 3:15 PM UTC")
    await expect(of("duration")[0]).toHaveTextContent("3 min")
    await expect(of("duration")[0]).toHaveAttribute("title", "3 minutes")
    await expect(of("duration")[1]).toHaveTextContent("1 h 12 min")
    await expect(of("duration")[1]).toHaveAttribute("datetime", "PT1H12M")
    await expect(of("fileSize")[0]).toHaveTextContent("2.4 MB")
    await expect(of("fileSize")[0]).toHaveAttribute("title", "2,516,582 bytes")
    // No data is a dash and a spoken "No value", never 0.
    const none = canvasElement.querySelector('[data-state="empty"]')!
    await expect(none).toHaveTextContent("—No value")
    await expect(within(none as HTMLElement).getByText("No value")).toHaveClass("sr-only")
  },
}

/** Inline, taking the size and weight of the sentence around it. */
export const InASentence: Story = {
  name: "In a sentence",
  render: () => (
    <p className="max-w-prose text-base text-body-muted">
      Maya’s <strong className="font-semibold text-foreground-strong">Family plan</strong> renews on <Formatted kind="date" value="2026-11-03" today={TODAY} /> for{" "}
      <Formatted kind="currency" value={3000} />. They uploaded <Formatted kind="fileSize" value={2516582} /> of documents in the last <Formatted kind="duration" value={4320} />, and{" "}
      <Formatted kind="percent" value={42.5} /> of their checklist is done. <Formatted kind="count" value={12400} compact /> people have viewed it since <Formatted kind="datetime" value="2026-03-04T15:15:00Z" tone="muted" />.
    </p>
  ),
  play: async ({ canvasElement }) => {
    const p = canvasElement.querySelector("p")!
    await expect(p).toHaveTextContent("renews on Nov 3 for $30.00")
    await expect(p).toHaveTextContent("2.4 MB of documents in the last 1 h 12 min")
    await expect(p).toHaveTextContent("42.5% of their checklist")
    await expect(p.querySelectorAll("time")).toHaveLength(3)
  },
}

/** In a card: a label and its value on each line, the numbers lining up. */
export const InACard: Story = {
  name: "In a card",
  render: () => {
    const rows: [string, FormattedProps][] = [
      ["Plan price", { kind: "currency", value: 3000 }],
      ["Documents", { kind: "count", value: 128 }],
      ["Storage used", { kind: "fileSize", value: 52428800 }],
      ["Checklist done", { kind: "percent", value: 42.5 }],
      ["Last update", { kind: "date", value: "2026-10-12", today: TODAY }],
      ["Time in setup", { kind: "duration", value: 4320 }],
    ]
    return (
      <Card className="max-w-sm gap-3 px-6">
        <Eyebrow>Account summary</Eyebrow>
        <Stack gap={2}>
          {rows.map(([label, props]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <Formatted {...props} tone="strong" className="font-medium" />
            </div>
          ))}
        </Stack>
      </Card>
    )
  },
}

/** R21-10: the three tones side by side. `attention` is the attention ink only, for a value the page judges needs a look (the page sets the threshold: here, under 75%). */
export const Tones: Story = {
  tags: ["r21-10"],
  render: () => {
    const rates = [["Welcome", 88], ["Your people", 71], ["Getting in", 32]] as const
    return (
      <Stack gap={2} className="max-w-xs text-sm">
        {rates.map(([label, rate]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <Formatted kind="percent" value={rate} tone={rate < 75 ? "attention" : "strong"} className="font-semibold" />
          </div>
        ))}
        <span>
          <Formatted kind="count" value={30} tone="muted" /> stopped
        </span>
      </Stack>
    )
  },
  play: async ({ canvasElement }) => {
    const low = within(canvasElement).getByText("32%")
    const ok = within(canvasElement).getByText("88%")
    await expect(getComputedStyle(low).color).not.toBe(getComputedStyle(ok).color)
  },
}
