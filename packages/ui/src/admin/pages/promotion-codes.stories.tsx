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
import { promotionCodes, SUBSCRIPTION_PARTNERS, SUBSCRIPTIONS_TODAY } from "../../fixtures/subscriptions"
import { typeKeys } from "../../stories/typing"
import { codeActions, promotionCodesPage } from "./promotion-codes"
import { promotionQuery, type PromotionCodeRow } from "../subscription-rules"

/* R16-05 · Billing › Promotion codes: `promotionCodesPage` (the page's fixed parts, the same the
   app's /admin/billing/promotion-codes uses, R17-06) on ListPage in AdminPage. Stripe's promotion
   codes, without the Vue page's code map. Filter cards (Active, In use, Partner, Inactive, All
   codes), search by code, partner or program, Filters (for, takes off, how long, created), each
   row's ⋯ menu; a row click opens Subscriptions filtered to the code (a stand-in here). Loading
   and error are ListPage's own (Templates › ListPage). Live counts come from the same invented
   subscriptions (fixtures/subscriptions.ts). */
const subscriptionsHref = (c: PromotionCodeRow) => `/admin/billing/subscriptions?${promotionQuery(c.code)}`
const page = promotionCodesPage({ subscriptionsHref, linkAs: StubLink, partners: SUBSCRIPTION_PARTNERS, today: SUBSCRIPTIONS_TODAY })

function PromotionCodesPage({ rows = promotionCodes }: { rows?: PromotionCodeRow[] }) {
  const [state, setState] = useState<ListState>(() => defaultListState(page.config))
  const [opened, setOpened] = useState<PromotionCodeRow | null>(null)
  return (
    <AdminFrame>
      <AdminPage current="promotionCodes" linkAs={StubLink} title={page.title} description={page.description}>
        {opened && (
          <Card className="flex-row items-center justify-between gap-4 px-5 py-4" data-testid="subscriptions-stand-in">
            <span className="text-sm font-medium">
              Subscriptions (stand-in), filtered to <strong>{opened.code}</strong>: {opened.live} live
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOpened(null)}>
              Back to Promotion codes
            </Button>
          </Card>
        )}
        <ListPage {...page.list} rows={rows} state={state} onStateChange={setState} onRowClick={setOpened} rowActions={(c) => codeActions(c, { subscriptionsHref, partnerHref: (id) => `/admin/partners/${id}` })} />
      </AdminPage>
    </AdminFrame>
  )
}

const meta = {
  component: PromotionCodesPage,
  parameters: { layout: "fullscreen" },
  tags: ["r16-05"],
} satisfies Meta<typeof PromotionCodesPage>

export default meta
type Story = StoryObj<typeof meta>

const count = (pred: (c: PromotionCodeRow) => boolean) => promotionCodes.filter(pred).length
const word = (n: number) => `${n} ${n === 1 ? "code" : "codes"}`

/** Filter, find and open a code's subscriptions. */
export const Default: Story = {
  name: "Filter, find and open",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expectCollapseInView(canvasElement)
    const cards = c.getByRole("radiogroup", { name: "Promotion codes: segments" })
    const active = count((x) => x.status === "active")
    await expect(within(cards).getByRole("radio", { name: /^Active/ })).toHaveTextContent(String(active))
    await expect(c.getByText(word(active))).toBeInTheDocument()
    // Inactive takes in codes Stripe no longer holds.
    await userEvent.click(within(cards).getByRole("radio", { name: /^Inactive/ }))
    await expect(c.getByText(word(count((x) => x.status !== "active")))).toBeInTheDocument()
    await expect(c.getByText("Not in Stripe")).toBeInTheDocument()
    // Search by partner.
    await userEvent.click(within(cards).getByRole("radio", { name: /All codes/ }))
    await typeKeys(c.getByRole("searchbox", { name: "Search promotion codes" }), "cedar")
    await waitFor(() => expect(c.getByText("1 code")).toBeInTheDocument())
    // The code links to its subscriptions; the row opens them.
    await expect(c.getByRole("link", { name: "CEDARVIP" })).toHaveAttribute("href", "/admin/billing/subscriptions?promotion=CEDARVIP")
    await userEvent.click(c.getByRole("link", { name: "CEDARVIP" }).closest("tr")!.querySelector("td:nth-child(3)")!)
    await expect(c.getByTestId("subscriptions-stand-in")).toHaveTextContent("filtered to CEDARVIP")
  },
}

export const RowMenu: Story = {
  name: "Row menu: copy the code, then Go to",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(c.getByRole("radiogroup", { name: "Promotion codes: segments" })).getByRole("radio", { name: /All codes/ }))
    await userEvent.click(c.getByRole("button", { name: "Actions for CEDARVIP" }))
    const menu = await body.findByRole("menu")
    const items = within(menu).getAllByRole("menuitem").map((i) => i.textContent)
    await expect(items[0]).toContain("Copy code")
    await expect(items.slice(1).join(" ")).toContain("View subscriptions")
    await expect(items.slice(1).join(" ")).toContain("View Cedar Trust")
    await userEvent.keyboard("{Escape}")
  },
}

export const Empty: Story = { name: "Empty (no codes yet)", args: { rows: [] } }
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } } }
