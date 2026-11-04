import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  FolderInputIcon,
  KeyRoundIcon,
  PencilIcon,
  ScrollTextIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"

import { StubLink } from "../../stories/fixtures"
import { Button } from "./button"
import { DisclosureTrigger } from "./disclosure-trigger"
import { DropdownMenu, type DropdownMenuEntry } from "./dropdown-menu"

/* DropdownMenu (R1-25): a menu of actions. The entries are a typed union (item, link,
   checkbox, radio-group, sub, separator, label); the trigger is the caller's element. The
   popover look is shared with Select: compare them on Components/Select "Matches
   DropdownMenu". */
const noop = () => {}

const EVERY_KIND: DropdownMenuEntry[] = [
  { kind: "label", label: "Will" },
  { kind: "item", label: "Rename", icon: <PencilIcon />, shortcut: "F2", onSelect: noop },
  { kind: "item", label: "Duplicate", icon: <CopyIcon />, shortcut: "Ctrl+D", onSelect: noop },
  {
    kind: "sub",
    label: "Move to",
    icon: <FolderInputIcon />,
    items: [
      { kind: "item", label: "Personal", onSelect: noop },
      { kind: "item", label: "Family", onSelect: noop },
      { kind: "item", label: "Household", onSelect: noop },
    ],
  },
  { kind: "link", label: "Open documents", icon: <FileTextIcon />, href: "#documents" },
  { kind: "item", label: "Share (no delegate yet)", icon: <UsersIcon />, onSelect: noop, disabled: true },
  { kind: "separator" },
  { kind: "item", label: "Delete", icon: <Trash2Icon />, onSelect: noop, tone: "destructive" },
]

const meta = {
  tags: ["r3-17", "r1-18"],
  component: DropdownMenu,
  args: {
    trigger: <Button variant="secondary" icon={<ChevronDownIcon />} iconPosition="end">Actions</Button>,
    items: EVERY_KIND,
    linkAs: StubLink,
    modal: false,
    side: "bottom",
    align: "start",
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    trigger: { control: false },
    items: { control: false },
    linkAs: { control: false },
  },
  decorators: [(S) => <div className="flex min-h-96 items-start justify-center pt-4"><S /></div>],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

/* Open states live in single-story view only (R3-17): tagged "!autodocs" (literal tags; the
   indexer reads them statically), so a docs page never mounts an open popover, which can lock
   its scroll. */

export const Closed: Story = {}

export const EveryKind: Story = {
  tags: ["!autodocs"],
  name: "Every item kind · open",
  args: { defaultOpen: true },
}

/* Checkbox and radio items need state; the check sits where Select draws it. */
function ViewMenu(args: Partial<Story["args"]>) {
  const [showArchived, setShowArchived] = useState(true)
  const [showShared, setShowShared] = useState(false)
  const [sort, setSort] = useState("recent")
  return (
    <DropdownMenu
      {...args}
      trigger={<DisclosureTrigger tone="strong">View options</DisclosureTrigger>}
      items={[
        { kind: "checkbox", label: "Show archived", checked: showArchived, onCheckedChange: setShowArchived },
        { kind: "checkbox", label: "Show shared with me", checked: showShared, onCheckedChange: setShowShared },
        { kind: "separator" },
        {
          kind: "radio-group",
          label: "Sort by",
          value: sort,
          onValueChange: setSort,
          options: [
            { value: "recent", label: "Most recent" },
            { value: "name", label: "Name" },
            { value: "area", label: "Area" },
          ],
        },
      ]}
    />
  )
}

export const CheckboxAndRadio: Story = {
  tags: ["!autodocs"],
  name: "Checkbox and radio items · open",
  args: { defaultOpen: true },
  render: (args) => <ViewMenu {...args} />,
}

export const DisclosureTriggerMenu: Story = {
  name: "Disclosure trigger · open",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    trigger: <DisclosureTrigger>Browse everything</DisclosureTrigger>,
    items: [
      { kind: "label", label: "Views" },
      { kind: "link", label: "Will", icon: <ScrollTextIcon />, href: "#will" },
      { kind: "link", label: "Documents", icon: <FileTextIcon />, href: "#documents" },
      { kind: "link", label: "Contacts", icon: <UsersIcon />, href: "#contacts" },
      { kind: "link", label: "Passwords", icon: <KeyRoundIcon />, href: "#passwords", disabled: true },
    ],
  },
}

/* Direction overrides: use the side and align controls. */
export const SideTop: Story = { tags: ["!autodocs"], name: "Direction · side top, align end", args: { defaultOpen: true, side: "top", align: "end" }, decorators: [(S) => <div className="pt-80"><S /></div>] }
export const SideRight: Story = { tags: ["!autodocs"], name: "Direction · side right, align start", args: { defaultOpen: true, side: "right", align: "start" } }
export const AlignCenter: Story = { tags: ["!autodocs"], name: "Direction · side bottom, align center", args: { defaultOpen: true, align: "center" } }

const LONG: DropdownMenuEntry[] = Array.from({ length: 30 }, (_, i) => ({
  kind: "item" as const,
  label: `Document ${i + 1}`,
  icon: <FileTextIcon />,
  onSelect: noop,
}))

/** Long list (scrolls inside the available height) */
export const LongList: Story = {
  tags: ["!autodocs"],
  name: "Long list · scrolls",
  args: { defaultOpen: true, items: LONG },
}
