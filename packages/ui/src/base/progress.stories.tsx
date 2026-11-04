import type { Meta, StoryObj } from "@storybook/react-vite"

import { Progress } from "./progress"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Progress. */
const meta = {
  component: Progress,
  args: { value: 40, "aria-label": "Progress" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
  decorators: [(S) => <div className="max-w-xs"><S /></div>],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
