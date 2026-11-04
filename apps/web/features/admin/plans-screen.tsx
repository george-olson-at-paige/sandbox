"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { planActions, plansPage } from "@paige/ui/admin/pages/plans"
import { planQuery, type PlanPriceRow } from "@paige/ui/admin/subscription-rules"
import { SUBSCRIPTION_PARTNERS, SUBSCRIPTIONS_TODAY } from "@paige/ui/fixtures/subscriptions"
import { ListPage } from "@paige/ui/templates/list-page"

import { AdminScreen } from "./admin-screen"
import { useListUrlState } from "./use-list-url-state"

/* /admin/billing/plans (R16-03): the common list page over plan prices, Paige's and partners'
   (the Vue admin's Pricing); its fixed parts are `plansPage` (shared with the story, R17-06). A
   row, or its name, opens Subscriptions filtered to that price (?plan=<id>), as Partners' View
   people opens People. State in the URL (all but the search). Fixtures: the counts are computed
   from the same rows Subscriptions lists. */

const subscriptionsHref = (p: PlanPriceRow) => `${adminHref("subscriptions")}?${planQuery(p.id)}`
const partnerHref = (partnerId: string) => `${adminHref("partners")}/${partnerId}`
const page = plansPage({ subscriptionsHref, linkAs: Link, partners: SUBSCRIPTION_PARTNERS, today: SUBSCRIPTIONS_TODAY })

export function PlansScreen({ rows }: { rows: PlanPriceRow[] }) {
  const router = useRouter()
  const [state, setState] = useListUrlState(page.config, "plans")
  const [status, setStatus] = useState<string>()
  return (
    <AdminScreen current="plans" title={page.title} description={page.description}>
      <ListPage
        {...page.list}
        rows={rows}
        state={state}
        onStateChange={(next) => {
          setStatus(undefined)
          setState(next)
        }}
        onRowClick={(p) => router.push(subscriptionsHref(p))}
        rowActions={(p) => planActions(p, { subscriptionsHref, partnerHref })}
        onActionDone={(a, done) => {
          if (a.id === "copyPriceId" && done[0]) setStatus(page.copied(done[0]))
        }}
        status={status}
      />
    </AdminScreen>
  )
}
