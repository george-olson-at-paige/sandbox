/* The admin People data and rules (R12-10, split from people.tsx by R17-08): the row type, the
   company's subscription kinds and account standings, "last active" in words, the filter cards
   and filters, the plan and trial choices, and what a plan change will do in words. Pure, no
   React, tested under node (people-rules.test.ts); `people.tsx` renders them.
   The plan vocabulary is the company's subscription kinds: Direct, Sponsored, Discounted, Free,
   Trial, No plan, Cancelled (the server will derive them from the person's subscription, A42).
   Partners' plan columns are a different thing, `PlanSegment` (R17-02). */

import { formatCents, formatDay, possessive } from "../lib/format.ts"
import type { ListFilter, ListSegment, ListSort } from "../lib/list-query.ts"
import { partnerKey } from "./partner-rules.ts"

/** The company's subscription kinds. */
export type PlanKind = "direct" | "sponsored" | "discounted" | "free" | "trial" | "no-plan" | "cancelled"

/** A person's account standing, most pressing first. */
export type PersonStatus = "active" | "unverified" | "locked" | "past-due" | "disabled"

/** One person as the People list shows them. */
export type PersonRow = {
  id: string
  name: string
  email: string
  plan: PlanKind
  /** The partner behind a Sponsored or Discounted plan. */
  partner: string | null
  status: PersonStatus
  /** An MFA phone is on file. */
  mfaPhone: boolean
  /** ISO date; set while in a trial. */
  trialEndsAt: string | null
  /** ISO date. */
  createdAt: string
  /** ISO date-time; null if they never signed in. */
  lastActiveAt: string | null
}

export const PLAN_LABEL: Record<PlanKind, string> = {
  direct: "Direct",
  sponsored: "Sponsored",
  discounted: "Discounted",
  free: "Free",
  trial: "Trial",
  "no-plan": "No plan",
  cancelled: "Cancelled",
}

export const PERSON_STATUS: Record<PersonStatus, { label: string; tone: "success" | "warning" | "attention" | "neutral"; outline?: boolean }> = {
  active: { label: "Active", tone: "success" },
  unverified: { label: "Unverified email", tone: "warning" },
  locked: { label: "Locked out", tone: "attention" },
  "past-due": { label: "Past due", tone: "attention" },
  disabled: { label: "Disabled", tone: "neutral", outline: true },
}

const DAY = 86_400_000

/** "Today", "Yesterday", "3 days ago", "5 weeks ago", "4 months ago", "2 years ago"; "Never" for null. */
export function formatAgo(iso: string | null, now: Date): string {
  if (!iso) return "Never"
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`
  if (days < 730) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

/** The filter cards: the questions support asks first. */
export const peopleSegments: ListSegment<PersonRow>[] = [
  { id: "all", label: "All people" },
  { id: "paying", label: "Paying", match: (p) => p.plan === "direct" || p.plan === "discounted" },
  { id: "sponsored", label: "Sponsored", match: (p) => p.plan === "sponsored" },
  { id: "trial", label: "Trial", match: (p) => p.plan === "trial" },
  { id: "attention", label: "Needs attention", description: "Past due, locked out or unverified", match: (p) => p.status === "past-due" || p.status === "locked" || p.status === "unverified" },
]

/** The Filters popover (R13-06): plan kind and status (any of), last active and created (date ranges), partner (one).
    The partner values are partner keys, the same `partnerKey` the Partners list links with ("View people" → /admin/people?partner=<key>, R13-22). */
export function peopleFilters(partners: readonly string[]): ListFilter<PersonRow>[] {
  return [
    { id: "plan", label: "Plan", multiple: true, placeholder: "Any plan", options: (Object.keys(PLAN_LABEL) as PlanKind[]).map((k) => ({ value: k, label: PLAN_LABEL[k] })), match: (p, v) => v.includes(p.plan) },
    { id: "status", label: "Status", multiple: true, placeholder: "Any status", options: (Object.keys(PERSON_STATUS) as PersonStatus[]).map((k) => ({ value: k, label: PERSON_STATUS[k].label })), match: (p, v) => v.includes(p.status) },
    { kind: "date-range", id: "lastActive", label: "Last active", date: (p) => p.lastActiveAt },
    { kind: "date-range", id: "created", label: "Created", date: (p) => p.createdAt },
    { id: "partner", label: "Partner", placeholder: "Any partner", options: partners.map((name) => ({ value: partnerKey(name), label: name })), match: (p, v) => p.partner !== null && v.includes(partnerKey(p.partner)) },
  ]
}

/** Name or email contains the search. */
export const matchPerson = (p: PersonRow, q: string) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)

/** Newest first. */
export const peopleDefaultSort: ListSort = { id: "created", desc: true }

/** The support actions (the Vue admin's ids where they exist). */
export type PersonActionId = "verificationEmail" | "unlock" | "resetMfa" | "enable" | "changePlan" | "extendTrial" | "disable" | "disableMany"

/** What an action carries besides who it's for: the reason, and its own fields. */
export type PersonActionInput = { reason: string; plan?: PlanKind; days?: number }

/** The plans Change plan offers. */
export const PLAN_CHOICES: { value: PlanKind; label: string }[] = [
  { value: "direct", label: "Direct (Paige Annual)" },
  { value: "free", label: "Free" },
  { value: "trial", label: "Trial (14 days)" },
]

/** How much longer Extend trial can make a trial. */
export const TRIAL_CHOICES: { value: string; label: string }[] = [
  { value: "7", label: "7 more days" },
  { value: "14", label: "14 more days" },
  { value: "30", label: "30 more days" },
]

/** What the API says a plan change will do (R13-08): Stripe's proration and the next invoice, in cents. */
export type PlanChangePreview = { dueNowCents: number; nextInvoiceCents: number; nextInvoiceOn: string }

/** Asks the API what moving this person to `plan` would do (charges and the next invoice); `{ error }` when it can't say. */
export type PreviewPlanChange = (person: PersonRow, plan: PlanKind) => Promise<PlanChangePreview | { error: string }>

/** A plan change's preview in words: what's charged or credited today, then the next invoice. */
export function describePlanPreview(p: PlanChangePreview): string {
  const today = p.dueNowCents > 0 ? `${formatCents(p.dueNowCents)} is charged today (prorated).` : p.dueNowCents < 0 ? `${formatCents(-p.dueNowCents)} is credited (prorated).` : "Nothing is charged today."
  const next = p.nextInvoiceCents > 0 ? `The next invoice is ${formatCents(p.nextInvoiceCents)} on ${formatDay(p.nextInvoiceOn)}.` : "No invoice follows."
  return `${today} ${next}`
}

/** What a support action did, for the list's status line (R17-06: the story and the app say the same). */
export function personActionMessage(id: PersonActionId, people: readonly Pick<PersonRow, "name">[], input: Pick<PersonActionInput, "plan" | "days"> = {}): string {
  const who = people.length === 1 ? people[0].name : `${people.length} people`
  switch (id) {
    case "verificationEmail":
      return `Verification email sent to ${who}.`
    case "unlock":
      return `${who} can sign in again.`
    case "enable":
      return `${possessive(who)} account is enabled.`
    case "resetMfa":
      return `${possessive(who)} MFA phone was removed.`
    case "changePlan":
      return `${who} is on ${PLAN_LABEL[input.plan ?? "direct"]}.`
    case "extendTrial":
      return `${possessive(who)} trial is ${input.days ?? 14} days longer.`
    case "disable":
    case "disableMany":
      return people.length === 1 ? `${possessive(who)} account is disabled.` : `${people.length} accounts disabled.`
  }
}
