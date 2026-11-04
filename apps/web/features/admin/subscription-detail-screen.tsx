"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { planQuery } from "@paige/ui/admin/subscription-rules"
import { SubscriptionDetailSections, type SubscriptionDetail } from "@paige/ui/admin/pages/subscriptions"
import { Button } from "@paige/ui/components/actions/button"

import { SUBSCRIPTIONS_TODAY } from "@paige/ui/fixtures/subscriptions"
import { AdminScreen } from "./admin-screen"
import { SUBSCRIPTIONS_KEY } from "./subscriptions-screen"
import { listHref } from "./use-list-url-state"

/* /admin/billing/subscriptions/[id] (R16-02 (5), R16-03): one subscription on a page of its own
   (a page gives Back and a shared link for nothing; a panel beside the list would be a new overlay
   component). The way back returns to Subscriptions as it was left; the plan links to
   Subscriptions filtered to its price. Fixtures. */

export function SubscriptionDetailScreen({ detail }: { detail: SubscriptionDetail }) {
  const list = adminHref("subscriptions")
  // The stored list is this tab's: read after hydration so the server and client agree.
  const [back, setBack] = useState<string>(list)
  useEffect(() => setBack(listHref(list, SUBSCRIPTIONS_KEY)), [list])
  return (
    <AdminScreen
      current="subscriptions"
      title={detail.person ? `${detail.person.name}'s subscription` : "Subscription"}
      description={detail.price.plan}
      actions={
        <>
          <Link href={back} className="rounded-sm text-sm font-semibold text-primary underline-offset-4 focus-ring hover:underline">
            Back to Subscriptions
          </Link>
          {detail.person && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`${adminHref("people")}/${detail.person.userId}`}>View person</Link>
            </Button>
          )}
        </>
      }
    >
      <SubscriptionDetailSections
        detail={detail}
        today={SUBSCRIPTIONS_TODAY}
        personHref={(id) => `${adminHref("people")}/${id}`}
        partnerHref={(id) => `${adminHref("partners")}/${id}`}
        planHref={(priceId) => `${list}?${planQuery(priceId)}`}
        linkAs={Link}
      />
    </AdminScreen>
  )
}
