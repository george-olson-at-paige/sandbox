import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu"

/* Base = upstream shadcn, unedited (R1-22). Added 2026-10-29 for right-click menus (S-41). Paige
   code uses Components/ContextMenu, which takes DropdownMenu's typed entries. */
const meta = {
  component: ContextMenu,
  decorators: [(S) => <div className="min-h-80"><S /></div>],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Right-click the box. */
export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-36 w-72 items-center justify-center rounded-md border border-dashed text-sm">Right-click here</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel>Views</ContextMenuLabel>
        <ContextMenuItem>Documents<ContextMenuShortcut>12</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled>Passwords</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
          <ContextMenuSubContent><ContextMenuItem>Memories</ContextMenuItem></ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem variant="destructive">Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}
