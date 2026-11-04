import { Suspense } from "react"

import { PeopleScreen } from "@/features/admin/people-screen"
import { people } from "@paige/ui/fixtures/people"

/* /admin/people (R12-10): the list page pattern on people. The screen reads its state from the
   query string (useSearchParams), so it renders inside Suspense; the fallback is nothing for the
   moment the query is read on the client. */
export default function AdminPeoplePage() {
  return (
    <Suspense>
      <PeopleScreen initial={people} />
    </Suspense>
  )
}
