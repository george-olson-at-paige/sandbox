// The People rules (R12-10, R17-08): last active in words, the filter cards and filters through the
// list derivation, search, and a plan change's preview in words. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { defaultListState, deriveList, parseListState, type ListConfig } from "../lib/list-query.ts"
import { describePlanPreview, formatAgo, matchPerson, peopleDefaultSort, peopleFilters, peopleSegments, personActionMessage, type PersonRow } from "./people-rules.ts"

const NOW = new Date("2026-10-20T15:00:00Z")

function person(patch: Partial<PersonRow> = {}): PersonRow {
  return { id: "p1", name: "Ada Park", email: "ada.park@example.com", plan: "direct", partner: null, status: "active", mfaPhone: true, trialEndsAt: null, createdAt: "2025-03-04", lastActiveAt: "2026-10-19T09:00:00Z", ...patch }
}

test("last active in words", () => {
  assert.equal(formatAgo(null, NOW), "Never")
  assert.equal(formatAgo("2026-10-20T08:00:00Z", NOW), "Today")
  assert.equal(formatAgo("2026-10-19T09:00:00Z", NOW), "Yesterday")
  assert.equal(formatAgo("2026-10-14T15:00:00Z", NOW), "6 days ago")
  assert.equal(formatAgo("2026-09-20T15:00:00Z", NOW), "4 weeks ago")
  assert.equal(formatAgo("2026-04-20T15:00:00Z", NOW), "6 months ago")
  assert.equal(formatAgo("2023-10-20T15:00:00Z", NOW), "3 years ago")
})

test("the cards: paying is Direct or Discounted; needs attention is past due, locked out or unverified", () => {
  const rows = [
    person({ id: "a" }),
    person({ id: "b", plan: "discounted", partner: "Cedar Trust" }),
    person({ id: "c", plan: "sponsored", partner: "Cedar Trust", status: "past-due" }),
    person({ id: "d", plan: "trial", status: "unverified" }),
    person({ id: "e", plan: "free", status: "locked" }),
    person({ id: "f", plan: "cancelled", status: "disabled" }),
  ]
  const config: ListConfig<PersonRow> = { segments: peopleSegments, filters: peopleFilters(["Cedar Trust"]), search: matchPerson, sortValues: {}, defaultSort: peopleDefaultSort }
  assert.deepEqual(deriveList(rows, config, defaultListState(config), 25).counts, { all: 6, paying: 2, sponsored: 1, trial: 1, attention: 3 })
  // The partner filter takes the Partners list's key (View people → ?partner=cedar-trust).
  const linked = parseListState(new URLSearchParams("partner=cedar-trust"), config)
  assert.deepEqual(deriveList(rows, config, { ...linked, q: "" }, 25).matching.map((p) => p.id), ["b", "c"])
})

test("search by name or email", () => {
  assert.equal(matchPerson(person(), "ada"), true)
  assert.equal(matchPerson(person(), "example.com"), true)
  assert.equal(matchPerson(person(), "smith"), false)
})

test("a plan change's preview in words", () => {
  assert.equal(describePlanPreview({ dueNowCents: 1250, nextInvoiceCents: 3000, nextInvoiceOn: "2027-03-04" }), "$12.50 is charged today (prorated). The next invoice is $30.00 on Mar 4, 2027.")
  assert.equal(describePlanPreview({ dueNowCents: -500, nextInvoiceCents: 0, nextInvoiceOn: "2027-03-04" }), "$5.00 is credited (prorated). No invoice follows.")
  assert.equal(describePlanPreview({ dueNowCents: 0, nextInvoiceCents: 0, nextInvoiceOn: "2027-03-04" }), "Nothing is charged today. No invoice follows.")
})

test("what a support action did, in words", () => {
  const ada = [{ name: "Ada Park" }]
  const many = [{ name: "Ada Park" }, { name: "Bo Ward" }]
  assert.equal(personActionMessage("verificationEmail", many), "Verification email sent to 2 people.")
  assert.equal(personActionMessage("unlock", ada), "Ada Park can sign in again.")
  assert.equal(personActionMessage("enable", ada), "Ada Park's account is enabled.")
  assert.equal(personActionMessage("resetMfa", ada), "Ada Park's MFA phone was removed.")
  assert.equal(personActionMessage("changePlan", ada, { plan: "trial" }), "Ada Park is on Trial.")
  assert.equal(personActionMessage("extendTrial", ada, { days: 30 }), "Ada Park's trial is 30 days longer.")
  assert.equal(personActionMessage("disable", ada), "Ada Park's account is disabled.")
  assert.equal(personActionMessage("disableMany", many), "2 accounts disabled.")
})
