import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Tabs as TabsPrimitive } from "radix-ui"

import { StubLink } from "../../stories/fixtures"
import { TabsLineList, tabsLineTriggerVariants } from "./tabs-line"

/* TabsLine (R21-03): underline tabs, views of one page. As links (aria-current, the default: back
   and deep links work) or as Radix Tabs' list (panels on the page, arrow keys). It draws no rule of
   its own; these stories put it on a region rule as AdminPage's `tabs` slot does. */
const JOURNEYS = [
  ["signup", "Sign-up"],
  ["setup", "Essential Setup"],
  ["first", "First things in the Vault"],
] as const
type Journey = (typeof JOURNEYS)[number][0]

function JourneyTabs({ current: initial = "setup" }: { current?: Journey }) {
  const [current, setCurrent] = useState<Journey>(initial)
  return (
    <div className="border-b">
      <TabsLineList aria-label="Journeys">
        {JOURNEYS.map(([key, label]) => (
          <StubLink
            key={key}
            href={`#${key}`}
            aria-current={current === key ? "page" : undefined}
            onClick={() => setCurrent(key)}
            className={tabsLineTriggerVariants()}
          >
            {label}
          </StubLink>
        ))}
      </TabsLineList>
    </div>
  )
}

const meta = {
  component: JourneyTabs,
  args: { current: "setup" },
  argTypes: { current: { control: "select", options: JOURNEYS.map(([k]) => k) } },
  decorators: [(S) => <div className="bg-surface-page p-6"><S /></div>],
  tags: ["r21-03"],
} satisfies Meta<typeof JourneyTabs>

export default meta
type Story = StoryObj<typeof meta>

/** Links with `aria-current="page"` on the current view; a click moves it (the links are stubbed). */
export const Links: Story = {
  name: "Links · Essential Setup current",
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Journeys" })
    const links = within(nav).getAllByRole("link")
    await expect(links).toHaveLength(JOURNEYS.length)
    await expect(within(nav).getByRole("link", { name: "Essential Setup" })).toHaveAttribute("aria-current", "page")
    await userEvent.click(within(nav).getByRole("link", { name: "Sign-up" }))
    await expect(within(nav).getByRole("link", { name: "Sign-up" })).toHaveAttribute("aria-current", "page")
    await expect(within(nav).getByRole("link", { name: "Essential Setup" })).not.toHaveAttribute("aria-current")
  },
}

/** Each tab is a link in the tab order: Tab moves through them, Enter follows one; the focused one wears the gapped ring. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Journeys" })
    await userEvent.tab()
    await expect(within(nav).getByRole("link", { name: "Sign-up" })).toHaveFocus()
    await userEvent.tab()
    const setup = within(nav).getByRole("link", { name: "Essential Setup" })
    await expect(setup).toHaveFocus()
    await expect(getComputedStyle(setup).outlineStyle).toBe("solid")
    await userEvent.tab()
    await userEvent.keyboard("{Enter}")
    await expect(within(nav).getByRole("link", { name: "First things in the Vault" })).toHaveAttribute("aria-current", "page")
  },
}

/** The current tab's 3px bar is always drawn (transparent on the others), so the labels never move. */
export const States: Story = {
  parameters: { pseudo: { hover: ['[href="#signup"]'], focusVisible: ['[href="#first"]'] } },
  play: async ({ canvasElement }) => {
    const current = within(canvasElement).getByRole("link", { name: "Essential Setup" })
    await expect(getComputedStyle(current, "::after").borderBottomWidth).toBe("3px")
    await expect(getComputedStyle(current).fontWeight).toBe("700")
    await expect(getComputedStyle(within(canvasElement).getByRole("link", { name: "Sign-up" })).fontWeight).toBe("600")
  },
}

/* Panels on one page: Radix Tabs with TabsLineList as its list (asChild). Radix gives the roles
   and the arrow keys; the current tab is data-state="active". */
function PanelTabs() {
  return (
    <TabsPrimitive.Root defaultValue="overview" className="flex flex-col gap-4">
      <div className="border-b">
        <TabsPrimitive.List asChild>
          <TabsLineList as="div" aria-label="Person">
            {["overview", "billing", "messages"].map((v) => (
              <TabsPrimitive.Trigger key={v} value={v} className={tabsLineTriggerVariants()}>
                {v[0].toUpperCase() + v.slice(1)}
              </TabsPrimitive.Trigger>
            ))}
          </TabsLineList>
        </TabsPrimitive.List>
      </div>
      {["overview", "billing", "messages"].map((v) => (
        <TabsPrimitive.Content key={v} value={v} className="text-sm">
          The {v} panel.
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

/** As Radix Tabs' list: tabs with panels, the arrow keys move between tabs. */
export const Panels: Story = {
  name: "Panels · arrow keys",
  render: () => <PanelTabs />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.tab()
    await expect(c.getByRole("tab", { name: "Overview" })).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(c.getByRole("tab", { name: "Billing" })).toHaveAttribute("data-state", "active")
    await expect(c.getByRole("tabpanel")).toHaveTextContent("The billing panel.")
  },
}

/** At a phone's width the tabs wrap to a second row rather than scroll off. */
export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w375" } } }
