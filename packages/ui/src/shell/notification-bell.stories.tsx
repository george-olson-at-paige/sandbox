import type { ComponentType, ElementType, ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { StubLink } from "../stories/fixtures"
import { NotificationBell } from "./notification-bell"

/* NotificationBell opens a route, a handler or a panel, never nothing (R2-30). The panel is a
   Popover (R11-10): click away and Escape close it. */
/** The bell's props flattened for Storybook's args (its real props are a union on what it opens). */
type Args = { unread?: number; open?: boolean; onOpen?: () => void; href?: string; panel?: ReactNode; linkAs?: ElementType }

const meta = {
  component: NotificationBell as unknown as ComponentType<Args>,
  tags: ["r2-30", "gaps-53", "r4-02"],
  args: { unread: 0, onOpen: fn() },
  argTypes: { unread: { control: { type: "number", min: 0 } } },
  decorators: [(S) => <div className="flex min-h-48 items-start justify-end gap-4 p-2"><S /></div>],
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

/* Stand-in panel content: the notifications list isn't built. */
const PANEL = (
  <div className="flex flex-col gap-1 px-2.5 py-2">
    <p className="text-sm font-semibold text-card-foreground">Notifications</p>
    <p className="text-xs font-medium text-muted-foreground">A stand-in: the list isn’t built yet.</p>
  </div>
)

export const NothingUnread: Story = { name: "Nothing unread" }
export const Unread: Story = { name: "Unread (dot; count in the name)", args: { unread: 3 } }
export const Link: Story = { name: "Opens a route", args: { unread: 1, onOpen: undefined, href: "#notifications", linkAs: StubLink } }
/** Opens a panel (click away and Escape close it) */
export const Panel: Story = {
  name: "Opens a panel",
  tags: ["r11-10"],
  args: { unread: 2, onOpen: undefined, panel: PANEL },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const bell = c.getByRole("button", { name: "Notifications, 2 unread" })
    await userEvent.click(bell)
    await body.findByRole("dialog", { name: "Notifications" })
    await expect(bell).toHaveAttribute("aria-expanded", "true")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Notifications" })).toBeNull())
    await expect(bell).toHaveFocus()
    await userEvent.click(bell)
    await body.findByRole("dialog", { name: "Notifications" })
    await userEvent.click(canvasElement.ownerDocument.body)
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Notifications" })).toBeNull())
  },
}
export const PanelOpen: Story = {
  name: "Panel open (keeps the pressed look)",
  args: { unread: 2, open: true },
}
export const States: Story = {
  name: "Rest · hover · pressed · open",
  parameters: { pseudo: { hover: ['[data-demo="hover"] button'], active: ['[data-demo="pressed"] button'] } },
  render: (args) => (
    <div className="flex items-center gap-6">
      {(["rest", "hover", "pressed", "open"] as const).map((s) => (
        <span key={s} data-demo={s} className="flex flex-col items-center gap-1">
          <NotificationBell unread={1} onOpen={args.onOpen ?? (() => {})} open={s === "open"} />
          <span className="eyebrow">{s}</span>
        </span>
      ))}
    </div>
  ),
}
