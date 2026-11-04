import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { ShareBar, type ShareSegment } from "./share-bar"

/* ShareBar (R21-13): how one whole splits, as one stacked bar and its Legend. The data is the
   Journeys fixture's "What they did next" after Getting in. */
const NEXT: ShareSegment[] = [
  { label: "On to the end", value: 14, color: "brand" },
  { label: "Back a screen or more", value: 9, color: "neutral" },
  { label: "Left Setup", value: 30, color: "attention" },
]

const meta = {
  component: ShareBar,
  args: { segments: NEXT, label: "What they did next" },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["r21-13"],
} satisfies Meta<typeof ShareBar>

export default meta
type Story = StoryObj<typeof meta>

/** Each segment is its share of the total; the legend names them with their counts and is what a screen reader reads. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const total = args.segments.reduce((a, s) => a + s.value, 0)
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="share-bar-track"]')!
    await expect(track).toHaveAttribute("aria-hidden", "true")
    const segs = canvasElement.querySelectorAll<HTMLElement>('[data-slot="share-bar-segment"]')
    await expect(segs).toHaveLength(args.segments.length)
    const left = segs[2]!.getBoundingClientRect().width / track.getBoundingClientRect().width
    await expect(Math.abs(left - 30 / total)).toBeLessThan(0.02)
    await expect(within(canvasElement).getByRole("list", { name: "What they did next" })).toHaveTextContent("Left Setup30")
  },
}

/** Four shares, one light. */
export const FourShares: Story = {
  name: "Four shares",
  args: {
    segments: [
      { label: "On to Who steps in", value: 56, color: "brand" },
      { label: "Back a screen or more", value: 36, color: "neutral" },
      { label: "Same screen again", value: 8, color: "brand-subtle" },
      { label: "Left Setup", value: 13, color: "attention" },
    ],
  },
}

/** Without the legend the bar names its shares itself. */
export const NoLegend: Story = {
  name: "No legend",
  args: { legend: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: /On to the end 14, Back a screen or more 9, Left Setup 30, of 53/ })).toBeInTheDocument()
  },
}

/** A whole bigger than the shown shares: the rest is the empty track. A zero share stays in the legend. */
export const PartOfTheWhole: Story = {
  name: "Part of the whole",
  args: { total: 80, segments: [...NEXT, { label: "Still on the screen", value: 0, color: "brand-subtle" }] },
}

/** At a phone's width the legend wraps under the bar. */
export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w375" } } }
