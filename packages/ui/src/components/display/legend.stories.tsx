import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Legend } from "./legend"

/* Legend (R21-09): swatches and labels for the marks in a bar or a column; the swatch's colour is
   the data colour the mark was drawn in, its shape the mark's. */
const meta = {
  component: Legend,
  args: {
    label: "Key",
    items: [
      { label: "Reached", color: "brand" },
      { label: "Most people’s time", color: "brand-subtle" },
      { label: "Median", color: "brand-ink", shape: "line" },
    ],
  },
  tags: ["r21-09"],
} satisfies Meta<typeof Legend>

export default meta
type Story = StoryObj<typeof meta>

/** A key above a table: a list named "Key"; the swatches are decoration, the labels the text. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Key" })
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3)
    await expect(list.querySelector('[data-shape="line"]')).toHaveAttribute("aria-hidden", "true")
  },
}

/** Under a ShareBar: dots, the body ink at 14px and each share's count. */
export const WithValues: Story = {
  name: "With values (sm)",
  args: {
    size: "sm",
    label: "What they did next",
    items: [
      { label: "On to the end", color: "brand", shape: "dot", value: 14 },
      { label: "Back a screen or more", color: "neutral", shape: "dot", value: 9 },
      { label: "Left Setup", color: "attention", shape: "dot", value: 30 },
    ],
  },
}

export const Shapes: Story = {
  args: {
    items: [
      { label: "Block", color: "brand" },
      { label: "Line", color: "brand-ink", shape: "line" },
      { label: "Dot", color: "attention", shape: "dot" },
      { label: "Series 2", color: "chart-2" },
      { label: "Series 3", color: "chart-3", shape: "dot" },
    ],
  },
}

/** At a phone's width the entries wrap. */
export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w375" } }, args: WithValues.args }
