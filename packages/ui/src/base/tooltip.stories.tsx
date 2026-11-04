import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Tooltip. */
const meta = {
  component: Tooltip,
  decorators: [(S) => <div className="flex min-h-32 items-center justify-center"><S /></div>],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}
