import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Collapsible. */
const meta = {
  component: Collapsible,
  render: (args) => (
    <Collapsible {...args} className="max-w-md">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">Toggle</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 text-sm">Pet care instructions · Digital accounts</CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

/* Open states live in single-story view only (R3-17): tagged "!autodocs" (literal tags; the
   indexer reads them statically), so a docs page never mounts an open popover, which can lock
   its scroll. */

export const Closed: Story = {}
export const Open: Story = { tags: ["!autodocs", "r3-17"], args: { defaultOpen: true } }
