import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"


import { ACCOUNT_ITEMS, PaigeLogo, standInSearch, StubLink } from "../stories/fixtures"
import { Button } from "../components/actions/button"
import { tabsPillTriggerVariants } from "../components/navigation/tabs-pill-styles"
import { TabsPillList } from "../components/navigation/tabs-pill"
import { AccountMenu } from "./account-menu"
import { AppHeader } from "./app-header"
import { HeaderSearch } from "./header-search"
import { NotificationBell } from "./notification-bell"
import { StepRail } from "../setup/step-rail"
import { enter } from "../stories/typing"

/* AppHeader is layout and slots (R1-19); the Vault configuration fills `actions` with the
   HeaderSearch, NotificationBell and AccountMenu composites. */
const meta = {
  tags: ["r11-10", "r11-09", "r11-08", "r2-22", "gaps-85", "r6-04", "gaps-88"],
  component: AppHeader,
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div className="min-h-72"><S /></div>],
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

const MODES = [["vault", "Vault"], ["messages", "Messages"], ["memories", "Memories"]] as const

function Modes() {
  const [current, setCurrent] = useState<string>("vault")
  return (
    <TabsPillList aria-label="Modes">
      {MODES.map(([key, label]) => (
        <StubLink
          key={key}
          href={`#${key}`}
          aria-current={key === current ? "page" : undefined}
          onClick={() => setCurrent(key)}
          className={tabsPillTriggerVariants()}
        >
          {label}
        </StubLink>
      ))}
    </TabsPillList>
  )
}

/* Search and notifications aren't built: stand-in results and a stand-in panel. They are real
   popovers (R11-10): a click outside or Escape closes them, and opening one (or the account
   menu) closes the others, through AppHeader's one shared open state. Actions sit 16px apart
   (R11-09); the avatar is md 34; its photo has the border (R13-13). */
const BELL_PANEL = (
  <div className="flex flex-col gap-1 px-2.5 py-2">
    <p className="text-sm font-semibold text-card-foreground">Notifications</p>
    <p className="text-xs font-medium text-muted-foreground">A stand-in: the list isn’t built yet.</p>
  </div>
)

function VaultActions() {
  const [query, setQuery] = useState("")
  return (
    <>
      <HeaderSearch query={query} onQueryChange={setQuery} groups={standInSearch(query)} linkAs={StubLink} />
      <NotificationBell unread={2} panel={BELL_PANEL} />
      <AccountMenu
        name="Maya Elena Reyes"
        email="maya@example.com"
        avatar="assets/avatar-female-glasses.png"
        items={ACCOUNT_ITEMS}
        linkAs={StubLink}
      />
    </>
  )
}

export const Vault: Story = {
  name: "Vault configuration",
  tags: ["r2-30"],
  decorators: [(S) => <div className="relative"><S /></div>],
  args: {
    logo: <PaigeLogo />,
    nav: <Modes />,
    actions: <VaultActions />,
  },
}

/* R11-10: one header popover at a time, and click-away closes. */
export const OnePopoverAtATime: Story = {
  name: "One popover at a time",
  args: { logo: <PaigeLogo />, actions: <VaultActions /> },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const bell = c.getByRole("button", { name: "Notifications, 2 unread" })
    // Actions 16px apart (R11-09).
    await expect(getComputedStyle(canvasElement.querySelector('[data-slot="app-header-actions"]')!).columnGap).toBe("16px")
    // The bell's panel, then the account menu: the panel closes.
    await userEvent.click(bell)
    await body.findByRole("dialog", { name: "Notifications" })
    await userEvent.click(c.getByRole("button", { name: /account menu for Maya Elena Reyes/ }))
    await body.findByRole("menu")
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Notifications" })).toBeNull())
    // Keyboard: Escape closes the menu, then Enter on the bell opens its panel alone.
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())
    await enter(bell)
    await userEvent.keyboard("{Enter}")
    await body.findByRole("dialog", { name: "Notifications" })
    // Search: expanding it closes the panel; a click away collapses the empty field.
    await userEvent.click(c.getByRole("button", { name: "Search" }))
    await c.findByRole("combobox", { name: "Search" })
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Notifications" })).toBeNull())
    await userEvent.click(c.getByRole("link", { name: "Paige home" }))
    await waitFor(() => expect(c.queryByRole("combobox", { name: "Search" })).toBeNull())
  },
}

/** Vault configuration at 375: nav on its own row. */
export const VaultPhone: Story = {
  name: "Vault · 375",
  tags: ["!autodocs"],
  args: Vault.args,
  globals: { viewport: { value: "w375", isRotated: false } },
}

/* The Essential Setup bar as SetupBeat draws it (R4-06): the StepRail sits beside the exit from
   sm, and on its own row under the bar below sm (R6-04, GAPS #88). */
export const Setup: Story = {
  name: "Setup configuration",
  args: {
    logo: <PaigeLogo />,
    nav: (
      <div className="flex sm:hidden">
        <StepRail step={2} total={6} />
      </div>
    ),
    actions: (
      <div className="flex items-center gap-6 text-sm">
        <StepRail step={2} total={6} className="hidden sm:flex" />
        <Button asChild variant="quiet" size="inline">
          <StubLink href="#vault">Save and finish later</StubLink>
        </Button>
      </div>
    ),
  },
}

/** Setup configuration at 375: rail on its own row. */
export const SetupPhone: Story = {
  name: "Setup · 375",
  tags: ["!autodocs"],
  args: Setup.args,
  globals: { viewport: { value: "w375", isRotated: false } },
}

export const LogoOnly: Story = { name: "Logo only", args: { logo: <PaigeLogo /> } }
