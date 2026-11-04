"use client"

import type { ElementType, ReactNode } from "react"
import { Building2, Copy, UserRound } from "lucide-react"

import type { ListAction } from "../../components/actions/row-actions"
import { copyText } from "../../components/actions/copy-button"
import type { ActionResult } from "../../components/overlays/confirm-dialog"
import { Badge } from "../../components/display/badge"
import { Card } from "../../components/display/card"
import { DataTable, type DataTableColumn } from "../../components/display/data-table"
import { CYCLE_LABEL, formatCents, formatDay, formatDayNear, formatPrice } from "../../lib/format"
import { sortValuesOf, type ListConfig } from "../../lib/list-query"
import {
  formatPays,
  formatPaysLong,
  matchSubscription,
  subscriptionDefaultSort,
  subscriptionFilters,
  subscriptionSegments,
  type CatalogPrice,
  offeredByLabel,
  promotionLabel,
  renewsOn,
  STATUS_LABEL,
  statusLine,
  type SubscriptionDetail,
  type SubscriptionPayment,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "../subscription-rules"

/* @archetype Composite (ARCHETYPES.md).
   Billing › Subscriptions, the list's own parts and a subscription's details (REVIEW-16: R16-01
   the list, R16-03 the two pages; the Vue admin's Subscriptions on the common list page). What the
   list page pattern is given for subscriptions; the rules and words are subscription-rules.ts.
   - Columns: Person (name linking to their page, email under it; "Not matched to a person" with
     the Stripe customer when the mirror can't match one), Plan (and who offers it), Status (badge
     and its date line), Renews, Last payment (a failed one in attention ink), Pays (with a
     promotion code under it). Off by default, in the Columns menu, so the table fits the 1280
     inset as Partners does: Started, Promotion, Canceled, Trial ends, the Stripe ids.
   - Row actions: copy the subscription id, then Go to (the person, the partner). Cancel, refund
     and plan changes wait on Stripe writes, which the admin plan puts last; a button that does
     nothing or that the night's sync reverses is broken UI (R16-01 (6)).
   - Details (a page of its own, `SubscriptionDetailSections`): the subscription's dates, its plan
     and price, any promotion or comp, every payment (Stripe's manual ledger entries left out), the
     ids. Partners offer prices, not discounts: there are no price lines (R16-03). */

const STATUS: Record<SubscriptionStatus, { tone: "success" | "info" | "warning" | "attention" | "neutral"; outline?: boolean }> = {
  trial: { tone: "info" },
  active: { tone: "success" },
  "past-due": { tone: "attention" },
  paused: { tone: "neutral", outline: true },
  canceled: { tone: "neutral" },
  incomplete: { tone: "warning" },
}

/** A subscription's status as a badge, with its date line under it ("Ends Nov 3"). */
function SubscriptionStatusCell({ row, today }: { row: SubscriptionRow; today: string }) {
  const line = statusLine(row, today)
  return (
    <span className="flex w-fit flex-col items-start gap-0.5" data-slot="subscription-status" data-status={row.status}>
      <Badge tone={STATUS[row.status].tone} appearance={STATUS[row.status].outline ? "outline" : "soft"}>
        {STATUS_LABEL[row.status]}
      </Badge>
      {line && <span className="text-xs font-medium text-muted-foreground">{line}</span>}
    </span>
  )
}

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const mono = (text: string) => <code className="font-mono text-xs">{text}</code>

/** The last payment: the amount over its date ("$30.00" / "Mar 4"); a failed one says Failed in attention ink; "—" without one. */
function LastPaymentCell({ row, today }: { row: SubscriptionRow; today: string }) {
  const p = row.lastPayment
  if (!p) return muted("—")
  return (
    <span className="flex flex-col items-end" data-slot="last-payment" data-status={p.status}>
      {p.status === "failed" ? <span className="font-medium text-attention-foreground">Failed</span> : <span>{formatCents(p.cents)}</span>}
      <span className="text-xs text-muted-foreground">
        {formatDayNear(p.on, today)}
        {p.status === "refunded" && " · refunded"}
      </span>
    </span>
  )
}

/** The Subscriptions columns. `personHref` is a person's page.
    R20-25 (after People): the list is resizable, so the columns shown by default state a width
    (the last one takes what is left); the plain dates (Started, Renews, Canceled, Trial ends)
    are typed `date` columns — the kind formats, sorts and dashes them. Last payment keeps its
    cell (a date with its standing under it), Pays its own (an amount with the code under it). */
function subscriptionColumns({ personHref, linkAs: Link = "a", today }: { personHref: (userId: string) => string; linkAs?: ElementType; today: string }): DataTableColumn<SubscriptionRow>[] {
  return [
    {
      id: "person",
      header: "Person",
      width: 200,
      minWidth: 160,
      sortValue: (r) => r.person?.name ?? null,
      cell: (r) =>
        r.person ? (
          <span className="flex max-w-48 min-w-0 flex-col">
            <Link href={personHref(r.person.userId)} className="w-fit rounded-sm font-medium text-card-foreground focus-ring hover:underline">
              {r.person.name}
            </Link>
            <span className="truncate text-xs text-muted-foreground">{r.person.email}</span>
          </span>
        ) : (
          <span className="flex flex-col">
            <span className="font-medium text-muted-foreground">Not matched to a person</span>
            {r.stripe && <span className="font-mono text-xs text-muted-foreground">{r.stripe.customerId}</span>}
          </span>
        ),
    },
    {
      id: "plan",
      header: "Plan",
      width: 160,
      sortValue: (r) => r.price.plan,
      cell: (r) => (
        <span className="flex max-w-48 flex-col whitespace-normal">
          <span className="font-medium">{r.price.plan}</span>
          <span className="text-xs text-muted-foreground">
            {CYCLE_LABEL[r.price.cycle]} · {offeredByLabel(r.price.offeredBy)}
          </span>
        </span>
      ),
    },
    { id: "status", header: "Status", width: 140, sortValue: (r) => STATUS_LABEL[r.status], cell: (r) => <SubscriptionStatusCell row={r} today={today} /> },
    { id: "started", header: "Started", type: "date", width: 120, defaultHidden: true, value: (r) => r.startedAt },
    { id: "renews", header: "Renews", type: "date", width: 130, value: (r) => renewsOn(r) },
    { id: "lastPayment", header: "Last payment", width: 130, numeric: true, sortValue: (r) => r.lastPayment?.on ?? null, cell: (r) => <LastPaymentCell row={r} today={today} /> },
    {
      id: "pays",
      header: "Pays",
      width: 100,
      numeric: true,
      sortValue: (r) => r.paysCents,
      // A promotion code shows under the amount, so a $0 explains itself; few have one, so no column of dashes.
      cell: (r) => (
        <span className="flex flex-col items-end">
          <span>{formatPays(r)}</span>
          {r.promotion && <span className="font-mono text-xs text-muted-foreground">{r.promotion.code}</span>}
        </span>
      ),
    },
    { id: "promotion", header: "Promotion", defaultHidden: true, sortValue: (r) => r.promotion?.code ?? null, cell: (r) => (r.promotion ? promotionLabel(r.promotion) : muted("—")) },
    { id: "canceled", header: "Canceled", type: "date", width: 120, defaultHidden: true, value: (r) => r.canceledAt },
    { id: "trialEnds", header: "Trial ends", type: "date", width: 120, defaultHidden: true, value: (r) => r.trialEndsAt },
    { id: "subscriptionId", header: "Subscription id", defaultHidden: true, cell: (r) => (r.stripe ? mono(r.stripe.subscriptionId) : muted("None (comp)")) },
    { id: "customerId", header: "Customer id", defaultHidden: true, cell: (r) => (r.stripe ? mono(r.stripe.customerId) : muted("—")) },
  ]
}

/** Copies a subscription id; `{ error }` when the browser refuses. */
async function copyId(id: string): Promise<ActionResult> {
  return (await copyText(id)) ? undefined : { error: "The browser didn't allow copying. Open the subscription to copy the id by hand." }
}

/** One subscription's row menu: copy its id, then Go to (the person, the partner; R15-14); each off with its reason when it can't apply. */
function subscriptionActions(r: SubscriptionRow, { personHref, partnerHref }: { personHref: (userId: string) => string; partnerHref: (partnerId: string) => string }): ListAction[] {
  const stripe = r.stripe
  const actions: ListAction[] = [
    stripe
      ? { kind: "action", id: "copyId", group: "Subscription", label: "Copy subscription id", icon: <Copy aria-hidden />, run: () => copyId(stripe.subscriptionId) }
      : { kind: "action", id: "copyId", group: "Subscription", label: "Copy subscription id", icon: <Copy aria-hidden />, disabledReason: "A comp has no Stripe subscription", run: () => undefined },
    r.person
      ? { kind: "link", id: "viewPerson", group: "Go to", label: "View person", icon: <UserRound aria-hidden />, href: personHref(r.person.userId) }
      : { kind: "action", id: "viewPerson", group: "Go to", label: "View person", icon: <UserRound aria-hidden />, disabledReason: "Not matched to a person", run: () => undefined },
  ]
  const by = r.price.offeredBy
  if (by.kind === "partner") actions.push({ kind: "link", id: "viewPartner", group: "Go to", label: `View ${by.partner}`, icon: <Building2 aria-hidden />, href: partnerHref(by.partnerId) })
  return actions
}

/** A labelled set of facts: term above, value below, in a grid. */
function Facts({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1">
          <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium text-card-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** A card with a heading, for one section of a details page. */
function Section({ title, children, slot }: { title: string; children: ReactNode; slot: string }) {
  return (
    <Card className="gap-4 px-6 py-5" data-slot={slot}>
      <h2 className="text-base font-semibold text-foreground-strong">{title}</h2>
      {children}
    </Card>
  )
}

const PAYMENT_STATUS: Record<SubscriptionPayment["status"], { label: string; tone: "success" | "attention" | "neutral" | "info" }> = {
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "attention" },
  refunded: { label: "Refunded", tone: "neutral" },
  "partly-refunded": { label: "Partly refunded", tone: "neutral" },
  open: { label: "Open", tone: "info" },
}

const paymentColumns: DataTableColumn<SubscriptionPayment>[] = [
  { id: "on", header: "Date", cell: (p) => formatDay(p.on) },
  { id: "period", header: "Paid for", cell: (p) => (p.periodStart && p.periodEnd ? `${formatDay(p.periodStart)} – ${formatDay(p.periodEnd)}` : muted("—")) },
  { id: "amount", header: "Amount", numeric: true, cell: (p) => formatCents(p.cents) },
  {
    id: "status",
    header: "Status",
    cell: (p) => (
      <Badge tone={PAYMENT_STATUS[p.status].tone} appearance="soft">
        {PAYMENT_STATUS[p.status].label}
        {p.status === "partly-refunded" ? ` · ${formatCents(p.refundedCents)}` : ""}
      </Badge>
    ),
  },
]

/** One subscription's details page body: the subscription, its plan and price, its payments, the ids. */
function SubscriptionDetailSections({
  detail,
  today,
  personHref,
  partnerHref,
  planHref,
  linkAs: Link = "a",
}: {
  /** The subscription's details (A45). */
  detail: SubscriptionDetail
  /** Today, for the status line's dates. */
  today: string
  /** A person's page. */
  personHref: (userId: string) => string
  /** A partner's page. */
  partnerHref: (partnerId: string) => string
  /** The subscriptions on a plan price (Subscriptions filtered to it). */
  planHref: (priceId: string) => string
  /** The app's router link. */
  linkAs?: ElementType
}) {
  const d = detail
  const renews = renewsOn(d)
  const link = (href: string, text: string) => (
    <Link href={href} className="rounded-sm font-semibold text-primary underline-offset-4 focus-ring hover:underline">
      {text}
    </Link>
  )
  const by = d.price.offeredBy
  const noPayments = d.comp
    ? "No payments: support put them on this plan by hand."
    : d.paysCents === 0
      ? by.kind === "partner"
        ? `No payments: ${by.partner}'s plan is free to its members.`
        : "No payments: the member pays nothing."
      : "No payments yet."
  return (
    <>
      <Section title="Subscription" slot="subscription-facts">
        <Facts
          items={[
            ["Status", <SubscriptionStatusCell key="s" row={d} today={today} />],
            ["Person", d.person ? link(personHref(d.person.userId), d.person.name) : muted("Not matched to a person")],
            ["Started", formatDay(d.startedAt)],
            ["Cycle", CYCLE_LABEL[d.price.cycle]],
            ["Current period", d.currentPeriodStart && d.currentPeriodEnd ? `${formatDay(d.currentPeriodStart)} – ${formatDay(d.currentPeriodEnd)}` : muted("—")],
            [renews ? "Renews" : "Ends", renews ? formatDay(renews) : d.currentPeriodEnd ? formatDay(d.currentPeriodEnd) : muted("—")],
            ["Canceled", d.canceledAt ? formatDay(d.canceledAt) : muted("—")],
            ["Trial ends", d.trialEndsAt ? formatDay(d.trialEndsAt) : muted("—")],
          ]}
        />
      </Section>
      <Section title="Plan" slot="subscription-plan">
        <Facts
          items={[
            ["Plan", link(planHref(d.price.id), d.price.plan)],
            ["Offered by", by.kind === "partner" ? link(partnerHref(by.partnerId), by.partner) : "Paige"],
            ["Price", formatPrice(d.price.cents, d.price.cycle)],
            ["Pays", formatPaysLong(d)],
            ["Promotion", d.promotion ? promotionLabel(d.promotion) : muted("None")],
            ["Comp", d.comp ? `Until ${formatDay(d.comp.until)}` : muted("No")],
            ["Price version", d.price.grandfathered ? "Grandfathered" : "Current"],
          ]}
        />
      </Section>
      <DataTable
        rows={d.payments}
        columns={paymentColumns}
        getRowId={(p) => p.id}
        label="Payments"
        title="Payments"
        description="Newest first. Manual entries in Stripe's ledger aren't payments and aren't shown."
        emptyMessage={noPayments}
        columnsMenu={false}
        maxHeight="none"
        pageSize={12}
      />
      <Section title="Stripe" slot="subscription-ids">
        {d.stripe ? (
          <Facts
            items={[
              ["Subscription", mono(d.stripe.subscriptionId)],
              ["Customer", mono(d.stripe.customerId)],
              ["Price", mono(d.price.stripePriceId)],
            ]}
          />
        ) : (
          <p className="text-sm font-medium text-muted-foreground">A comp has no Stripe subscription: support put this person on the plan by hand.</p>
        )}
      </Section>
    </>
  )
}

/* R17-06: the Subscriptions page's fixed parts, shared by its story and the app screen so the two can't drift:
   the heading, ListPage's props that don't change, the list state's config (the app keeps it in
   the URL), and what an action says it did. The caller adds the rows, the state and the handlers. */
/** The Subscriptions list: every subscription and who is on it, and a subscription's page (SubscriptionDetailSections); ListPage's parts for it. */
function subscriptionsPage({ personHref, linkAs, catalog, partners, codes, today }: { personHref: (userId: string) => string; linkAs?: ElementType; catalog: readonly CatalogPrice[]; partners: readonly { id: string; name: string }[]; codes: readonly string[]; today: string }) {
  const columns = subscriptionColumns({ personHref, linkAs, today })
  const segments = subscriptionSegments(today)
  const filters = subscriptionFilters(catalog, partners, codes)
  const search = { match: matchSubscription, label: "Search subscriptions", placeholder: "Name, email or subscription id" }
  const config: ListConfig<SubscriptionRow> = { segments, filters, search: matchSubscription, sortValues: sortValuesOf(columns), defaultSort: subscriptionDefaultSort }
  return {
    title: "Subscriptions",
    description: "Every subscription: who is on it, its plan, and where it stands.",
    config,
    copied: (r: SubscriptionRow) => (r.person ? `${r.person.name}'s subscription id is copied.` : "The subscription id is copied."),
    list: {
      noun: { one: "subscription", other: "subscriptions" },
      label: "Subscriptions",
      getRowId: (r: SubscriptionRow) => r.id,
      rowLabel: (r: SubscriptionRow) => r.person?.name ?? r.stripe?.subscriptionId ?? r.id,
      columns,
      segments,
      filters,
      search,
      defaultSort: subscriptionDefaultSort,
      emptyMessage: "No one has subscribed yet.",
      // The common experience (R20-25, after People): columns drag, rows compact.
      resizable: true,
      density: "compact" as const,
      linkAs,
      today,
    },
  }
}

export { subscriptionActions, subscriptionColumns, SubscriptionDetailSections, subscriptionsPage, SubscriptionStatusCell }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SubscriptionDetailSectionsProps = Parameters<typeof SubscriptionDetailSections>[0]
export type { Cycle } from "../../lib/format"
export type { CatalogPrice, OfferedBy, SubscriptionDetail, SubscriptionPayment, SubscriptionRow, SubscriptionStatus } from "../subscription-rules"
