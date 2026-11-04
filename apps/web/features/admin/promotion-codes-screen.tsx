"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { codeActions, promotionCodesPage } from "@paige/ui/admin/pages/promotion-codes"
import { promotionQuery, type PromotionCodeRow } from "@paige/ui/admin/subscription-rules"
import { SUBSCRIPTION_PARTNERS, SUBSCRIPTIONS_TODAY } from "@paige/ui/fixtures/subscriptions"
import { ListPage } from "@paige/ui/templates/list-page"

import { AdminScreen } from "./admin-screen"
import { useListUrlState } from "./use-list-url-state"

/* /admin/billing/promotion-codes (R16-05): the common list page over Stripe's promotion codes (the
   Vue admin's Promotion codes); its fixed parts are `promotionCodesPage` (shared with the story,
   R17-06). A row, or its code, opens Subscriptions filtered to the code (?promotion=<code>), as
   Plans opens it filtered to a price. State in the URL (all but the search). Fixtures: the live
   counts come from the same rows Subscriptions lists. */

const subscriptionsHref = (c: PromotionCodeRow) => `${adminHref("subscriptions")}?${promotionQuery(c.code)}`
const partnerHref = (partnerId: string) => `${adminHref("partners")}/${partnerId}`
const page = promotionCodesPage({ subscriptionsHref, linkAs: Link, partners: SUBSCRIPTION_PARTNERS, today: SUBSCRIPTIONS_TODAY })

export function PromotionCodesScreen({ rows }: { rows: PromotionCodeRow[] }) {
  const router = useRouter()
  const [state, setState] = useListUrlState(page.config, "promotion-codes")
  const [status, setStatus] = useState<string>()
  return (
    <AdminScreen current="promotionCodes" title={page.title} description={page.description}>
      <ListPage
        {...page.list}
        rows={rows}
        state={state}
        onStateChange={(next) => {
          setStatus(undefined)
          setState(next)
        }}
        onRowClick={(c) => router.push(subscriptionsHref(c))}
        rowActions={(c) => codeActions(c, { subscriptionsHref, partnerHref })}
        onActionDone={(a, done) => {
          if (a.id === "copyCode" && done[0]) setStatus(page.copied(done[0]))
        }}
        status={status}
      />
    </AdminScreen>
  )
}
