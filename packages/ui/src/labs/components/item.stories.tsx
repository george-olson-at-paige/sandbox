import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactElement } from "react"
import { fn } from "storybook/test"
import { Eye, Pencil, PhoneCall, Trash2, UserMinus } from "lucide-react"

import { Avatar } from "../../components/display/avatar"
import { ItemGroup } from "../../components/display/item"
import { Placeholder } from "../../stories/placeholder"
import { ACTION_ICONS, type ActionIcon } from "../icons/action-icons"
import { Item, ItemFrame } from "./item"

/* Labs › Components › Item (level 0, S-27). The Anatomy stories draw ItemFrame, the layout:
   the Item's bounds dashed and its padding tinted, each region a numbered placeholder (the docs
   page's legend names them). The rest are Item: one story per kind of actions, details, the
   activate hook, and the least an Item can be. */

/** Shows the Item's bounds (dashed) and its padding (the tint between the bounds and the regions). */
const bounds = (S: () => ReactElement) => (
  <div className="[&_[data-labs-item]]:bg-accent [&_[data-labs-item]]:outline-1 [&_[data-labs-item]]:outline-dashed [&_[data-labs-item]]:outline-border">
    <S />
  </div>
)

const david = (
  <span aria-hidden className="flex">
    <Avatar name="David Reyes" size="md" />
  </span>
)

const meta = {
  component: Item,
  tags: ["level-0", "!autodocs"],
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

/** The layout: the Item's bounds dashed and padding tinted, every region a numbered placeholder in its place. */
export const Anatomy: Story = {
  args: { title: "" },
  decorators: [bounds],
  render: () => (
    <ItemFrame
      media={<Placeholder size="sm" label="1" className="w-10 px-0" />}
      title={<Placeholder size="xs" label="2 · title" className="w-36" />}
      description={<Placeholder size="xs" label="3 · description" className="w-52" />}
      details={<Placeholder size="sm" label="4 · details" className="w-72" />}
      actions={<Placeholder size="sm" label="5 · actions" className="w-32" />}
      footer={<Placeholder size="sm" label="6 · footer" />}
    />
  ),
}

/** Absent regions take no space: title and actions only. */
export const AnatomyTitleOnly: Story = {
  name: "Anatomy · title and actions",
  args: { title: "" },
  decorators: [bounds],
  render: () => (
    <ItemFrame
      title={<Placeholder size="xs" label="2 · title" className="w-36" />}
      actions={<Placeholder size="sm" label="5 · actions" className="w-32" />}
    />
  ),
}

/** Actions as one button. */
export const ActionsButton: Story = {
  name: "Actions · button",
  args: { media: david, title: "David Reyes", description: "Spouse", actions: { kind: "button", label: "Invite", onClick: fn() } },
}

/** Actions as a blue text button: for an action an icon wouldn't say clearly enough. */
export const ActionsText: Story = {
  name: "Actions · text button",
  args: { media: david, title: "David Reyes", description: "Spouse", actions: { kind: "button", label: "Add a number", emphasis: "text", onClick: fn() } },
}

/** Actions as a link to the thing's own page: the open chevron. */
export const ActionsLink: Story = {
  name: "Actions · link",
  args: { media: david, title: "David Reyes", description: "Spouse", actions: { kind: "link", href: "#david", label: "Open David Reyes" } },
}

/** Actions as icon buttons, in order: each names an action and Item draws its icon. Muted until the Item is hovered or focused (with a mouse); full on touch. */
export const ActionsIcons: Story = {
  name: "Actions · icons",
  args: {
    media: david,
    title: "David Reyes",
    description: "Spouse",
    actions: {
      kind: "icons",
      items: [
        { action: "edit", label: "Edit David Reyes", onClick: fn() },
        { action: "remove", label: "Remove David Reyes", onClick: fn() },
      ],
    },
  },
}

const PEOPLE = [
  ["David Reyes", "Spouse"],
  ["Elena Reyes", "Child"],
  ["Marta Ortiz", "Parent"],
] as const

/** Three Items in a group: the icons stay quiet until you reach an Item, so the names read first. Hover one. */
export const ActionsIconsInAGroup: Story = {
  name: "Actions · icons in a group",
  args: { title: "" },
  render: () => (
    <ItemGroup label="Your people">
      {PEOPLE.map(([name, kin]) => (
        <Item
          key={name}
          media={<span aria-hidden className="flex"><Avatar name={name} size="md" /></span>}
          title={name}
          description={kin}
          actions={{ kind: "icons", items: [{ action: "edit", label: `Edit ${name}`, onClick: fn() }, { action: "remove", label: `Remove ${name}`, onClick: fn() }] }}
        />
      ))}
    </ItemGroup>
  ),
}

/** Every action icon, named by its action (Labs › Icons › action-icons.ts): the same action always has the same icon. An Item shows two at most; more go in a menu. */
export const ActionIcons: Story = {
  name: "Action icons",
  args: { title: "" },
  render: () => (
    <ul className="flex flex-wrap gap-6 text-sm text-muted-foreground">
      {(Object.keys(ACTION_ICONS) as ActionIcon[]).map((action) => {
        const Icon = ACTION_ICONS[action]
        return (
          <li key={action} className="flex flex-col items-center gap-1.5">
            <Icon aria-hidden className="size-4 text-foreground" />
            {action}
          </li>
        )
      })}
    </ul>
  ),
}

/** Details add lines under the description; the actions stay centred on the title and description. */
export const WithDetails: Story = {
  name: "With details",
  args: {
    media: david,
    title: "David Reyes",
    description: "Spouse",
    details: (
      <a href="tel:+12065550192" className="w-fit rounded-sm font-semibold text-primary focus-ring hover:underline">
        (206) 555-0192
      </a>
    ),
    actions: { kind: "link", href: "#david", label: "Open David Reyes" },
  },
}

/** Context: why it is here, where the place has a purpose for saying so (a role on a mixed list). Plain text after the description. Its actions are a menu: a ⋯ instead of the chevron, never both; right-click the Item for the same menu. */
export const WithContext: Story = {
  name: "With context",
  args: {
    media: david,
    title: "David Reyes",
    description: "Spouse",
    context: "Emergency contact",
    details: (
      <a href="tel:+12065550192" className="w-fit rounded-sm font-semibold text-primary focus-ring hover:underline">
        (206) 555-0192
      </a>
    ),
    actions: {
      kind: "menu",
      label: "Actions for David Reyes",
      actions: [
        { id: "open", kind: "link", label: "View David Reyes", icon: <Eye aria-hidden />, href: "#david" },
        { id: "edit", kind: "action", label: "Edit", icon: <Pencil aria-hidden />, run: fn() },
        { id: "number", kind: "action", label: "Add a number", icon: <PhoneCall aria-hidden />, run: fn() },
        // Rule 6's wording (ADR 0076 amendment). Take off can be undone (struck, with Undo), so no
        // confirm; delete can't, so RowActions confirms it and draws it red. Confirm copy: placeholder.
        { id: "take-off", kind: "action", label: "Take David Reyes off this list", icon: <UserMinus aria-hidden />, run: fn() },
        {
          id: "delete",
          kind: "destructive",
          irreversible: true,
          label: "Delete David Reyes from People",
          icon: <Trash2 aria-hidden />,
          confirm: { title: "Delete David Reyes from People?", confirmLabel: "Delete" },
          run: fn(),
        },
      ],
    },
  },
}

/** The footer as the decline: ink, underlined, under the title; the way out, never beside the actions. */
export const FooterDecline: Story = {
  name: "Footer · decline",
  args: {
    media: david,
    title: "David Reyes",
    description: "Spouse",
    actions: { kind: "button", label: "Confirm", emphasis: "text", onClick: fn() },
    footer: { kind: "decline", label: "Not this person", onClick: fn() },
  },
}

/** With `hooks.onActivate`, the title is the Item's control and the whole Item is its target; actions stay their own. */
export const Activates: Story = {
  args: {
    title: "Last will and testament",
    description: "Signed 2024 · 6 pages",
    actions: { kind: "button", label: "Share", onClick: fn() },
    hooks: { onActivate: fn() },
  },
}

/** The least an Item can be: a title. */
export const TitleOnly: Story = { name: "Title only", args: { title: "Last will and testament" } }
