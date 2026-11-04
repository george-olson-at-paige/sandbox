/* Date ranges (R13-06): the value DateRangeField edits and a list's date filters match. Pure
   functions, no React, tested under node (date-range.test.ts).

   A range is two ISO calendar dates, `{ from, to }`, both inclusive; either may be "" (open on
   that side), and both "" is no range. Presets are relative to today ("last 30 days" is the 30
   days ending today) and resolve to fixed dates when chosen, so the value is always plain dates.
   In a URL a range is `from..to` (`2026-01-01..2026-03-31`, `..2026-03-31`, `2026-01-01..`). */

import { fromIso, normalizeIso, toIso, todayIso, type IsoDate } from "./dates.ts"
import { DEFAULT_LOCALE } from "./locale.ts"

/** Two inclusive ISO dates; "" leaves that side open. */
export type DateRange = { from: IsoDate; to: IsoDate }

/** The presets a DateRangeField offers. */
export type DateRangePresetId = "last7" | "last30" | "last90" | "thisYear"

/** The empty range (no filter). */
export const EMPTY_RANGE: DateRange = { from: "", to: "" }

/** The presets, in the order they show. */
export const DATE_RANGE_PRESETS: ReadonlyArray<{ id: DateRangePresetId; label: string }> = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "last90", label: "Last 90 days" },
  { id: "thisYear", label: "This year" },
]

/** n days after the date (before it for n < 0). */
export function addDays(iso: IsoDate, n: number): IsoDate {
  const p = fromIso(iso)
  if (!p) return ""
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + n))
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** The fixed dates a preset means today. */
export function presetRange(id: DateRangePresetId, today: IsoDate = todayIso()): DateRange {
  switch (id) {
    case "last7":
      return { from: addDays(today, -6), to: today }
    case "last30":
      return { from: addDays(today, -29), to: today }
    case "last90":
      return { from: addDays(today, -89), to: today }
    case "thisYear":
      return { from: `${today.slice(0, 4)}-01-01`, to: today }
  }
}

/** The preset this range is today, if any. */
export function matchPreset(range: DateRange, today: IsoDate = todayIso()): DateRangePresetId | undefined {
  return DATE_RANGE_PRESETS.find((p) => {
    const r = presetRange(p.id, today)
    return r.from === range.from && r.to === range.to
  })?.id
}

/** True when neither side is set. */
export function isEmptyRange(range: DateRange | undefined): boolean {
  return !range || (!range.from && !range.to)
}

/** True when the date (an ISO date or date-time: its written date) is inside the range. A missing date is never inside a set range. */
export function inRange(value: string | null | undefined, range: DateRange): boolean {
  if (isEmptyRange(range)) return true
  const day = normalizeIso(value)
  if (!day) return false
  return (!range.from || day >= range.from) && (!range.to || day <= range.to)
}

/** `from..to` for a URL; "" for the empty range. */
export function serializeRange(range: DateRange): string {
  return isEmptyRange(range) ? "" : `${range.from}..${range.to}`
}

/** Reads `from..to`; bad dates drop to open sides, a reversed range is swapped; null when nothing is left. */
export function parseRange(raw: string | null | undefined): DateRange | null {
  if (!raw || !raw.includes("..")) return null
  const [a, b] = raw.split("..")
  let from = normalizeIso(a)
  let to = normalizeIso(b)
  if (from && to && from > to) [from, to] = [to, from]
  return from || to ? { from, to } : null
}

const short = (locale: string) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" })
const long = (locale: string) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
const utc = (iso: IsoDate) => {
  const p = fromIso(iso)!
  return new Date(Date.UTC(p.y, p.m - 1, p.d))
}

/** A chip's words: the preset's name when it is one today, else "Jan 1 – Mar 31, 2026", "Since Jan 1, 2026", "Until Mar 31, 2026". */
export function describeRange(range: DateRange, today: IsoDate = todayIso(), locale: string = DEFAULT_LOCALE): string {
  if (isEmptyRange(range)) return ""
  const preset = matchPreset(range, today)
  if (preset) return DATE_RANGE_PRESETS.find((p) => p.id === preset)!.label
  if (!range.to) return `Since ${long(locale).format(utc(range.from))}`
  if (!range.from) return `Until ${long(locale).format(utc(range.to))}`
  if (range.from === range.to) return long(locale).format(utc(range.from))
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4)
  return `${(sameYear ? short(locale) : long(locale)).format(utc(range.from))} – ${long(locale).format(utc(range.to))}`
}
