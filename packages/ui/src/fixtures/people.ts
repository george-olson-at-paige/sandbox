import type { PersonRow, PersonStatus, PlanKind, PreviewPlanChange } from "../admin/pages/people"

/* People for the People stories and the app's /admin/people (R12-10; one copy, R17-03): 150
   invented people across the subscription kinds, at roughly the customer profile's mix, generated
   from a fixed seed so every render and every test sees the same rows. Names and partners are
   invented; emails are example.com. Fixtures only: package code never imports this folder
   (check-layers); it goes when the API serves people (GAPS #133). */

/** "Now" for the fixtures, so "last active" reads the same every day. */
export const PEOPLE_NOW = new Date("2026-10-20T15:00:00Z")

export const PARTNERS = ["Cedar Trust", "Lakeside Credit Union", "Northwind Financial", "Summit Wealth Partners", "Brightpath Benefits"] as const

const FIRST = ["Ada", "Ben", "Cora", "Dev", "Eli", "Fay", "Gus", "Hana", "Ira", "June", "Kai", "Lena", "Milo", "Nora", "Omar", "Pia", "Quinn", "Rosa", "Sam", "Tess", "Uma", "Vic", "Wren", "Xavi", "Yara", "Zeke", "Alma", "Bo", "Cyrus", "Dina"]
const LAST = ["Park", "Ortiz", "Smith", "Okafor", "Lindqvist", "Nguyen", "Haddad", "Moreau", "Kowalski", "Reyes", "Abara", "Fischer", "Tanaka", "Murphy", "Silva", "Novak", "Chen", "Delgado", "Ward", "Bianchi", "Iyer"]

/** How many of each kind (150 in all). */
const MIX: Array<[PlanKind, number]> = [
  ["direct", 42],
  ["sponsored", 28],
  ["discounted", 12],
  ["free", 18],
  ["trial", 20],
  ["no-plan", 15],
  ["cancelled", 15],
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

const iso = (ms: number) => new Date(ms).toISOString()
const isoDate = (ms: number) => iso(ms).slice(0, 10)

function generate(): PersonRow[] {
  const rand = mulberry32(20261020)
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
  const now = PEOPLE_NOW.getTime()
  const day = 86_400_000
  const used = new Set<string>()
  const out: PersonRow[] = []
  for (const [plan, n] of MIX)
    for (let i = 0; i < n; i++) {
      let name: string
      do name = `${pick(FIRST)} ${pick(LAST)}`
      while (used.has(name))
      used.add(name)
      const [first, last] = name.toLowerCase().split(" ")
      const age = plan === "trial" ? Math.floor(rand() * 14) : Math.floor(rand() * 1380) + 3
      const created = now - age * day
      let status: PersonStatus = "active"
      const r = rand()
      if (plan === "no-plan" && r < 0.5) status = "unverified"
      else if (r < 0.06) status = "unverified"
      else if (r < 0.09) status = "locked"
      else if ((plan === "direct" || plan === "discounted" || plan === "sponsored") && r < 0.16) status = "past-due"
      else if (r > 0.985) status = "disabled"
      const never = status === "unverified" && rand() < 0.6
      const lastActive = never ? null : created + Math.floor(rand() * (now - created))
      out.push({
        id: `p-${String(out.length + 1001)}`,
        name,
        email: `${first}.${last}${rand() < 0.3 ? Math.floor(rand() * 90 + 10) : ""}@example.com`,
        plan,
        partner: plan === "sponsored" || plan === "discounted" ? pick(PARTNERS) : null,
        status,
        mfaPhone: rand() < 0.6,
        trialEndsAt: plan === "trial" ? isoDate(created + 14 * day) : null,
        createdAt: isoDate(created),
        lastActiveAt: lastActive === null ? null : iso(lastActive),
      })
    }
  return out
}

export const people: PersonRow[] = generate()

/** A stand-in for the API's plan-change preview (R13-08, API-NEEDS.md): what Stripe would charge now
    and the next invoice. Direct is $99 a year, prorated over the days left in the person's year;
    Free and Trial charge nothing. */
export const previewPlanChange = (async (person, plan) => {
  await new Promise((r) => setTimeout(r, 300))
  const nextYear = new Date(PEOPLE_NOW.getTime() + 365 * 86_400_000).toISOString().slice(0, 10)
  if (plan !== "direct") return { dueNowCents: 0, nextInvoiceCents: 0, nextInvoiceOn: nextYear }
  const paying = person.plan === "direct" || person.plan === "discounted"
  return { dueNowCents: paying ? 0 : 8_250, nextInvoiceCents: 9_900, nextInvoiceOn: nextYear }
}) satisfies PreviewPlanChange
