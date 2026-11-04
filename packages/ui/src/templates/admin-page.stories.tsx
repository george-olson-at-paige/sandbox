import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { StubLink } from "../stories/fixtures"
import { AdminFrame, expectCollapseInView } from "../stories/admin-frame"
import { Placeholder } from "../stories/placeholder"
import { Button } from "../components/actions/button"
import { AdminPage } from "./admin-page"

/* AdminPage (R8-07): side nav, a top bar with the global actions, then the page header and
   sections. Desktop-first. R12-09: the sidebar is AdminPage's own (the page passes `current`),
   so the admin nav and its footer Collapse are on every admin page; every story renders in
   AdminFrame (the viewport's height), so the footer is never cut off. The admin home with its
   two KPI rows is Admin › Pulse (R8-11, R12-08). */
const meta = {
  component: AdminPage,
  args: {
    current: "pulse",
    linkAs: StubLink,
    title: "Pulse",
    description: "How Paige is doing this month, at a glance.",
    actions: <Button variant="secondary" size="sm">Export</Button>,
    children: (
      <>
        <Placeholder label="KPI row: three lg cards" className="h-40" />
        <Placeholder label="KPI row: five compact cards" className="h-28" />
        <Placeholder label="Chart" className="h-72" />
      </>
    ),
  },
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <AdminFrame><S /></AdminFrame>],
  tags: ["r8-07", "r12-09"],
} satisfies Meta<typeof AdminPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("heading", { level: 1, name: "Pulse" })).toBeInTheDocument()
    await expect(c.getByRole("main")).toBeInTheDocument()
    // R12-09: the admin nav with the current page, and its footer Collapse, inside the frame.
    await expect(within(c.getByRole("navigation", { name: "Admin" })).getByRole("link", { name: "Pulse" })).toHaveAttribute("aria-current", "page")
    await expectCollapseInView(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Collapse" }))
    await expectCollapseInView(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Expand" }))
  },
}
export const RailCollapsed: Story = {
  name: "Sidebar as the icon rail",
  args: { defaultSidebarOpen: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Expand" })).toBeInTheDocument()
    await expectCollapseInView(canvasElement)
  },
}
export const AnotherPage: Story = {
  name: "Another admin page (Jobs current)",
  args: { current: "jobs", navBadges: { jobs: "4" }, title: "Jobs", description: "Pipelines and their runs.", children: <Placeholder label="Runs table" className="h-96" /> },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(within(c.getByRole("navigation", { name: "Admin" })).getByRole("link", { name: /Jobs/ })).toHaveAttribute("aria-current", "page")
    await expectCollapseInView(canvasElement)
  },
}

/** R21-02: the three header slots — the trail over the title (the page added as its current level), the freshness line at the header's right before the actions, and views of the page on the header's rule. The tabs here are a stand-in; Admin › Pages › Journeys has the real TabsLine. */
export const HeaderSlots: Story = {
  name: "Header · trail, meta and tabs",
  tags: ["r21-02"],
  args: {
    current: "journeys",
    title: "Journeys",
    description: undefined,
    breadcrumb: [{ label: "Admin", href: "/admin" }, { label: "Usage", href: "/admin/usage" }],
    meta: "As of 31 Oct 2026 · nightly",
    tabs: <Placeholder label="Tabs: the page's views (TabsLine)" className="h-11" />,
    children: <Placeholder label="The page" className="h-96" />,
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const trail = c.getByRole("navigation", { name: "Breadcrumb" })
    await expect(within(trail).getByRole("link", { name: "Usage" })).toHaveAttribute("href", "/admin/usage")
    // The page is the trail's current level, not a link.
    await expect(within(trail).getByText("Journeys")).toHaveAttribute("aria-current", "page")
    await expect(c.getByText("As of 31 Oct 2026 · nightly")).toBeInTheDocument()
    // One region rule: under the tabs, not also under the title.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="page-header"] > div')!
    await expect(getComputedStyle(row).borderBottomWidth).toBe("0px")
    await expect(getComputedStyle(canvasElement.querySelector<HTMLElement>('[data-slot="admin-page-tabs"]')!).borderBottomWidth).toBe("1px")
  },
}

/** Without tabs the rule stays under the title, as on every other admin page. */
export const HeaderTrailOnly: Story = {
  name: "Header · trail and meta, no tabs",
  tags: ["r21-02"],
  args: {
    ...HeaderSlots.args,
    tabs: undefined,
  },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="page-header"] > div')!
    await expect(getComputedStyle(row).borderBottomWidth).toBe("1px")
    await expect(canvasElement.querySelector('[data-slot="admin-page-tabs"]')).toBeNull()
  },
}
