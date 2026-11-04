import { notFound } from "next/navigation"

import { PartnerStandIn } from "@/features/admin/partner-stand-in"
import { partners } from "@paige/ui/fixtures/partners"

/* /admin/partners/[slug] (R13-22): the stand-in partner page a Partners row opens. The segment is
   the partner's key (a slug of its name), not one of its offers' signup slugs. The real page, the
   jumping-off point into the partner's people, revenue, subscriptions and signups, comes later. */
export default async function AdminPartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const partner = partners.find((p) => p.key === slug)
  if (!partner) notFound()
  return <PartnerStandIn partner={partner} />
}
