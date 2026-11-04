import type { Meta, StoryObj } from "@storybook/react-vite"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./select"

/* Base = upstream shadcn, unedited (R1-20, R1-22). Paige code uses Components/Select. */
const meta = {
  component: Select,
  decorators: [(S) => <div className="min-h-72"><S /></div>],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/* Open states live in single-story view only (R3-17): tagged "!autodocs" (literal tags; the
   indexer reads them statically), so a docs page never mounts an open popover, which can lock
   its scroll. */

function Example({ open }: { open?: boolean }) {
  return (
    <Select defaultOpen={open}>
      <SelectTrigger className="w-56" aria-label="Relationship">
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Family</SelectLabel>
          <SelectItem value="spouse">Spouse or partner</SelectItem>
          <SelectItem value="child">Child</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const Closed: Story = { render: () => <Example /> }
export const Open: Story = { tags: ["!autodocs", "r3-17"], render: () => <Example open /> }
