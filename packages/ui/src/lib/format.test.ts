// The display formatters (R17-01, R17-20): days in UTC, money, prices in words, counts, plurals,
// possessives. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { CYCLE_LABEL, formatCents, formatCount, formatDay, formatDayNear, formatPrice, plural, possessive } from "./format.ts"

test("days: an ISO date or date-time, in UTC; the year only when it isn't today's", () => {
  assert.equal(formatDay("2026-03-04"), "Mar 4, 2026")
  assert.equal(formatDay("2026-03-04T23:30:00Z"), "Mar 4, 2026")
  assert.equal(formatDayNear("2026-11-03", "2026-10-20"), "Nov 3")
  assert.equal(formatDayNear("2027-01-05", "2026-10-20"), "Jan 5, 2027")
})

test("money and prices: the amount for a list, the long form for a sentence", () => {
  assert.equal(formatCents(3000), "$30.00")
  assert.equal(formatCents(0), "$0.00")
  assert.equal(formatCents(123456), "$1,234.56")
  assert.equal(formatPrice(3000, "annual"), "$30.00 a year")
  assert.equal(formatPrice(399, "monthly"), "$3.99 a month")
  assert.deepEqual(CYCLE_LABEL, { monthly: "Monthly", annual: "Annual" })
})

test("counts, plurals and possessives", () => {
  assert.equal(formatCount(2040), "2,040")
  assert.equal(plural(1, "person", "people"), "1 person")
  assert.equal(plural(2040, "person", "people"), "2,040 people")
  assert.equal(possessive("Cedar Trust"), "Cedar Trust's")
  assert.equal(possessive("Brightpath Benefits"), "Brightpath Benefits'")
})
