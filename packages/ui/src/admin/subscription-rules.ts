// The Billing rules: Plans, Subscriptions and Promotion codes (REVIEW-16: R16-01 the subscriptions
// list, R16-03 the two pages, R16-04 Direct and Partner, R16-05 promotion codes): pure, tested (subscription-rules.test.ts). Types follow API-NEEDS A41, A44, A45; the
// server will derive status and the counts (A42), the web only words them and filters.
// - Partners offer prices, not discounts (George 2026-10-21). A plan price belongs to a plan,
//   Paige's or a partner's, and has an amount; there is no list-price-less-a-discount reading, no
//   price map, nothing provisional. A promotion code is a discount on one member's subscription.
// - Status is the model's six (Paige's words): Trial, Active, Past due, Paused, Canceled,
//   Incomplete. A subscription set to cancel at period end stays Active, with "Ends <date>". A trial
//   is a state, not a price.
// - A comp is a subscription support put someone on by hand (a manual billing account: no Stripe).
// - The Plans page's counts come from the same rows the Subscriptions page lists (`planPriceRows`),
//   so the two can't disagree. No partner contract fees or partner invoices (R16-02 (6)).
import type { IsoDate } from "../lib/dates.ts"
import { CYCLE_LABEL, formatCents, formatDayNear, formatPrice, type Cycle } from "../lib/format.ts"
import type { ListFilter, ListSegment, ListSort } from "../lib/list-query.ts"

/** A subscription's state, in Paige's words (the model's `SubscriptionStatus`). */
export type SubscriptionStatus = "trial" | "active" | "past-due" | "paused" | "canceled" | "incomplete"

/** Who offers a plan: Paige, or a partner (its sponsorship's plan, with the segment it's for). */
export type OfferedBy = { kind: "paige" } | { kind: "partner"; partnerId: string; partner: string; segment: string | null }

/** A plan price in the catalog: a plan's amount per cycle, and the Stripe price behind it. */
export type CatalogPrice = {
  /** Our id for the price (the Plans row, the Subscriptions filter value). */
  id: string
  /** The plan's name ("Paige Membership", "Cedar Trust · VIP"). */
  plan: string
  offeredBy: OfferedBy
  cycle: Cycle
  cents: number
  /** A kept old price (A12): no one new gets it. */
  grandfathered: boolean
  stripePriceId: string
}

/** One plan price as the Plans page lists it (A44): the catalog's facts and the counts. */
export type PlanPriceRow = CatalogPrice & { live: number; pastDue: number; ending: number }

/** One subscription as the Subscriptions page lists it (A41). */
export type SubscriptionRow = {
  id: string
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  trialEndsAt: IsoDate | null
  /** When the current period ends: the renewal, or the end when it won't renew. */
  currentPeriodEnd: IsoDate | null
  startedAt: IsoDate
  canceledAt: IsoDate | null
  /** The plan price it's on. */
  price: CatalogPrice
  /** A promotion code on this subscription, if any. */
  promotion: { code: string; percentOff: number } | null
  /** Support put them on it by hand, until this date. */
  comp: { until: IsoDate } | null
  /** What the member pays per cycle, in cents, after a promotion; 0 for a comp. */
  paysCents: number
  lastPayment: { cents: number; on: IsoDate; status: "paid" | "failed" | "refunded" } | null
  /** Null when the Stripe customer isn't matched to a person. */
  person: { userId: string; name: string; email: string } | null
  /** Null for a comp (no Stripe). */
  stripe: { subscriptionId: string; customerId: string } | null
}

/** One payment on a subscription (A45). Stripe's manual ledger entries are never here. */
export type SubscriptionPayment = {
  id: string
  on: IsoDate
  cents: number
  periodStart: IsoDate | null
  periodEnd: IsoDate | null
  status: "paid" | "failed" | "refunded" | "partly-refunded" | "open"
  refundedCents: number
}

/** One subscription's details (A45). */
export type SubscriptionDetail = SubscriptionRow & { currentPeriodStart: IsoDate | null; payments: SubscriptionPayment[] }

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Active",
  "past-due": "Past due",
  paused: "Paused",
  canceled: "Canceled",
  incomplete: "Incomplete",
}

/** A trial ending within this many days is Ending. */
export const ENDING_WITHIN_DAYS = 14

const DAY = 86_400_000
const days = (from: IsoDate, to: IsoDate) => Math.round((Date.parse(to) - Date.parse(from)) / DAY)

/** Live: Trial, Active or Past due (the member has access). */
export const isLive = (s: Pick<SubscriptionRow, "status">) => s.status === "trial" || s.status === "active" || s.status === "past-due"

/** Live, and either canceling at period end or a trial ending within 14 days of `today`. */
export function isEnding(s: Pick<SubscriptionRow, "status" | "cancelAtPeriodEnd" | "trialEndsAt">, today: IsoDate): boolean {
  if (!isLive(s)) return false
  if (s.cancelAtPeriodEnd) return true
  return s.status === "trial" && s.trialEndsAt !== null && days(today, s.trialEndsAt) <= ENDING_WITHIN_DAYS
}

/** Past due or Incomplete. */
export const needsAttention = (s: Pick<SubscriptionRow, "status">) => s.status === "past-due" || s.status === "incomplete"

/** The status's date line: "Ends Nov 3" (canceling at period end), "Trial ends Nov 3", "Canceled Mar 4, 2026"; null when there's nothing to add. */
export function statusLine(s: Pick<SubscriptionRow, "status" | "cancelAtPeriodEnd" | "trialEndsAt" | "currentPeriodEnd" | "canceledAt">, today: IsoDate): string | null {
  if (s.status === "canceled") return s.canceledAt ? `Canceled ${formatDayNear(s.canceledAt, today)}` : null
  if (s.cancelAtPeriodEnd && s.currentPeriodEnd) return `Ends ${formatDayNear(s.currentPeriodEnd, today)}`
  if (s.status === "trial" && s.trialEndsAt) return `Trial ends ${formatDayNear(s.trialEndsAt, today)}`
  return null
}

/** When it renews, or null when it won't (canceled, canceling, incomplete). */
export function renewsOn(s: Pick<SubscriptionRow, "status" | "cancelAtPeriodEnd" | "currentPeriodEnd">): IsoDate | null {
  if (!isLive(s) && s.status !== "paused") return null
  return s.cancelAtPeriodEnd ? null : s.currentPeriodEnd
}

/** What the member pays, for a list (R17-20: the amount alone; the plan cell says the cycle): "$30.00"; "Comp" for a comp. */
export const formatPays = (s: Pick<SubscriptionRow, "paysCents" | "comp">) => (s.comp ? "Comp" : formatCents(s.paysCents))

/** What the member pays, in words, for a detail view: "$30.00 a year"; "Nothing (a comp)". */
export const formatPaysLong = (s: Pick<SubscriptionRow, "paysCents" | "price" | "comp">) => (s.comp ? "Nothing (a comp)" : formatPrice(s.paysCents, s.price.cycle))

/** "Paige"; "Cedar Trust". */
export const offeredByLabel = (o: OfferedBy) => (o.kind === "paige" ? "Paige" : o.partner)

/** "DEVSIDE26 · 100% off". */
export const promotionLabel = (p: NonNullable<SubscriptionRow["promotion"]>) => `${p.code} · ${p.percentOff}% off`

/** The Plans rows: each catalog price with its live, past-due and ending counts over these subscriptions. */
export function planPriceRows(catalog: readonly CatalogPrice[], rows: readonly SubscriptionRow[], today: IsoDate): PlanPriceRow[] {
  return catalog.map((price) => {
    const live = rows.filter((r) => r.price.id === price.id && isLive(r))
    return { ...price, live: live.length, pastDue: live.filter((r) => r.status === "past-due").length, ending: live.filter((r) => isEnding(r, today)).length }
  })
}

/** The Plans filter cards (R16-03): Live (default) · Paige · Partner · Grandfathered · Needs attention. */
export const planSegments: ListSegment<PlanPriceRow>[] = [
  { id: "live", label: "Live", description: "Prices with live subscriptions", match: (p) => p.live > 0 },
  { id: "paige", label: "Paige", description: "Paige's own plans", match: (p) => p.offeredBy.kind === "paige" },
  { id: "partner", label: "Partner", description: "Partners' plans", match: (p) => p.offeredBy.kind === "partner" },
  { id: "grandfathered", label: "Grandfathered", description: "Kept old prices", match: (p) => p.grandfathered },
  { id: "attention", label: "Needs attention", description: "Someone on it is past due", match: (p) => p.pastDue > 0 },
]

/** The Plans Filters popover: offered by (Paige or a partner), cycle. */
export function planFilters(partners: readonly { id: string; name: string }[]): ListFilter<PlanPriceRow>[] {
  return [
    {
      id: "offeredBy",
      label: "Offered by",
      multiple: true,
      placeholder: "Anyone",
      options: [{ value: "paige", label: "Paige" }, ...partners.map((p) => ({ value: p.id, label: p.name }))],
      match: (p, v) => v.includes(p.offeredBy.kind === "paige" ? "paige" : p.offeredBy.partnerId),
    },
    { id: "cycle", label: "Cycle", multiple: true, placeholder: "Any cycle", options: (Object.keys(CYCLE_LABEL) as Cycle[]).map((k) => ({ value: k, label: CYCLE_LABEL[k] })), match: (p, v) => v.includes(p.cycle) },
  ]
}

/** Plan name, partner or Stripe price id contains the search. */
export const matchPlanPrice = (p: PlanPriceRow, q: string) => p.plan.toLowerCase().includes(q) || offeredByLabel(p.offeredBy).toLowerCase().includes(q) || p.stripePriceId.toLowerCase().includes(q)

/** Most live first. */
export const planDefaultSort: ListSort = { id: "live", desc: true }

/** The Subscriptions filter cards (R16-04, George 2026-10-21): Live (default) · Direct (on a Paige plan) · Partner (on a partner's plan, a hybrid one the member pays for too) · Ending · Needs attention. */
export function subscriptionSegments(today: IsoDate): ListSegment<SubscriptionRow>[] {
  return [
    { id: "live", label: "Live", description: "Trial, active or past due", match: isLive },
    { id: "direct", label: "Direct", description: "Live, on a Paige plan", match: (r) => isLive(r) && r.price.offeredBy.kind === "paige" },
    { id: "partner", label: "Partner", description: "Live, on a partner's plan", match: (r) => isLive(r) && r.price.offeredBy.kind === "partner" },
    { id: "ending", label: "Ending", description: `Canceling, or a trial ending within ${ENDING_WITHIN_DAYS} days`, match: (r) => isEnding(r, today) },
    { id: "attention", label: "Needs attention", description: "Past due or incomplete", match: needsAttention },
  ]
}

/** The Subscriptions Filters popover: plan (any of the prices; Plans links with it), status, offered by, promotion code (any of; Promotion codes links with it), renews and started (date ranges). */
export function subscriptionFilters(catalog: readonly CatalogPrice[], partners: readonly { id: string; name: string }[], codes: readonly string[]): ListFilter<SubscriptionRow>[] {
  return [
    { id: "plan", label: "Plan", multiple: true, placeholder: "Any plan", options: catalog.map((p) => ({ value: p.id, label: `${p.plan} · ${CYCLE_LABEL[p.cycle]}` })), match: (r, v) => v.includes(r.price.id) },
    { id: "status", label: "Status", multiple: true, placeholder: "Any status", options: (Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((k) => ({ value: k, label: STATUS_LABEL[k] })), match: (r, v) => v.includes(r.status) },
    {
      id: "offeredBy",
      label: "Offered by",
      multiple: true,
      placeholder: "Anyone",
      options: [{ value: "paige", label: "Paige" }, ...partners.map((p) => ({ value: p.id, label: p.name }))],
      match: (r, v) => v.includes(r.price.offeredBy.kind === "paige" ? "paige" : r.price.offeredBy.partnerId),
    },
    { id: "promotion", label: "Promotion code", multiple: true, placeholder: "Any code", options: codes.map((c) => ({ value: c, label: c })), match: (r, v) => r.promotion !== null && v.includes(r.promotion.code) },
    { kind: "date-range", id: "renews", label: "Renews", date: (r) => renewsOn(r) },
    { kind: "date-range", id: "started", label: "Started", date: (r) => r.startedAt },
  ]
}

/** Name, email or subscription id contains the search. */
export const matchSubscription = (r: SubscriptionRow, q: string) =>
  (r.person !== null && (r.person.name.toLowerCase().includes(q) || r.person.email.toLowerCase().includes(q))) || (r.stripe?.subscriptionId.toLowerCase().includes(q) ?? false)

/** What renews next first. */
export const subscriptionDefaultSort: ListSort = { id: "renews", desc: false }

/** The Subscriptions URL's query for one plan price (the Plans row's link). */
export const planQuery = (priceId: string) => `plan=${encodeURIComponent(priceId)}`

/** The Subscriptions URL's query for one promotion code (the Promotion codes row's link). */
export const promotionQuery = (code: string) => `promotion=${encodeURIComponent(code)}`

/* Promotion codes (R16-05, from the Vue admin's Promotion codes, A46): Stripe's codes, what each
   takes off and for how long, who it's for (a partner and segment, a program, or no one), how
   often it's been redeemed and how many live subscriptions carry it. The Vue page's code map
   (mapped, not mapped, "decide") is the same attribution work the price map was, and goes with it
   (R16-03): "For" is a fact or a dash. */

/** What a coupon takes off: a percentage, or an amount in cents. */
export type CouponOff = { kind: "percent"; percent: number } | { kind: "amount"; cents: number }

/** How long it applies: the first payment, a number of months, or for as long as the subscription runs. */
export type CouponDuration = { kind: "once" } | { kind: "repeating"; months: number } | { kind: "forever" }

/** Whether Stripe still accepts the code; "gone" when Stripe no longer holds it. */
export type CodeStatus = "active" | "inactive" | "gone"

/** Who a code is for: a partner (and segment), a program, or no one. */
export type CodeFor = { kind: "partner"; partnerId: string; partner: string; segment: string | null } | { kind: "program"; name: string } | null

/** One promotion code as the Promotion codes page lists it (A46). */
export type PromotionCodeRow = {
  code: string
  /** Null when Stripe no longer holds the code. */
  off: CouponOff | null
  duration: CouponDuration | null
  for: CodeFor
  status: CodeStatus
  /** Times redeemed, by Stripe's count. */
  redeemed: number
  /** Live subscriptions carrying it. */
  live: number
  createdAt: IsoDate
}

export const CODE_STATUS_LABEL: Record<CodeStatus, string> = { active: "Active", inactive: "Inactive", gone: "Not in Stripe" }

/** "100% off · forever", "$10.00 off · once", "50% off · 3 months"; "—" when Stripe doesn't hold it. */
export function takesOffLabel(r: Pick<PromotionCodeRow, "off" | "duration">): string {
  if (!r.off) return "—"
  const off = r.off.kind === "percent" ? `${r.off.percent}% off` : `${formatCents(r.off.cents)} off`
  const d = r.duration
  const how = !d ? "" : d.kind === "once" ? " · once" : d.kind === "forever" ? " · forever" : ` · ${d.months} ${d.months === 1 ? "month" : "months"}`
  return off + how
}

/** "Cedar Trust · VIP", "Paige Benefit Program"; null for no one. */
export function codeForLabel(f: CodeFor): string | null {
  if (!f) return null
  return f.kind === "program" ? f.name : f.segment ? `${f.partner} · ${f.segment}` : f.partner
}

/** Each code with its live subscriptions counted from these rows (the fixtures' stand-in for A46's count). */
export function withLiveCounts(codes: readonly Omit<PromotionCodeRow, "live">[], rows: readonly SubscriptionRow[]): PromotionCodeRow[] {
  return codes.map((c) => ({ ...c, live: rows.filter((r) => isLive(r) && r.promotion?.code === c.code).length }))
}

/** The Promotion codes filter cards: Active (default) · In use · Partner · Inactive (or gone from Stripe) · All codes. */
export const codeSegments: ListSegment<PromotionCodeRow>[] = [
  { id: "active", label: "Active", description: "Stripe accepts it", match: (c) => c.status === "active" },
  { id: "inUse", label: "In use", description: "On live subscriptions", match: (c) => c.live > 0 },
  { id: "partner", label: "Partner", description: "For a partner", match: (c) => c.for?.kind === "partner" },
  { id: "inactive", label: "Inactive", description: "Turned off, or gone from Stripe", match: (c) => c.status !== "active" },
  { id: "all", label: "All codes" },
]

/** The Promotion codes Filters popover: who it's for (a partner, a program, no one), how it takes off, how long, created. */
export function codeFilters(partners: readonly { id: string; name: string }[]): ListFilter<PromotionCodeRow>[] {
  return [
    {
      id: "for",
      label: "For",
      multiple: true,
      placeholder: "Anyone",
      options: [...partners.map((p) => ({ value: p.id, label: p.name })), { value: "program", label: "A program" }, { value: "none", label: "No one" }],
      match: (c, v) => v.includes(c.for === null ? "none" : c.for.kind === "program" ? "program" : c.for.partnerId),
    },
    { id: "off", label: "Takes off", multiple: true, placeholder: "Any", options: [{ value: "percent", label: "A percentage" }, { value: "amount", label: "An amount" }], match: (c, v) => c.off !== null && v.includes(c.off.kind) },
    { id: "duration", label: "For how long", multiple: true, placeholder: "Any", options: [{ value: "once", label: "Once" }, { value: "repeating", label: "Some months" }, { value: "forever", label: "Forever" }], match: (c, v) => c.duration !== null && v.includes(c.duration.kind) },
    { kind: "date-range", id: "created", label: "Created", date: (c) => c.createdAt },
  ]
}

/** The code, or who it's for, contains the search. */
export const matchCode = (c: PromotionCodeRow, q: string) => c.code.toLowerCase().includes(q) || (codeForLabel(c.for)?.toLowerCase().includes(q) ?? false)

/** Most live first. */
export const codeDefaultSort: ListSort = { id: "live", desc: true }
