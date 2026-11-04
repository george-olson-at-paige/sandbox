import { notFound } from "next/navigation"

import { SubscriptionDetailScreen } from "@/features/admin/subscription-detail-screen"
import { subscriptionDetail, subscriptions } from "@paige/ui/fixtures/subscriptions"

/* /admin/billing/subscriptions/[id] (R16-02 (5)): one subscription's details. The segment is the
   subscription's id in our model, not Stripe's (a comp has none). */
export default async function AdminSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = subscriptions.find((s) => s.id === id)
  if (!row) notFound()
  return <SubscriptionDetailScreen detail={subscriptionDetail(row)} />
}
