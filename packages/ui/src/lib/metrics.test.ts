import { test } from "node:test"
import assert from "node:assert/strict"

import { comparisonPhrase, comparisonShort, describeDelta, describeSeries, formatDelta, formatMetric, levelSince } from "./metrics.ts"

test("counts: exact below 10,000, compact above", () => {
  assert.equal(formatMetric(2333, { kind: "count" }), "2,333")
  assert.equal(formatMetric(12_430, { kind: "count" }), "12.4K")
  assert.equal(formatMetric(1_250_000, { kind: "count" }), "1.3M")
  assert.equal(formatMetric(12_430, { kind: "count" }, { compact: false }), "12,430")
})

test("currency comes in minor units", () => {
  assert.equal(formatMetric(129_900, { kind: "currency" }), "$1,299")
  assert.equal(formatMetric(1_999, { kind: "currency" }), "$19.99")
  assert.equal(formatMetric(1_234_500, { kind: "currency" }), "$12.3K")
  assert.equal(formatMetric(1_234_500, { kind: "currency" }, { compact: false }), "$12,345")
})

test("percent and plain numbers with a unit", () => {
  assert.equal(formatMetric(42.46, { kind: "percent" }), "42.5%")
  assert.equal(formatMetric(4.25, { kind: "number", unit: "days" }), "4.3 days")
})

test("no value is a dash, never zero", () => {
  assert.equal(formatMetric(null, { kind: "count" }), "—")
  assert.equal(formatMetric(Number.NaN, { kind: "currency" }), "—")
})

test("percent delta: sign, rounding, flat, and none from zero", () => {
  assert.deepEqual(formatDelta(112, 100, "percent", { kind: "count" }), { text: "+12%", direction: "up", tone: "better" })
  assert.deepEqual(formatDelta(95.5, 100, "percent", { kind: "count" }), { text: "−4.5%", direction: "down", tone: "worse" })
  assert.deepEqual(formatDelta(100, 100, "percent", { kind: "count" }), { text: "0%", direction: "flat", tone: "neutral" })
  assert.equal(formatDelta(5, 0, "percent", { kind: "count" }), null)
  assert.equal(formatDelta(5, null, "percent", { kind: "count" }), null)
})

test("the delta as a sentence (R11-07)", () => {
  assert.equal(describeDelta(formatDelta(118, 100, "percent", { kind: "count" })!, "the previous 12 months"), "Up 18% compared with the previous 12 months")
  assert.equal(describeDelta(formatDelta(1_000_000, 2_234_500, "net", { kind: "currency" })!, "12 months before"), "Down $12.3K compared with 12 months before")
  assert.equal(describeDelta(formatDelta(3.1, 3.1, "points", { kind: "percent" })!, "12 months before"), "No change compared with 12 months before")
})

test("tone follows the good direction, not the sign", () => {
  // Churn: lower is better, so up is worse.
  assert.equal(formatDelta(4.2, 3.1, "points", { kind: "percent" }, "down")?.tone, "worse")
  assert.equal(formatDelta(2.0, 3.1, "points", { kind: "percent" }, "down")?.tone, "better")
  assert.equal(formatDelta(2.0, 3.1, "points", { kind: "percent" }, "neither")?.tone, "neutral")
})

test("net delta uses the metric's format; points delta", () => {
  assert.equal(formatDelta(2808, 2333, "net", { kind: "count" })?.text, "+475")
  assert.equal(formatDelta(1_000_000, 2_234_500, "net", { kind: "currency" })?.text, "−$12.3K")
  assert.equal(formatDelta(44.5, 42, "points", { kind: "percent" })?.text, "+2.5 pts")
})

test("series summary for screen readers", () => {
  assert.equal(describeSeries([10, 14, 9, 20], { kind: "count" }), "Trending up, from 10 to 20; low 9, high 20.")
  assert.equal(describeSeries([], { kind: "count" }), "No data.")
  assert.equal(describeSeries([null, 5], { kind: "count" }), "One value: 5.")
})

test("flow vs level: the visible comparison (R12-05)", () => {
  // A flow compares the window's total with the previous window of the same length.
  assert.equal(comparisonShort("flow", "Last 12 months"), "vs prior")
  assert.equal(comparisonShort("flow", "March 2026"), "vs prior")
  // A level compares the count now with the count at the window's start.
  assert.equal(comparisonShort("level", "Last 12 months"), "vs a year ago")
  assert.equal(comparisonShort("level", "Last 24 months"), "vs 2 years ago")
  assert.equal(comparisonShort("level", "Last 30 days"), "vs 30 days ago")
  assert.equal(comparisonShort("level", "Last 7 days"), "vs a week ago")
  assert.equal(comparisonShort("level", "Last 14 days"), "vs 2 weeks ago")
  assert.equal(comparisonShort("level", "Past month"), "vs a month ago")
  assert.equal(comparisonShort("level", "last 6 months"), "vs 6 months ago")
  // Any other window: the comparison date, else "the start".
  assert.equal(comparisonShort("level", "Year to date", "Jan 1"), "vs Jan 1")
  assert.equal(comparisonShort("level", "March 2026"), "vs the start")
  // Compact cards (R13-14): the short level form; flows and named windows unchanged.
  assert.equal(comparisonShort("level", "Last 12 months", undefined, { compact: true }), "vs 1y ago")
  assert.equal(comparisonShort("level", "Last 30 days", undefined, { compact: true }), "vs 30d ago")
  assert.equal(comparisonShort("level", "Last 14 days", undefined, { compact: true }), "vs 2w ago")
  assert.equal(comparisonShort("level", "last 6 months", undefined, { compact: true }), "vs 6mo ago")
  assert.equal(comparisonShort("flow", "Last 12 months", undefined, { compact: true }), "vs prior")
  assert.equal(comparisonShort("level", "Year to date", "Jan 1", { compact: true }), "vs Jan 1")
  assert.equal(levelSince("Last 12 months", "Oct 2025"), "a year ago")
})

test("flow vs level: the sentence follows (R12-05)", () => {
  assert.equal(comparisonPhrase("flow", "Last 12 months"), "the previous 12 months")
  assert.equal(comparisonPhrase("flow", "Last 30 days"), "the previous 30 days")
  assert.equal(comparisonPhrase("flow", "March 2026"), "the previous period")
  assert.equal(comparisonPhrase("level", "Last 12 months"), "a year ago")
  assert.equal(comparisonPhrase("level", "Year to date", "Jan 1"), "Jan 1")
  assert.equal(describeDelta(formatDelta(2333, 1984, "net", { kind: "count" })!, comparisonPhrase("level", "Last 12 months")), "Up 349 compared with a year ago")
})
