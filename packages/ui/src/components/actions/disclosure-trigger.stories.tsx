import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileText, ScrollText, Users } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../display/collapsible"
import { DisclosureTrigger } from "./disclosure-trigger"
import { DropdownMenu } from "./dropdown-menu"

/* DisclosureTrigger (R1-18): text that opens something. A real <button>; the chevron turns
   when the Collapsible or DropdownMenu it triggers is open. */
const meta = {
  tags: ["r3-14"],
  component: DisclosureTrigger,
  args: { children: "Show 3 more", tone: "primary" },
  argTypes: { tone: { control: "select", options: ["primary", "muted", "strong"] } },
  decorators: [(S) => <div className="min-h-56"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          "A real `<button>` that reads as text with a chevron. It triggers anything that opens below it: wrap it in `CollapsibleTrigger` for show more / show less, or pass it as a DropdownMenu's `trigger` for a menu. The chevron turns when what it opens is open (Radix sets `data-state`, and `aria-expanded` for screen readers). It is its own component because both Collapsible and DropdownMenu use it (R3-14).",
      },
    },
  },
} satisfies Meta<typeof DisclosureTrigger>

export default meta
type Story = StoryObj<typeof meta>

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <DisclosureTrigger tone="primary">Show 3 more</DisclosureTrigger>
      <DisclosureTrigger tone="muted">Details</DisclosureTrigger>
      <DisclosureTrigger tone="strong">Maya Reyes</DisclosureTrigger>
    </div>
  ),
}

export const WithCollapsible: Story = {
  name: "Opens a Collapsible",
  render: (args) => (
    <Collapsible className="max-w-md">
      <CollapsibleTrigger>
        <DisclosureTrigger {...args} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 flex flex-col gap-2 text-sm text-card-foreground">
        <p>Pet care instructions</p>
        <p>Digital accounts</p>
        <p>Letters to loved ones</p>
      </CollapsibleContent>
    </Collapsible>
  ),
}

function SortMenu() {
  const [sort, setSort] = useState("recent")
  const label = sort === "recent" ? "most recent" : "name"
  return (
    <DropdownMenu
      modal={false}
      align="start"
      trigger={<DisclosureTrigger tone="strong">Sort: {label}</DisclosureTrigger>}
      items={[
        {
          kind: "radio-group",
          value: sort,
          onValueChange: setSort,
          options: [
            { value: "recent", label: "Most recent" },
            { value: "name", label: "Name" },
          ],
        },
      ]}
    />
  )
}

export const WithDropdownMenu: Story = {
  name: "Opens a DropdownMenu",
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <SortMenu />
      <DropdownMenu
        modal={false}
        align="start"
        trigger={<DisclosureTrigger>Browse everything</DisclosureTrigger>}
        items={[
          { kind: "label", label: "Your sections" },
          // R20-04: these go somewhere, so they are actions and carry icons; the Sort menu above is a pick-list and does not.
          { kind: "item", label: "Will", icon: <ScrollText aria-hidden />, onSelect: () => {} },
          { kind: "item", label: "Documents", icon: <FileText aria-hidden />, onSelect: () => {} },
          { kind: "item", label: "Contacts", icon: <Users aria-hidden />, onSelect: () => {} },
        ]}
      />
    </div>
  ),
}
