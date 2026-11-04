import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { CircleGauge, ListChecks, Settings, Users } from "lucide-react"

import { StubLink } from "../../stories/fixtures"
import { Sidebar, SidebarLayout, SidebarToggle, type SidebarSection } from "./sidebar"

/* Sidebar (R8-07): a side nav from data. Collapses to an icon rail (the toggle, Ctrl/Cmd+B, or
   the rail edge; labels become tooltips) and is a sheet on phones. `collapseControl` and
   `rail={false}` (R10-06/07) are shown on Admin › AdminSidebar. The frame's transform keeps
   the fixed sidebar inside each story. */
const sections: SidebarSection[] = [
  { id: "top", items: [{ id: "home", label: "Overview", href: "#overview", icon: CircleGauge }] },
  {
    id: "work",
    label: "Work",
    items: [
      { id: "people", label: "People", href: "#people", icon: Users },
      { id: "jobs", label: "Jobs", href: "#jobs", icon: ListChecks, badge: "2" },
    ],
  },
  { id: "more", label: "More", items: [{ id: "settings", label: "Settings", href: "#settings", icon: Settings }] },
]

function Frame({ defaultOpen = true }: { defaultOpen?: boolean }) {
  return (
    <SidebarLayout defaultOpen={defaultOpen} sidebar={<Sidebar sections={sections} activeId="people" linkAs={StubLink} header={<span className="text-sm font-semibold">Paige</span>} />}>
      <div className="flex items-center gap-2 border-b p-3">
        <SidebarToggle />
        <span className="text-sm text-muted-foreground">Page content</span>
      </div>
    </SidebarLayout>
  )
}

const meta = {
  component: Sidebar,
  args: { sections },
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div className="relative h-120 overflow-hidden transform-gpu"><S /></div>],
  tags: ["r8-07"],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Frame />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const nav = c.getByRole("navigation", { name: "Main" })
    await expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page")
    await expect(within(nav).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current")
  },
}

export const Collapsed: Story = {
  name: "Collapsed to the icon rail",
  render: () => <Frame defaultOpen={false} />,
}

export const Toggle: Story = {
  name: "Toggle collapses and expands",
  render: () => <Frame />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="sidebar"][data-state]')!
    // The page's toggle (the rail on the edge has the same name).
    const toggle = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!
    await expect(root).toHaveAttribute("data-state", "expanded")
    await userEvent.click(toggle)
    await expect(root).toHaveAttribute("data-state", "collapsed")
    await userEvent.click(toggle)
    await expect(root).toHaveAttribute("data-state", "expanded")
  },
}

export const PointerCursor: Story = {
  name: "Every control shows the pointer",
  tags: ["r13-11"],
  render: () => (
    <SidebarLayout sidebar={<Sidebar sections={sections} activeId="people" linkAs={StubLink} collapseControl rail={false} />}>
      <div className="flex items-center gap-2 border-b p-3">
        <SidebarToggle />
      </div>
    </SidebarLayout>
  ),
  play: async ({ canvasElement }) => {
    const controls = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="sidebar-collapse"], [data-slot="sidebar-trigger"], nav a'),
    ]
    await expect(controls.length).toBeGreaterThan(3)
    for (const el of controls) await expect(getComputedStyle(el).cursor).toBe("pointer")
  },
}

export const Phone: Story = {
  name: "Phone (a sheet behind the toggle)",
  globals: { viewport: { value: "w375" } },
  tags: ["!autodocs"],
  render: () => <Frame />,
}
