import type { Meta, StoryObj } from "@storybook/react-vite"

import { Separator } from "./separator"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Separator. */
const meta = {
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-md text-sm">
      <p>Personal details</p>
      <Separator className="my-3" />
      <p>Where you live</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Vault</span>
      <Separator orientation="vertical" />
      <span>Setup</span>
    </div>
  ),
}
