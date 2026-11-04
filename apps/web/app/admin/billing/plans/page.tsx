import { Suspense } from "react"

import { PlansScreen } from "@/features/admin/plans-screen"
import { planPrices } from "@paige/ui/fixtures/subscriptions"

/* /admin/billing/plans (R16-03): every plan price on the common list page. The screen reads its
   state from the query string (useSearchParams), so it renders inside Suspense. */
export default function AdminPlansPage() {
  return (
    <Suspense>
      <PlansScreen rows={planPrices} />
    </Suspense>
  )
}
