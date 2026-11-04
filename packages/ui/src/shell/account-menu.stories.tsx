import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { ACCOUNT_ITEMS, StubLink } from "../stories/fixtures"
import { AccountMenu } from "./account-menu"

const meta = {
  tags: ["r12-01", "gaps-120"],
  component: AccountMenu,
  args: {
    name: "Maya Elena Reyes",
    email: "maya@example.com",
    avatar: "assets/avatar-female-glasses.png",
    items: ACCOUNT_ITEMS,
    linkAs: StubLink,
  },
  decorators: [(S) => <div className="flex min-h-56 justify-end"><S /></div>],
} satisfies Meta<typeof AccountMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const NoPhoto: Story = { name: "No photo (initials)", args: { avatar: undefined } }

/** R12-01: the heading is the 74px avatar centred above the name and email. */
export const Open: Story = {
  tags: ["!autodocs"],
  decorators: [(S) => <div className="flex min-h-96 justify-end"><S /></div>],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: /account menu for Maya Elena Reyes/ }))
    const body = within(canvasElement.ownerDocument.body)
    const menu = await body.findByRole("menu")
    const heading = menu.querySelector('[data-slot="account-menu-heading"]')!
    const frame = heading.querySelector('[data-slot="avatar-frame"]')!
    await expect(frame).toHaveAttribute("data-size", "2xl")
    // Above the name, centred.
    const name = within(heading as HTMLElement).getByText("Maya Elena Reyes")
    await expect(frame.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // offsetWidth: the menu opens with a scale animation, which getBoundingClientRect would measure.
    await expect((frame as HTMLElement).offsetWidth).toBe(74)
    await userEvent.keyboard("{Escape}")
  },
}
