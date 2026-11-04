// The stack rules (ADR 0076 amendment 2026-10-28, rules 1, 3, 4, 5). node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  contactFieldsFor,
  pickCandidates,
  pickMode,
  quickAddFor,
  sameOpenThing,
  STACK_REST,
  stackHasRoom,
  stackOpenReducer,
  type QuickAddOption,
  type StackOpen,
} from "./stack-rules.ts"

test("rule 1: one open thing; an entry toggles, the add replaces it", () => {
  let s: StackOpen = STACK_REST
  s = stackOpenReducer(s, { type: "toggle-entry", id: "a" })
  assert.deepEqual(s, { kind: "entry", id: "a" })
  s = stackOpenReducer(s, { type: "toggle-entry", id: "b" })
  assert.deepEqual(s, { kind: "entry", id: "b" })
  s = stackOpenReducer(s, { type: "open-add", pickMode: "pills" })
  assert.deepEqual(s, { kind: "add", step: "choose" })
  s = stackOpenReducer(s, { type: "toggle-entry", id: "b" })
  assert.deepEqual(s, { kind: "entry", id: "b" })
  s = stackOpenReducer(s, { type: "toggle-entry", id: "b" })
  assert.deepEqual(s, STACK_REST)
})

test("rule 3: nobody to pick goes straight to the form; full opens nothing", () => {
  assert.deepEqual(stackOpenReducer(STACK_REST, { type: "open-add", pickMode: "new" }), { kind: "add", step: "form" })
  assert.deepEqual(stackOpenReducer(STACK_REST, { type: "open-add", pickMode: "full" }), STACK_REST)
  assert.deepEqual(stackOpenReducer({ kind: "add", step: "choose" }, { type: "quick-add", kinship: "child" }), { kind: "add", step: "form", kinship: "child" })
  assert.deepEqual(stackOpenReducer({ kind: "add", step: "choose" }, { type: "someone-new" }), { kind: "add", step: "form" })
})

test("moving inside the Add region closes nothing; leaving it does", () => {
  assert.equal(sameOpenThing({ kind: "add", step: "choose" }, { kind: "add", step: "form", kinship: "pet" }), true)
  assert.equal(sameOpenThing({ kind: "add", step: "form" }, { kind: "entry", id: "a" }), false)
  assert.equal(sameOpenThing({ kind: "entry", id: "a" }, { kind: "entry", id: "b" }), false)
})

test("pick mode: new, pills up to five, search from six, full without room", () => {
  assert.equal(pickMode(0), "new")
  assert.equal(pickMode(1), "pills")
  assert.equal(pickMode(5), "pills")
  assert.equal(pickMode(6), "search")
  assert.equal(pickMode(3, false), "full")
})

test("candidates are the book less who is on the stack, in the book's order", () => {
  const book = [{ id: "a" }, { id: "b" }, { id: "c" }]
  assert.deepEqual(pickCandidates(book, [{ id: "b" }]).map((p) => p.id), ["a", "c"])
})

const QUICK: QuickAddOption[] = [
  { kinship: "spouse_partner", label: "Spouse or partner" },
  { kinship: "child", label: "Child" },
  { kinship: "pet", label: "Pet" },
]

test("rule 4: a capped kinship's quick add goes once used and comes back when they come off", () => {
  const many = { multi: true }
  assert.deepEqual(quickAddFor(QUICK, [], many).map((o) => o.kinship), ["spouse_partner", "child", "pet"])
  assert.deepEqual(quickAddFor(QUICK, [{ kinship: "spouse_partner" }], many).map((o) => o.kinship), ["child", "pet"])
  assert.deepEqual(quickAddFor(QUICK, [{ kinship: "child" }, { kinship: "child" }], many).map((o) => o.kinship), ["spouse_partner", "child", "pet"])
})

test("rule 4: the emergency contact holds one; a single item holds one; many holds any", () => {
  assert.equal(stackHasRoom([{}], { role: "emergency", multi: true }), false)
  assert.equal(stackHasRoom([], { role: "emergency", multi: true }), true)
  assert.equal(stackHasRoom([{}], { multi: false }), false)
  assert.equal(stackHasRoom([{}, {}, {}], { role: "executor", multi: true }), true)
  assert.deepEqual(quickAddFor(QUICK, [{}], { role: "emergency", multi: true }), [])
})

test("rule 5: fields come from kin, mode and role", () => {
  assert.deepEqual(contactFieldsFor("child", "create"), ["name", "relationship", "dateOfBirth", "phone", "email"])
  assert.deepEqual(contactFieldsFor("pet", "create"), ["name", "relationship", "note"])
  assert.deepEqual(contactFieldsFor("parent", "create", { role: "guardian" }), ["name", "relationship", "phone", "email"])
  assert.deepEqual(contactFieldsFor(undefined, "reach"), ["phone", "email"])
  assert.deepEqual(contactFieldsFor("friend", "create", {}, [{ fields: ["name"] }, { role: "delegate", include: ["email"] }]), ["name"])
  assert.deepEqual(contactFieldsFor("friend", "create", { role: "delegate" }, [{ fields: ["name"] }, { role: "delegate", include: ["email"] }]), ["name", "email"])
})
