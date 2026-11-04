import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Stack } from "../../primitives/stack"
import { Legend } from "./legend"
import { RangeBar } from "./range-bar"

/* RangeBar (R21-08): a spread on a shared scale at row size — the box (most people's time, the
   25th to 75th percentile), the median tick, the whisker to the 90th. Seconds on a 0–5 minute
   scale, from the Journeys fixture's Setup screens. */
const DOMAIN = [0, 300] as const
const meta = {
  component: RangeBar,
  args: { low: 13, high: 103, mark: 36, whisker: 376, domain: DOMAIN, summary: "Most people 13s to 1m 43s, median 36s, slowest 10% 6m 16s or longer" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r21-08"],
} satisfies Meta<typeof RangeBar>

export default meta
type Story = StoryObj<typeof meta>

/** One image named by its summary; the tick sits in the box at the median's share of the scale, and a whisker past the scale stops at its end. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: /median 36s/ })).toBeInTheDocument()
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="range-bar"]')!.getBoundingClientRect()
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="range-bar-box"]')!.getBoundingClientRect()
    const mark = canvasElement.querySelector<HTMLElement>('[data-slot="range-bar-mark"]')!.getBoundingClientRect()
    await expect(mark.left).toBeGreaterThan(box.left)
    await expect(mark.right).toBeLessThan(box.right)
    await expect(Math.abs((mark.left + mark.width / 2 - bar.left) / bar.width - 36 / 300)).toBeLessThan(0.02)
    const whisker = canvasElement.querySelector<HTMLElement>('[data-slot="range-bar-whisker"]')!.getBoundingClientRect()
    await expect(whisker.right).toBeLessThanOrEqual(bar.right + 1)
  },
}

export const NoWhisker: Story = { name: "No whisker", args: { whisker: undefined } }

const ROWS: [string, number, number, number, number][] = [
  ["Welcome", 6, 14, 49, 125],
  ["Your people", 13, 36, 103, 376],
  ["Getting in", 7, 8, 13, 36],
  ["What you’ve put in place", 12, 22, 65, 206],
]

/** A column of them on one scale, with the Legend that explains the marks. */
export const Column: Story = {
  render: () => (
    <Stack gap={3}>
      <Legend
        label="Key"
        items={[
          { label: "Most people’s time", color: "brand-subtle" },
          { label: "Median", color: "brand-ink", shape: "line" },
          { label: "Slowest 10%", color: "neutral", shape: "line" },
        ]}
      />
      {ROWS.map(([name, p25, p50, p75, p90]) => (
        <div key={name} className="grid grid-cols-2 items-center gap-3 text-sm">
          <span>{name}</span>
          <RangeBar low={p25} high={p75} mark={p50} whisker={p90} domain={DOMAIN} summary={`${name}: median ${p50}s`} />
        </div>
      ))}
    </Stack>
  ),
}
