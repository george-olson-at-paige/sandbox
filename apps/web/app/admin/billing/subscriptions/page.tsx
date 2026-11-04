import { Suspense } from "react"

import { SubscriptionsScreen } from "@/features/admin/subscriptions-screen"
import { subscriptions } from "@paige/ui/fixtures/subscriptions"

/* /admin/billing/subscriptions (R16-01, R16-03): every subscription on the common list page. The
   screen reads its state from the query string (useSearchParams), so it renders inside Suspense. */
export default function AdminSubscriptionsPage() {
  return (
    <Suspense>
      <SubscriptionsScreen rows={subscriptions} />
    </Suspense>
  )
}
