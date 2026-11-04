import type { Cycle } from "../lib/format"
import {
  orderedOffers,
  partnerKey,
  REV_SHARE_DEFAULTS,
  type OfferDraft,
  type PartnerKind,
  type PartnerOffer,
  type PartnerPlan,
  type PartnerRevShare,
  type PartnerRow,
  type RevShareParams,
} from "../admin/partner-rules"

/* Partners for the Partners stories and the app's /admin/partners (R13-22, reworked by REVIEW-15; one copy, R17-03): 20 invented partners across
   the three types, with the variety the list has to show: Customer, VIP and Employee plans and
   plans outside them (Alumni, SMB), $0 plans the partner covers, a plan without a Stripe price,
   plans launching later (A39: "Starts Nov 3"), partners with no logo or no plan yet (Needs setup),
   rev share on for some plans (never VIP by default, as the reporting code had it), ad strip
   offers on three partners, and two partnerships that ended. Names, logos and offers are invented
   (logos: apps/web/public/assets/partner-logos, served to Storybook through staticDirs); signup
   links are example.com. The first five are the People fixtures' partners, so "View people" lands
   on rows; the people counts here are the partner's real-scale numbers, not the People sample.
   Fixtures only (package code never imports this folder); it goes when the API serves partners (API-NEEDS A30,
   GAPS #144). */

/** The day the fixtures are seen from: plans starting after it are "Launching soon". */
export const PARTNERS_TODAY = "2026-10-20"

type PlanSeed = [segment: string | null, slug: string | null, plan: string, priceCents: number, cycle: Cycle, stripe: boolean, active: boolean, startsAt: string | null, people: number, revShare: boolean]
type Seed = [name: string, kind: PartnerKind | null, logo: boolean, active: boolean, plans: PlanSeed[]]

const MEMBERSHIP = "Paige Membership"
const ONE_WILL = "Subscription with One Will"

const SEEDS: Seed[] = [
  ["Cedar Trust", "bank", true, true, [[null, "cedar-trust", ONE_WILL, 0, "monthly", true, true, null, 586, false], ["Employee", "cedar-trust-employees", MEMBERSHIP, 0, "annual", true, true, null, 41, false], ["VIP", "cedar-trust-vip", MEMBERSHIP, 0, "annual", true, true, "2026-11-03", 0, false]]],
  ["Lakeside Credit Union", "credit-union", true, true, [[null, "lakeside", MEMBERSHIP, 2900, "annual", true, true, null, 212, true]]],
  ["Northwind Financial", "bank", true, true, [[null, "northwind", MEMBERSHIP, 1900, "annual", true, true, null, 362, true], ["VIP", "northwind-vip", MEMBERSHIP, 0, "annual", true, true, null, 48, false], ["Employee", "northwind-staff", MEMBERSHIP, 0, "annual", true, true, null, 21, false]]],
  ["Summit Wealth Partners", null, true, true, [[null, "summit", MEMBERSHIP, 3900, "annual", true, true, null, 97, false]]],
  ["Brightpath Benefits", null, false, true, [["Employee", "brightpath", MEMBERSHIP, 0, "monthly", true, true, null, 64, false]]],
  ["Harbor State Bank", "bank", true, true, [[null, "harbor-state", MEMBERSHIP, 2400, "annual", false, true, "2026-12-01", 0, false]]],
  ["Riverbend University", "university", true, true, [["Alumni", "riverbend-alumni", MEMBERSHIP, 2400, "annual", true, true, null, 131, false], ["Employee", "riverbend-staff", MEMBERSHIP, 0, "annual", true, true, null, 17, false]]],
  ["Pioneer Federal Credit Union", "credit-union", true, true, [[null, "pioneer-fcu", MEMBERSHIP, 2900, "annual", true, true, null, 173, true]]],
  ["Granite Peak Bank", "bank", true, true, []],
  ["Meridian Community Bank", "bank", true, true, [["SMB", "meridian-smb", MEMBERSHIP, 4900, "annual", true, true, null, 58, false], [null, "meridian", MEMBERSHIP, 2900, "annual", true, false, null, 0, false]]],
  ["Copperline Credit Union", "credit-union", false, true, [[null, "copperline", MEMBERSHIP, 1900, "annual", false, true, null, 0, false]]],
  ["Westfield College", "university", true, true, [["Employee", "westfield", MEMBERSHIP, 0, "annual", true, true, null, 36, false]]],
  ["Bluewater Savings", "bank", true, false, [[null, "bluewater", MEMBERSHIP, 2900, "annual", true, false, null, 22, true]]],
  ["Evergreen Members Credit Union", "credit-union", true, true, [[null, "evergreen-cu", MEMBERSHIP, 1900, "annual", true, true, null, 119, true], ["VIP", "evergreen-vip", MEMBERSHIP, 0, "annual", true, true, "2027-01-05", 0, false]]],
  ["Oak & Iron Trust", "bank", true, true, [["VIP", "oak-iron-vip", ONE_WILL, 0, "monthly", true, true, null, 41, false]]],
  ["Prairie Farmers Bank", "bank", false, false, [[null, null, MEMBERSHIP, 2900, "annual", true, false, null, 9, false]]],
  ["Silverline Financial", null, true, true, [[null, "silverline", MEMBERSHIP, 2900, "annual", true, true, null, 27, true]]],
  ["Tidewater Bank & Trust", "bank", true, true, [[null, "tidewater", MEMBERSHIP, 0, "annual", true, true, null, 271, false], ["Employee", "tidewater-staff", MEMBERSHIP, 0, "annual", true, true, null, 32, false]]],
  ["Highland State University", "university", false, true, [["Alumni", "highland-alumni", MEMBERSHIP, 1900, "annual", true, true, null, 12, false]]],
  ["Keystone Credit Union", "credit-union", true, true, [[null, "keystone-cu", MEMBERSHIP, 2400, "annual", true, true, null, 88, true]]],
]

type OfferSeed = [title: string, description: string | null, buttonLabel: string | null, url: string | null, enabled: boolean]

/** Ad strip offers (invented copy) by partner key, in display order on the dashboard ad strip. */
const OFFERS: Record<string, OfferSeed[]> = {
  "cedar-trust": [
    ["Your will, covered by Cedar Trust", "Cedar Trust members get Paige at no cost. Most people finish their will in about 20 minutes.", "Start my will", "https://cedartrust.example.com/paige", true],
    ["Name a guardian this month", "If you have children under 18, naming a guardian is the step most people put off.", "Learn more", "https://cedartrust.example.com/paige/guardians", false],
  ],
  "lakeside-credit-union": [["A member benefit from Lakeside", "Plan for the people you love, included with your Lakeside membership.", "Get started", "https://lakeside.example.com/paige", true]],
  "northwind-financial": [
    ["Northwind members save on a will", "Your membership price covers a will and your vault.", "See your plan", "https://northwind.example.com/paige", true],
    ["Questions about estate planning?", "Join a free webinar with Northwind's wealth team.", "Register", "https://northwind.example.com/events", true],
    ["Keep your documents in one place", null, null, null, true],
  ],
}

const SIGNUP = "https://app.example.com/account/partnerRegister?partner_slug="

function build(): PartnerRow[] {
  return SEEDS.map(([name, kind, logo, active, plans], i) => {
    const key = partnerKey(name)
    const rows: PartnerPlan[] = plans.map(([segment, slug, planName, priceCents, cycle, stripe, planActive, startsAt, people, revShare], j) => ({
      id: `pl-${i + 1}-${j + 1}`,
      segment,
      slug,
      signupUrl: slug ? `${SIGNUP}${slug}` : null,
      planName,
      priceCents,
      cycle,
      stripePriceId: stripe ? `price_${key.replace(/-/g, "_")}_${j + 1}` : null,
      active: planActive,
      startsAt,
      people,
      revShare,
    }))
    const offers: PartnerOffer[] = (OFFERS[key] ?? []).map(([title, description, buttonLabel, url, enabled], j) => ({
      id: `of-${i + 1}-${j + 1}`,
      adContext: "dashboard_ad",
      title,
      description,
      buttonLabel,
      imageUrl: null,
      url,
      useLogoAsImage: true,
      position: j,
      enabled,
    }))
    return {
      id: `pt-${String(i + 101)}`,
      key,
      name,
      kind,
      logoUrl: logo ? `/assets/partner-logos/${key}.svg` : null,
      plans: rows,
      offers,
      people: rows.reduce((n, p) => n + p.people, 0),
      active,
    }
  })
}

export const partners: PartnerRow[] = build()

/** Every partner's name, for People's partner filter. */
export const PARTNER_NAMES = partners.map((p) => p.name)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ---------- Offers: stand-ins for the API (A32) ---------- */

/** Saves an offer (new when `id` is null) and answers with the partner's offers as they now stand. */
export async function saveOffer(partner: PartnerRow, offer: OfferDraft & { id: string | null }): Promise<{ offers: PartnerOffer[] }> {
  await wait(400)
  const all = orderedOffers(partner.offers)
  if (offer.id) return { offers: all.map((o) => (o.id === offer.id ? { ...o, ...offer, id: o.id } : o)) }
  const position = all.filter((o) => o.adContext === offer.adContext).length
  return { offers: [...all, { ...offer, id: `of-new-${Date.now().toString(36)}`, position, enabled: true }] }
}

export async function setOfferEnabled(partner: PartnerRow, id: string, enabled: boolean): Promise<{ offers: PartnerOffer[] }> {
  await wait(400)
  return { offers: orderedOffers(partner.offers).map((o) => (o.id === id ? { ...o, enabled } : o)) }
}

export async function reorderOffers(_partner: PartnerRow, offers: PartnerOffer[]): Promise<{ offers: PartnerOffer[] }> {
  await wait(300)
  return { offers: orderedOffers(offers) }
}

/* ---------- Rev share: stand-ins for the API (A37) ---------- */

/** Each partner's base for the stand-in calculation, and its override where it has one, by partner key. */
const REV_SHARE_BASE: Record<string, { revenueCents: number; override?: RevShareParams }> = {
  "lakeside-credit-union": { revenueCents: 1_248_000, override: { ratePercent: 10, countFromPaidMonth: 4, willsCounted: 2, deductRefunds: true } },
  "northwind-financial": { revenueCents: 1_832_000 },
  "pioneer-federal-credit-union": { revenueCents: 642_000 },
  "bluewater-savings": { revenueCents: 118_000 },
  "evergreen-members-credit-union": { revenueCents: 286_000 },
  "silverline-financial": { revenueCents: 94_000 },
  "keystone-credit-union": { revenueCents: 410_000, override: { ratePercent: 12.5, countFromPaidMonth: 3, willsCounted: 2, deductRefunds: true } },
}

/** The global defaults the stand-ins use (the settings page saves over them). */
export let revShareDefaults: RevShareParams = { ...REV_SHARE_DEFAULTS }

/** Each partner's override, by key (the partner page saves or drops one). */
const overrides = new Map<string, RevShareParams>(Object.entries(REV_SHARE_BASE).flatMap(([key, b]) => (b.override ? [[key, b.override] as const] : [])))

/** A stand-in for the API's calculation: eligible people from the plans with rev share on, revenue scaled by the parameters in force (the stored override, or `override` when given; null: the defaults). */
export function revShareFor(partner: PartnerRow, override: RevShareParams | null = overrides.get(partner.key) ?? null): PartnerRevShare {
  const params = override ?? revShareDefaults
  const on = partner.plans.filter((p) => p.revShare)
  const base = on.length ? (REV_SHARE_BASE[partner.key]?.revenueCents ?? on.reduce((n, p) => n + p.people * 2400, 0)) : 0
  const factor = Math.max(0.4, 1 - 0.06 * (params.countFromPaidMonth - 4)) * (1 + 0.04 * (params.willsCounted - 2)) * (params.deductRefunds ? 1 : 1.03)
  return {
    source: override ? "override" : "defaults",
    params,
    result: { eligiblePeople: Math.round(on.reduce((n, p) => n + p.people, 0) * 0.85), qualifyingRevenueCents: Math.round(base * factor) },
  }
}

/** Saves a partner's override (or drops it with null) and answers with its rev share as it now stands. */
export async function saveRevShareOverride(partner: PartnerRow, params: RevShareParams | null): Promise<PartnerRevShare> {
  await wait(500)
  if (params) overrides.set(partner.key, params)
  else overrides.delete(partner.key)
  return revShareFor(partner)
}

/** How many partners with rev share use the defaults, and how many have an override. */
export function revShareUsage(): { usingDefaults: number; overrides: number } {
  const on = partners.filter((p) => p.plans.some((x) => x.revShare))
  const n = on.filter((p) => overrides.has(p.key)).length
  return { usingDefaults: on.length - n, overrides: n }
}

export async function saveRevShareDefaults(params: RevShareParams): Promise<{ usingDefaults: number; overrides: number }> {
  await wait(500)
  revShareDefaults = params
  return revShareUsage()
}
