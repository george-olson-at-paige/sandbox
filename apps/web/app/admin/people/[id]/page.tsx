import { notFound } from "next/navigation"

import { PersonStandIn } from "@/features/admin/person-stand-in"
import { people } from "@paige/ui/fixtures/people"

/* /admin/people/[id] (R12-10): the stand-in person page a People row opens. The real person page
   (the Vue admin's PersonAccountPanel: sign-in, account, subscriptions, passing reports, and the
   actions) is designed later; this proves the row click, the deep link and the way back. */
export default async function AdminPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const person = people.find((p) => p.id === id)
  if (!person) notFound()
  return <PersonStandIn person={person} />
}
