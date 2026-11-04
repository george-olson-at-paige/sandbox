// The Billing rules (REVIEW-16): live, ending, needs attention, the words (status line, prices,
// offered by, promotion, what a code takes off), the Plans and Promotion codes counts, and the
// three pages' cards and filters through the list derivation. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { defaultListState, deriveList, parseListState, type ListConfig } from "../lib/list-query.ts"
import {
  codeDefaultSort,
  codeFilters,
  codeForLabel,
  codeSegments,
  formatPays,
  formatPaysLong,
  isEnding,
  isLive,
  matchCode,
  matchPlanPrice,
  matchSubscription,
  needsAttention,
  offeredByLabel,
  planDefaultSort,
  planFilters,
  planPriceRows,
  planQuery,
  planSegments,
  promotionLabel,
  promotionQuery,
  renewsOn,
  statusLine,
  subscriptionDefaultSort,
  subscriptionFilters,
  subscriptionSegments,
  takesOffLabel,
  withLiveCounts,
  type CatalogPrice,
  type PlanPriceRow,
  type PromotionCodeRow,
  type SubscriptionRow,
} from "./subscription-rules.ts"

const TODAY = "2026-10-20"
const ANNUAL: CatalogPrice = { id: "membership-annual", plan: "Paige Membership", offeredBy: { kind: "paige" }, cycle: "annual", cents: 3000, grandfathered: false, stripePriceId: "price_annual" }
const CEDAR: CatalogPrice = { id: "cedar-vip", plan: "Cedar Trust · VIP", offeredBy: { kind: "partner", partnerId: "cedar-trust", partner: "Cedar Trust", segment: "VIP" }, cycle: "annual", cents: 0, grandfathered: false, stripePriceId: "price_cedar" }
const OLD: CatalogPrice = { id: "base-2023", plan: "2023 Base Access", offeredBy: { kind: "paige" }, cycle: "annual", cents: 9900, grandfathered: true, stripePriceId: "price_old" }

function row(patch: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: "s1",
    status: "active",
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    currentPeriodEnd: "2027-03-04",
    startedAt: "2025-03-04",
    canceledAt: null,
    price: ANNUAL,
    promotion: null,
    comp: null,
    paysCents: 3000,
    lastPayment: { cents: 3000, on: "2026-03-04", status: "paid" },
    person: { userId: "u1", name: "Ada Park", email: "ada.park@example.com" },
    stripe: { subscriptionId: "sub_1", customerId: "cus_1" },
    ...patch,
  }
}

test("live is trial, active or past due; needs attention is past due or incomplete", () => {
  const all = ["trial", "active", "past-due", "paused", "canceled", "incomplete"] as const
  assert.deepEqual(all.map((status) => isLive({ status })), [true, true, true, false, false, false])
  assert.deepEqual(all.map((status) => needsAttention({ status })), [false, false, true, false, false, true])
})

test("ending: canceling at period end, or a trial ending within 14 days; never when not live", () => {
  assert.equal(isEnding(row({ cancelAtPeriodEnd: true }), TODAY), true)
  assert.equal(isEnding(row({ status: "trial", trialEndsAt: "2026-11-03" }), TODAY), true)
  assert.equal(isEnding(row({ status: "trial", trialEndsAt: "2026-11-04" }), TODAY), false)
  assert.equal(isEnding(row({ status: "canceled", cancelAtPeriodEnd: true }), TODAY), false)
  assert.equal(isEnding(row(), TODAY), false)
})

test("the status line and the renewal", () => {
  assert.equal(statusLine(row({ cancelAtPeriodEnd: true, currentPeriodEnd: "2026-11-03" }), TODAY), "Ends Nov 3")
  assert.equal(statusLine(row({ status: "trial", trialEndsAt: "2026-11-03" }), TODAY), "Trial ends Nov 3")
  assert.equal(statusLine(row({ status: "canceled", canceledAt: "2025-12-01" }), TODAY), "Canceled Dec 1, 2025")
  assert.equal(statusLine(row(), TODAY), null)
  assert.equal(renewsOn(row()), "2027-03-04")
  assert.equal(renewsOn(row({ cancelAtPeriodEnd: true })), null)
  assert.equal(renewsOn(row({ status: "canceled" })), null)
})

test("pays, offered by and promotions in words", () => {
  // A list says the amount (R17-20); a detail view the long form.
  assert.equal(formatPays(row()), "$30.00")
  assert.equal(formatPays(row({ paysCents: 0, promotion: { code: "DEVSIDE26", percentOff: 100 } })), "$0.00")
  assert.equal(formatPays(row({ paysCents: 0, comp: { until: "2027-01-01" } })), "Comp")
  assert.equal(formatPaysLong(row()), "$30.00 a year")
  assert.equal(formatPaysLong(row({ paysCents: 0, comp: { until: "2027-01-01" } })), "Nothing (a comp)")
  assert.equal(offeredByLabel(ANNUAL.offeredBy), "Paige")
  assert.equal(offeredByLabel(CEDAR.offeredBy), "Cedar Trust")
  assert.equal(promotionLabel({ code: "DEVSIDE26", percentOff: 100 }), "DEVSIDE26 · 100% off")
})

test("the Plans counts are the live rows per price; canceled rows don't count", () => {
  const rows = [row({ id: "a" }), row({ id: "b", status: "past-due" }), row({ id: "c", cancelAtPeriodEnd: true }), row({ id: "d", status: "canceled" }), row({ id: "e", price: CEDAR, paysCents: 0 })]
  const plans = planPriceRows([ANNUAL, CEDAR, OLD], rows, TODAY)
  assert.deepEqual(
    plans.map((p) => [p.id, p.live, p.pastDue, p.ending]),
    [["membership-annual", 3, 1, 1], ["cedar-vip", 1, 0, 0], ["base-2023", 0, 0, 0]]
  )
})

test("the Plans cards, filters and search through the list derivation", () => {
  const plans: PlanPriceRow[] = [
    { ...ANNUAL, live: 3, pastDue: 1, ending: 1 },
    { ...CEDAR, live: 1, pastDue: 0, ending: 0 },
    { ...OLD, live: 0, pastDue: 0, ending: 0 },
  ]
  const config: ListConfig<PlanPriceRow> = { segments: planSegments, filters: planFilters([{ id: "cedar-trust", name: "Cedar Trust" }]), search: matchPlanPrice, sortValues: { live: (p) => p.live }, defaultSort: planDefaultSort }
  const view = deriveList(plans, config, defaultListState(config), 25)
  assert.deepEqual(view.counts, { live: 2, paige: 2, partner: 1, grandfathered: 1, attention: 1 })
  assert.deepEqual(view.pageRows.map((p) => p.id), ["membership-annual", "cedar-vip"])
  const byPartner = deriveList(plans, config, { ...defaultListState(config), segment: "paige", filters: { offeredBy: ["cedar-trust"] } }, 25)
  assert.equal(byPartner.matching.length, 0)
  assert.equal(matchPlanPrice(plans[1], "cedar"), true)
  assert.equal(matchPlanPrice(plans[0], "price_annual"), true)
})

test("the Subscriptions cards; the Plans link's filter parses; search by name, email or subscription id", () => {
  const rows = [
    row({ id: "a" }),
    row({ id: "b", status: "past-due" }),
    row({ id: "c", status: "trial", trialEndsAt: "2026-10-25" }),
    row({ id: "d", price: CEDAR, paysCents: 0 }),
    row({ id: "e", status: "canceled" }),
    row({ id: "f", status: "incomplete" }),
    row({ id: "g", paysCents: 0, promotion: { code: "DEVSIDE26", percentOff: 100 } }),
  ]
  const filters = subscriptionFilters([ANNUAL, CEDAR], [{ id: "cedar-trust", name: "Cedar Trust" }], ["DEVSIDE26"])
  const config: ListConfig<SubscriptionRow> = { segments: subscriptionSegments(TODAY), filters, search: matchSubscription, sortValues: {}, defaultSort: subscriptionDefaultSort }
  const view = deriveList(rows, config, defaultListState(config), 25)
  // Direct is a Paige plan, Partner a partner's (a hybrid one the member pays for too).
  assert.deepEqual(view.counts, { live: 5, direct: 4, partner: 1, ending: 1, attention: 2 })
  const byCode = parseListState(new URLSearchParams(promotionQuery("DEVSIDE26")), config)
  assert.deepEqual(deriveList(rows, config, { ...byCode, q: "" }, 25).matching.map((r) => r.id), ["g"])
  const linked = parseListState(new URLSearchParams(planQuery("cedar-vip")), config)
  assert.deepEqual(linked.filters, { plan: ["cedar-vip"] })
  assert.deepEqual(deriveList(rows, config, { ...linked, q: "" }, 25).matching.map((r) => r.id), ["d"])
  assert.equal(matchSubscription(row(), "ada"), true)
  assert.equal(matchSubscription(row(), "sub_1"), true)
  assert.equal(matchSubscription(row({ person: null, stripe: null }), "ada"), false)
})

test("promotion codes: what they take off, who they're for, the live counts, the cards", () => {
  assert.equal(takesOffLabel({ off: { kind: "percent", percent: 100 }, duration: { kind: "forever" } }), "100% off · forever")
  assert.equal(takesOffLabel({ off: { kind: "amount", cents: 1000 }, duration: { kind: "once" } }), "$10.00 off · once")
  assert.equal(takesOffLabel({ off: { kind: "percent", percent: 50 }, duration: { kind: "repeating", months: 3 } }), "50% off · 3 months")
  assert.equal(takesOffLabel({ off: null, duration: null }), "—")
  assert.equal(codeForLabel({ kind: "partner", partnerId: "cedar-trust", partner: "Cedar Trust", segment: "VIP" }), "Cedar Trust · VIP")
  assert.equal(codeForLabel({ kind: "program", name: "Paige Benefit Program" }), "Paige Benefit Program")
  assert.equal(codeForLabel(null), null)
  const base = { off: { kind: "percent", percent: 100 }, duration: { kind: "forever" }, redeemed: 3, createdAt: "2026-01-05" } as const
  const seeds: Omit<PromotionCodeRow, "live">[] = [
    { ...base, code: "DEVSIDE26", for: null, status: "active" },
    { ...base, code: "CEDARVIP", for: { kind: "partner", partnerId: "cedar-trust", partner: "Cedar Trust", segment: "VIP" }, status: "active" },
    { ...base, code: "OLD2024", for: null, status: "inactive" },
    { code: "GONE", off: null, duration: null, for: null, status: "gone", redeemed: 9, createdAt: "2024-03-01" },
  ]
  const rows = [row({ id: "a", promotion: { code: "DEVSIDE26", percentOff: 100 } }), row({ id: "b", status: "canceled", promotion: { code: "DEVSIDE26", percentOff: 100 } })]
  const codes = withLiveCounts(seeds, rows)
  assert.deepEqual(codes.map((c) => c.live), [1, 0, 0, 0])
  const config: ListConfig<PromotionCodeRow> = { segments: codeSegments, filters: codeFilters([{ id: "cedar-trust", name: "Cedar Trust" }]), search: matchCode, sortValues: { live: (c) => c.live }, defaultSort: codeDefaultSort }
  const view = deriveList(codes, config, defaultListState(config), 25)
  assert.deepEqual(view.counts, { active: 2, inUse: 1, partner: 1, inactive: 2, all: 4 })
  assert.equal(matchCode(codes[1], "cedar"), true)
  const forNoOne = deriveList(codes, config, { ...defaultListState(config), segment: "all", filters: { for: ["none"] } }, 25)
  assert.deepEqual(forNoOne.matching.map((c) => c.code).sort(), ["DEVSIDE26", "GONE", "OLD2024"])
})
