import type { Meta, StoryObj } from "@storybook/react-vite"

import { StepRail } from "./step-rail"

const meta = {
  component: StepRail,
  args: { step: 2, total: 6 },
  argTypes: { step: { control: { type: "range", min: 1, max: 6 } } },
} satisfies Meta<typeof StepRail>

export default meta
type Story = StoryObj<typeof meta>

export const First: Story = { name: "First step", args: { step: 1 } }
export const Middle: Story = { name: "Middle step", args: { step: 3 } }
export const Last: Story = { name: "Last step", args: { step: 6 } }
export const BeatLabel: Story = { name: "Beat label instead of count", args: { step: 4, label: "About you" } }
export const AllPositions: Story = {
  name: "Every position",
  render: () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5, 6].map((s) => <StepRail key={s} step={s} total={6} />)}
    </div>
  ),
}
