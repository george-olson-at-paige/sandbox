import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { StubLink } from "../../stories/fixtures"
import { NavList, type NavListItem } from "./nav-list"

/* NavList (R21-12): the views of one page as a vertical list, with counts and a named attention
   dot; buttons that switch the view in place, or links (`href`) when each view has a URL. */
const SCREENS: NavListItem[] = [
  { id: "all", label: "All screens" },
  { id: "welcome", label: "Welcome", count: 101 },
  { id: "about", label: "About you", count: 89 },
  { id: "your-people", label: "Your people", count: 84 },
  { id: "getting-in", label: "Getting in", count: 44, marker: "Biggest drop" },
  { id: "in-place", label: "What you’ve put in place", count: 14 },
]

function Screens({ framed = true, initial = "all" }: { framed?: boolean; initial?: string }) {
  const [current, setCurrent] = useState(initial)
  return (
    <div className="flex flex-col gap-3">
      <NavList label="Screens" items={SCREENS} current={current} onSelect={setCurrent} framed={framed} />
      <span role="status" className="text-sm">
        Showing {current}
      </span>
    </div>
  )
}

const meta = {
  component: Screens,
  decorators: [(S) => <div data-surface="page" className="max-w-xs bg-surface-page p-6"><S /></div>],
  tags: ["r21-12"],
} satisfies Meta<typeof Screens>

export default meta
type Story = StoryObj<typeof meta>

/** Buttons: the current one is `aria-current`; a click shows that view; the attention dot's name is part of the item's name. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Screens" })
    await expect(within(nav).getByRole("button", { name: "All screens" })).toHaveAttribute("aria-current", "true")
    const drop = within(nav).getByRole("button", { name: /Getting in.*Biggest drop.*44/ })
    await userEvent.click(drop)
    await expect(drop).toHaveAttribute("aria-current", "true")
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Showing getting-in")
  },
}

/** Every item is in the tab order with the gapped ring; Enter or Space shows the view. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Screens" })
    await userEvent.tab()
    await userEvent.tab()
    const welcome = within(nav).getByRole("button", { name: /Welcome/ })
    await expect(welcome).toHaveFocus()
    await expect(getComputedStyle(welcome).outlineStyle).toBe("solid")
    await userEvent.keyboard("{Enter}")
    await expect(welcome).toHaveAttribute("aria-current", "true")
  },
}

/** The current item (a screen), hover on the next and the attention dot. */
export const States: Story = {
  args: { initial: "your-people" },
  parameters: { pseudo: { hover: ['[data-slot="nav-list-item"]:not([aria-current])'] } },
}

/** Without the frame, on whatever holds it. */
export const Unframed: Story = { args: { framed: false } }

/** Links: each view has a URL, so the current one is `aria-current="page"`. */
export const Links: Story = {
  render: () => (
    <NavList label="Screens" items={SCREENS.map((s) => ({ ...s, href: `#${s.id}` }))} current="about" linkAs={StubLink} framed />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: /About you/ })).toHaveAttribute("aria-current", "page")
  },
}

/** A long label truncates before its count. */
export const LongLabel: Story = { name: "Long label", decorators: [(S) => <div className="w-56"><S /></div>] }
