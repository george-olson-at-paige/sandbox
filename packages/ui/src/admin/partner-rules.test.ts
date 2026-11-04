// The Partners rules (R13-22, REVIEW-15): plan kinds and status, needs setup, the filter cards and
// filters through the list derivation, signup plans, offer order and checks, rev share words and
// the share. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { defaultListState, deriveList, type ListConfig } from "../lib/list-query.ts"
import {
  describeRevShare,
  fromRevShareDraft,
  hasRevShare,
  matchPartner,
  moveOffer,
  ordinal,
  otherPlans,
  partnerFilters,
  partnerKey,
  partnerSegments,
  partnerStatus,
  planSegment,
  planName,
  planOf,
  planStatus,
  REV_SHARE_DEFAULTS,
  setupIssues,
  shareCents,
  signupPlans,
  toRevShareDraft,
  validateOfferDraft,
  validateRevShareDraft,
  emptyOfferDraft,
  type PartnerOffer,
  type PartnerPlan,
  type PartnerRow,
} from "./partner-rules.ts"

const TODAY = "2026-10-20"

const plan = (o: Partial<PartnerPlan>): PartnerPlan => ({
  id: "pl",
  segment: null,
  slug: "x",
  signupUrl: "https://app.example.com/?partner_slug=x",
  planName: "Paige Membership",
  priceCents: 2900,
  cycle: "annual",
  stripePriceId: "price_x",
  active: true,
  startsAt: null,
  people: 10,
  revShare: false,
  ...o,
})
const partner = (p: Partial<PartnerRow>): PartnerRow => ({ id: "p", key: "p", name: "P", kind: "bank", logoUrl: "/l.svg", plans: [plan({})], offers: [], people: 10, active: true, ...p })

const rows: PartnerRow[] = [
  partner({ id: "1", name: "Cedar Trust", plans: [plan({ id: "a", slug: "cedar-trust", people: 5 }), plan({ id: "b", segment: "Employee", slug: "cedar-staff", people: 50, revShare: true })] }),
  partner({ id: "2", name: "Lakeside Credit Union", kind: "credit-union", plans: [plan({ startsAt: "2026-11-03" })] }),
  partner({ id: "3", name: "Brightpath", kind: null, logoUrl: null }),
  partner({ id: "4", name: "Harbor State", plans: [plan({ stripePriceId: null })] }),
  partner({ id: "5", name: "Granite Peak", plans: [] }),
  partner({ id: "6", name: "Bluewater", active: false, plans: [plan({ active: false })] }),
]

test("plan kinds: no segment is Customer, VIP and Employee(s) by name, anything else is other", () => {
  assert.equal(planSegment({ segment: null }), "customer")
  assert.equal(planSegment({ segment: "  " }), "customer")
  assert.equal(planSegment({ segment: "vip" }), "vip")
  assert.equal(planSegment({ segment: "Employees" }), "employee")
  assert.equal(planSegment({ segment: "Alumni" }), null)
  assert.equal(planName({ segment: "Alumni" }), "Alumni")
  assert.equal(planName({ segment: null }), "Customer")
  assert.deepEqual(otherPlans(partner({ plans: [plan({ segment: "SMB" }), plan({})] })).map((x) => x.segment), ["SMB"])
})

test("plan status: live once started, scheduled with a date ahead, off when not in effect", () => {
  assert.deepEqual(planStatus({ active: true, startsAt: null }, TODAY), { kind: "live" })
  assert.deepEqual(planStatus({ active: true, startsAt: TODAY }, TODAY), { kind: "live" })
  assert.deepEqual(planStatus({ active: true, startsAt: "2026-11-03" }, TODAY), { kind: "scheduled", startsAt: "2026-11-03" })
  assert.deepEqual(planStatus({ active: false, startsAt: "2026-11-03" }, TODAY), { kind: "off" })
})

test("planOf picks the live plan of a kind, else the first; null when the partner has none", () => {
  const p = partner({ plans: [plan({ id: "later", segment: "VIP", startsAt: "2027-01-01" }), plan({ id: "now", segment: "VIP" })] })
  assert.equal(planOf(p, "vip", TODAY)?.id, "now")
  assert.equal(planOf(p, "employee", TODAY), null)
})

test("needs setup: no logo, no plan in effect, a plan in effect without a Stripe price; inactive needs nothing", () => {
  assert.deepEqual(setupIssues(rows[0]), [])
  assert.deepEqual(setupIssues(rows[2]), ["no-logo"])
  assert.deepEqual(setupIssues(rows[3]), ["no-stripe-price"])
  assert.deepEqual(setupIssues(rows[4]), ["no-plan"])
  assert.deepEqual(setupIssues(rows[5]), [])
  assert.equal(partnerStatus(rows[0]), "active")
  assert.equal(partnerStatus(rows[2]), "needs-setup")
  assert.equal(partnerStatus(rows[5]), "inactive")
})

test("filter cards count under the search and filters (All · Live · Launching soon · Needs setup · Inactive)", () => {
  const segments = partnerSegments(TODAY)
  const config: ListConfig<PartnerRow> = { segments, filters: partnerFilters, search: matchPartner, sortValues: { people: (p) => p.people } }
  const state = defaultListState(config)
  const result = deriveList(rows, config, state, 25)
  assert.deepEqual(result.counts, { all: 6, live: 3, launching: 1, setup: 3, inactive: 1 })
  // Search by name or a plan's slug.
  assert.equal(deriveList(rows, config, { ...state, q: "cedar-staff" }, 25).matching.length, 1)
  // Type filter: "Type not set" is a value of its own.
  assert.deepEqual(
    deriveList(rows, config, { ...state, filters: { type: ["none"] } }, 25).matching.map((p) => p.name),
    ["Brightpath"]
  )
})

test("signup plans come in column order; rev share is on when any plan has it", () => {
  const p = partner({ plans: [plan({ id: "e", segment: "Employee" }), plan({ id: "o", segment: "Alumni" }), plan({ id: "c" }), plan({ id: "n", signupUrl: null, segment: "VIP" })] })
  assert.deepEqual(signupPlans(p).map((x) => x.id), ["c", "e", "o"])
  assert.equal(hasRevShare(rows[0]), true)
  assert.equal(hasRevShare(rows[1]), false)
})

test("partner keys", () => {
  assert.equal(partnerKey("Oak & Iron Trust"), "oak-iron-trust")
})

const offer = (o: Partial<PartnerOffer>): PartnerOffer => ({
  id: "o",
  adContext: "dashboard_ad",
  title: "T",
  description: null,
  buttonLabel: null,
  imageUrl: null,
  url: null,
  useLogoAsImage: true,
  position: 0,
  enabled: true,
  ...o,
})

test("offers move within their ad context and renumber from 0; an end stays put", () => {
  const offers = [offer({ id: "a", position: 0 }), offer({ id: "b", position: 1 }), offer({ id: "c", position: 2 })]
  assert.deepEqual(moveOffer(offers, "c", -1).map((o) => `${o.id}${o.position}`), ["a0", "c1", "b2"])
  assert.deepEqual(moveOffer(offers, "a", -1).map((o) => o.id), ["a", "b", "c"])
  assert.deepEqual(moveOffer(offers, "a", 1).map((o) => `${o.id}${o.position}`), ["b0", "a1", "c2"])
})

test("an offer needs a title; links and image addresses are web addresses", () => {
  assert.deepEqual(validateOfferDraft(emptyOfferDraft), { title: "Enter a title." })
  assert.deepEqual(validateOfferDraft({ ...emptyOfferDraft, title: "Free will review", url: "example.com" }), { url: "Enter a web address starting with https://." })
  assert.deepEqual(validateOfferDraft({ ...emptyOfferDraft, title: "x", useLogoAsImage: false, imageUrl: "ftp://x" }), { imageUrl: "Enter an image address starting with https://." })
  // The image address doesn't matter while the logo is used.
  assert.deepEqual(validateOfferDraft({ ...emptyOfferDraft, title: "x", useLogoAsImage: true, imageUrl: "nope" }), {})
  assert.deepEqual(validateOfferDraft({ ...emptyOfferDraft, title: "x", url: "https://cedartrust.example.com/paige" }), {})
})

test("rev share: the share is revenue × rate, none without a rate; the words follow the parameters", () => {
  assert.equal(shareCents(1_248_000, 10), 124_800)
  assert.equal(shareCents(1_000, 12.5), 125)
  assert.equal(shareCents(1_248_000, null), null)
  assert.equal(ordinal(4), "4th")
  assert.equal(ordinal(1), "1st")
  assert.equal(ordinal(12), "12th")
  assert.equal(ordinal(22), "22nd")
  const words = describeRevShare(REV_SHARE_DEFAULTS)
  assert.deepEqual(words.map((w) => w.value), ["Not set", "4th", "2", "Yes"])
  assert.match(words[1].meaning, /from their 4th paid month; the first 3 don't/)
  assert.match(describeRevShare({ ...REV_SHARE_DEFAULTS, willsCounted: 1 })[2].meaning, /first will purchase counts/)
})

test("rev share form: the rate may be empty; numbers are checked; a draft round-trips", () => {
  const draft = toRevShareDraft(REV_SHARE_DEFAULTS)
  assert.deepEqual(validateRevShareDraft(draft), {})
  assert.deepEqual(fromRevShareDraft({ ...draft, ratePercent: "12.5" }), { ...REV_SHARE_DEFAULTS, ratePercent: 12.5 })
  assert.deepEqual(Object.keys(validateRevShareDraft({ ...draft, ratePercent: "120", countFromPaidMonth: "0", willsCounted: "x" })), ["ratePercent", "countFromPaidMonth", "willsCounted"])
})
