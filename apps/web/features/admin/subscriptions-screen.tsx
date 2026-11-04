"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import type { SubscriptionRow } from "@paige/ui/admin/subscription-rules"
import { subscriptionActions, subscriptionsPage } from "@paige/ui/admin/pages/subscriptions"
import { planCatalog, PROMOTION_CODES, SUBSCRIPTION_PARTNERS, SUBSCRIPTIONS_TODAY } from "@paige/ui/fixtures/subscriptions"
import { ListPage } from "@paige/ui/templates/list-page"

import { AdminScreen } from "./admin-screen"
import { useListUrlState } from "./use-list-url-state"

/* /admin/billing/subscriptions (R16-01, R16-03): the common list page over every subscription
   (the Vue admin's Subscriptions); its fixed parts are `subscriptionsPage` (shared with the story,
   R17-06). Plans and Promotion codes link here with ?plan= and ?promotion=, filters shown as
   chips, so the person can widen them. State in the URL (all but the search). A row opens the
   subscription's page; its menu is copy the id and Go to (R16-01 (6)). Fixtures. */

/** The key the Subscriptions list keeps its state and search under (the details page's way back). */
export const SUBSCRIPTIONS_KEY = "subscriptions"
const personHref = (userId: string) => `${adminHref("people")}/${userId}`
const partnerHref = (partnerId: string) => `${adminHref("partners")}/${partnerId}`
const page = subscriptionsPage({ personHref, linkAs: Link, catalog: planCatalog, partners: SUBSCRIPTION_PARTNERS, codes: PROMOTION_CODES, today: SUBSCRIPTIONS_TODAY })

export function SubscriptionsScreen({ rows }: { rows: SubscriptionRow[] }) {
  const router = useRouter()
  const [state, setState] = useListUrlState(page.config, SUBSCRIPTIONS_KEY)
  const [status, setStatus] = useState<string>()
  return (
    <AdminScreen current="subscriptions" title={page.title} description={page.description}>
      <ListPage
        {...page.list}
        rows={rows}
        state={state}
        onStateChange={(next) => {
          setStatus(undefined)
          setState(next)
        }}
        onRowClick={(r) => router.push(`${adminHref("subscriptions")}/${r.id}`)}
        rowActions={(r) => subscriptionActions(r, { personHref, partnerHref })}
        onActionDone={(a, done) => {
          if (a.id === "copyId" && done[0]) setStatus(page.copied(done[0]))
        }}
        status={status}
      />
    </AdminScreen>
  )
}
