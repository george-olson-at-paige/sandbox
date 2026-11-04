import type { Meta, StoryObj } from "@storybook/react-vite"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { DisclosureTrigger } from "../actions/disclosure-trigger"

const meta = {
  component: Collapsible,
  render: (args) => (
    <Collapsible {...args} className="max-w-md">
      <CollapsibleTrigger>
        <DisclosureTrigger>Show 3 more</DisclosureTrigger>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 flex flex-col gap-2 text-sm text-card-foreground">
        <p>Pet care instructions</p>
        <p>Digital accounts</p>
        <p>Letters to loved ones</p>
      </CollapsibleContent>
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
