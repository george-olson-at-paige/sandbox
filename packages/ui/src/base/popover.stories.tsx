import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/* Base = upstream shadcn, unedited (R1-22). Paige code reaches it through Components/DateField. */
const meta = {
  component: Popover,
  decorators: [(S) => <div className="flex min-h-32 items-center justify-center"><S /></div>],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent>Popover content</PopoverContent>
    </Popover>
  ),
}
