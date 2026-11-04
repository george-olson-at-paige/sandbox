import { Suspense } from "react"

import { PartnersScreen } from "@/features/admin/partners-screen"
import { partners } from "@paige/ui/fixtures/partners"

/* /admin/partners (R13-22): the list page pattern on partners. The screen reads its state from the
   query string (useSearchParams), so it renders inside Suspense. */
export default function AdminPartnersPage() {
  return (
    <Suspense>
      <PartnersScreen initial={partners} />
    </Suspense>
  )
}
