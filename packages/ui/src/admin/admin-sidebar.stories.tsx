import type { ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { StubLink } from "../stories/fixtures"
import { AdminFrame, expectCollapseInView } from "../stories/admin-frame"
import { SidebarLayout, SidebarToggle } from "../components/navigation/sidebar"
import { AdminSidebar } from "./admin-sidebar"

/* AdminSidebar (R8-07): the admin site's nav (provisional list, GAPS #108). R10-06/07: the
   collapse control is in its footer (Ctrl/Cmd+B still toggles), and its edge is plain (no rail,
   no resize cursor). On a phone it is a sheet behind the page's toggle. AdminFrame (R12-09) is
   the viewport's height, so the fixed sidebar, footer included, sits inside each story. */
function Frame({ defaultOpen = true, children }: { defaultOpen?: boolean; children: ReactNode }) {
  return (
    <AdminFrame>
      <SidebarLayout defaultOpen={defaultOpen} sidebar={children}>
        {/* TODO: components */}
        <div className="flex items-center gap-2 border-b p-3">
          {/* The page's toggle exists on a phone only, as in AdminPage. */}
          <SidebarToggle className="md:hidden" />          
          
          <span className="text-sm text-muted-foreground">Page</span>
        </div>
      </SidebarLayout>
    </AdminFrame>
  )
}

const meta = {
  component: AdminSidebar,
  args: { current: "jobs", linkAs: StubLink, badges: { jobs: "2" } },
  parameters: { layout: "fullscreen" },
  decorators: [(S, { parameters }) => <Frame defaultOpen={parameters.sidebarOpen ?? true}><S /></Frame>],
  tags: ["r8-07", "r10-06", "r10-07", "r12-09"],
} satisfies Meta<typeof AdminSidebar>

export default meta
type Story = StoryObj<typeof meta>

const stateOf = (el: HTMLElement) => el.querySelector('[data-slot="sidebar"][data-state]')!

/** Expanded (collapse in the footer, no rail) */
export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const nav = c.getByRole("navigation", { name: "Admin" })
    await expect(within(nav).getByRole("link", { name: /Jobs/ })).toHaveAttribute("aria-current", "page")
    // No rail on the edge: nothing that resizes or shows a resize cursor.
    await expect(canvasElement.querySelector('[data-slot="sidebar-rail"]')).toBeNull()
    const root = stateOf(canvasElement)
    await expect(root).toHaveAttribute("data-state", "expanded")
    // R12-09: the footer's control is on screen, not cut off below the frame.
    await expectCollapseInView(canvasElement)
    // The footer's control collapses to the icon rail and expands again.
    await userEvent.click(c.getByRole("button", { name: "Collapse" }))
    await expect(root).toHaveAttribute("data-state", "collapsed")
    await userEvent.click(c.getByRole("button", { name: "Expand" }))
    await expect(root).toHaveAttribute("data-state", "expanded")
    // Ctrl+B still toggles.
    await userEvent.keyboard("{Control>}b{/Control}")
    await expect(root).toHaveAttribute("data-state", "collapsed")
    await userEvent.keyboard("{Control>}b{/Control}")
    await expect(root).toHaveAttribute("data-state", "expanded")
  },
}

/** Collapsed (icon rail; the control is an icon with a tooltip) */
export const Collapsed: Story = {
  name: "Collapsed · icon rail",
  parameters: { sidebarOpen: false },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(stateOf(canvasElement)).toHaveAttribute("data-state", "collapsed")
    await expectCollapseInView(canvasElement)
    const expand = c.getByRole("button", { name: "Expand" })
    await userEvent.hover(expand)
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("tooltip")).toHaveTextContent("Expand"))
  },
}

export const Phone: Story = {
  name: "Phone (a sheet behind the page's toggle)",
  globals: { viewport: { value: "w375" } },
  tags: ["!autodocs"],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // No collapse control in the sheet; the page's toggle opens it.
    await userEvent.click(c.getByRole("button", { name: /toggle sidebar/i }))
    const sheet = await within(canvasElement.ownerDocument.body).findByRole("dialog")
    await expect(within(sheet).getByRole("navigation", { name: "Admin" })).toBeInTheDocument()
    await expect(within(sheet).queryByRole("button", { name: "Collapse" })).toBeNull()
  },
}
