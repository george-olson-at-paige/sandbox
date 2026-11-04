/* Metric number formats and deltas (R8-08): the logic behind Stat, KpiCard and the admin's
   MetricCard, pure and tested (`metrics.test.ts`). en-US by default (R5-01, `lib/locale.ts`).

   Formats: `count` (compact past 10,000: 12.4K, 1.2M; exact below), `currency` (integer minor
   units in, like every money value in the package: 1234500 → $12.3K compact, $12,345 exact),
   `percent` (0–100 in: 42.5 → 42.5%), `number` (a plain quantity with an optional unit: "4.2 days").
   A value that isn't known is `null` and formats as "—" (never 0: no data is not zero).

   Deltas: one comparison, three kinds (the needs list from the old admin's Pulse cards):
     - `percent`: relative change, "+12%" (none when the earlier value is 0 or less);
     - `net`: the difference in the metric's own format, "+475", "−$1.2K";
     - `points`: the difference between two percentages, "+2.5 pts".
   Direction is by sign (up, down, flat); whether that's good is separate (`good`: "up" | "down"
   | "neither"), so churn going up reads as worse in the tone, not in the arrow. */

import { DEFAULT_LOCALE } from "./locale.ts"

/** How a metric's value reads. */
export type MetricFormat =
  | { kind: "count" }
  | { kind: "currency"; currency?: string }
  | { kind: "percent" }
  | { kind: "number"; unit?: string; maximumFractionDigits?: number }

/** How a delta reads: relative change, the difference in the metric's format, or percentage points. */
export type DeltaKind = "percent" | "net" | "points"

/** Which direction is good for this metric ("neither" for a metric where up and down are both just change). */
export type GoodDirection = "up" | "down" | "neither"

export type Delta = {
  /** "+12%", "−$1.2K", "+2.5 pts", or "0%" when flat. */
  text: string
  /** By sign. */
  direction: "up" | "down" | "flat"
  /** better / worse by `good`; neutral when flat or when neither direction is good. */
  tone: "better" | "worse" | "neutral"
}

const MINUS = "−"
const COMPACT_FROM = 10_000

/** Formats a metric value; `compact` (default true) shortens large counts and amounts. */
export function formatMetric(value: number | null, format: MetricFormat, options: { compact?: boolean; locale?: string } = {}): string {
  if (value === null || !Number.isFinite(value)) return "—"
  const { compact = true, locale = DEFAULT_LOCALE } = options
  switch (format.kind) {
    case "count": {
      const short = compact && Math.abs(value) >= COMPACT_FROM
      return new Intl.NumberFormat(locale, short ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(value)
    }
    case "currency": {
      const major = value / 100
      const short = compact && Math.abs(major) >= COMPACT_FROM
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: format.currency ?? "USD",
        ...(short ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: Number.isInteger(major) ? 0 : 2, minimumFractionDigits: Number.isInteger(major) ? 0 : 2 }),
      }).format(major)
    }
    case "percent":
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
    case "number": {
      const n = new Intl.NumberFormat(locale, { maximumFractionDigits: format.maximumFractionDigits ?? 1 }).format(value)
      return format.unit ? `${n} ${format.unit}` : n
    }
  }
}

const signed = (n: number, body: string) => (n > 0 ? `+${body}` : n < 0 ? `${MINUS}${body}` : body)

/** The one delta between the current value and the earlier one, or null when there's nothing to compare. */
export function formatDelta(
  current: number | null,
  previous: number | null,
  kind: DeltaKind,
  format: MetricFormat,
  good: GoodDirection = "up",
  locale: string = DEFAULT_LOCALE
): Delta | null {
  if (current === null || previous === null || !Number.isFinite(current) || !Number.isFinite(previous)) return null
  let diff: number
  let body: string
  if (kind === "percent") {
    if (previous <= 0) return null
    diff = ((current - previous) / previous) * 100
    const rounded = Math.abs(diff) < 10 ? Math.round(Math.abs(diff) * 10) / 10 : Math.round(Math.abs(diff))
    diff = rounded === 0 ? 0 : diff
    body = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(rounded)}%`
  } else if (kind === "points") {
    diff = Math.round((current - previous) * 10) / 10
    body = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(diff))} pts`
  } else {
    diff = current - previous
    body = formatMetric(Math.abs(diff), format, { locale })
  }
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat"
  const tone = direction === "flat" || good === "neither" ? "neutral" : direction === good ? "better" : "worse"
  return { text: signed(diff, body), direction, tone }
}

/** The delta as a sentence (R11-07), for screen readers and the delta's tooltip: "Up 18% compared with the previous 12 months". `against` is the comparison as a phrase ("the previous 12 months", "12 months before"). */
export function describeDelta(delta: Delta, against: string): string {
  const amount = delta.text.replace(/^[+−]/, "")
  if (delta.direction === "flat") return `No change compared with ${against}`
  return `${delta.direction === "up" ? "Up" : "Down"} ${amount} compared with ${against}`
}

/** What a metric's number is (R12-05): a **flow** totals the window (signups, cancellations: compared with the previous window of the same length); a **level** is a count at a moment (active subscribers, MRR: compared with the same count at the window's start). */
export type MetricBasis = "flow" | "level"

const UNIT_AGO: Record<string, { one: string; other: string }> = {
  day: { one: "a day", other: "days" },
  week: { one: "a week", other: "weeks" },
  month: { one: "a month", other: "months" },
  year: { one: "a year", other: "years" },
}

/** "Last 12 months" → { n: 12, unit: "month" }; anything else (a named month, "Year to date") → null. */
function rollingWindow(window: string): { n: number; unit: string } | null {
  const m = /^\s*(?:last|past)\s+(?:(\d+)\s+)?(day|week|month|year)s?\s*$/i.exec(window)
  if (!m) return null
  let n = m[1] ? Number(m[1]) : 1
  let unit = m[2].toLowerCase()
  // Whole years and whole weeks say so: 12 months is "a year ago", 14 days "2 weeks ago".
  if (unit === "month" && n % 12 === 0) {
    n /= 12
    unit = "year"
  } else if (unit === "day" && n % 7 === 0 && n < 28) {
    n /= 7
    unit = "week"
  }
  return { n, unit }
}

/** When a level metric's comparison point was, as words after "vs" (R12-05): "a year ago" for "Last 12 months", "30 days ago" for "Last 30 days"; for any other window the comparison date (`since`, the first point's period: "Oct 2025"), else "the start". */
export function levelSince(window: string, since?: string): string {
  const w = rollingWindow(window)
  if (!w) return since ?? "the start"
  const u = UNIT_AGO[w.unit]
  return w.n === 1 ? `${u.one} ago` : `${w.n} ${u.other} ago`
}

const UNIT_SHORT: Record<string, string> = { day: "d", week: "w", month: "mo", year: "y" }

/** The visible comparison after a delta's number (R12-05): a flow says "vs prior" (the previous window of the same length; the window under the label says how long); a level says when its comparison point was, "vs a year ago". `compact` (R13-14, a compact KPI card ~170 wide) shortens a rolling window to "vs 1y ago", "vs 30d ago", "vs 2w ago"; the full sentence stays in the tooltip and for screen readers. */
export function comparisonShort(basis: MetricBasis, window: string, since?: string, options: { compact?: boolean } = {}): string {
  if (basis !== "level") return "vs prior"
  const w = options.compact ? rollingWindow(window) : null
  return w ? `vs ${w.n}${UNIT_SHORT[w.unit]} ago` : `vs ${levelSince(window, since)}`
}

/** What the full sentence compares with (R12-05), when the caller doesn't say: a flow "the previous 12 months" (for "Last 12 months"; otherwise "the previous period"), a level the same words as its short form ("a year ago", "Oct 2025"). */
export function comparisonPhrase(basis: MetricBasis, window: string, since?: string): string {
  if (basis === "level") return levelSince(window, since)
  const m = /^\s*(?:last|past)\s+(.+?)\s*$/i.exec(window)
  return m ? `the previous ${m[1].toLowerCase()}` : "the previous period"
}

/** A plain-language summary of a series for screen readers: start, end, low and high. */
export function describeSeries(values: ReadonlyArray<number | null>, format: MetricFormat, locale: string = DEFAULT_LOCALE): string {
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v))
  if (known.length === 0) return "No data."
  const f = (v: number) => formatMetric(v, format, { locale })
  if (known.length === 1) return `One value: ${f(known[0])}.`
  const first = known[0]
  const last = known[known.length - 1]
  const trend = last > first ? "up" : last < first ? "down" : "unchanged"
  return `${trend === "unchanged" ? "Unchanged" : `Trending ${trend}`}, from ${f(first)} to ${f(last)}; low ${f(Math.min(...known))}, high ${f(Math.max(...known))}.`
}
