// Date ranges (R13-06). node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { addDays, describeRange, inRange, matchPreset, parseRange, presetRange, serializeRange } from "./date-range.ts"

const TODAY = "2026-10-20"

test("addDays crosses months, years and leap days", () => {
  assert.equal(addDays("2026-10-20", -29), "2026-09-21")
  assert.equal(addDays("2026-12-31", 1), "2027-01-01")
  assert.equal(addDays("2028-03-01", -1), "2028-02-29")
  assert.equal(addDays("nope", 1), "")
})

test("presets resolve to fixed inclusive dates and are recognised back", () => {
  assert.deepEqual(presetRange("last7", TODAY), { from: "2026-10-14", to: TODAY })
  assert.deepEqual(presetRange("last30", TODAY), { from: "2026-09-21", to: TODAY })
  assert.deepEqual(presetRange("last90", TODAY), { from: "2026-07-23", to: TODAY })
  assert.deepEqual(presetRange("thisYear", TODAY), { from: "2026-01-01", to: TODAY })
  assert.equal(matchPreset({ from: "2026-09-21", to: TODAY }, TODAY), "last30")
  assert.equal(matchPreset({ from: "2026-09-20", to: TODAY }, TODAY), undefined)
})

test("inRange: inclusive, open sides, date-times by their written date, missing never inside", () => {
  const r = { from: "2026-01-01", to: "2026-03-31" }
  assert.equal(inRange("2026-01-01", r), true)
  assert.equal(inRange("2026-03-31T23:59:00Z", r), true)
  assert.equal(inRange("2026-04-01", r), false)
  assert.equal(inRange("2025-06-01", { from: "", to: "2026-01-01" }), true)
  assert.equal(inRange(null, r), false)
  assert.equal(inRange(null, { from: "", to: "" }), true)
})

test("URL form: from..to, open sides, bad dates dropped, reversed swapped", () => {
  assert.equal(serializeRange({ from: "2026-01-01", to: "2026-03-31" }), "2026-01-01..2026-03-31")
  assert.equal(serializeRange({ from: "", to: "" }), "")
  assert.deepEqual(parseRange("2026-01-01.."), { from: "2026-01-01", to: "" })
  assert.deepEqual(parseRange("2026-03-31..2026-01-01"), { from: "2026-01-01", to: "2026-03-31" })
  assert.equal(parseRange("x..y"), null)
  assert.equal(parseRange("2026-01-01"), null)
})

test("describeRange: preset names today, otherwise compact dates", () => {
  assert.equal(describeRange(presetRange("last7", TODAY), TODAY), "Last 7 days")
  assert.equal(describeRange({ from: "2026-01-05", to: "2026-03-31" }, TODAY), "Jan 5 – Mar 31, 2026")
  assert.equal(describeRange({ from: "2025-11-01", to: "2026-02-01" }, TODAY), "Nov 1, 2025 – Feb 1, 2026")
  assert.equal(describeRange({ from: "2026-01-05", to: "" }, TODAY), "Since Jan 5, 2026")
  assert.equal(describeRange({ from: "", to: "2026-01-05" }, TODAY), "Until Jan 5, 2026")
})
