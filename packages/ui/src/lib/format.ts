// Display formatting for lists and detail views (R17-01): the one set the admin pages use, on the
// package's locale (DEFAULT_LOCALE, en-US only: R5-01). Pure, tested (format.test.ts). Dates are
// ISO strings and are shown in UTC, so a server render and the browser agree; money is integer
// cents. Field formatting (the numeric "03/04/2026" a DateField shows, the masks) stays in
// dates.ts and mask.ts; these are the words a page shows around them.
// - Prices (R17-20, George 2026-10-21): a list shows the amount alone (`formatCents`) beside a
//   Cycle column, so prices line up; a detail view or a sentence says the long form
//   (`formatPrice`: "$30.00 a year"). There is no short "/yr" form.
import { formatMoney } from "./mask.ts"
import { DEFAULT_LOCALE } from "./locale.ts"
import type { IsoDate } from "./dates.ts"

/** How often a price bills. */
export type Cycle = "monthly" | "annual"

export const CYCLE_LABEL: Record<Cycle, string> = { monthly: "Monthly", annual: "Annual" }
const PER: Record<Cycle, string> = { monthly: "month", annual: "year" }

const day = new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
const dayInYear = new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: "short", day: "numeric", timeZone: "UTC" })
/** The day of an ISO date or date-time, as a UTC instant. */
const instant = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)

/** "Mar 4, 2026" from an ISO date or date-time. */
export const formatDay = (iso: IsoDate | string) => day.format(instant(iso))

/** "Nov 3" within `today`'s year, "Nov 3, 2027" otherwise. */
export const formatDayNear = (iso: IsoDate | string, today: IsoDate) => (iso.slice(0, 4) === today.slice(0, 4) ? dayInYear : day).format(instant(iso))

/** "$30.00", "$0.00". */
export const formatCents = (cents: number) => formatMoney(cents)

/** A price in words, for a detail view or a sentence: "$30.00 a year", "$3.99 a month". */
export const formatPrice = (cents: number, cycle: Cycle) => `${formatCents(cents)} a ${PER[cycle]}`

/** "1,234". */
export const formatCount = (n: number) => n.toLocaleString(DEFAULT_LOCALE)

/** "1 person", "2,040 people". */
export const plural = (n: number, one: string, other: string) => `${formatCount(n)} ${n === 1 ? one : other}`

/** "Cedar Trust's", "Brightpath Benefits'": a name as an owner. */
export const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`)
