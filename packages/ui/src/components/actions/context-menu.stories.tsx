import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fireEvent, fn, waitFor, within } from "storybook/test"
import { Eye, Pencil, PhoneCall, Trash2 } from "lucide-react"

import { ContextMenu, type ContextMenuEntry } from "./context-menu"

/* ContextMenu (S-41): the menu that opens where a person right-clicks, with DropdownMenu's typed
   entries and look. A shortcut only: whatever offers one also shows its ⋯ (useActionMenu). */

const opened = fn()
const items: ContextMenuEntry[] = [
  { kind: "link", label: "View David Reyes", icon: <Eye aria-hidden />, href: "#david" },
  { kind: "item", label: "Edit", icon: <Pencil aria-hidden />, onSelect: opened },
  { kind: "item", label: "Add a number", icon: <PhoneCall aria-hidden />, onSelect: fn() },
  { kind: "separator" },
  { kind: "item", label: "Delete David Reyes from People", icon: <Trash2 aria-hidden />, tone: "destructive", onSelect: fn() },
]

const meta = {
  component: ContextMenu,
  tags: ["s-41"],
  decorators: [(S) => <div className="min-h-80"><S /></div>],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Right-click the box: the entries open where you clicked. */
export const Default: Story = {
  args: {
    "aria-label": "Actions for David Reyes",
    items,
    children: <div className="flex h-36 w-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Right-click here</div>,
  },
}

/** Right-clicking the target opens the menu; choosing an entry runs it. */
export const Opens: Story = {
  name: "Right-click opens",
  args: Default.args,
  play: async ({ canvasElement }) => {
    opened.mockClear()
    const body = within(canvasElement.ownerDocument.body)
    fireEvent.contextMenu(within(canvasElement).getByText("Right-click here"))
    const menu = await body.findByRole("menu", { name: "Actions for David Reyes" })
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(items.filter((i) => i.kind === "item" || i.kind === "link").length)
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Edit" }))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
  },
}
