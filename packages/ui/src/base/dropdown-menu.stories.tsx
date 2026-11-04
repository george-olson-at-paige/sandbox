import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/DropdownMenu, which
   exposes only item, label and separator. Upstream shadow-md compiles to nothing (GAPS #4). */
const meta = {
  component: DropdownMenu,
  decorators: [(S) => <div className="min-h-80"><S /></div>],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

/* Open states live in single-story view only (R3-17): tagged "!autodocs" (literal tags; the
   indexer reads them statically), so a docs page never mounts an open popover, which can lock
   its scroll. */

function Example({ open = false }: { open?: boolean }) {
  return (
    <DropdownMenu defaultOpen={open} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Views</DropdownMenuLabel>
        <DropdownMenuItem>Documents<DropdownMenuShortcut>12</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem disabled>Passwords</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked>Show pets</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent><DropdownMenuItem>Memories</DropdownMenuItem></DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Closed: Story = { render: () => <Example /> }
export const Open: Story = { tags: ["!autodocs", "r3-17"], render: () => <Example open /> }
