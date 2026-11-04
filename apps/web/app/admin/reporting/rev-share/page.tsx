import { RevShareStatementStandIn } from "@/features/admin/rev-share-statement-stand-in"
import { partners } from "@paige/ui/fixtures/partners"

/* /admin/reporting/rev-share (R15-03): a stand-in for the rev share statement, filtered to a
   partner by ?partner=<key> (the API has the statement endpoint, GetRevShareStatement, on
   admin-site). The real page is Reporting's, designed later. */
export default async function AdminRevShareStatementPage({ searchParams }: { searchParams: Promise<{ partner?: string }> }) {
  const { partner: key } = await searchParams
  const partner = key ? (partners.find((p) => p.key === key) ?? null) : null
  return <RevShareStatementStandIn partner={partner} requestedKey={key ?? null} />
}
