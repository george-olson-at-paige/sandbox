import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Stack } from "../../primitives/stack"
import { MeterBar } from "./meter-bar"

/* MeterBar (R21-07): one quantity against its whole at row size, a `meter` for assistive tech.
   The Journeys table's "Reached" column: each screen's people against the 101 who started. */
const meta = {
  component: MeterBar,
  args: { value: 84, max: 101, label: "Reached Your people", showValue: true },
  argTypes: { color: { control: "select", options: ["brand", "brand-subtle", "attention", "neutral", "chart-2"] } },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r21-07"],
} satisfies Meta<typeof MeterBar>

export default meta
type Story = StoryObj<typeof meta>

/** The bar and its count; a screen reader hears "Reached Your people, 84 of 101". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole("meter", { name: "Reached Your people" })
    await expect(meter).toHaveAttribute("aria-valuetext", "84 of 101")
    await expect(meter).toHaveAttribute("aria-valuenow", "84")
    const fill = canvasElement.querySelector<HTMLElement>('[data-slot="meter-bar-fill"]')!
    const ratio = fill.getBoundingClientRect().width / meter.getBoundingClientRect().width
    await expect(Math.abs(ratio - 84 / 101)).toBeLessThan(0.02)
  },
}

export const BarOnly: Story = { name: "Bar only", args: { showValue: false } }

const SCREENS: [string, number][] = [
  ["Welcome", 101],
  ["About you", 89],
  ["Your people", 84],
  ["Getting in", 44],
  ["What you’ve put in place", 14],
]

/** Bars in a column share one whole, so their lengths compare. */
export const Column: Story = {
  render: () => (
    <Stack gap={2}>
      {SCREENS.map(([name, n]) => (
        <MeterBar key={name} value={n} max={101} label={`Reached ${name}`} showValue />
      ))}
    </Stack>
  ),
}

export const Colors: Story = {
  render: () => (
    <Stack gap={2}>
      {(["brand", "brand-subtle", "attention", "neutral", "chart-2"] as const).map((color) => (
        <MeterBar key={color} value={60} max={100} label={color} color={color} showValue />
      ))}
    </Stack>
  ),
}

/** No value: an empty track and a dash; a screen reader hears "no value", never 0. */
export const NoValue: Story = {
  name: "No value",
  args: { value: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "Reached Your people: no value" })).toBeInTheDocument()
    await expect(within(canvasElement).queryByRole("meter")).toBeNull()
  },
}

/** Over the whole (a data error upstream) the bar stops at full rather than overflowing the row. */
export const OverTheWhole: Story = { name: "Over the whole", args: { value: 130 } }
