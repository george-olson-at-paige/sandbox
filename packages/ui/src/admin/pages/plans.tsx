"use client"

import type { ElementType } from "react"
import { Building2, Copy, ListFilter } from "lucide-react"

import type { ListAction } from "../../components/actions/row-actions"
import { copyText } from "../../components/actions/copy-button"
import type { ActionResult } from "../../components/overlays/confirm-dialog"
import { Badge } from "../../components/display/badge"
import type { DataTableColumn } from "../../components/display/data-table"
import { CYCLE_LABEL, formatCount } from "../../lib/format"
import { sortValuesOf, type ListConfig } from "../../lib/list-query"
import { matchPlanPrice, offeredByLabel, planDefaultSort, planFilters, planSegments, type PlanPriceRow } from "../subscription-rules"

/* Billing › Plans, the list's own parts (REVIEW-16 R16-03, the Vue admin's Pricing on the common
   list page): one row per plan price, Paige's or a partner's (partners offer prices, not
   discounts). What the list page pattern is given for plans; the rules are subscription-rules.ts.
   - Columns: Plan (name, a link to its subscriptions; the Stripe price id under it; Grandfathered
     for a kept old price), Offered by, Cycle, Price (the amount alone, so prices line up; R16-06),
     Live, Past due, Ending.
   - Row click and the name open Subscriptions filtered to the price (`?plan=<id>`), as Partners'
     View people opens People: a filter with a chip, not a nested page.
   - Row actions: Go to (the subscriptions, the partner); copy the Stripe price id. Changing a
     price or adding one waits on catalog editing, which has no backend yet. */

const count = formatCount
const muted = (n: number) => <span className="text-muted-foreground">{count(n)}</span>

/** The Plans columns. `subscriptionsHref` is Subscriptions filtered to a price.
    R20-25: the list is resizable, so each column states a width (the last takes what is left);
    Price is a typed `currency` column (cents in, the kind formats and sorts). The counts keep
    their cells: a zero reads muted and past due reads in the attention ink, which a kind
    wouldn't say. */
function planColumns({ subscriptionsHref, linkAs: Link = "a" }: { subscriptionsHref: (p: PlanPriceRow) => string; linkAs?: ElementType }): DataTableColumn<PlanPriceRow>[] {
  return [
    {
      id: "plan",
      header: "Plan",
      width: 240,
      minWidth: 160,
      sortValue: (p) => p.plan,
      cell: (p) => (
        // A long plan name ("Northwind Financial · Employee") wraps within the column; the price id truncates (the full id on hover).
        <span className="flex min-w-0 max-w-full flex-col items-start gap-0.5">
          <span className="flex flex-wrap items-center gap-1.5 whitespace-normal">
            <Link href={subscriptionsHref(p)} className="w-fit rounded-sm font-medium text-card-foreground focus-ring hover:underline">
              {p.plan}
            </Link>
            {p.grandfathered && (
              <Badge size="xs" tone="neutral" appearance="outline">
                Grandfathered
              </Badge>
            )}
          </span>
          <code className="max-w-full truncate font-mono text-xs text-muted-foreground" title={p.stripePriceId}>
            {p.stripePriceId}
          </code>
        </span>
      ),
    },
    // Wraps within its column (the width is the column's now, not a cap on the span).
    { id: "offeredBy", header: "Offered by", width: 140, sortValue: (p) => offeredByLabel(p.offeredBy), cell: (p) => <span className="block whitespace-normal">{offeredByLabel(p.offeredBy)}</span> },
    // The cycle has its own column and the price is the amount alone, so the prices line up (R16-06, George 2026-10-21).
    { id: "cycle", header: "Cycle", width: 90, sortValue: (p) => CYCLE_LABEL[p.cycle], cell: (p) => CYCLE_LABEL[p.cycle] },
    { id: "price", header: "Price", type: "currency", width: 100, value: (p) => p.cents },
    { id: "live", header: "Live", width: 80, numeric: true, sortValue: (p) => p.live, cell: (p) => (p.live ? <span className="font-semibold">{count(p.live)}</span> : muted(0)) },
    { id: "pastDue", header: "Past due", width: 100, numeric: true, sortValue: (p) => p.pastDue, cell: (p) => (p.pastDue ? <span className="font-medium text-attention-foreground">{count(p.pastDue)}</span> : muted(0)) },
    { id: "ending", header: "Ending", width: 90, numeric: true, sortValue: (p) => p.ending, cell: (p) => (p.ending ? count(p.ending) : muted(0)) },
  ]
}

/** Copies a Stripe price id; `{ error }` when the browser refuses. */
async function copyPriceId(id: string): Promise<ActionResult> {
  return (await copyText(id)) ? undefined : { error: "The browser didn't allow copying. Copy the id from the row by hand." }
}

/** One plan price's row menu: copy the Stripe price id, then Go to (its subscriptions, its partner; R15-14). */
function planActions(p: PlanPriceRow, { subscriptionsHref, partnerHref }: { subscriptionsHref: (p: PlanPriceRow) => string; partnerHref: (partnerId: string) => string }): ListAction[] {
  const actions: ListAction[] = [
    { kind: "action", id: "copyPriceId", group: "Plan", label: "Copy Stripe price id", icon: <Copy aria-hidden />, run: () => copyPriceId(p.stripePriceId) },
    { kind: "link", id: "viewSubscriptions", group: "Go to", label: "View subscriptions", icon: <ListFilter aria-hidden />, href: subscriptionsHref(p) },
  ]
  if (p.offeredBy.kind === "partner") actions.push({ kind: "link", id: "viewPartner", group: "Go to", label: `View ${p.offeredBy.partner}`, icon: <Building2 aria-hidden />, href: partnerHref(p.offeredBy.partnerId) })
  return actions
}

/* R17-06: the Plans page's fixed parts, shared by its story and the app screen so the two can't drift:
   the heading, ListPage's props that don't change, the list state's config (the app keeps it in
   the URL), and what an action says it did. The caller adds the rows, the state and the handlers. */
/** The Plans list: every plan price, Paige's or a partner's, with its live, past-due and ending counts; ListPage's parts for it. */
function plansPage({ subscriptionsHref, linkAs, partners, today }: { subscriptionsHref: (p: PlanPriceRow) => string; linkAs?: ElementType; partners: readonly { id: string; name: string }[]; today: string }) {
  const columns = planColumns({ subscriptionsHref, linkAs })
  const filters = planFilters(partners)
  const search = { match: matchPlanPrice, label: "Search plans", placeholder: "Plan, partner or Stripe price" }
  const config: ListConfig<PlanPriceRow> = { segments: planSegments, filters, search: matchPlanPrice, sortValues: sortValuesOf(columns), defaultSort: planDefaultSort }
  return {
    title: "Plans",
    description: "Every plan's prices, Paige's and partners', and how many people are on each.",
    config,
    copied: (p: PlanPriceRow) => `${p.plan} Stripe price id is copied.`,
    list: { noun: { one: "price", other: "prices" }, label: "Plans", getRowId: (p: PlanPriceRow) => p.id, rowLabel: (p: PlanPriceRow) => p.plan, columns, segments: planSegments, filters, search, defaultSort: planDefaultSort, emptyMessage: "No plans set up yet.", resizable: true, density: "compact" as const, linkAs, today },
  }
}

export { planActions, planColumns, plansPage }
export type { Cycle } from "../../lib/format"
export type { CatalogPrice, OfferedBy, PlanPriceRow } from "../subscription-rules"
