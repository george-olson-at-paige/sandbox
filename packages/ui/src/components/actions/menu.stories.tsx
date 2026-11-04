import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronDownIcon, CopyIcon, DownloadIcon, FileTextIcon, PencilIcon, Trash2Icon, UsersIcon } from "lucide-react"

import { StubLink } from "../../stories/fixtures"
import { Button } from "./button"
import { DropdownMenu } from "./dropdown-menu"
import { Menu, type MenuEntry } from "./menu"

/* Menu (R4-08): the list of entries itself, standalone in the page: real buttons and links in
   the tab order. DropdownMenu is the same entries in a popover (plus submenus). */
const noop = () => {}

const ACTIONS: MenuEntry[] = [
  { kind: "label", label: "Will" },
  { kind: "item", label: "Rename", icon: <PencilIcon />, shortcut: "F2", onSelect: noop },
  { kind: "item", label: "Duplicate", icon: <CopyIcon />, onSelect: noop },
  { kind: "link", label: "Open documents", icon: <FileTextIcon />, href: "#documents" },
  { kind: "item", label: "Share (no delegate yet)", icon: <UsersIcon />, onSelect: noop, disabled: true },
  { kind: "separator" },
  { kind: "item", label: "Delete", icon: <Trash2Icon />, onSelect: noop, tone: "destructive" },
]

const meta = {
  component: Menu,
  tags: ["r4-08"],
  args: { items: ACTIONS, linkAs: StubLink, "aria-label": "Will actions" },
  argTypes: { items: { control: false }, linkAs: { control: false } },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

export const Standalone: Story = {
  name: "Standalone, in a card",
  render: (args) => (
    <div className="max-w-xs rounded-lg border bg-card p-2">
      <Menu {...args} />
    </div>
  ),
}

export const OnMuted: Story = {
  name: "On a muted surface (relative hover)",
  tags: ["r4-01"],
  parameters: { pseudo: { hover: ['[data-slot="menu"] > button:nth-of-type(1)'] } },
  render: (args) => (
    <div className="max-w-xs rounded-lg bg-muted p-2">
      <Menu {...args} />
    </div>
  ),
}

function ToggleEntries() {
  const [sorted, setSorted] = useState("newest")
  const [archived, setArchived] = useState(false)
  const items: MenuEntry[] = [
    { kind: "radio-group", label: "Sort", value: sorted, onValueChange: setSorted, options: [{ value: "newest", label: "Newest first" }, { value: "name", label: "By name" }] },
    { kind: "separator" },
    { kind: "checkbox", label: "Show archived", checked: archived, onCheckedChange: setArchived },
    { kind: "item", label: "Export list", icon: <DownloadIcon />, onSelect: noop },
  ]
  return (
    <div className="max-w-xs rounded-lg border bg-card p-2">
      <Menu items={items} aria-label="List options" />
    </div>
  )
}
export const Toggles: Story = {
  name: "Toggle and choice entries (aria-pressed)",
  render: () => <ToggleEntries />,
}

export const SameEntriesInAPopover: Story = {
  name: "The same entries in a DropdownMenu",
  render: (args) => (
    <div className="flex min-h-80 items-start gap-8">
      <div className="w-56 shrink-0 rounded-lg border bg-card p-2">
        <Menu {...args} />
      </div>
      <DropdownMenu
        modal={false}
        linkAs={StubLink}
        items={ACTIONS}
        trigger={<Button variant="secondary" icon={<ChevronDownIcon />} iconPosition="end">Actions</Button>}
      />
    </div>
  ),
}
