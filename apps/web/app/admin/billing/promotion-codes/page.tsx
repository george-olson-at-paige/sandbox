import { Suspense } from "react"

import { PromotionCodesScreen } from "@/features/admin/promotion-codes-screen"
import { promotionCodes } from "@paige/ui/fixtures/subscriptions"

/* /admin/billing/promotion-codes (R16-05): Stripe's promotion codes on the common list page. The
   screen reads its state from the query string (useSearchParams), so it renders inside Suspense. */
export default function AdminPromotionCodesPage() {
  return (
    <Suspense>
      <PromotionCodesScreen rows={promotionCodes} />
    </Suspense>
  )
}
