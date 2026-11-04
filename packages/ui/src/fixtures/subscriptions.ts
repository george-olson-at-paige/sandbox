import { partnerKey } from "../admin/partner-rules"
import type { PersonRow } from "../admin/pages/people"
import {
  planPriceRows,
  withLiveCounts,
  type CatalogPrice,
  type PromotionCodeRow,
  type SubscriptionDetail,
  type SubscriptionPayment,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "../admin/subscription-rules"
import type { Cycle } from "../lib/format"
import { people } from "./people"

/* Plans, subscriptions and promotion codes for the Billing stories and the app's /admin/billing
   (REVIEW-16 R16-03, R16-05; one copy, R17-03). Fixtures only (package code never imports this
   folder); they go when the API serves them
   (A41, A44, A45; the pattern GAPS #133 has for people). A catalog of plan prices, Paige's and
   partners' (partners offer prices, not discounts: Cedar Trust · VIP is $0 a year, Northwind's
   Employee plan $15), the old prices kept as grandfathered Paige prices, and ~175 invented
   subscriptions at the live data's proportions (most on a partner's plan, about a sixth
   canceled), from a fixed seed. Paige Membership's prices follow proposal P1 ($30 a year after
   the term discount, $3.99 a month). The people are People's fixtures (so a row's person opens
   their page): each live subscription has its own person, and a canceled one belongs to someone
   who may have another; their People plan kinds don't follow these rows (two generators, A42).
   No partner contract fees and no manual ledger entries (R16-02 (6)). Promotion codes: the three
   the subscriptions carry and a spread around them (partner and program codes, an amount off,
   months-long ones, turned off, one Stripe no longer holds); the codes are invented. */

/** The fixtures' today. */
export const SUBSCRIPTIONS_TODAY = "2026-10-20"

const partner = (name: string) => ({ id: partnerKey(name), name })
export const SUBSCRIPTION_PARTNERS = ["Cedar Trust", "Lakeside Credit Union", "Northwind Financial", "Summit Wealth Partners", "Brightpath Benefits"].map(partner)
const [CEDAR, LAKESIDE, NORTHWIND, SUMMIT, BRIGHTPATH] = SUBSCRIPTION_PARTNERS

const paige = { kind: "paige" } as const
const by = (p: { id: string; name: string }, segment: string | null = null) => ({ kind: "partner", partnerId: p.id, partner: p.name, segment }) as const
const price = (id: string, plan: string, offeredBy: CatalogPrice["offeredBy"], cycle: Cycle, cents: number, stripePriceId: string, grandfathered = false): CatalogPrice => ({
  id,
  plan,
  offeredBy,
  cycle,
  cents,
  grandfathered,
  stripePriceId,
})

export const planCatalog: CatalogPrice[] = [
  price("membership-annual", "Paige Membership", paige, "annual", 3000, "price_1PmAnnual30"),
  price("membership-monthly", "Paige Membership", paige, "monthly", 399, "price_1PmMonthly399"),
  price("cedar-vip", "Cedar Trust · VIP", by(CEDAR, "VIP"), "annual", 0, "price_1CedarVip0"),
  price("cedar", "Cedar Trust", by(CEDAR), "annual", 0, "price_1Cedar0"),
  price("lakeside", "Lakeside Credit Union", by(LAKESIDE), "annual", 0, "price_1Lakeside0"),
  price("northwind-employee", "Northwind Financial · Employee", by(NORTHWIND, "Employee"), "annual", 1500, "price_1Northwind15"),
  price("summit", "Summit Wealth Partners", by(SUMMIT), "annual", 0, "price_1Summit0"),
  price("brightpath", "Brightpath Benefits", by(BRIGHTPATH), "annual", 0, "price_1Brightpath0"),
  price("base-2023", "2023 Base Access", paige, "annual", 9900, "price_1Base2023", true),
  price("premium-2020", "Premium (2020)", paige, "annual", 14900, "price_1Premium149", true),
  price("priority-legacy", "Priority", paige, "monthly", 999, "price_1LegacyPriority", true),
  price("annual-legacy", "Annual (2021)", paige, "annual", 7900, "price_1OldAnnual79", true),
]

const CODES = [
  { code: "DEVSIDE26", percentOff: 100 },
  { code: "PAIGERS", percentOff: 100 },
  { code: "TSBFREE", percentOff: 100 },
]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const TODAY_MS = Date.parse(`${SUBSCRIPTIONS_TODAY}T00:00:00Z`)
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const addMonths = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return isoDate(d.getTime())
}
const step = (cycle: Cycle) => (cycle === "annual" ? 12 : 1)
/** The first period boundary after today, counting from `start` by the cycle. */
function nextBoundary(start: string, cycle: Cycle): string {
  let at = start
  while (Date.parse(at) <= TODAY_MS) at = addMonths(at, step(cycle))
  return at
}

/** One group of the mix: how many, on which price, in what state, with a promotion or a comp. */
type Group = { n: number; price: string; status?: SubscriptionStatus; ending?: boolean; promotion?: boolean; comp?: boolean }

const MIX: Group[] = [
  { n: 27, price: "membership-annual" },
  { n: 4, price: "membership-annual", status: "past-due" },
  { n: 5, price: "membership-annual", ending: true },
  { n: 9, price: "membership-annual", status: "canceled" },
  { n: 7, price: "membership-annual", promotion: true },
  { n: 6, price: "membership-annual", status: "trial" },
  { n: 4, price: "membership-annual", comp: true },
  { n: 10, price: "cedar-vip" },
  { n: 14, price: "cedar" },
  { n: 3, price: "cedar", status: "canceled" },
  { n: 12, price: "lakeside" },
  { n: 8, price: "northwind-employee" },
  { n: 1, price: "northwind-employee", status: "past-due" },
  { n: 6, price: "summit" },
  { n: 4, price: "brightpath" },
  { n: 14, price: "membership-monthly" },
  { n: 2, price: "membership-monthly", ending: true },
  { n: 2, price: "membership-monthly", status: "incomplete" },
  { n: 1, price: "membership-monthly", status: "paused" },
  { n: 12, price: "membership-monthly", status: "canceled" },
  { n: 10, price: "base-2023" },
  { n: 2, price: "base-2023", status: "canceled" },
  { n: 8, price: "premium-2020" },
  { n: 3, price: "priority-legacy" },
  { n: 1, price: "annual-legacy" },
]

function generate(people: readonly PersonRow[]): SubscriptionRow[] {
  const rand = mulberry32(20261021)
  const out: SubscriptionRow[] = []
  let nextPerson = 0
  for (const g of MIX)
    for (let i = 0; i < g.n; i++) {
      const p = planCatalog.find((c) => c.id === g.price)!
      const n = out.length + 1
      const status: SubscriptionStatus = g.status ?? "active"
      // A live subscription takes the next person; a canceled one someone earlier in the list.
      const who = status === "canceled" ? people[(n * 37) % people.length] : people[nextPerson++ % people.length]
      const trial = status === "trial"
      // A past-due renewal failed a few days ago: it started whole cycles before that day.
      const failedOn = status === "past-due" ? isoDate(TODAY_MS - (Math.floor(rand() * 9) + 1) * DAY) : null
      const startedAt = failedOn ? addMonths(failedOn, -step(p.cycle) * (Math.floor(rand() * 3) + 1)) : isoDate(TODAY_MS - (trial ? Math.floor(rand() * 10) + 1 : Math.floor(rand() * 1000) + 20) * DAY)
      const startDays = Math.round((TODAY_MS - Date.parse(startedAt)) / DAY)
      const canceled = status === "canceled"
      const canceledAt = canceled ? isoDate(TODAY_MS - Math.floor(rand() * Math.min(startDays - 1, 400)) * DAY) : null
      const currentPeriodEnd = canceled ? canceledAt : status === "incomplete" ? null : nextBoundary(startedAt, p.cycle)
      const promotion = g.promotion ? CODES[i % CODES.length] : null
      const comp = g.comp ? { until: isoDate(TODAY_MS + (60 + Math.floor(rand() * 200)) * DAY) } : null
      const paysCents = comp ? 0 : promotion ? Math.round(p.cents * (1 - promotion.percentOff / 100)) : p.cents
      const periodStart = currentPeriodEnd ? addMonths(currentPeriodEnd, -step(p.cycle)) : startedAt
      const lastPayment: SubscriptionRow["lastPayment"] =
        paysCents === 0 || trial || status === "incomplete"
          ? null
          : status === "past-due"
            ? { cents: paysCents, on: failedOn!, status: "failed" }
            : canceled && rand() < 0.3
              ? { cents: paysCents, on: canceledAt!, status: "refunded" }
              : { cents: paysCents, on: canceled ? addMonths(canceledAt!, p.cycle === "annual" ? -6 : 0) : periodStart, status: "paid" }
      out.push({
        id: `sub-${1000 + n}`,
        status,
        cancelAtPeriodEnd: Boolean(g.ending),
        trialEndsAt: trial ? isoDate(Date.parse(startedAt) + 14 * DAY) : null,
        currentPeriodEnd,
        startedAt,
        canceledAt,
        price: p,
        promotion,
        comp,
        paysCents,
        lastPayment,
        // A few Stripe customers the mirror can't match to a person (the Vue view's case).
        person: n % 47 === 0 ? null : { userId: who.id, name: who.name, email: who.email },
        stripe: comp ? null : { subscriptionId: `sub_1Q${(n * 7919).toString(36).toUpperCase().padStart(6, "0")}`, customerId: `cus_P${(n * 104729).toString(36).toUpperCase().padStart(6, "0")}` },
      })
    }
  return out
}

export const subscriptions: SubscriptionRow[] = generate(people)

/** The Plans rows over the same subscriptions, so their counts match Subscriptions filtered to a plan. */
export const planPrices = planPriceRows(planCatalog, subscriptions, SUBSCRIPTIONS_TODAY)

/** One subscription's details (A45): its payments, newest first. A subscription that pays nothing has none. */
export function subscriptionDetail(r: SubscriptionRow): SubscriptionDetail {
  const months = step(r.price.cycle)
  const currentPeriodStart = r.currentPeriodEnd && r.status !== "canceled" ? addMonths(r.currentPeriodEnd, -months) : null
  const payments: SubscriptionPayment[] = []
  if (r.paysCents > 0 && r.status !== "trial" && r.status !== "incomplete") {
    const until = r.canceledAt ?? SUBSCRIPTIONS_TODAY
    for (let at = r.startedAt, k = 0; Date.parse(at) <= Date.parse(until); at = addMonths(at, months), k++)
      payments.push({ id: `${r.id}-in-${k + 1}`, on: at, cents: r.paysCents, periodStart: at, periodEnd: addMonths(at, months), status: "paid", refundedCents: 0 })
    const last = payments.at(-1)
    if (last && r.lastPayment?.status === "failed") Object.assign(last, { status: "failed", on: r.lastPayment.on })
    if (last && r.lastPayment?.status === "refunded") Object.assign(last, { status: "refunded", refundedCents: last.cents })
    payments.reverse()
  }
  return { ...r, currentPeriodStart, payments }
}

const pct = (percent: number) => ({ kind: "percent", percent }) as const
const forever = { kind: "forever" } as const
const once = { kind: "once" } as const
const months = (n: number) => ({ kind: "repeating", months: n }) as const
const forPartner = (p: { id: string; name: string }, segment: string | null = null) => ({ kind: "partner", partnerId: p.id, partner: p.name, segment }) as const

/** The promotion codes in Stripe (and one it no longer holds); live counts come from the subscriptions. */
const codeSeeds: Omit<PromotionCodeRow, "live">[] = [
  { code: "DEVSIDE26", off: pct(100), duration: forever, for: null, status: "active", redeemed: 12, createdAt: "2026-01-12" },
  { code: "PAIGERS", off: pct(100), duration: forever, for: { kind: "program", name: "Paige team" }, status: "active", redeemed: 10, createdAt: "2025-06-02" },
  { code: "TSBFREE", off: pct(100), duration: forever, for: forPartner(SUMMIT), status: "active", redeemed: 6, createdAt: "2025-09-15" },
  { code: "DEVSIDE2026", off: pct(100), duration: forever, for: null, status: "active", redeemed: 7, createdAt: "2026-02-01" },
  { code: "CEDARVIP", off: pct(100), duration: forever, for: forPartner(CEDAR, "VIP"), status: "active", redeemed: 2, createdAt: "2025-11-20" },
  { code: "LAKESIDE50", off: pct(50), duration: months(12), for: forPartner(LAKESIDE), status: "active", redeemed: 4, createdAt: "2026-03-09" },
  { code: "PBP2025", off: pct(100), duration: forever, for: { kind: "program", name: "Paige Benefit Program" }, status: "active", redeemed: 8, createdAt: "2025-01-06" },
  { code: "WELCOME10", off: { kind: "amount", cents: 1000 }, duration: once, for: null, status: "active", redeemed: 31, createdAt: "2025-04-14" },
  { code: "SPRING25", off: pct(25), duration: months(3), for: null, status: "inactive", redeemed: 19, createdAt: "2025-03-01" },
  { code: "HOLIDAY20", off: pct(20), duration: once, for: null, status: "inactive", redeemed: 44, createdAt: "2024-11-25" },
  { code: "NORTHWIND", off: pct(100), duration: months(6), for: forPartner(NORTHWIND, "Employee"), status: "inactive", redeemed: 3, createdAt: "2024-08-19" },
  { code: "TRIAL30", off: null, duration: null, for: null, status: "gone", redeemed: 27, createdAt: "2023-05-10" },
]

export const promotionCodes: PromotionCodeRow[] = withLiveCounts(codeSeeds, subscriptions)

/** Every code, for the Subscriptions page's Promotion code filter. */
export const PROMOTION_CODES = codeSeeds.map((c) => c.code)
