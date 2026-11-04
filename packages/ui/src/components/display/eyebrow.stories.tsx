import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "./eyebrow"

/* Eyebrow (R1-17): the labelling text style for things that are not form labels: section
   labels, step labels, a page intro's kicker. Inside a form field use FieldLabel. */
const meta = {
  tags: ["r3-15"],
  component: Eyebrow,
  parameters: {
    docs: {
      description: {
        component:
          "`tone=\"area\"` takes its colour from CSS, not React: `text-area-ink` reads the `--area-ink` variable set by the nearest `[data-area=\"…\"]` ancestor (the Area page sets it on the page; these stories wrap it). With no `data-area` above it falls back to the neutral body ink.",
      },
    },
  },
  args: { children: "Step 2 of 6", tone: "muted" },
  argTypes: { tone: { control: "select", options: ["muted", "area", "primary"] } },
} satisfies Meta<typeof Eyebrow>

export default meta
type Story = StoryObj<typeof meta>

export const Muted: Story = {}
export const Area: Story = {
  name: "Area tone",
  tags: ["gaps-44"],
  args: { tone: "area", children: "Start here" },
  decorators: [(S) => <div data-area="family"><S /></div>],
}
/** Area tone · no data-area above (neutral fallback) */
export const AreaFallback: Story = {
  name: "Area tone · neutral fallback",
  args: { tone: "area", children: "Start here" },
}
export const AreaNested: Story = {
  name: "Area tone · the nearest data-area wins",
  render: () => (
    <div data-area="family" className="flex flex-col gap-2">
      <Eyebrow tone="area">Family</Eyebrow>
      <div data-area="money">
        <Eyebrow tone="area">Money, inside Family</Eyebrow>
      </div>
    </div>
  ),
}
export const Primary: Story = { args: { tone: "primary", children: "Your roles" } }
