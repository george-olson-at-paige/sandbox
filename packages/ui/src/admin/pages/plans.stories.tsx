import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { defaultListState, type ListState } from "../../lib/list-query"
import { Button } from "../../components/actions/button"
import { Card } from "../../components/display/card"
import { AdminPage } from "../../templates/admin-page"
import { ListPage } from "../../templates/list-page"
import { AdminFrame, expectCollapseInView } from "../../stories/admin-frame"
import { StubLink } from "../../stories/fixtures"
import { planPrices, SUBSCRIPTION_PARTNERS, SUBSCRIPTIONS_TODAY } from "../../fixtures/subscriptions"
import { typeKeys } from "../../stories/typing"
import { planActions, plansPage } from "./plans"
import { planQuery, type PlanPriceRow } from "../subscription-rules"

/* R16-03 · Billing › Plans: `plansPage` (the page's fixed parts, the same the app's
   /admin/billing/plans uses, R17-06) on ListPage in AdminPage. Plan prices, Paige's and partners'
   (partners offer prices, not discounts). Filter cards (Live, Paige, Partner, Grandfathered, Needs
   attention), search by plan, partner or Stripe price, Filters (offered by, cycle), each row's ⋯
   menu; a row click opens Subscriptions filtered to the price (a stand-in here). Loading and error
   are ListPage's own (Templates › ListPage). Counts come from the same invented subscriptions the
   Subscriptions stories list (fixtures/subscriptions.ts). */
const subscriptionsHref = (p: PlanPriceRow) => `/admin/billing/subscriptions?${planQuery(p.id)}`
const page = plansPage({ subscriptionsHref, linkAs: StubLink, partners: SUBSCRIPTION_PARTNERS, today: SUBSCRIPTIONS_TODAY })

function PlansPage({ rows = planPrices }: { rows?: PlanPriceRow[] }) {
  const [state, setState] = useState<ListState>(() => defaultListState(page.config))
  const [opened, setOpened] = useState<PlanPriceRow | null>(null)
  return (
    <AdminFrame>
      <AdminPage current="plans" linkAs={StubLink} title={page.title} description={page.description}>
        {opened && (
          <Card className="flex-row items-center justify-between gap-4 px-5 py-4" data-testid="subscriptions-stand-in">
            <span className="text-sm font-medium">
              Subscriptions (stand-in), filtered to <strong>{opened.plan}</strong>: {opened.live} live
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOpened(null)}>
              Back to Plans
            </Button>
          </Card>
        )}
        <ListPage {...page.list} rows={rows} state={state} onStateChange={setState} onRowClick={setOpened} rowActions={(p) => planActions(p, { subscriptionsHref, partnerHref: (id) => `/admin/partners/${id}` })} />
      </AdminPage>
    </AdminFrame>
  )
}

const meta = {
  component: PlansPage,
  parameters: { layout: "fullscreen" },
  tags: ["r16-03"],
} satisfies Meta<typeof PlansPage>

export default meta
type Story = StoryObj<typeof meta>

const count = (pred: (p: PlanPriceRow) => boolean) => planPrices.filter(pred).length

/** Filter, find and open a plan's subscriptions. */
export const Default: Story = {
  name: "Filter, find and open",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expectCollapseInView(canvasElement)
    const cards = c.getByRole("radiogroup", { name: "Plans: segments" })
    // Live is the default: prices someone is on, most live first.
    const live = count((p) => p.live > 0)
    await expect(within(cards).getByRole("radio", { name: /^Live/ })).toHaveTextContent(String(live))
    await expect(c.getByText(`${live} prices`)).toBeInTheDocument()
    const first = canvasElement.querySelector("tbody tr")!
    await expect(first).toHaveTextContent("Paige Membership")
    // Partner: partners' own prices, $0 or not.
    await userEvent.click(within(cards).getByRole("radio", { name: /^Partner/ }))
    await expect(c.getByText(`${count((p) => p.offeredBy.kind === "partner")} prices`)).toBeInTheDocument()
    // Search by partner.
    await userEvent.click(within(cards).getByRole("radio", { name: /^Live/ }))
    await typeKeys(c.getByRole("searchbox", { name: "Search plans" }), "cedar")
    await waitFor(() => expect(c.getByText("2 prices")).toBeInTheDocument())
    // A row opens its subscriptions; the name is a link to the same place.
    await expect(c.getByRole("link", { name: "Cedar Trust · VIP" })).toHaveAttribute("href", "/admin/billing/subscriptions?plan=cedar-vip")
    await userEvent.click(c.getByText("Cedar Trust · VIP").closest("tr")!.querySelector("td:nth-child(2)")!)
    await expect(c.getByTestId("subscriptions-stand-in")).toHaveTextContent("filtered to Cedar Trust · VIP")
  },
}

/** Row menu: copy the Stripe price id, then Go to. */
export const RowMenu: Story = {
  name: "Row menu · copy, then Go to",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(c.getByRole("button", { name: "Actions for Cedar Trust · VIP" }))
    const menu = await body.findByRole("menu")
    const items = within(menu).getAllByRole("menuitem").map((i) => i.textContent)
    await expect(items[0]).toContain("Copy Stripe price id")
    await expect(items.slice(1).join(" ")).toContain("View subscriptions")
    await expect(items.slice(1).join(" ")).toContain("View Cedar Trust")
    await userEvent.keyboard("{Escape}")
  },
}

export const Empty: Story = { name: "Empty (no plans yet)", args: { rows: [] } }
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } } }
