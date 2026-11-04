"use client"

import type { ElementType } from "react"
import { Building2, Copy, ListFilter } from "lucide-react"

import type { ListAction } from "../../components/actions/row-actions"
import { copyText } from "../../components/actions/copy-button"
import type { ActionResult } from "../../components/overlays/confirm-dialog"
import { Badge } from "../../components/display/badge"
import type { DataTableColumn } from "../../components/display/data-table"
import { formatCount } from "../../lib/format"
import { sortValuesOf, type ListConfig } from "../../lib/list-query"
import { CODE_STATUS_LABEL, codeDefaultSort, codeFilters, codeForLabel, codeSegments, matchCode, takesOffLabel, type CodeStatus, type PromotionCodeRow } from "../subscription-rules"

/* Billing › Promotion codes, the list's own parts (REVIEW-16 R16-05, the Vue admin's Promotion codes
   on the common list page): Stripe's codes, what each takes off and for how long, who it's for,
   how often it's been redeemed and how many live subscriptions carry it. The Vue page's code map
   (mapped, not mapped, "decide") goes with the price map (R16-03).
   - Columns: Code (a link to its subscriptions), Takes off, For (a partner, a program, or a
     dash), Redeemed, Live, Status, Created (Stripe's `created` on the code, R16-06).
   - Row click and the code open Subscriptions filtered to it (`?promotion=<code>`), as Plans does.
   - Row actions: copy the code, then Go to (its subscriptions, its partner). Creating, changing or
     turning off a code waits on Stripe writes, which the admin plan puts last. */

const count = formatCount
const STATUS_TONE: Record<CodeStatus, { tone: "success" | "neutral"; outline?: boolean }> = { active: { tone: "success" }, inactive: { tone: "neutral" }, gone: { tone: "neutral", outline: true } }

/** The Promotion codes columns. `subscriptionsHref` is Subscriptions filtered to a code.
    R20-25: the list is resizable, so each column states a width (the last takes what is left);
    Redeemed is a typed `count` and Created a typed `date`. Live keeps its cell (a zero reads muted). */
function codeColumns({ subscriptionsHref, linkAs: Link = "a" }: { subscriptionsHref: (c: PromotionCodeRow) => string; linkAs?: ElementType }): DataTableColumn<PromotionCodeRow>[] {
  return [
    {
      id: "code",
      header: "Code",
      width: 140,
      minWidth: 120,
      sortValue: (c) => c.code,
      cell: (c) => (
        <Link href={subscriptionsHref(c)} className="w-fit rounded-sm font-mono text-sm font-medium text-card-foreground focus-ring hover:underline">
          {c.code}
        </Link>
      ),
    },
    { id: "off", header: "Takes off", width: 165, cell: (c) => (c.off ? takesOffLabel(c) : <span className="text-muted-foreground">—</span>) },
    {
      id: "for",
      header: "For",
      width: 150,
      sortValue: (c) => codeForLabel(c.for),
      cell: (c) => {
        const label = codeForLabel(c.for)
        return label ? <span className="block whitespace-normal">{label}</span> : <span className="text-muted-foreground">—</span>
      },
    },
    { id: "redeemed", header: "Redeemed", type: "count", width: 110, value: (c) => c.redeemed },
    { id: "live", header: "Live", width: 70, numeric: true, sortValue: (c) => c.live, cell: (c) => (c.live ? <span className="font-semibold">{count(c.live)}</span> : <span className="text-muted-foreground">0</span>) },
    {
      id: "status",
      header: "Status",
      width: 110,
      sortValue: (c) => CODE_STATUS_LABEL[c.status],
      cell: (c) => (
        <Badge tone={STATUS_TONE[c.status].tone} appearance={STATUS_TONE[c.status].outline ? "outline" : "soft"}>
          {CODE_STATUS_LABEL[c.status]}
        </Badge>
      ),
    },
    { id: "created", header: "Created", type: "date", width: 130, value: (c) => c.createdAt },
  ]
}

/** Copies a code; `{ error }` when the browser refuses. */
async function copyCode(code: string): Promise<ActionResult> {
  return (await copyText(code)) ? undefined : { error: "The browser didn't allow copying. Copy the code from the row by hand." }
}

/** One code's row menu: copy it, then Go to (its subscriptions, its partner; R15-14). */
function codeActions(c: PromotionCodeRow, { subscriptionsHref, partnerHref }: { subscriptionsHref: (c: PromotionCodeRow) => string; partnerHref: (partnerId: string) => string }): ListAction[] {
  const actions: ListAction[] = [
    { kind: "action", id: "copyCode", group: "Code", label: "Copy code", icon: <Copy aria-hidden />, run: () => copyCode(c.code) },
    { kind: "link", id: "viewSubscriptions", group: "Go to", label: "View subscriptions", icon: <ListFilter aria-hidden />, href: subscriptionsHref(c) },
  ]
  if (c.for?.kind === "partner") actions.push({ kind: "link", id: "viewPartner", group: "Go to", label: `View ${c.for.partner}`, icon: <Building2 aria-hidden />, href: partnerHref(c.for.partnerId) })
  return actions
}

/* R17-06: the Promotion codes page's fixed parts, shared by its story and the app screen so the two can't drift:
   the heading, ListPage's props that don't change, the list state's config (the app keeps it in
   the URL), and what an action says it did. The caller adds the rows, the state and the handlers. */
/** The Promotion codes list: Stripe's codes, what each takes off, who it's for and how much it's used; ListPage's parts for it. */
function promotionCodesPage({ subscriptionsHref, linkAs, partners, today }: { subscriptionsHref: (c: PromotionCodeRow) => string; linkAs?: ElementType; partners: readonly { id: string; name: string }[]; today: string }) {
  const columns = codeColumns({ subscriptionsHref, linkAs })
  const filters = codeFilters(partners)
  const search = { match: matchCode, label: "Search promotion codes", placeholder: "Code, partner or program" }
  const config: ListConfig<PromotionCodeRow> = { segments: codeSegments, filters, search: matchCode, sortValues: sortValuesOf(columns), defaultSort: codeDefaultSort }
  return {
    title: "Promotion codes",
    description: "Stripe's promotion codes: what each takes off, who it's for, and how much it's used.",
    config,
    copied: (c: PromotionCodeRow) => `${c.code} is copied.`,
    list: { noun: { one: "code", other: "codes" }, label: "Promotion codes", getRowId: (c: PromotionCodeRow) => c.code, rowLabel: (c: PromotionCodeRow) => c.code, columns, segments: codeSegments, filters, search, defaultSort: codeDefaultSort, emptyMessage: "No promotion codes in Stripe yet.", resizable: true, density: "compact" as const, linkAs, today },
  }
}

export { codeActions, codeColumns, promotionCodesPage }
export type { CodeFor, CodeStatus, CouponDuration, CouponOff, PromotionCodeRow } from "../subscription-rules"
