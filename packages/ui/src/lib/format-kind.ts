/* The words behind Formatted (R20-21), pure and tested (`format-kind.test.ts`): one function that turns a
   kind and a value into the text to show, the machine-readable form for `<time>`, and the
   full value for the hover title when the text is shortened. In `lib/` with the other
   formatters, so `npm test` runs it (Node's test runner reads `.ts`, not JSX) and the DataTable
   column `type` (R20-23) can share it. Every formatter is one the package already has
   (`format.ts`, `metrics.ts`, `file-kind.ts`) plus duration and date-time, first written here.
   en-US and UTC, like `lib/format.ts` (R5-01), so a server
   render and the browser agree. A value that isn't known (null, not a number) is `undefined`
   text: the component shows a dash, never 0 (the metrics rule: no data is not zero). */
import { DEFAULT_LOCALE } from "./locale.ts"
import { formatCents, formatCount, formatDay, formatDayNear } from "./format.ts"
import { formatFileSize } from "./file-kind.ts"
import { formatMetric } from "./metrics.ts"
import type { IsoDate } from "./dates.ts"

/** A value and how to read it: the kind decides the value's type and the options that apply. */
export type FormattedValue =
  | { kind: "count"; value: number | null | undefined; /** 12.4K past 10,000, the exact count as the hover title. */ compact?: boolean }
  | { kind: "currency"; value: number | null | undefined; /** $12.3K past $10,000, the exact amount as the hover title. */ compact?: boolean }
  | { kind: "percent"; value: number | null | undefined }
  | { kind: "date"; value: string | null | undefined; /** Leaves the year off a date in `today`'s year; the full date is the hover title. */ today?: IsoDate }
  | { kind: "datetime"; value: string | null | undefined }
  | { kind: "duration"; value: number | null | undefined }
  | { kind: "fileSize"; value: number | null | undefined }

/** What a kind and value read as. */
export type FormattedText = {
  /** The text to show; undefined when the value isn't known. */
  text: string | undefined
  /** The full value, when `text` is shortened. */
  title?: string
  /** An ISO date, date-time or duration for `<time dateTime>`, for the kinds that are times. */
  iso?: string
}

const dateTime = new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })

/** "Mar 4, 2026, 3:15 PM UTC" from an ISO date-time; an ISO date reads as midnight UTC. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso))
}

/** Seconds as the two largest units, rounded to the minute from a minute up: "45 s", "3 min", "1 h 12 min", "2 h", "1 d 3 h". Empty for a negative or non-finite value. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return ""
  const total = Math.round(seconds)
  if (total < 60) return `${total} s`
  const minutes = Math.round(total / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`
}

const unit = (n: number, one: string) => `${formatCount(n)} ${one}${n === 1 ? "" : "s"}`

/** The same duration spelled out, for a title or a screen reader: "3 minutes", "1 hour 12 minutes". */
export function describeDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return ""
  const total = Math.round(seconds)
  if (total < 60) return unit(total, "second")
  const minutes = Math.round(total / 60)
  if (minutes < 60) return unit(minutes, "minute")
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${unit(hours, "hour")} ${unit(minutes % 60, "minute")}` : unit(hours, "hour")
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${unit(days, "day")} ${unit(hours % 24, "hour")}` : unit(days, "day")
}

/** An ISO 8601 duration for `<time dateTime>`: 4320 → "PT1H12M". */
export function isoDuration(seconds: number): string {
  const total = Math.round(seconds)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const date = d ? `${d}D` : ""
  const time = [h ? `${h}H` : "", m ? `${m}M` : "", s ? `${s}S` : ""].join("")
  // PT0S for zero: an ISO duration needs at least one part.
  if (date === "" && time === "") return "PT0S"
  return `P${date}${time ? `T${time}` : ""}`
}

/** $10,000 in cents: where `lib/metrics.ts` starts to abbreviate an amount. */
const COMPACT_FROM_CENTS = 1_000_000
const known = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n)
/** An ISO date or date-time the Date parser accepts (a bad string would throw in Intl). */
const readable = (iso: string | null | undefined): iso is string => !!iso && !Number.isNaN(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).getTime())
const NONE: FormattedText = { text: undefined }
/** Only a title that says something the text doesn't. */
const titled = (text: string, title: string): FormattedText => (title === text ? { text } : { text, title })

/** What to show for a kind and value: the text, its full value when shortened, and the ISO form for a time. */
export function formatKind(input: FormattedValue): FormattedText {
  switch (input.kind) {
    case "count": {
      if (!known(input.value)) return NONE
      const exact = formatCount(input.value)
      return input.compact ? titled(formatMetric(input.value, { kind: "count" }), exact) : { text: exact }
    }
    case "currency": {
      if (!known(input.value)) return NONE
      const exact = formatCents(input.value)
      // formatMetric drops the cents below its compact threshold ("$30"); a list that shows "$30.00" beside "$12.3K" keeps the cents until it abbreviates.
      return input.compact && Math.abs(input.value) >= COMPACT_FROM_CENTS ? titled(formatMetric(input.value, { kind: "currency" }), exact) : { text: exact }
    }
    case "percent":
      return known(input.value) ? { text: formatMetric(input.value, { kind: "percent" }) } : NONE
    case "date": {
      if (!readable(input.value)) return NONE
      const full = formatDay(input.value)
      const text = input.today ? formatDayNear(input.value, input.today) : full
      return { ...titled(text, full), iso: input.value }
    }
    case "datetime":
      return readable(input.value) ? { text: formatDateTime(input.value), iso: input.value } : NONE
    case "duration": {
      if (!known(input.value) || input.value < 0) return NONE
      return { ...titled(formatDuration(input.value), describeDuration(input.value)), iso: isoDuration(input.value) }
    }
    case "fileSize": {
      if (!known(input.value) || input.value < 0) return NONE
      const text = formatFileSize(input.value)
      // Under 1 KB the text is the exact byte count already; above, the bytes are the full value.
      return input.value < 1024 ? { text } : titled(text, `${formatCount(input.value)} bytes`)
    }
  }
}
