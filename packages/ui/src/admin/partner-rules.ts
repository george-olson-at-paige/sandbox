/* The admin Partners data and rules (R13-22, reworked by REVIEW-15): the row type, a plan's
   status, what "needs setup" means, the filter cards and filters, prices, and the rev share
   parameters. Pure, no React, tested under node (partner-rules.test.ts); `partners.tsx`,
   `partner-offers.tsx` and `rev-share.tsx` render them.

   Vocabulary (REVIEW-15 § Model, from Paige.Domain Partner, Sponsorship, PartnerOffer):
   - A **partner** is the business (one of the banks, credit unions and universities that sponsor
     Paige) with one banner logo. Never "bank" for a partner.
   - Its **plans** are its sponsorships (`Sponsorship`), one per segment: **Customer** (no segment,
     the partner's customers in general), **VIP**, **Employee**. `Sponsorship.Segment` is an open
     vocabulary, so a plan for any other segment ("Alumni", "SMB") is an "other" plan. Each plan has
     its own signup slug, the member's price (a Stripe price) and a launch date (`startsAt`, A39).
   - Its **offers** are the in-app ad strip (`PartnerOffer`): title, description, button label,
     link, image or the partner's logo, where it shows (ad context), order, on or off. Nothing else
     is called an offer.
   - **Rev share** is a pricing agreement: one parameter set (rate, the paid month subscriptions
     count from, wills counted, refunds deducted), the global defaults or the partner's own
     override, enabled per plan. */

import type { IsoDate } from "../lib/dates.ts"
import type { Cycle } from "../lib/format.ts"
import type { ListFilter, ListSegment, ListSort } from "../lib/list-query.ts"

/** What kind of organisation a partner is (null until someone says). */
export type PartnerKind = "bank" | "credit-union" | "university"

/** The plan segments the list has a column for; any other segment is "other" (R17-02: PlanSegment is People's subscription kinds). */
export type PlanSegment = "customer" | "vip" | "employee"

/** One plan: a sponsorship's segment, signup slug, member's price and launch date. */
export type PartnerPlan = {
  id: string
  /** `Sponsorship.Segment`: null = Customer (the partner's customers in general); "VIP", "Employee" or any other the partner uses. */
  segment: string | null
  /** The signup slug; null when people reach it another way (a promotion code). */
  slug: string | null
  /** The public signup link for the slug (the API builds it, A33); null without a slug. */
  signupUrl: string | null
  /** The underlying plan's name ("Paige Membership"). */
  planName: string
  /** What a member pays per term, in cents; 0 = the partner covers it. */
  priceCents: number
  cycle: Cycle
  /** The Stripe price behind it; null = none yet (it can't be sold). */
  stripePriceId: string | null
  /** `Sponsorship.IsActive`: in effect, or due to start on `startsAt`. */
  active: boolean
  /** The launch date (A39); null = no date, live while active. */
  startsAt: IsoDate | null
  /** People on this plan. */
  people: number
  /** Rev share is on for this plan (R15-11). */
  revShare: boolean
}

/** One ad strip offer (`PartnerOffer`): only the contract's fields (R15-15). */
export type PartnerOffer = {
  id: string
  /** Where it shows (`AdContext`): "dashboard_ad", the dashboard's ad strip. */
  adContext: string
  title: string
  description: string | null
  buttonLabel: string | null
  /** The image's URL; ignored while `useLogoAsImage`. */
  imageUrl: string | null
  /** Where the button goes. */
  url: string | null
  /** Show the partner's banner logo instead of an image. */
  useLogoAsImage: boolean
  /** Display order within the same ad context (0 first). */
  position: number
  enabled: boolean
}

/** One partner as the Partners list shows it. */
export type PartnerRow = {
  id: string
  /** The partner's stable key: its page's URL and People's partner filter value (the API's partner id later, REVIEW-15 Decided). */
  key: string
  name: string
  kind: PartnerKind | null
  /** The banner logo's URL; null = none uploaded. */
  logoUrl: string | null
  plans: PartnerPlan[]
  /** Its ad strip offers, in display order. */
  offers: PartnerOffer[]
  /** People sponsored by the partner (every plan). */
  people: number
  /** False once the partnership has ended. */
  active: boolean
}

/** What's missing before a partner is set up. */
export type SetupIssue = "no-logo" | "no-plan" | "no-stripe-price"

/** The partner's standing on the list. */
export type PartnerStatus = "active" | "needs-setup" | "inactive"

/** A plan's status in its cell: live, starting on a date, or not in effect. */
export type PlanStatus = { kind: "live" } | { kind: "scheduled"; startsAt: IsoDate } | { kind: "off" }

export const PARTNER_KIND_LABEL: Record<PartnerKind, string> = { bank: "Bank", "credit-union": "Credit union", university: "University" }

export const PLAN_SEGMENT_LABEL: Record<PlanSegment, string> = { customer: "Customer", vip: "VIP", employee: "Employee" }

/** The three plan columns, in order. */
export const PLAN_SEGMENTS: readonly PlanSegment[] = ["customer", "vip", "employee"]

export const SETUP_ISSUE_LABEL: Record<SetupIssue, string> = {
  "no-logo": "No logo",
  "no-plan": "No plan",
  "no-stripe-price": "No Stripe price",
}

export const PARTNER_STATUS: Record<PartnerStatus, { label: string; tone: "success" | "warning" | "neutral"; outline?: boolean }> = {
  active: { label: "Active", tone: "success" },
  "needs-setup": { label: "Needs setup", tone: "warning" },
  inactive: { label: "Inactive", tone: "neutral", outline: true },
}

/** Which column a plan sits in: Customer (no segment), VIP, Employee, or null for any other segment. */
export function planSegment(plan: Pick<PartnerPlan, "segment">): PlanSegment | null {
  const s = plan.segment?.trim().toLowerCase()
  if (!s) return "customer"
  if (s === "vip") return "vip"
  if (s === "employee" || s === "employees") return "employee"
  return null
}

/** A plan's name: "Customer", "VIP", "Employee", or its own segment ("Alumni"). */
export const planName = (plan: Pick<PartnerPlan, "segment">) => {
  const k = planSegment(plan)
  return k ? PLAN_SEGMENT_LABEL[k] : (plan.segment ?? "Customer")
}

/** Live: active and started (no date, or the date is today or past). Scheduled: active with a date ahead. */
export function planStatus(plan: Pick<PartnerPlan, "active" | "startsAt">, today: IsoDate): PlanStatus {
  if (!plan.active) return { kind: "off" }
  if (plan.startsAt && plan.startsAt > today) return { kind: "scheduled", startsAt: plan.startsAt }
  return { kind: "live" }
}

/** The partner's plan of a kind (the live one first when there are several). */
export function planOf(p: PartnerRow, kind: PlanSegment, today: IsoDate): PartnerPlan | null {
  const all = p.plans.filter((x) => planSegment(x) === kind)
  return all.find((x) => planStatus(x, today).kind === "live") ?? all[0] ?? null
}

/** Plans outside Customer, VIP and Employee. */
export const otherPlans = (p: PartnerRow) => p.plans.filter((x) => planSegment(x) === null)

/** Rev share is on when any plan has it on (REVIEW-15 § Model). */
export const hasRevShare = (p: Pick<PartnerRow, "plans">) => p.plans.some((x) => x.revShare)

/** What an active partner still lacks, in the order to fix it; an inactive partner needs nothing. */
export function setupIssues(p: PartnerRow): SetupIssue[] {
  if (!p.active) return []
  const issues: SetupIssue[] = []
  if (!p.logoUrl) issues.push("no-logo")
  const inEffect = p.plans.filter((x) => x.active)
  if (inEffect.length === 0) issues.push("no-plan")
  if (inEffect.some((x) => !x.stripePriceId)) issues.push("no-stripe-price")
  return issues
}

export function partnerStatus(p: PartnerRow): PartnerStatus {
  if (!p.active) return "inactive"
  return setupIssues(p).length ? "needs-setup" : "active"
}

/** The plans with a signup link, in column order (Customer, VIP, Employee, then the others). */
export function signupPlans(p: Pick<PartnerRow, "plans">): PartnerPlan[] {
  const rank = (x: PartnerPlan) => {
    const k = planSegment(x)
    return k ? PLAN_SEGMENTS.indexOf(k) : PLAN_SEGMENTS.length
  }
  return p.plans.filter((x) => x.signupUrl).sort((a, b) => rank(a) - rank(b))
}

/** The filter cards (R15-08), for a given day (live and launching depend on it). */
export function partnerSegments(today: IsoDate): ListSegment<PartnerRow>[] {
  return [
    { id: "all", label: "All" },
    { id: "live", label: "Live", description: "A plan in effect now", match: (p) => p.active && p.plans.some((x) => planStatus(x, today).kind === "live") },
    { id: "launching", label: "Launching soon", description: "A plan with a start date ahead", match: (p) => p.active && p.plans.some((x) => planStatus(x, today).kind === "scheduled") },
    { id: "setup", label: "Needs setup", description: "No logo, no plan, or a plan without a Stripe price", match: (p) => partnerStatus(p) === "needs-setup" },
    { id: "inactive", label: "Inactive", match: (p) => !p.active },
  ]
}

/** The Filters popover: type and setup issue, any of each. */
export const partnerFilters: ListFilter<PartnerRow>[] = [
  {
    id: "type",
    label: "Type",
    multiple: true,
    placeholder: "Any type",
    options: [...(Object.keys(PARTNER_KIND_LABEL) as PartnerKind[]).map((k) => ({ value: k, label: PARTNER_KIND_LABEL[k] })), { value: "none", label: "Type not set" }],
    match: (p, v) => v.includes(p.kind ?? "none"),
  },
  {
    id: "setup",
    label: "Setup issue",
    multiple: true,
    placeholder: "Any",
    options: (Object.keys(SETUP_ISSUE_LABEL) as SetupIssue[]).map((k) => ({ value: k, label: SETUP_ISSUE_LABEL[k] })),
    match: (p, v) => setupIssues(p).some((i) => v.includes(i)),
  },
]

/** A partner's key from its name ("Oak & Iron Trust" → "oak-iron-trust"), until the API serves the partner id (REVIEW-15 Decided). */
export const partnerKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/** Name or any plan's slug contains the search. */
export const matchPartner = (p: PartnerRow, q: string) => p.name.toLowerCase().includes(q) || p.plans.some((x) => x.slug?.includes(q))

/** Most people first. */
export const partnerDefaultSort: ListSort = { id: "people", desc: true }

/* ---------- Offers (the ad strip, R15-15) ---------- */

/** Where an offer can show (`AdContext`). The contract names one surface today; the API lists them later (GAPS). */
export const AD_CONTEXT_LABEL: Record<string, string> = { dashboard_ad: "Dashboard ad strip" }

/** "Dashboard ad strip", or the raw key for a surface the UI doesn't know yet. */
export const adContextLabel = (key: string) => AD_CONTEXT_LABEL[key] ?? key

/** The offers in display order: by ad context, then position. */
export function orderedOffers(offers: readonly PartnerOffer[]): PartnerOffer[] {
  return [...offers].sort((a, b) => a.adContext.localeCompare(b.adContext) || a.position - b.position)
}

/** Moves an offer one place up or down within its ad context and renumbers positions from 0; unchanged at an end. */
export function moveOffer(offers: readonly PartnerOffer[], id: string, by: -1 | 1): PartnerOffer[] {
  const all = orderedOffers(offers)
  const me = all.find((o) => o.id === id)
  if (!me) return all
  const same = all.filter((o) => o.adContext === me.adContext)
  const i = same.indexOf(me)
  const j = i + by
  if (j < 0 || j >= same.length) return all
  ;[same[i], same[j]] = [same[j], same[i]]
  const renumbered = new Map(same.map((o, k) => [o.id, k]))
  return orderedOffers(all.map((o) => (renumbered.has(o.id) ? { ...o, position: renumbered.get(o.id)! } : o)))
}

/** What the offer editor holds (the contract's fields without id, position and enabled). */
export type OfferDraft = Pick<PartnerOffer, "adContext" | "title" | "description" | "buttonLabel" | "imageUrl" | "url" | "useLogoAsImage">

export const emptyOfferDraft: OfferDraft = { adContext: "dashboard_ad", title: "", description: null, buttonLabel: null, imageUrl: null, url: null, useLogoAsImage: true }

const httpUrl = (v: string) => /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(v)

/** The editor's rules: a title; a link and an image URL, when given, are web addresses. Errors by field name. */
export function validateOfferDraft(d: OfferDraft): Partial<Record<"title" | "url" | "imageUrl", string>> {
  const errors: Partial<Record<"title" | "url" | "imageUrl", string>> = {}
  if (!d.title.trim()) errors.title = "Enter a title."
  if (d.url && !httpUrl(d.url.trim())) errors.url = "Enter a web address starting with https://."
  if (!d.useLogoAsImage && d.imageUrl && !httpUrl(d.imageUrl.trim())) errors.imageUrl = "Enter an image address starting with https://."
  return errors
}

/* ---------- Rev share (R15-11, R15-12) ---------- */

/** The one rev share parameter set (REVIEW-15 § Model; A37). */
export type RevShareParams = {
  /** The partner's share of qualifying revenue, in percent; entered by hand until HubSpot is integrated. Null: no rate yet, so no share. */
  ratePercent: number | null
  /** Subscription payments count from this paid month on (4: from the fourth). */
  countFromPaidMonth: number
  /** Will purchases counted per person, ever. */
  willsCounted: number
  /** Refunded amounts come off the revenue. */
  deductRefunds: boolean
}

/** The global defaults as the reporting code applies them today (RevShareCharges: the fourth paid month, two wills, net of refunds); no rate. */
export const REV_SHARE_DEFAULTS: RevShareParams = { ratePercent: null, countFromPaidMonth: 4, willsCounted: 2, deductRefunds: true }

/** Where a partner's parameters come from. */
export type RevShareSource = "defaults" | "override"

/** What the calculation found for a partner (A37 `result`). */
export type RevShareResult = {
  /** People on a plan with rev share on, paying themselves. */
  eligiblePeople: number
  /** What they paid that counts under the parameters, in cents. */
  qualifyingRevenueCents: number
}

/** A partner's rev share as its page shows it: the parameters in force, where they come from, and the results. */
export type PartnerRevShare = {
  source: RevShareSource
  /** The parameters in force (the defaults or the override). */
  params: RevShareParams
  result: RevShareResult
}

/** The share: qualifying revenue × rate, rounded to the cent; null without a rate. */
export function shareCents(revenueCents: number, ratePercent: number | null): number | null {
  if (ratePercent === null) return null
  return Math.round((revenueCents * ratePercent) / 100)
}

/** "4th", "1st", "22nd". */
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13
  const s = teen ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"
  return `${n}${s}`
}

/** Each parameter in plain words, for the read view (R15-11: "each is described in plain words"). */
export function describeRevShare(p: RevShareParams): { id: keyof RevShareParams; label: string; value: string; meaning: string }[] {
  return [
    {
      id: "ratePercent",
      label: "Rate",
      value: p.ratePercent === null ? "Not set" : `${p.ratePercent}%`,
      meaning: p.ratePercent === null ? "No share can be calculated until someone enters the rate from the agreement." : `The partner gets ${p.ratePercent}% of qualifying revenue.`,
    },
    {
      id: "countFromPaidMonth",
      label: "Count from paid month",
      value: ordinal(p.countFromPaidMonth),
      meaning:
        p.countFromPaidMonth <= 1
          ? "Every subscription payment counts."
          : `A person's subscription payments count from their ${ordinal(p.countFromPaidMonth)} paid month; the first ${p.countFromPaidMonth - 1} don't.`,
    },
    {
      id: "willsCounted",
      label: "Wills counted",
      value: String(p.willsCounted),
      meaning: p.willsCounted === 0 ? "Will purchases don't count." : `A person's first ${p.willsCounted === 1 ? "will purchase counts" : `${p.willsCounted} will purchases count`}; later ones don't.`,
    },
    {
      id: "deductRefunds",
      label: "Refunds deducted",
      value: p.deductRefunds ? "Yes" : "No",
      meaning: p.deductRefunds ? "Refunded amounts come off the revenue." : "Refunds don't change the revenue.",
    },
  ]
}

/** What the parameter form holds while editing: text as typed, so a half-typed number stays put. */
export type RevShareDraft = { ratePercent: string; countFromPaidMonth: string; willsCounted: string; deductRefunds: boolean }

export const toRevShareDraft = (p: RevShareParams): RevShareDraft => ({
  ratePercent: p.ratePercent === null ? "" : String(p.ratePercent),
  countFromPaidMonth: String(p.countFromPaidMonth),
  willsCounted: String(p.willsCounted),
  deductRefunds: p.deductRefunds,
})

/** The form's rules: the rate empty or 0–100 (two decimals at most); the month 1–24; wills 0–10. Errors by field name. */
export function validateRevShareDraft(d: RevShareDraft): Partial<Record<"ratePercent" | "countFromPaidMonth" | "willsCounted", string>> {
  const errors: Partial<Record<"ratePercent" | "countFromPaidMonth" | "willsCounted", string>> = {}
  const rate = d.ratePercent.trim()
  if (rate && (!/^\d{1,3}(\.\d{1,2})?$/.test(rate) || Number(rate) > 100)) errors.ratePercent = "Enter a rate from 0 to 100, like 12.5."
  if (!/^\d{1,2}$/.test(d.countFromPaidMonth.trim()) || Number(d.countFromPaidMonth) < 1 || Number(d.countFromPaidMonth) > 24) errors.countFromPaidMonth = "Enter a month from 1 to 24."
  if (!/^\d{1,2}$/.test(d.willsCounted.trim()) || Number(d.willsCounted) > 10) errors.willsCounted = "Enter a number from 0 to 10."
  return errors
}

/** The draft as parameters (call after validateRevShareDraft finds nothing). */
export const fromRevShareDraft = (d: RevShareDraft): RevShareParams => ({
  ratePercent: d.ratePercent.trim() === "" ? null : Number(d.ratePercent),
  countFromPaidMonth: Number(d.countFromPaidMonth),
  willsCounted: Number(d.willsCounted),
  deductRefunds: d.deductRefunds,
})
