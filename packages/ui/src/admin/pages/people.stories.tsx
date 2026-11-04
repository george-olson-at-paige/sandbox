import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { inRange, presetRange } from "../../lib/date-range"
import { defaultListState, type ListState } from "../../lib/list-query"
import { Button } from "../../components/actions/button"
import { Card } from "../../components/display/card"
import { AdminPage } from "../../templates/admin-page"
import { ListPage } from "../../templates/list-page"
import { AdminFrame, expectCollapseInView } from "../../stories/admin-frame"
import { StubLink } from "../../stories/fixtures"
import { PARTNERS, PEOPLE_NOW, people, previewPlanChange } from "../../fixtures/people"
import { typeKeys } from "../../stories/typing"
import { matchPerson, peoplePage, personActionMessage, personActions, type PersonActionId, type PersonActionInput, type PersonRow } from "./people"

/* R12-10 · the admin People page: `peoplePage` (the page's fixed parts, the same the app's
   /admin/people uses, R17-06) on ListPage in AdminPage. Filter cards (All, Paying, Sponsored,
   Trial, Needs attention) whose counts follow the search; search by name or email; Filters (a
   popover, R13-06: plan, status, last active, created, partner; Apply and Reset) mirrored by chips
   on their own row (R13-04); the Plan column (the partner over the kind, R16-06); no row selection
   for now (R16-06); each row's ⋯ menu; a row click opens the person (a stand-in here). Loading and
   error are ListPage's own (Templates › ListPage). 150 invented people (fixtures/people.ts). */
/** The fixtures' today, so the date presets and chips read the same every day. */
const TODAY = PEOPLE_NOW.toISOString().slice(0, 10)
const page = peoplePage({ href: (p) => `/admin/people/${p.id}`, linkAs: StubLink, now: PEOPLE_NOW, partners: PARTNERS, today: TODAY })
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function PeoplePage({ initialRows = people }: { initialRows?: PersonRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [state, setState] = useState<ListState>(() => defaultListState(page.config))
  const [status, setStatus] = useState<string>()
  const [opened, setOpened] = useState<PersonRow | null>(null)

  async function run(id: PersonActionId, ps: PersonRow[], input: PersonActionInput) {
    await wait(400)
    const ids = new Set(ps.map((p) => p.id))
    const update = (patch: Partial<PersonRow>) => setRows((all) => all.map((p) => (ids.has(p.id) ? { ...p, ...patch } : p)))
    if (id === "unlock" || id === "enable") update({ status: "active" })
    else if (id === "resetMfa") update({ mfaPhone: false })
    else if (id === "changePlan") update({ plan: input.plan ?? "direct", partner: null })
    else if (id === "disable" || id === "disableMany") update({ status: "disabled" })
    setStatus(personActionMessage(id, ps, input))
  }

  return (
    <AdminFrame>
      <AdminPage current="people" linkAs={StubLink} title={page.title} description={page.description}>
        {opened && (
          <Card className="flex-row items-center justify-between gap-4 px-5 py-4" data-testid="person-stand-in">
            <span className="text-sm font-medium">
              Person page (stand-in): <strong>{opened.name}</strong> · {opened.email}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOpened(null)}>
              Back to People
            </Button>
          </Card>
        )}
        <ListPage
          {...page.list}
          rows={rows}
          state={state}
          onStateChange={(next) => {
            setStatus(undefined)
            setState(next)
          }}
          onRowClick={setOpened}
          rowActions={(p) => personActions(p, { run, previewPlan: previewPlanChange })}
          status={status}
        />
      </AdminPage>
    </AdminFrame>
  )
}

const meta = {
  component: PeoplePage,
  parameters: { layout: "fullscreen" },
  tags: ["r12-10", "r13-04", "r13-06"],
} satisfies Meta<typeof PeoplePage>

export default meta
type Story = StoryObj<typeof meta>

const count = (pred: (p: PersonRow) => boolean) => people.filter(pred).length

/** Filter and find; one Plan column; no selection. */
export const Default: Story = {
  name: "Filter and find",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expectCollapseInView(canvasElement)
    const cards = c.getByRole("radiogroup", { name: "People: segments" })
    await expect(within(cards).getByRole("radio", { name: /All people/ })).toHaveTextContent(String(people.length))
    // A card filters the table and its count is the result count.
    const trials = count((p) => p.plan === "trial")
    await userEvent.click(within(cards).getByRole("radio", { name: /Trial/ }))
    await expect(c.getByText(`${trials} people`)).toBeInTheDocument()
    // Counts follow the search.
    await userEvent.click(within(cards).getByRole("radio", { name: /All people/ }))
    await typeKeys(c.getByRole("searchbox", { name: "Search people" }), "smith")
    const smiths = people.filter((p) => matchPerson(p, "smith"))
    await waitFor(() => expect(c.getByText(`${smiths.length} ${smiths.length === 1 ? "person" : "people"}`)).toBeInTheDocument())
    await expect(within(cards).getByRole("radio", { name: /Sponsored/ })).toHaveTextContent(String(smiths.filter((p) => p.plan === "sponsored").length))
    await userEvent.click(c.getByRole("button", { name: "Clear search" }))
    // One Plan column: a sponsored person shows their partner over the kind; no Partner column.
    const headers = [...canvasElement.querySelectorAll("thead th")].map((th) => th.textContent?.trim())
    await expect(headers).toContain("Plan")
    await expect(headers).not.toContain("Partner")
    await userEvent.click(within(cards).getByRole("radio", { name: /Sponsored/ }))
    const sponsored = people.find((p) => p.plan === "sponsored")!
    await expect(c.getAllByText(sponsored.partner!).length).toBeGreaterThan(0)
    // No row selection for now (R16-06).
    await expect(c.queryByRole("checkbox", { name: "Select all on this page" })).toBeNull()
  },
}

/** Filters: multi-selects and date ranges, applied together, chips mirror them. */
export const Filters: Story = {
  name: "Filters · applied together",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    // No filter, no chips row.
    await expect(canvasElement.querySelector("[data-slot=filter-chips]")).toBeNull()
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    const pop = await body.findByRole("dialog", { name: "Filters" })
    // Plan: a multi-select, its trigger counts the choices.
    await userEvent.click(within(pop).getByRole("button", { name: "Plan" }))
    const planList = await body.findByRole("group", { name: "Plan" })
    await userEvent.click(within(planList).getByRole("checkbox", { name: "Direct" }))
    await userEvent.click(within(planList).getByRole("checkbox", { name: "Trial" }))
    await userEvent.keyboard("{Escape}")
    await expect(within(pop).getByRole("button", { name: "Plan" })).toHaveTextContent("Direct, Trial")
    await expect(within(pop).getByRole("button", { name: "Plan" })).toHaveTextContent("2 chosen")
    // Last active: a preset.
    const lastActive = within(pop).getByRole("group", { name: "Last active" })
    await userEvent.click(within(lastActive).getByRole("button", { name: "Last 30 days" }))
    await expect(within(lastActive).getByRole("button", { name: "Last 30 days" })).toHaveAttribute("aria-pressed", "true")
    // Nothing changes until Apply.
    await expect(c.getByText(`${people.length} people`)).toBeInTheDocument()
    await userEvent.click(within(pop).getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Filters" })).toBeNull())
    const range = presetRange("last30", TODAY)
    const n = people.filter((p) => (p.plan === "direct" || p.plan === "trial") && inRange(p.lastActiveAt, range)).length
    await expect(c.getByText(`${n} ${n === 1 ? "person" : "people"}`)).toBeInTheDocument()
    // The chips: their own row, one per value, the range named by its preset; Clear all at the end.
    const chips = c.getByRole("group", { name: "Applied filters" })
    await expect(within(chips).getAllByRole("button", { name: /^Remove filter/ })).toHaveLength(3)
    await expect(within(chips).getByRole("button", { name: "Remove filter Last active: Last 30 days" })).toBeInTheDocument()
    await expect(c.getByRole("button", { name: /^Filters/ })).toHaveTextContent("3 applied")
    await userEvent.click(within(chips).getByRole("button", { name: "Remove filter Plan: Trial" }))
    await expect(c.getByRole("button", { name: /^Filters/ })).toHaveTextContent("2 applied")
    // The popover opens on what's applied; Reset empties it, Apply clears.
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    const again = await body.findByRole("dialog", { name: "Filters" })
    await expect(within(again).getByRole("button", { name: "Plan" })).toHaveTextContent("Direct")
    await userEvent.click(within(again).getByRole("button", { name: "Reset" }))
    await userEvent.click(within(again).getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=filter-chips]")).toBeNull())
    await expect(c.getByText(`${people.length} people`)).toBeInTheDocument()
  },
}

export const FiltersOpen: Story = {
  name: "Filters popover open",
  tags: ["!autodocs"],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: /^Filters/ }))
    await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "Filters" })
  },
}

/** Change plan: the API's Stripe preview, no manual-plan note. */
export const ChangePlanPreview: Story = {
  name: "Change plan · Stripe preview",
  tags: ["r13-08"],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const row = within(c.getByRole("table", { name: "People" })).getAllByRole("row").find((r) => r.textContent?.includes("Trial") && r.textContent.includes("Disabled") === false)!
    const name = within(row).getAllByRole("link")[0].textContent!
    await userEvent.click(within(row).getByRole("button", { name: `Actions for ${name}` }))
    await userEvent.click(await body.findByRole("menuitem", { name: /Change plan/ }))
    const dialog = await body.findByRole("alertdialog", { name: `Change ${name}'s plan` })
    await expect(dialog).not.toHaveTextContent("Stripe isn't changed")
    await waitFor(() => expect(within(dialog).getByText(/charged today/)).toBeInTheDocument())
    await expect(dialog).toHaveTextContent("The next invoice is $99.00")
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
  },
}

/** Row menu: confirm a destructive action, the row changes in place. */
export const RowMenuAndConfirm: Story = {
  name: "Row menu · a destructive action",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const first = within(c.getByRole("table", { name: "People" })).getAllByRole("row")[1]
    const name = within(first).getAllByRole("link")[0].textContent!
    await userEvent.click(within(first).getByRole("button", { name: `Actions for ${name}` }))
    const menu = await body.findByRole("menu", { name: `Actions for ${name}` })
    await expect(within(menu).getAllByRole("menuitem").at(-1)).toHaveTextContent("Disable account")
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Disable account/ }))
    const dialog = await body.findByRole("alertdialog", { name: `Disable ${name}'s account?` })
    await typeKeys(within(dialog).getByRole("textbox", { name: /Reason/ }), "Owner asked by phone")
    await userEvent.click(within(dialog).getByRole("button", { name: "Disable account" }))
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    await expect(c.getByRole("status")).toHaveTextContent(`${name}'s account is disabled.`)
    await expect(within(first).getByText("Disabled")).toBeInTheDocument()
  },
}

export const RowClick: Story = {
  name: "A row click opens the person",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const row = within(c.getByRole("table", { name: "People" })).getAllByRole("row")[3]
    const name = within(row).getAllByRole("link")[0].textContent!
    await userEvent.click(within(row).getAllByRole("cell")[2])
    await expect(c.getByTestId("person-stand-in")).toHaveTextContent(name)
  },
}

export const Empty: Story = { name: "Empty (no one yet)", args: { initialRows: [] } }
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } } }
export const At1440: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1440" } } }
