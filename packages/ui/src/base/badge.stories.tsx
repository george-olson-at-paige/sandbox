import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "./badge"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Badge. */
const meta = {
  component: Badge,
  args: { children: "Badge" },
  argTypes: { variant: { control: "select", options: ["default", "secondary", "destructive", "outline", "ghost", "link"] } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((v) => (
        <Badge key={v} variant={v}>{v}</Badge>
      ))}
    </div>
  ),
}
