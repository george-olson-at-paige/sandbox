import { cn } from "../../lib/utils"
import type { Tone } from "../../lib/vocabulary"
import { formatKind, type FormattedValue } from "../../lib/format-kind"

/* @archetype Text (ARCHETYPES.md).
   Formatted (R20-21): a number, an amount, a date, a duration or a file size written the way the
   package writes them, inline, in a sentence or a card. ui.shadcn.com has no such part; this
   is a thin element over the formatters we already have (`lib/format.ts`, `lib/metrics.ts`,
   `lib/file-kind.ts`), and the rule that one place decides how a value reads. It is the inline
   half of the proposal; the DataTable column `type` (R20-23) is the other and will use
   `formatKind` (`lib/format-kind.ts`, the pure, tested half) too.
   - Text, not Media: a Media part is the leading picture of a thing. This is a typographic
     role, a run of text with the one treatment numbers need (`tabular-nums`, so a column of
     them lines up), so it sits beside Stat's value and the Field parts. Its one axis is the
     Text one, `tone`, narrowed to `strong`, `muted` and (R21-10) `attention`: the attention ink
     only (the plain fill), for a value the page judges needs a look ("32% went on" where most
     screens keep 75%); the page decides the threshold, the part only draws it. It picks no size
     or weight, so it takes the text around it.
   - The kind decides the value (a discriminated union, so `today` is only on `date` and `compact`
     only on `count` and `currency`): `count` (1,234), `currency` (integer cents, never a float:
     $30.00), `percent` (0-100 in, one decimal at most: 42.5%), `date` (Mar 4, 2026, or Nov 3
     with `today` in the same year), `datetime` (Mar 4, 2026, 3:15 PM UTC), `duration`
     (seconds: 45 s, 3 min, 1 h 12 min), `fileSize` (bytes: 2.4 MB).
   - The element says what it is: `<time dateTime>` for a date, date-time and duration (the
     ISO form for machines and assistive tech); a `<span>` for the numbers. Both are
     `tabular-nums`, so a column of them lines up; `data-kind` is for tests and for CSS that has
     a reason to know.
   - A `title` carries the full value whenever the text is shortened: the exact count and amount
     under `compact`, the whole date when `today` dropped the year, the spelled-out duration
     ("1 hour 12 minutes"), the byte count of a file size. No title when the text already is
     the whole value.
   - No data is not zero (the metrics rule): a null or unreadable value shows a dash, and a
     screen reader hears "No value".
   - en-US and UTC, like the formatters (R5-01); a date-time says "UTC" because that is the
     zone it was formatted in. Server-safe. */

type FormattedProps = FormattedValue & {
  /** Strong ink, muted ink or the attention ink (a value that needs a look, R21-10); omitted, it takes the surrounding text. */
  tone?: Extract<Tone, "strong" | "muted" | "attention">
  className?: string
}

const TIME = new Set<FormattedValue["kind"]>(["date", "datetime", "duration"])
const INK = { strong: "text-foreground-strong", muted: "text-muted-foreground", attention: "text-attention-foreground" } as const

/** A count, amount, percent, date, date-time, duration or file size written the Paige way, inline; a title carries the full value when the text is shortened. */
function Formatted({ tone, className, ...input }: FormattedProps) {
  const { text, title, iso } = formatKind(input as FormattedValue)
  const classes = cn("tabular-nums", tone && INK[tone], className)
  if (text === undefined) {
    return (
      <span data-slot="formatted" data-kind={input.kind} data-state="empty" className={classes}>
        <span aria-hidden>—</span>
        <span className="sr-only">No value</span>
      </span>
    )
  }
  if (TIME.has(input.kind) && iso) {
    return (
      <time data-slot="formatted" data-kind={input.kind} dateTime={iso} title={title} className={classes}>
        {text}
      </time>
    )
  }
  return (
    <span data-slot="formatted" data-kind={input.kind} title={title} className={classes}>
      {text}
    </span>
  )
}

export { Formatted }
export type { FormattedProps }
