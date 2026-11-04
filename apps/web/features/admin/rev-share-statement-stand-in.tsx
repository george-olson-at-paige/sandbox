"use client"

import Link from "next/link"

import { adminHref } from "@paige/ui/admin/admin-nav"
import type { PartnerRow } from "@paige/ui/admin/pages/partners"
import { Card } from "@paige/ui/components/display/card"

import { AdminScreen } from "./admin-screen"

/* The rev share statement stand-in (R15-03): where Partners' "Rev share statement" and the partner
   page's statement link land, filtered to the partner. The statement itself is Reporting's page,
   designed later on the API's statement endpoint. */
export function RevShareStatementStandIn({ partner, requestedKey }: { partner: PartnerRow | null; requestedKey: string | null }) {
  return (
    <AdminScreen
      current="reporting"
      title="Rev share statement"
      description={partner ? `Filtered to ${partner.name}.` : "All partners."}
      actions={
        partner ? (
          <Link href={`${adminHref("partners")}/${partner.key}`} className="rounded-sm text-sm font-semibold text-primary underline-offset-4 focus-ring hover:underline">
            Back to {partner.name}
          </Link>
        ) : undefined
      }
    >
      <Card variant="placeholder" className="gap-2 px-6 py-5">
        <h2 className="text-base font-semibold text-foreground-strong">Stand-in</h2>
        <p className="text-sm font-medium text-muted-foreground">
          {requestedKey && !partner ? "No partner matches that link. " : ""}The statement (its people, charges and share for a period) is designed with Reporting, on the API&apos;s statement endpoint.
        </p>
      </Card>
    </AdminScreen>
  )
}
