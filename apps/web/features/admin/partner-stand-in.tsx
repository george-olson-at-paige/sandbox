"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CYCLE_LABEL, formatCents, formatCount, formatDayNear, possessive } from "@paige/ui/lib/format"
import Link from "next/link"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { PartnerLogo } from "@paige/ui/admin/partner-logo"
import {
  PARTNER_KIND_LABEL,
  PARTNER_STATUS,
  partnerStatus,
  planName,
  planStatus,
  SETUP_ISSUE_LABEL,
  setupIssues,
  type PartnerPlan,
  type PartnerRow,
} from "@paige/ui/admin/pages/partners"
import { PartnerRevShareSection, type PartnerRevShareActions } from "@paige/ui/admin/rev-share"
import { Button } from "@paige/ui/components/actions/button"
import { Badge } from "@paige/ui/components/display/badge"
import { Card } from "@paige/ui/components/display/card"
import { DataTable, type DataTableColumn } from "@paige/ui/components/display/data-table"
import { ConfirmDialog } from "@paige/ui/components/overlays/confirm-dialog"

import { PARTNERS_TODAY, revShareFor, saveRevShareOverride } from "@paige/ui/fixtures/partners"
import { AdminScreen } from "./admin-screen"
import { listHref } from "./use-list-url-state"

/* The stand-in partner page (R13-22, REVIEW-15): the partner's facts and plans, its Rev share
   section (R15-11, built), the sections the real page will have listed as placeholders (R15-05,
   deferred: Plans with prices, launch dates and Stripe; Offers; Preferred organizations for
   gifting; Branding), and Deactivate partner last (REVIEW-15 Decided (c): destructive, confirmed,
   a reason for the audit trail as every support action has). The way back keeps the list as it
   was left. Fixtures only. */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const planColumns: DataTableColumn<PartnerPlan>[] = [
  { id: "plan", header: "Plan", cell: (p) => <span className="font-medium">{planName(p)}</span> },
  { id: "slug", header: "Signup slug", cell: (p) => (p.slug ? <code className="font-mono text-xs">{p.slug}</code> : <span className="text-muted-foreground">—</span>) },
  {
    id: "status",
    header: "Status",
    cell: (p) => {
      const s = planStatus(p, PARTNERS_TODAY)
      return s.kind === "live" ? "Live" : s.kind === "scheduled" ? `Starts ${formatDayNear(s.startsAt, PARTNERS_TODAY)}` : "Not live"
    },
  },
  { id: "cycle", header: "Cycle", cell: (p) => CYCLE_LABEL[p.cycle] },
  { id: "price", header: "Member's price", numeric: true, cell: (p) => formatCents(p.priceCents) },
  { id: "stripe", header: "Stripe price", cell: (p) => (p.stripePriceId ? <code className="font-mono text-xs">{p.stripePriceId}</code> : <span className="text-muted-foreground">None yet</span>) },
  { id: "people", header: "People", numeric: true, cell: (p) => formatCount(p.people) },
]

/** The real page's sections not built in this round (R15-05, deferred). */
const LATER: Array<[string, string]> = [
  ["Plans", "Prices, launch dates and the Stripe prices behind each plan; who keeps an old price."],
  ["Offers", "The ad strip offers, as Manage offers on the list does today."],
  ["Preferred organizations for gifting", "The organizations this partner's people can give to."],
  ["Branding", "The banner logo and how Paige co-brands for the partner."],
]

const revShareActions: PartnerRevShareActions = {
  setPlanEnabled: async (partner, planId, enabled) => {
    await wait(400)
    const next = { ...partner, plans: partner.plans.map((p) => (p.id === planId ? { ...p, revShare: enabled } : p)) }
    return { revShare: revShareFor(next), plans: next.plans }
  },
  saveOverride: async (partner, params) => ({ revShare: await saveRevShareOverride(partner, params) }),
  useDefaults: async (partner) => ({ revShare: await saveRevShareOverride(partner, null) }),
}

export function PartnerStandIn({ partner: initial }: { partner: PartnerRow }) {
  const list = adminHref("partners")
  const [partner, setPartner] = useState(initial)
  const [deactivating, setDeactivating] = useState(false)
  // The stored list URL is this tab's: read after hydration so the server and client agree.
  const [back, setBack] = useState<string>(list)
  useEffect(() => setBack(listHref(list, "partners")), [list])
  const status = PARTNER_STATUS[partnerStatus(partner)]
  const issues = setupIssues(partner)
  const facts: Array<[string, ReactNode]> = [
    ["Type", partner.kind ? PARTNER_KIND_LABEL[partner.kind] : "Not set"],
    ["Status", <Badge key="s" tone={status.tone} appearance={status.outline ? "outline" : "soft"}>{status.label}</Badge>],
    ["Needs", issues.length ? issues.map((i) => SETUP_ISSUE_LABEL[i]).join(", ") : "Nothing"],
    ["People", formatCount(partner.people)],
  ]
  return (
    <AdminScreen
      current="partners"
      title={partner.name}
      description={partner.kind ? PARTNER_KIND_LABEL[partner.kind] : "Partner"}
      actions={
        <>
          <Link href={back} className="rounded-sm text-sm font-semibold text-primary underline-offset-4 focus-ring hover:underline">
            Back to Partners
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link href={`${adminHref("people")}?partner=${encodeURIComponent(partner.key)}`}>View people</Link>
          </Button>
        </>
      }
    >
      <Card className="gap-4 px-6 py-5">
        <h2 className="text-base font-semibold text-foreground-strong">Partner</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <PartnerLogo partner={partner} size="lg" />
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:col-span-3 md:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium text-card-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
      <DataTable rows={partner.plans} columns={planColumns} getRowId={(p) => p.id} label="Plans" title="Plans" headingLevel={2} emptyMessage="No plans set up yet." columnsMenu={false} maxHeight="none" />
      <PartnerRevShareSection
        partner={partner}
        revShare={revShareFor(partner)}
        actions={revShareActions}
        statementHref={`${adminHref("reporting")}/rev-share?partner=${encodeURIComponent(partner.key)}`}
        linkAs={Link}
      />
      <Card variant="placeholder" className="gap-3 px-6 py-5" data-slot="partner-later">
        <h2 className="text-base font-semibold text-foreground-strong">Later on this page</h2>
        <ul className="flex flex-col gap-2">
          {LATER.map(([title, line]) => (
            <li key={title} className="text-sm font-medium text-muted-foreground">
              <span className="font-semibold text-card-foreground">{title}</span> · {line}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="gap-3 px-6 py-5" data-slot="partner-deactivate">
        <h2 className="text-base font-semibold text-foreground-strong">Deactivate partner</h2>
        {partner.active ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">Marks the partnership as ended. The partner shows as Inactive on the list.</p>
            <div>
              <Button variant="secondary" onClick={() => setDeactivating(true)}>
                Deactivate partner
              </Button>
            </div>
          </>
        ) : (
          <p role="status" className="text-sm font-medium text-muted-foreground">
            This partnership has ended. {partner.name} shows as Inactive.
          </p>
        )}
      </Card>
      <ConfirmDialog
        open={deactivating}
        onOpenChange={setDeactivating}
        title={`Deactivate ${partner.name}?`}
        description={`${possessive(partner.name)} partnership is marked as ended and it shows as Inactive on the Partners list.`}
        confirmLabel="Deactivate partner"
        reason="required"
        onConfirm={async () => {
          await wait(600)
          setPartner((p) => ({ ...p, active: false }))
        }}
      />
    </AdminScreen>
  )
}
