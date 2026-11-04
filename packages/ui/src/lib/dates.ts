/* Calendar dates for the field controls (R4-12). Pure functions, no React, no "use client".

   A date is an ISO calendar date string, "YYYY-MM-DD", everywhere it crosses an API: no JS Date
   (a Date is an instant, and turning it back into a day depends on the time zone; the old app's
   "born a day early" bugs came from exactly that). Date objects appear only inside this file and
   the calendar adapter, built from and read back to local year/month/day.

   parseDate accepts what people type, in the owner's locale order: 3/4/26, 03042026, 3-4-2026,
   March 4 2026, 4 Mar 2026, 2026-03-04. Two-digit years resolve by a pivot: "window" (the year
   falls within 80 years back and 20 ahead of today) or "past" (never after this year; dates of
   birth). Partial input (3/4, 3/4/2) and impossible dates (2/30, 13/1) return null. */

import { DEFAULT_LOCALE } from "./locale.ts"

export type IsoDate = string
/** Order of the day, month and year parts in the owner's locale. */
export type DateOrder = "MDY" | "DMY" | "YMD"
/** How a two-digit year picks its century. */
export type YearPivot = "window" | "past"

export type ParseOptions = {
  /** Part order for numeric input (default MDY). */
  order?: DateOrder
  /** Today, for the two-digit year pivot (default the local date). */
  today?: IsoDate
  /** Default "window". */
  pivot?: YearPivot
  /** Extra month names (lowercase), one array per month, from the owner's locale. English is always understood. */
  monthNames?: string[][]
}

type Ymd = { y: number; m: number; d: number }

const pad = (n: number, w = 2) => String(n).padStart(w, "0")

/** True when y-m-d is a real calendar day (leap years included). Years 1–9999. */
export function isValidYmd(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1) return false
  return d <= daysInMonth(y, m)
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28
  return [4, 6, 9, 11].includes(m) ? 30 : 31
}

export function toIso(y: number, m: number, d: number): IsoDate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`
}

/** The calendar date in an ISO date or date-time string ("2026-03-04", "2026-03-04T23:00:00Z"
    → 2026-03-04: the written date, never shifted by a time zone), or null. */
export function fromIso(value: string | null | undefined): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec((value ?? "").trim())
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return isValidYmd(y, mo, d) ? { y, m: mo, d } : null
}

/** The value normalised to "YYYY-MM-DD", or "" when it isn't a date. */
export function normalizeIso(value: string | null | undefined): IsoDate {
  const p = fromIso(value)
  return p ? toIso(p.y, p.m, p.d) : ""
}

/** Today's local date. */
export function todayIso(now: Date = new Date()): IsoDate {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** The same day n years later (or earlier, n < 0); 29 February becomes 28 February in a common year. */
export function addYears(iso: IsoDate, n: number): IsoDate {
  const p = fromIso(iso)
  if (!p) return ""
  const y = p.y + n
  return toIso(y, p.m, Math.min(p.d, daysInMonth(y, p.m)))
}

/** The next calendar day. */
export function addDay(iso: IsoDate): IsoDate {
  const p = fromIso(iso)
  if (!p) return ""
  if (p.d < daysInMonth(p.y, p.m)) return toIso(p.y, p.m, p.d + 1)
  return p.m < 12 ? toIso(p.y, p.m + 1, 1) : toIso(p.y + 1, 1, 1)
}

/** Whole years from a date of birth to today (the birthday counts on the day). */
export function ageOn(dob: IsoDate, today: IsoDate): number {
  const b = fromIso(dob)
  const t = fromIso(today)
  if (!b || !t) return NaN
  return t.y - b.y - (t.m < b.m || (t.m === b.m && t.d < b.d) ? 1 : 0)
}

/** Where a date falls against an optional min and max (ISO strings compare as dates). */
export function rangeStatus(iso: IsoDate, min?: IsoDate, max?: IsoDate): "ok" | "before-min" | "after-max" {
  if (min && iso < min) return "before-min"
  if (max && iso > max) return "after-max"
  return "ok"
}

const EN_MONTHS = [
  ["january", "jan"],
  ["february", "feb"],
  ["march", "mar"],
  ["april", "apr"],
  ["may"],
  ["june", "jun"],
  ["july", "jul"],
  ["august", "aug"],
  ["september", "sept", "sep"],
  ["october", "oct"],
  ["november", "nov"],
  ["december", "dec"],
]

/** The month (1–12) a word names: a full name, or an unambiguous prefix of 3+ letters. */
function monthFromWord(word: string, extra: string[][] = []): number | null {
  const w = word.replace(/\.$/, "")
  if (w.length < 3) return null
  const names = EN_MONTHS.map((n, i) => [...n, ...(extra[i] ?? [])])
  const exact = names.findIndex((n) => n.includes(w))
  if (exact >= 0) return exact + 1
  const hits = names.flatMap((n, i) => (n.some((name) => name.startsWith(w)) ? [i + 1] : []))
  return hits.length === 1 ? hits[0] : null
}

function resolveYear(token: string, today: IsoDate, pivot: YearPivot): number | null {
  if (token.length === 4) return Number(token)
  if (token.length !== 2) return null // 1 or 3 digits: still typing
  const yy = Number(token)
  const now = Number(today.slice(0, 4))
  let y = Math.floor(now / 100) * 100 + yy
  if (pivot === "past") {
    if (y > now) y -= 100
  } else {
    if (y >= now + 20) y -= 100
    else if (y < now - 80) y += 100
  }
  return y
}

const isDayOrMonth = (t: string) => /^\d{1,2}$/.test(t)

function build(dayT: string, monthT: string | number, yearT: string, today: IsoDate, pivot: YearPivot): IsoDate | null {
  if (!isDayOrMonth(dayT)) return null
  if (typeof monthT === "string" && !isDayOrMonth(monthT)) return null
  const y = resolveYear(yearT, today, pivot)
  const m = Number(monthT)
  const d = Number(dayT)
  return y !== null && isValidYmd(y, m, d) ? toIso(y, m, d) : null
}

function inOrder(parts: [string, string, string], order: DateOrder, today: IsoDate, pivot: YearPivot): IsoDate | null {
  const [a, b, c] = parts
  if (order === "YMD") return build(c, b, a, today, pivot)
  if (order === "DMY") return build(a, b, c, today, pivot)
  return build(b, a, c, today, pivot)
}

/** What a person typed, as an ISO date, or null when it isn't a whole, real date. */
export function parseDate(text: string, options: ParseOptions = {}): IsoDate | null {
  const { order = "MDY", today = todayIso(), pivot = "window", monthNames } = options
  const s = text.trim().toLowerCase()
  if (!s) return null

  // ISO first, in any locale (also what autofill and the native picker hand over).
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (iso) return build(iso[3], iso[2], iso[1], today, pivot)

  // A month name: "march 4 2026", "4 mar 2026", "mar 4th, 26", "4. märz 2026".
  if (/\p{L}/u.test(s)) {
    const tokens = s
      .split(/[\s,/.-]+/)
      .filter((t) => t && t !== "of")
      .map((t) => t.replace(/^(\d+)(st|nd|rd|th)$/, "$1"))
    const words = tokens.filter((t) => !/^\d+$/.test(t))
    const nums = tokens.filter((t) => /^\d+$/.test(t))
    if (words.length !== 1 || nums.length !== 2) return null
    const month = monthFromWord(words[0], monthNames)
    if (month === null) return null
    // "2026 March 4": a leading 3–4 digit number is the year; otherwise the day comes first.
    const [first, second] = nums
    return first.length >= 3 ? build(second, month, first, today, pivot) : build(first, month, second, today, pivot)
  }

  // Digits only: 8 = two, two, four in locale order (or YYYYMMDD); 6 = two, two, two.
  if (/^\d+$/.test(s)) {
    if (s.length === 8) {
      const year4 = order === "YMD" ? [s.slice(0, 4), s.slice(4, 6), s.slice(6)] : [s.slice(0, 2), s.slice(2, 4), s.slice(4)]
      const parsed = inOrder(year4 as [string, string, string], order, today, pivot)
      if (parsed || order === "YMD") return parsed
      return inOrder([s.slice(0, 4), s.slice(4, 6), s.slice(6)], "YMD", today, pivot)
    }
    if (s.length === 6) return inOrder([s.slice(0, 2), s.slice(2, 4), s.slice(4)], order, today, pivot)
    return null
  }

  // Separated numbers: 3/4/26, 03-04-2026, 4.3.2026 (a trailing separator is allowed).
  const parts = s.split(/[\s/.-]+/).filter(Boolean)
  if (parts.length !== 3 || !parts.every((p) => /^\d+$/.test(p))) return null
  const [a, b, c] = parts
  if (a.length >= 3) return build(c, b, a, today, pivot) // 2026/3/4 in any locale
  return inOrder([a, b, c], order, today, pivot)
}

/** A Date at UTC midnight of the day, for Intl formatting only (never returned). */
function utcDate({ y, m, d }: Ymd): Date {
  const date = new Date(0)
  date.setUTCFullYear(y, m - 1, d)
  return date
}

const SAMPLE: Ymd = { y: 2026, m: 11, d: 22 } // day, month and year all distinct

function numericParts(locale: string, date: Ymd) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).formatToParts(utcDate(date))
}

/** The owner's locale order for numeric dates (en-US MDY, en-GB DMY, ja YMD). */
export function dateOrder(locale: string = DEFAULT_LOCALE): DateOrder {
  const order = numericParts(locale, SAMPLE)
    .filter((p) => p.type === "day" || p.type === "month" || p.type === "year")
    .map((p) => p.type[0].toUpperCase())
    .join("")
  return order === "DMY" || order === "YMD" ? order : "MDY"
}

/** The date in the owner's locale, numeric, padded, four-digit year: 03/04/2026 (en-US), 04/03/2026 (en-GB), 04.03.2026 (de). */
export function formatDate(iso: IsoDate, locale: string = DEFAULT_LOCALE): string {
  const p = fromIso(iso)
  if (!p) return ""
  return numericParts(locale, p)
    .map((part) => (part.type === "year" ? pad(p.y, 4) : part.type === "literal" ? part.value.replace(/‏|‎/g, "") : part.value))
    .join("")
}

/** The date written out for a screen reader or a confirmation line: "March 4, 2026". */
export function formatDateLong(iso: IsoDate, locale: string = DEFAULT_LOCALE): string {
  const p = fromIso(iso)
  if (!p) return ""
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(utcDate(p))
}

/** The locale's numeric pattern for a placeholder and the format hint: MM/DD/YYYY, DD.MM.YYYY. */
export function datePattern(locale: string = DEFAULT_LOCALE): string {
  return numericParts(locale, SAMPLE)
    .map((p) => (p.type === "day" ? "DD" : p.type === "month" ? "MM" : p.type === "year" ? "YYYY" : p.value.replace(/‏|‎/g, "")))
    .join("")
}

/** The locale's month names (long and short, lowercase, without a trailing dot), one array per month. */
export function monthNames(locale: string = DEFAULT_LOCALE): string[][] {
  const long = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" })
  const short = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  return Array.from({ length: 12 }, (_, i) => {
    const d = utcDate({ y: 2026, m: i + 1, d: 15 })
    return [...new Set([long.format(d), short.format(d)].map((n) => n.toLowerCase().replace(/\.$/, "")))]
  })
}

/** A local Date for the day, for the calendar widget only. */
export function toLocalDate(iso: IsoDate): Date | undefined {
  const p = fromIso(iso)
  if (!p) return undefined
  const date = new Date(p.y, p.m - 1, p.d)
  date.setFullYear(p.y) // years 1–99
  return date
}

/** The day a local Date (from the calendar widget) shows, as an ISO date. */
export function fromLocalDate(date: Date): IsoDate {
  return toIso(date.getFullYear(), date.getMonth() + 1, date.getDate())
}
