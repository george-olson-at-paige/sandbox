import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

/* Base = upstream shadcn, unedited (R1-22). No Paige code uses it yet: a Paige wrapper arrives
   in Round C (R20-15 / R20-16). */
const meta = {
  component: HoverCard,
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@paige</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold">@paige</h4>
          <p className="text-sm">Estate planning, kept in one place.</p>
          <span className="text-xs text-muted-foreground">Joined October 2026</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

/* Open state: single-story view only (R3-17). */
export const Open: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div className="flex min-h-48 items-start justify-center">
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <Button variant="link">@paige</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">A short card that opens when the trigger is hovered or focused.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
}
