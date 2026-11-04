import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { adminHref } from "../admin-nav"
import { biggestDrop, journeyRanges, screenStats, stopsMost, type JourneyRange, type JourneyUsage } from "../journey-rules"
import { TabsLineList, tabsLineTriggerVariants } from "../../components/navigation/tabs-line"
import { AccountMenu } from "../../shell/account-menu"
import { AdminPage } from "../../templates/admin-page"
import { AdminFrame, expectCollapseInView } from "../../stories/admin-frame"
import { StubLink } from "../../stories/fixtures"
import { journeyOptions, journeyRecordings } from "../../fixtures/journeys"
import { JourneysToolbar, JourneysView } from "./journeys"

/* R21-14, R21-21 · Usage › Journeys on real `GET admin/usage/journeys` responses recorded from the
   local stack (`fixtures/journeys.ts`): AdminPage with the trail, the journey tabs (the API's
   journeys with no group), the recording line; then the dates and how they came in, and
   JourneysView. The journey, the dates, the entry, the view and the show-all switch are state
   here and answer from the recordings, as the app does from the URL. "Open in Mixpanel" is not
   shown while Mixpanel is off. */
const TABS = journeyOptions.filter((j) => j.group === null)
const setupAll = journeyRecordings["essential-setup.7d.all"]!
const stats = screenStats(setupAll)
const drop = biggestDrop(stats)!
const signup = journeyRecordings["sign-up.7d.all"]!

/** A recording with every count at zero: nobody in the window, or a host with no event store. */
const zeroed = (usage: JourneyUsage, eventsAvailable = true): JourneyUsage => ({
  ...usage,
  eventsAvailable,
  people: 0,
  reachedEnd: 0,
  entries: [],
  tasks: usage.tasks.map((t) => ({ ...t, reached: 0, activeSpread: { count: 0, p25: null, median: null, p75: null, p90: null }, next: [] })),
})

type PageProps = {
  initialJourney?: string
  initialEntry?: string | null
  initialView?: string
  initialExpanded?: boolean
  loading?: boolean
  error?: boolean
  /** In place of the recording (the zeroed states). */
  usage?: JourneyUsage
}

function JourneysPage({ initialJourney = "essential-setup", initialEntry = null, initialView = "all", initialExpanded = false, loading = false, error = false, usage: override }: PageProps) {
  const [journey, setJourney] = useState(initialJourney)
  const [range, setRange] = useState<JourneyRange>("7d")
  const [entry, setEntry] = useState<string | null>(initialEntry)
  const [view, setView] = useState(initialView)
  const [expanded, setExpanded] = useState(initialExpanded)
  const recorded = journeyRecordings[`${journey}.${range}.${entry ?? "all"}`] ?? null
  const usage = loading || error ? null : (override ?? recorded)
  const windowLabel = journeyRanges.find((r) => r.value === range)!.label
  return (
    <AdminPage
      current="journeys"
      linkAs={StubLink}
      navBadges={{ jobs: "4" }}
      breadcrumb={[
        { label: "Admin", href: adminHref("pulse") },
        { label: "Usage", href: adminHref("usage") },
      ]}
      title="Journeys"
      meta="Local stack · recorded 1 Nov 2026"
      tabs={
        <TabsLineList aria-label="Journeys">
          {TABS.map((j) => (
            <StubLink
              key={j.key}
              href={`#${j.key}`}
              aria-current={journey === j.key ? "page" : undefined}
              onClick={() => {
                setJourney(j.key)
                setEntry(null)
                setView("all")
              }}
              className={tabsLineTriggerVariants()}
            >
              {j.label}
            </StubLink>
          ))}
        </TabsLineList>
      }
      globalActions={<AccountMenu name="George Olson" email="george@example.com" items={[{ label: "Sign out", href: "#sign-out" }]} linkAs={StubLink} />}
    >
      <JourneysToolbar
        ranges={journeyRanges}
        range={range}
        onRangeChange={(v) => setRange(v as JourneyRange)}
        entries={(override ?? recorded)?.entries ?? []}
        entry={entry}
        onEntryChange={setEntry}
      />
      <JourneysView
        usage={usage}
        window={windowLabel}
        view={view}
        onViewChange={setView}
        expanded={expanded}
        onExpandedChange={setExpanded}
        whoStoppedHref={(key) => `${adminHref("people")}?journey=${journey}&stoppedAt=${key}`}
        linkAs={StubLink}
        loading={loading}
        error={error ? { title: "Journeys didn’t load", description: "The numbers couldn’t be read. Nothing is lost.", onRetry: () => {} } : undefined}
      />
    </AdminPage>
  )
}

const meta = {
  component: JourneysPage,
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <AdminFrame><S /></AdminFrame>],
  tags: ["r21-14", "r21-21", "!autodocs"],
} satisfies Meta<typeof JourneysPage>

export default meta
type Story = StoryObj<typeof meta>

/** All screens, Essential Setup, last 7 days: the summary (started, reached the end, the biggest drop as a card that opens it) and the three screens where people stop most. */
export const Default: Story = {
  name: "All screens",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("heading", { level: 1, name: "Journeys" })).toBeInTheDocument()
    await expect(within(c.getByRole("navigation", { name: "Admin" })).getByRole("link", { name: "Journeys" })).toHaveAttribute("aria-current", "page")
    await expect(within(c.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Usage" })).toBeInTheDocument()
    await expect(within(c.getByRole("navigation", { name: "Journeys" })).getByRole("link", { name: "Essential Setup" })).toHaveAttribute("aria-current", "page")
    await expect(c.queryByRole("link", { name: /Open in Mixpanel/ })).toBeNull()
    // The nav: All screens plus every task, the biggest drop named.
    const screensNav = c.getByRole("navigation", { name: "Screens" })
    await expect(within(screensNav).getAllByRole("button")).toHaveLength(setupAll.tasks.length + 1)
    await expect(within(screensNav).getByRole("button", { name: new RegExp(`${drop.label}.*Biggest drop`) })).toBeInTheDocument()
    // No segment: Setup has no entries (George 2026-11-01; the Areas will have one).
    await expect(c.queryByRole("radiogroup", { name: "How they came in" })).toBeNull()
    // The summary: started is the journey's people.
    const summary = canvasElement.querySelector<HTMLElement>('[data-slot="journeys-summary"]')!
    await expect(summary.querySelector('[data-slot="stat-value"]')).toHaveTextContent(String(setupAll.people))
    // The table: the three screens where people stop most, then all of them.
    const table = c.getByRole("table", { name: "Where people stop most" })
    await expect(within(table).getAllByRole("row")).toHaveLength(stopsMost(stats).length + 1)
    await userEvent.click(c.getByRole("button", { name: `Show all ${stats.length} screens` }))
    await expect(within(c.getByRole("table", { name: "Every screen" })).getAllByRole("row")).toHaveLength(stats.length + 1)
    // The InsightCard opens the biggest drop.
    await userEvent.click(c.getByRole("button", { name: /Biggest drop.*Look at it/ }))
    // R21-18: the card that opened it went with the old view, so focus lands on the screen's heading.
    await expect(c.getByRole("heading", { level: 2, name: drop.label })).toHaveFocus()
    await expect(within(screensNav).getByRole("button", { name: new RegExp(drop.label) })).toHaveAttribute("aria-current", "true")
    await expectCollapseInView(canvasElement)
  },
}

/** One screen, the biggest drop: the badge, how many reached it, the trio, what they did next and who stopped. */
export const Screen: Story = {
  name: "A screen · the biggest drop",
  args: { initialView: drop.key },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const card = c.getByRole("region", { name: drop.label })
    await expect(within(card).getByText("Biggest drop")).toBeInTheDocument()
    await expect(within(card).getByText(`${drop.stopped} of ${drop.reached} stopped here`)).toBeInTheDocument()
    await expect(within(card).getByRole("list", { name: "What they did next" })).toBeInTheDocument()
    await expect(within(card).getByRole("link", { name: "See who stopped here" })).toHaveAttribute("href", `/admin/people?journey=essential-setup&stoppedAt=${drop.key}`)
    // Back to All screens from the nav.
    await userEvent.click(c.getByRole("button", { name: "All screens" }))
    await expect(c.getByRole("table", { name: "Where people stop most" })).toBeInTheDocument()
  },
}

/** The optional screen (Check what we read): shown to some, no went-on rate. */
export const OptionalScreen: Story = { name: "A screen · optional", args: { initialView: "setup-check" } }

export const ShowAll: Story = { name: "All screens · every screen", args: { initialExpanded: true } }

/** Sign-up: a branch (an account, then phone and email in either order), tasks nobody was timed on, and no entries, so no segment. */
export const SignUp: Story = {
  name: "Sign-up · a branch, no entries",
  args: { initialJourney: "sign-up", initialExpanded: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(within(c.getByRole("navigation", { name: "Journeys" })).getByRole("link", { name: "Sign-up" })).toHaveAttribute("aria-current", "page")
    await expect(c.queryByRole("radiogroup", { name: "How they came in" })).toBeNull()
    await expect(within(c.getByRole("table", { name: "Every screen" })).getAllByRole("row")).toHaveLength(signup.tasks.length + 1)
  },
}

/** First things in the Vault: three tasks, two of them roots, timed in seconds to minutes. */
export const FirstThings: Story = { name: "First things", args: { initialJourney: "first-things", initialExpanded: true } }

/** Switching tabs: each journey answers from its own recording and the view goes back to All screens. */
export const SwitchJourney: Story = {
  name: "Tabs · switch journey",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(within(c.getByRole("navigation", { name: "Journeys" })).getByRole("link", { name: "First things in the Vault" }))
    const first = journeyRecordings["first-things.7d.all"]!
    await expect(within(c.getByRole("navigation", { name: "Screens" })).getAllByRole("button")).toHaveLength(first.tasks.length + 1)
  },
}

/** Loading: the nav, the cards and the table as skeletons in place. */
export const Loading: Story = { args: { loading: true } }

/** It didn't load: a Callout with Try again in the main column; the nav keeps All screens. */
export const ErrorState: Story = {
  name: "Error",
  args: { error: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("alert")).toHaveTextContent("Journeys didn’t load")
    await expect(c.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  },
}

/** Nobody started in these dates: the nav keeps All screens, the main column says so. */
export const Empty: Story = {
  name: "Empty (nobody started)",
  args: { usage: zeroed(setupAll) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Nobody started Essential Setup in these dates")).toBeInTheDocument()
  },
}

/** A host with no event store: the API answers zeros and says so; the page says so above them. */
export const NoEvents: Story = {
  name: "No event store",
  args: { usage: zeroed(setupAll, false) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("This host keeps no events")).toBeInTheDocument()
  },
}

/* Where it's designed: 1280 and 1440. The summary is one row of three, the table's columns fit. */
const rowCheck = async (canvasElement: HTMLElement) => {
  const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="journeys-summary"] > *')].map((el) => Math.round(el.getBoundingClientRect().top))
  await expect(new Set(cards).size).toBe(1)
  const box = canvasElement.querySelector<HTMLElement>('[data-slot="data-table"]') ?? canvasElement.querySelector<HTMLElement>("table")!.parentElement!
  await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1)
}
/* At a phone (R21-17, R21-18, R21-19): nothing runs past the page; the table scrolls inside its own box. */
const phoneCheck = async (canvasElement: HTMLElement) => {
  const page = canvasElement.querySelector<HTMLElement>('[data-slot="journeys-toolbar"]')!.parentElement!.getBoundingClientRect()
  for (const slot of ["journeys-toolbar", "toggle-group", "data-table-toolbar"]) {
    // The segment is there only for a journey with entries.
    const el = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
    if (!el) continue
    const box = el.getBoundingClientRect()
    await expect(box.right).toBeLessThanOrEqual(page.right + 1)
  }
  // The legend keeps its own width: it drops under the table's title rather than squeezing beside it.
  const legend = canvasElement.querySelector<HTMLElement>('[data-slot="data-table-toolbar"] ul')!
  await expect(legend.querySelectorAll("li")[0]!.getBoundingClientRect().height).toBeLessThan(24)
}
/** Phone width: the toolbar fits, the table's key sits under its title, the table scrolls in its box. */
export const AtPhone: Story = { name: "At 375", tags: ["!autodocs"], globals: { viewport: { value: "w375" } }, play: async ({ canvasElement }) => phoneCheck(canvasElement) }
/** Phone width, a screen picked from the nav: the card sits under the nav, so it is scrolled into view; focus stays on the nav. */
export const ScreenAtPhone: Story = {
  name: "A screen · at 375",
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375" } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const item = within(c.getByRole("navigation", { name: "Screens" })).getByRole("button", { name: new RegExp(drop.label) })
    await userEvent.click(item)
    await expect(item).toHaveFocus()
    const card = c.getByRole("region", { name: drop.label }).getBoundingClientRect()
    await expect(card.top).toBeLessThan(window.innerHeight / 2)
  },
}
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } }, play: async ({ canvasElement }) => rowCheck(canvasElement) }
export const At1440: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1440" } }, play: async ({ canvasElement }) => rowCheck(canvasElement) }
export const ScreenAt1440: Story = { name: "A screen · at 1440", tags: ["!autodocs"], globals: { viewport: { value: "w1440" } }, args: { initialView: drop.key } }
export const ScreenAt1280: Story = { name: "A screen · at 1280", tags: ["!autodocs"], globals: { viewport: { value: "w1280" } }, args: { initialView: drop.key } }
