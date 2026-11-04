"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react"

import { cn } from "../../lib/utils"
import { formatDay } from "../../lib/format"
import { DisclosureTrigger } from "../actions/disclosure-trigger"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Dot } from "./dot"
import { StatusMark, type MarkStatus } from "./status-mark"

/* @archetype Item (ARCHETYPES.md). Timeline (R20-18): a vertical rail of events, each with a
   dot (or an icon, or a status mark), a title, a time and a line of detail, and groups of
   events that fold away under a toggle.
   @from reui.io/r/timeline.json · 2026-10-31 · MIT
   changed: `useRender`/`mergeProps` (Base UI, not installed) → plain elements; none of the parts is polymorphic, so there is no `render` prop and no Slot, and nothing in the file imports a primitive (`check:layers` PRIMITIVE).
   changed: the root is an `<ol>` and each event an `<li>` (ReUI drew `div`s); the title is a `div`, not an `h3`, because a heading level is the page's to choose.
   changed: ReUI's `step` / `value` / `defaultValue` / `onValueChange` (a numeric active step, horizontal or vertical) → not kept: the current event is `current` on the item (`aria-current="step"`) and the order is the list's; vertical only, so no `orientation`.
   changed: ReUI's Base UI `data-completed` attribute → `data-status` (our StatusMark vocabulary); `data-orientation` → `data-rail`; `group-data-[orientation=…]` variants → `group-data-[rail=…]`.
   changed: ReUI's absolutely placed 16px ring (the brand colour at 20%) → `StatusMark` when there is a status, the caller's `icon` on a small circle, else our `Dot`; its brand-at-10% rail → `bg-border`; `text-muted-foreground`, `text-sm`, `font-medium` → our body-text rules (secondary text is 500).
   changed: left or right content (ReUI's drawing) is `rail="start" | "end"`, the side the rail and dots sit on; `side` and `align` are overlay and frame axes, not Item's, so the prop is named for what it moves.
   changed: ReUI's `TimelineDate` → `TimelineTime`, a `<time dateTime>` formatted by `formatDay` (lib/format); `TimelineHeader` dropped (title and time stack in `TimelineContent`).
   changed: the data shape and the collapsible groups are ours, re-derived from the description of Rocket UI's `timeline` (its licence is unknown, REVIEW-20 D-01; no code taken): `items[]` with `children`, `status`, `time`, `defaultOpen`. Rocket's status words (error · success · warning · pending · info) are MarkStatus's (attention · done · waiting · working …); no `motion`, the fold is our Collapsible with the theme's `animate-collapsible-*` (D-03).

   How it is built. The rail is drawn by each item, not by a wrapper: an `<li>` holds a 20px indicator at the rail's side and a 1px separator that runs from just under it to just above the next one (the last item's separator is hidden), and the content sits 32px in from the rail. So an item can be any height, a group's nested list gets its own rails, and nothing is measured. `rail="end"` mirrors it: the rail on the right and the text aligned to it.
   Groups. An entry with `children` is a group: its title becomes a toggle (a DisclosureTrigger inside our Collapsible, so Radix gives it `aria-expanded` and `aria-controls`), its time and description stay visible, and its children are a nested `<ol>` that folds. State lives in the root: `open` (a record of group id → open) with `onOpenChange(id, open)` is the controlled form; without `open` each group starts at its own `defaultOpen` and the root keeps the rest; `open` may name only some of the groups, the others stay uncontrolled. `collapsible={false}` draws every group open with no toggle (the title is plain text).
   Status. A status draws StatusMark and says its word to assistive tech (the `statusLabel`, or a default from `STATUS_WORDS`, spike copy until Product's lands); the item whose status is `working` is the current step. Without a status the dot is decorative: the text beside it carries the meaning.
   Not here: a horizontal timeline, per-event actions, a timeline that loads more as you scroll. */

type TimelineRail = "start" | "end"
/** A group's open state, by entry id. */
type TimelineOpen = Record<string, boolean>

/* The words assistive tech hears for a status mark (spike copy; the mark itself is decorative). */
const STATUS_WORDS: Record<MarkStatus, string> = {
  open: "Open",
  partial: "Partly done",
  present: "Added",
  declined: "Declined",
  waiting: "Waiting",
  working: "In progress",
  done: "Done",
  attention: "Needs attention",
  skipped: "Skipped",
  canceled: "Canceled",
}

type TimelineContextValue = {
  rail: TimelineRail
  collapsible: boolean
  isOpen: (id: string, defaultOpen?: boolean) => boolean
  setOpen: (id: string, open: boolean) => void
}

/* Outside a Timeline (a TimelineGroup composed on its own) groups are always open and say nothing. */
const TimelineContext = createContext<TimelineContextValue>({
  rail: "start",
  collapsible: false,
  isOpen: () => true,
  setOpen: () => {},
})

/** One event, or a group of them, as data: the `items` form of Timeline. */
type TimelineEntry = {
  /** Unique among all entries (a group's children too); it keys the list and names the group in `open` / `onOpenChange`. */
  id: string
  /** What happened. For a group, the toggle's text. */
  title: ReactNode
  /** One line of detail under the title. */
  description?: ReactNode
  /** When: an ISO date or date-time (or a Date), shown as the day ("Oct 28, 2026") in a `<time dateTime>`. */
  time?: string | Date
  /** The dot is a StatusMark for this status (done · working · waiting · attention …). `working` is the current step. */
  status?: MarkStatus
  /** What the status mark says to assistive tech, when the default word ("Done", "In progress") isn't right. */
  statusLabel?: string
  /** The dot when there is no status: a lucide icon, decorative. Neither: a plain dot. */
  icon?: ReactNode
  /** Makes this entry a group: these events fold under its title. */
  children?: TimelineEntry[]
  /** For a group in an uncontrolled Timeline: starts open. Default closed. */
  defaultOpen?: boolean
}

type TimelineProps = Omit<ComponentProps<"ol">, "style"> & {
  /** The events as data, groups included. Or pass `TimelineItem`s as `children` to compose them by hand. */
  items?: TimelineEntry[]
  /** Controlled: which groups are open, by entry id. Groups it doesn't name are uncontrolled. */
  open?: TimelineOpen
  /** A group was toggled: its id and whether it is now open. Fires in controlled and uncontrolled use. */
  onOpenChange?: (id: string, open: boolean) => void
  /** Groups fold under a toggle. False draws every group open, with its title as plain text. Default true. */
  collapsible?: boolean
  /** Which side the rail and dots sit on: `start` (default, content to the right of the rail) or `end` (rail on the right, text aligned to it). */
  rail?: TimelineRail
}

function renderEntry(entry: TimelineEntry): ReactNode {
  const { id, title, description, time, status, statusLabel, icon, children, defaultOpen } = entry
  return (
    <TimelineItem key={id} current={status === "working"} data-status={status}>
      <TimelineIndicator status={status} statusLabel={statusLabel} icon={icon} />
      <TimelineSeparator />
      <TimelineContent>
        {children?.length ? (
          <TimelineGroup id={id} title={title} time={time} description={description} defaultOpen={defaultOpen}>
            {children.map(renderEntry)}
          </TimelineGroup>
        ) : (
          <>
            <TimelineTitle>{title}</TimelineTitle>
            {time ? <TimelineTime value={time} /> : null}
            {description ? <TimelineDescription>{description}</TimelineDescription> : null}
          </>
        )}
      </TimelineContent>
    </TimelineItem>
  )
}

/** A vertical rail of events with dots, times and details, and groups that fold; pass `items`, or compose TimelineItems. */
function Timeline({ items, open, onOpenChange, collapsible = true, rail = "start", className, children, ...props }: TimelineProps) {
  const [own, setOwn] = useState<TimelineOpen>({})
  const isOpen = useCallback((id: string, defaultOpen?: boolean) => open?.[id] ?? own[id] ?? defaultOpen ?? false, [open, own])
  const setOpen = useCallback(
    (id: string, next: boolean) => {
      if (open?.[id] === undefined) setOwn((prev) => ({ ...prev, [id]: next }))
      onOpenChange?.(id, next)
    },
    [open, onOpenChange]
  )
  const value = useMemo(() => ({ rail, collapsible, isOpen, setOpen }), [rail, collapsible, isOpen, setOpen])
  return (
    <TimelineContext.Provider value={value}>
      <ol data-slot="timeline" data-rail={rail} className={cn("group/timeline flex flex-col", className)} {...props}>
        {items ? items.map(renderEntry) : children}
      </ol>
    </TimelineContext.Provider>
  )
}

/** One event in the rail: an `<li>` that holds its indicator, separator and content. */
function TimelineItem({
  current = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<"li">, "style"> & {
  /** This is the current step (`aria-current="step"`), as the order's fourth step is "being packed". */
  current?: boolean
  [key: `data-${string}`]: string | undefined
}) {
  return (
    <li
      data-slot="timeline-item"
      aria-current={current ? "step" : undefined}
      className={cn(
        "relative pb-6 last:pb-0 group-data-[rail=start]/timeline:ps-8 group-data-[rail=end]/timeline:pe-8 group-data-[rail=end]/timeline:text-end",
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
}

/** The dot on the rail: a StatusMark for a status, else the icon on a small circle, else a plain dot; `children` replaces all three. */
function TimelineIndicator({
  status,
  statusLabel,
  icon,
  className,
  children,
}: {
  /** Draws a StatusMark for this status. */
  status?: MarkStatus
  /** What the mark says to assistive tech; the default is the status's word. */
  statusLabel?: string
  /** A lucide icon on a small circle, when there is no status. Decorative. */
  icon?: ReactNode
  className?: string
  /** Your own indicator, in place of the three above. */
  children?: ReactNode
}) {
  return (
    <div
      data-slot="timeline-indicator"
      className={cn(
        "absolute top-0 flex size-5 items-center justify-center group-data-[rail=start]/timeline:start-0 group-data-[rail=end]/timeline:end-0",
        className
      )}
    >
      {children ??
        (status ? (
          <StatusMark status={status} label={statusLabel ?? STATUS_WORDS[status]} />
        ) : icon ? (
          <span aria-hidden className="flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground [&>svg]:size-icon-xs">
            {icon}
          </span>
        ) : (
          <Dot size="md" tone="neutral" />
        ))}
    </div>
  )
}

/** The rail between one dot and the next; an item draws it, and the last item's is hidden. */
function TimelineSeparator({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="timeline-separator"
      className={cn(
        "pointer-events-none absolute top-6 bottom-1 w-px bg-border [li:last-child>&]:hidden group-data-[rail=start]/timeline:start-2.5 group-data-[rail=end]/timeline:end-2.5",
        className
      )}
    />
  )
}

/** The text of an event: title, time and detail, stacked beside the rail. */
function TimelineContent({ className, children, ...props }: Omit<ComponentProps<"div">, "style">) {
  return (
    <div data-slot="timeline-content" className={cn("flex min-w-0 flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  )
}

/** What happened, in one line; its first line sits level with the dot. */
function TimelineTitle({ className, children, ...props }: Omit<ComponentProps<"div">, "style">) {
  return (
    <div data-slot="timeline-title" className={cn("text-sm font-semibold text-card-foreground", className)} {...props}>
      {children}
    </div>
  )
}

/** One line of detail under the title. */
function TimelineDescription({ className, children, ...props }: Omit<ComponentProps<"div">, "style">) {
  return (
    <div data-slot="timeline-description" className={cn("text-sm font-medium text-muted-foreground", className)} {...props}>
      {children}
    </div>
  )
}

const dayText = (iso: string) => (Number.isNaN(Date.parse(iso)) ? iso : formatDay(iso))

/** When it happened, in a `<time dateTime>`: the day ("Oct 28, 2026") from an ISO date or date-time, or your own text as children. */
function TimelineTime({
  value,
  className,
  children,
  ...props
}: Omit<ComponentProps<"time">, "style" | "dateTime"> & {
  /** An ISO date or date-time, or a Date: becomes `dateTime`, and the shown day when there are no children. */
  value?: string | Date
}) {
  const iso = value instanceof Date ? (Number.isNaN(value.getTime()) ? undefined : value.toISOString()) : value
  const text = children ?? (iso ? dayText(iso) : null)
  if (text === null || text === undefined) return null
  return (
    <time
      data-slot="timeline-time"
      dateTime={iso && !Number.isNaN(Date.parse(iso)) ? iso : undefined}
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    >
      {text}
    </time>
  )
}

/** Events that fold under a toggle (a plain title in a non-collapsible Timeline); its children are TimelineItems in a nested list. */
function TimelineGroup({
  id,
  title,
  time,
  description,
  defaultOpen,
  className,
  children,
}: {
  /** Names the group in the Timeline's `open` and `onOpenChange`. */
  id: string
  /** The toggle's text. */
  title: ReactNode
  /** When, shown under the toggle. */
  time?: string | Date
  /** One line under the toggle; stays visible when the group is folded. */
  description?: ReactNode
  /** Starts open when the Timeline doesn't control this group. Default closed. */
  defaultOpen?: boolean
  className?: string
  /** The group's events: TimelineItems. */
  children?: ReactNode
}) {
  const { collapsible, isOpen, setOpen } = useContext(TimelineContext)
  const head = (
    <>
      {time ? <TimelineTime value={time} /> : null}
      {description ? <TimelineDescription>{description}</TimelineDescription> : null}
    </>
  )
  if (!collapsible) {
    return (
      <div data-slot="timeline-group" className={cn("flex flex-col gap-0.5", className)}>
        <TimelineTitle>{title}</TimelineTitle>
        {head}
        <ol data-slot="timeline-group-list" className="flex flex-col pt-4">
          {children}
        </ol>
      </div>
    )
  }
  return (
    <Collapsible
      open={isOpen(id, defaultOpen)}
      onOpenChange={(next) => setOpen(id, next)}
      className={cn("flex flex-col gap-0.5", className)}
    >
      <div data-slot="timeline-group">
        <CollapsibleTrigger>
          <DisclosureTrigger tone="strong">{title}</DisclosureTrigger>
        </CollapsibleTrigger>
      </div>
      {head}
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <ol data-slot="timeline-group-list" className="flex flex-col pt-4 pb-1">
          {children}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { Timeline, TimelineContent, TimelineDescription, TimelineGroup, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTime, TimelineTitle }
export type { TimelineEntry, TimelineOpen, TimelineProps, TimelineRail }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type TimelineContentProps = ComponentProps<typeof TimelineContent>
export type TimelineDescriptionProps = ComponentProps<typeof TimelineDescription>
export type TimelineGroupProps = ComponentProps<typeof TimelineGroup>
export type TimelineIndicatorProps = ComponentProps<typeof TimelineIndicator>
export type TimelineItemProps = ComponentProps<typeof TimelineItem>
export type TimelineSeparatorProps = ComponentProps<typeof TimelineSeparator>
export type TimelineTimeProps = ComponentProps<typeof TimelineTime>
export type TimelineTitleProps = ComponentProps<typeof TimelineTitle>
