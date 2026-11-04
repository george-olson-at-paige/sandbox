// Formatted's words (R20-21): each kind's text, title and ISO form. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { describeDuration, formatDateTime, formatDuration, formatKind, isoDuration } from "./format-kind.ts"

test("count: exact by default, compact past 10,000 with the exact count as the title", () => {
  assert.deepEqual(formatKind({ kind: "count", value: 1234 }), { text: "1,234" })
  assert.deepEqual(formatKind({ kind: "count", value: 12400, compact: true }), { text: "12.4K", title: "12,400" })
  assert.deepEqual(formatKind({ kind: "count", value: 9999, compact: true }), { text: "9,999" })
  assert.deepEqual(formatKind({ kind: "count", value: 0 }), { text: "0" })
})

test("currency: integer cents, with the cents until it abbreviates", () => {
  assert.deepEqual(formatKind({ kind: "currency", value: 3000 }), { text: "$30.00" })
  assert.deepEqual(formatKind({ kind: "currency", value: 123456 }), { text: "$1,234.56" })
  assert.deepEqual(formatKind({ kind: "currency", value: 3000, compact: true }), { text: "$30.00" })
  assert.deepEqual(formatKind({ kind: "currency", value: 1234500, compact: true }), { text: "$12.3K", title: "$12,345.00" })
})

test("percent: zero to 100 in, one decimal at most", () => {
  assert.deepEqual(formatKind({ kind: "percent", value: 42.5 }), { text: "42.5%" })
  assert.deepEqual(formatKind({ kind: "percent", value: 42.54 }), { text: "42.5%" })
  assert.deepEqual(formatKind({ kind: "percent", value: 100 }), { text: "100%" })
  assert.deepEqual(formatKind({ kind: "percent", value: 0 }), { text: "0%" })
})

test("date: the full day, or no year inside today's year with the full date as the title", () => {
  assert.deepEqual(formatKind({ kind: "date", value: "2026-03-04" }), { text: "Mar 4, 2026", iso: "2026-03-04" })
  assert.deepEqual(formatKind({ kind: "date", value: "2026-11-03", today: "2026-10-31" }), { text: "Nov 3", title: "Nov 3, 2026", iso: "2026-11-03" })
  assert.deepEqual(formatKind({ kind: "date", value: "2027-01-05", today: "2026-10-31" }), { text: "Jan 5, 2027", iso: "2027-01-05" })
  assert.equal(formatKind({ kind: "date", value: "2026-03-04T23:30:00Z" }).text, "Mar 4, 2026")
})

test("datetime: day and time in UTC, the zone named", () => {
  assert.equal(formatDateTime("2026-03-04T15:15:00Z"), "Mar 4, 2026, 3:15 PM UTC")
  assert.deepEqual(formatKind({ kind: "datetime", value: "2026-03-04T09:05:00Z" }), { text: "Mar 4, 2026, 9:05 AM UTC", iso: "2026-03-04T09:05:00Z" })
})

test("duration: seconds as the two largest units, spelled out in the title", () => {
  assert.equal(formatDuration(45), "45 s")
  assert.equal(formatDuration(180), "3 min")
  assert.equal(formatDuration(4320), "1 h 12 min")
  assert.equal(formatDuration(7200), "2 h")
  assert.equal(formatDuration(97200), "1 d 3 h")
  assert.equal(formatDuration(172800), "2 d")
  // Rounds to the minute from a minute up, and 59 min 40 s is an hour, not "60 min".
  assert.equal(formatDuration(119), "2 min")
  assert.equal(formatDuration(3580), "1 h")
  assert.equal(formatDuration(0), "0 s")
  assert.equal(formatDuration(-1), "")
  assert.equal(describeDuration(180), "3 minutes")
  assert.equal(describeDuration(60), "1 minute")
  assert.equal(describeDuration(4320), "1 hour 12 minutes")
  assert.equal(describeDuration(1), "1 second")
  assert.equal(isoDuration(4320), "PT1H12M")
  assert.equal(isoDuration(45), "PT45S")
  assert.equal(isoDuration(0), "PT0S")
  assert.equal(isoDuration(97200), "P1DT3H")
  assert.deepEqual(formatKind({ kind: "duration", value: 4320 }), { text: "1 h 12 min", title: "1 hour 12 minutes", iso: "PT1H12M" })
})

test("fileSize: lib/file-kind's size, the byte count as the title from 1 KB", () => {
  assert.deepEqual(formatKind({ kind: "fileSize", value: 512 }), { text: "512 B" })
  assert.deepEqual(formatKind({ kind: "fileSize", value: 2516582 }), { text: "2.4 MB", title: "2,516,582 bytes" })
  assert.deepEqual(formatKind({ kind: "fileSize", value: 2048 }), { text: "2 KB", title: "2,048 bytes" })
})

test("a value that isn't known has no text, never 0", () => {
  for (const input of [
    { kind: "count", value: null },
    { kind: "currency", value: undefined },
    { kind: "percent", value: Number.NaN },
    { kind: "date", value: null },
    { kind: "date", value: "not a date" },
    { kind: "datetime", value: "" },
    { kind: "duration", value: -5 },
    { kind: "fileSize", value: null },
  ] as const) {
    assert.equal(formatKind(input).text, undefined, input.kind)
  }
})
