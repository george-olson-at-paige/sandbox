import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { defaultListState, type ListState } from "../../lib/list-query"
import { Button } from "../../components/actions/button"
import { AdminPage } from "../../templates/admin-page"
import { ListPage } from "../../templates/list-page"
import { AdminFrame, expectCollapseInView } from "../../stories/admin-frame"
import { StubLink } from "../../stories/fixtures"
import { typeKeys } from "../../stories/typing"
import { planCatalog, PROMOTION_CODES, SUBSCRIPTION_PARTNERS, subscriptionDetail, subscriptions, SUBSCRIPTIONS_TODAY } from "../../fixtures/subscriptions"
import { isLive, needsAttention, type SubscriptionRow } from "../subscription-rules"
import { subscriptionActions, SubscriptionDetailSections, subscriptionsPage } from "./subscriptions"

/* R16-01, R16-03 · Billing › Subscriptions: `subscriptionsPage` (the page's fixed parts, the same
   the app's /admin/billing/subscriptions uses, R17-06) on ListPage in AdminPage. Filter cards
   (Live, Direct, Partner, Ending, Needs attention), search by name, email or subscription id,
   Filters (plan, status, offered by, promotion code, renews, started); Plans links here with the
   Plan filter set (`FromAPlan`). A row opens the subscription's page (its body is
   `SubscriptionDetailSections`, the Details stories). Loading and error are ListPage's own
   (Templates › ListPage). ~175 invented subscriptions (fixtures/subscriptions.ts). */
const personHref = (id: string) => `/admin/people/${id}`
const partnerHref = (id: string) => `/admin/partners/${id}`
const page = subscriptionsPage({ personHref, linkAs: StubLink, catalog: planCatalog, partners: SUBSCRIPTION_PARTNERS, codes: PROMOTION_CODES, today: SUBSCRIPTIONS_TODAY })

function SubscriptionsPage({ rows = subscriptions, plan }: { rows?: SubscriptionRow[]; plan?: string }) {
  const [state, setState] = useState<ListState>(() => ({ ...defaultListState(page.config), filters: plan ? { plan: [plan] } : ({} as Record<string, string[]>) }))
  const [opened, setOpened] = useState<SubscriptionRow | null>(null)
  if (opened)
    return (
      <AdminFrame>
        <AdminPage
          current="subscriptions"
          linkAs={StubLink}
          title={opened.person ? `${opened.person.name}'s subscription` : "Subscription"}
          description={opened.price.plan}
          actions={
            <Button variant="secondary" size="sm" onClick={() => setOpened(null)}>
              Back to Subscriptions
            </Button>
          }
        >
          <SubscriptionDetailSections detail={subscriptionDetail(opened)} today={SUBSCRIPTIONS_TODAY} personHref={personHref} partnerHref={partnerHref} planHref={(id) => `/admin/billing/subscriptions?plan=${id}`} linkAs={StubLink} />
        </AdminPage>
      </AdminFrame>
    )
  return (
    <AdminFrame>
      <AdminPage current="subscriptions" linkAs={StubLink} title={page.title} description={page.description}>
        <ListPage {...page.list} rows={rows} state={state} onStateChange={setState} onRowClick={setOpened} rowActions={(r) => subscriptionActions(r, { personHref, partnerHref })} />
      </AdminPage>
    </AdminFrame>
  )
}

const meta = {
  component: SubscriptionsPage,
  parameters: { layout: "fullscreen" },
  tags: ["r16-01", "r16-03"],
} satisfies Meta<typeof SubscriptionsPage>

export default meta
type Story = StoryObj<typeof meta>

const count = (pred: (r: SubscriptionRow) => boolean) => subscriptions.filter(pred).length
const word = (n: number) => `${n} ${n === 1 ? "subscription" : "subscriptions"}`

export const Default: Story = {
  name: "Filter, find and open a subscription",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expectCollapseInView(canvasElement)
    const cards = c.getByRole("radiogroup", { name: "Subscriptions: segments" })
    await expect(within(cards).getByRole("radio", { name: /^Live/ })).toHaveTextContent(String(count(isLive)))
    await expect(c.getByText(word(count(isLive)))).toBeInTheDocument()
    await expect(within(cards).getByRole("radio", { name: /^Direct/ })).toHaveTextContent(String(count((r) => isLive(r) && r.price.offeredBy.kind === "paige")))
    await userEvent.click(within(cards).getByRole("radio", { name: /Needs attention/ }))
    await expect(c.getByText(word(count(needsAttention)))).toBeInTheDocument()
    // A past-due row's last payment says Failed; the row opens the subscription's page.
    const failed = canvasElement.querySelector("[data-slot=last-payment][data-status=failed]")!
    await expect(failed).toHaveTextContent("Failed")
    await userEvent.click(failed.closest("tr")!.querySelector("td:nth-child(3)")!)
    await expect(c.getByRole("heading", { name: "Payments" })).toBeInTheDocument()
    await expect(canvasElement.querySelector("[data-slot=subscription-facts]")).toHaveTextContent("Past due")
  },
}

/** From Plans: filtered to one plan, a chip with Clear all. */
export const FromAPlan: Story = {
  name: "From Plans · one plan",
  args: { plan: "cedar-vip" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const onIt = count((r) => isLive(r) && r.price.id === "cedar-vip")
    await expect(c.getByText(word(onIt))).toBeInTheDocument()
    await expect(canvasElement.querySelector("[data-slot=filter-chips]")).toHaveTextContent("Cedar Trust · VIP")
    await userEvent.click(c.getByRole("button", { name: "Clear all" }))
    await expect(c.getByText(word(count(isLive)))).toBeInTheDocument()
  },
}

/** Row menu: copy the id, then Go to; a comp can't be copied, with why. */
export const RowMenu: Story = {
  name: "Row menu · a comp can't copy",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const comp = subscriptions.find((r) => r.comp && r.person)!
    await typeKeys(c.getByRole("searchbox", { name: "Search subscriptions" }), comp.person!.email)
    await waitFor(() => expect(c.getByText("1 subscription")).toBeInTheDocument())
    await userEvent.click(c.getByRole("button", { name: `Actions for ${comp.person!.name}` }))
    const menu = await body.findByRole("menu")
    const copy = within(menu).getByRole("menuitem", { name: /Copy subscription id/ })
    await expect(copy).toHaveAttribute("aria-disabled", "true")
    await expect(copy).toHaveTextContent("A comp has no Stripe subscription")
    await expect(within(menu).getByRole("menuitem", { name: /View person/ })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
  },
}

export const Empty: Story = { name: "Empty (no one yet)", args: { rows: [] } }
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } } }

/* The subscription's page body, one story per kind of subscription. */
function Details({ row }: { row: SubscriptionRow }) {
  return (
    <AdminFrame>
      <AdminPage current="subscriptions" linkAs={StubLink} title={row.person ? `${row.person.name}'s subscription` : "Subscription"} description={row.price.plan}>
        <SubscriptionDetailSections detail={subscriptionDetail(row)} today={SUBSCRIPTIONS_TODAY} personHref={personHref} partnerHref={partnerHref} planHref={(id) => `/admin/billing/subscriptions?plan=${id}`} linkAs={StubLink} />
      </AdminPage>
    </AdminFrame>
  )
}
const pick = (pred: (r: SubscriptionRow) => boolean) => subscriptions.find(pred)!

/** Details: past due (the failed renewal first) */
export const DetailsPastDue: Story = {
  name: "Details · past due",
  render: () => <Details row={pick((r) => r.status === "past-due" && r.price.id === "membership-annual")} />,
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector("tbody tr")!
    await expect(first).toHaveTextContent("Failed")
  },
}
/** Details: a partner's $0 plan (no payments, and why) */
export const DetailsPartner: Story = {
  name: "Details · a partner's $0 plan",
  render: () => <Details row={pick((r) => r.price.id === "cedar-vip")} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("No payments: Cedar Trust's plan is free to its members.")).toBeInTheDocument()
  },
}
export const DetailsPromotion: Story = { name: "Details: a promotion code", render: () => <Details row={pick((r) => r.promotion !== null)} /> }
export const DetailsComp: Story = { name: "Details: a comp (no Stripe)", render: () => <Details row={pick((r) => r.comp !== null)} /> }
export const DetailsCanceled: Story = { name: "Details: canceled", render: () => <Details row={pick((r) => r.status === "canceled" && r.paysCents > 0)} /> }
export const DetailsTrial: Story = { name: "Details: in a trial", render: () => <Details row={pick((r) => r.status === "trial")} /> }
