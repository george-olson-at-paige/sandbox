"use client"

import type { ComponentProps } from "react"
import { useEffect, useRef, type MouseEvent } from "react"
import { CircleAlertIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Callout } from "../components/feedback/callout"
import { formMessages } from "./messages"

/* @archetype Composite (ARCHETYPES.md).
   ErrorSummary (R7-03, the GOV.UK / WCAG 3.3.1 pattern): after a failed submit, the form's
   problems in one place at the top. A Callout in the attention tone (role="alert", so it is
   announced) with a link per invalid field; a link moves focus into that field (and scrolls it
   into view), and a form-level error leads the list. Form renders it and gives it focus on
   every failed try (`focusKey`); it renders nothing while there is nothing to say.
   One problem is a sentence, not a one-item list (R18-24: the auth card's "didn't match"): the
   bullets appear from the second item, and the default heading counts with it ("Check this" /
   "Check these"). A form whose failure has a name of its own gives `title` ("Couldn't sign in"). */

/** One problem: a field's message, linked to its control by id (or a focus function). */
type ErrorSummaryItem = {
  /** The control's id; the link points at it. Without it the message is listed unlinked. */
  id?: string
  message: string
  /** Focuses the field (a control a link can't focus by id, the rich Textarea). */
  focus?: () => void
}

/** The form's errors after a failed submit, with links that focus each field; announced, and focused by Form. */
function ErrorSummary({
  title,
  error,
  items,
  focusKey,
  className,
}: {
  /** The heading. Default from forms/messages.ts, counting the problems (one: "Check this and try again"). */
  title?: string
  /** A form-level error (the save failed), listed first. */
  error?: string
  /** The field errors, in the order the fields appear. */
  items: ErrorSummaryItem[]
  /** Change it to move focus to the summary (Form does on each failed submit). */
  focusKey?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const empty = !error && items.length === 0
  useEffect(() => {
    if (focusKey && !empty) ref.current?.focus()
    // Focus only when a new failed submit asks for it, not as the list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey])
  if (empty) return null

  const go = (item: ErrorSummaryItem) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = item.id ? document.getElementById(item.id) : null
    el?.scrollIntoView({ block: "center" })
    if (item.focus) item.focus()
    else el?.focus()
  }
  const text = (item: ErrorSummaryItem) =>
    item.id ? (
      <a href={`#${item.id}`} onClick={go(item)} className="underline underline-offset-4 hover:no-underline">
        {item.message}
      </a>
    ) : (
      item.message
    )
  const single = !error && items.length === 1 ? items[0] : error && items.length === 0 ? { message: error } : null
  const heading = title ?? (single ? formMessages.summaryTitleOne : formMessages.summaryTitle)
  return (
    <div ref={ref} tabIndex={-1} data-slot="error-summary" className={cn("rounded-lg focus-ring", className)}>
      <Callout tone="attention" icon={<CircleAlertIcon aria-hidden />} title={heading}>
        {single ? (
          <p className="mt-1">{text(single)}</p>
        ) : (
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {error && <li>{error}</li>}
            {items.map((item, i) => (
              <li key={item.id ?? i}>{text(item)}</li>
            ))}
          </ul>
        )}
      </Callout>
    </div>
  )
}

export { ErrorSummary }
export type { ErrorSummaryItem }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ErrorSummaryProps = ComponentProps<typeof ErrorSummary>
