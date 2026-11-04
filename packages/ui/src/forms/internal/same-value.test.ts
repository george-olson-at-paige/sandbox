import { test } from "node:test"
import assert from "node:assert/strict"

import { sameValue } from "./same-value.ts"

test("primitives", () => {
  assert.equal(sameValue("a", "a"), true)
  assert.equal(sameValue("a", "b"), false)
  assert.equal(sameValue(1250, 1250), true)
  assert.equal(sameValue(null, null), true)
  assert.equal(sameValue(null, ""), false)
  assert.equal(sameValue(NaN, NaN), true)
})

test("objects ignore key order; undefined equals a missing key", () => {
  assert.equal(sameValue({ a: "1", b: "2" }, { b: "2", a: "1" }), true)
  assert.equal(sameValue({ a: "1", b: undefined }, { a: "1" }), true)
  assert.equal(sameValue({ a: "1" }, { a: "2" }), false)
})

test("nested arrays and objects", () => {
  const v = { legalName: "Maya", roles: ["executor", "guardian"], address: { zip: "02139" } }
  assert.equal(sameValue(v, structuredClone(v)), true)
  assert.equal(sameValue(v, { ...v, roles: ["executor"] }), false)
  assert.equal(sameValue(v, { ...v, address: { zip: "02138" } }), false)
  assert.equal(sameValue([1, 2], { 0: 1, 1: 2 }), false)
})
