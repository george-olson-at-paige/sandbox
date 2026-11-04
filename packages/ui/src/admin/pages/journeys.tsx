"use client"

import { useEffect, useRef, type ElementType, type ReactNode, type RefObject } from "react"
import { ArrowUpRight, ChevronDown, ChevronUp, RotateCw } from "lucide-react"

import { cn } from "../../lib/utils"
import { describeDuration, formatDuration } from "../../lib/format-kind"
import { Button } from "../../components/actions/button"
import { Badge } from "../../components/display/badge"
import { Card } from "../../components/display/card"
import { DataTable, type DataTableColumn } from "../../components/display/data-table"
import { Formatted } from "../../components/display/formatted"
import { Legend } from "../../components/display/legend"
import { MeterBar } from "../../components/display/meter-bar"
import { RangeBar } from "../../components/display/range-bar"
import { ShareBar, type ShareSegment } from "../../components/display/share-bar"
import { Callout } from "../../components/feedback/callout"
import { EmptyState } from "../../components/feedback/empty-state"
import { Skeleton } from "../../components/feedback/skeleton"
import { Select } from "../../components/inputs/select"
import { ToggleGroup, ToggleGroupItem } from "../../components/inputs/toggle-group"
import { NavList } from "../../components/navigation/nav-list"
import { pressable } from "../../components/internal/control"
import { Field, FieldLabel } from "../../forms/field"
import { InsightCard } from "../../patterns/insight-card"
import { KpiCard } from "../../patterns/kpi-card"
import { Flex } from "../../primitives/flex"
import { Grid } from "../../primitives/grid"
import { Split } from "../../primitives/split"
import { Stack } from "../../primitives/stack"
import { biggestDrop, entryLabel, isLow, screenStats, stopsMost, timeDomain, type JourneyEntry, type JourneyNextKind, type JourneyUsage, type ScreenStat } from "../journey-rules"

/* @archetype Composite (ARCHETYPES.md).
   Usage › Journeys (R21-14): one journey (Essential Setup first) as the screens people pass
   through, where they stop and how long they stay — the Journeys mock (`Main.dc.html`) on the
   package's parts. The page frame is AdminPage (`current="journeys"`) with the R21-02 slots: the
   trail "Admin › Usage", TabsLine for the journeys (Sign-up · Essential Setup · First things in
   the Vault), the source and freshness `meta`, and "Open in Mixpanel" as a link out
   (`journeysMixpanelLink`). This module is what goes inside it:
   - `JourneysToolbar`: the dates (Select, labelled inline) and how they came in (ToggleGroup
     `segment`: Everyone and each entry with its count, for a journey that has entries: the Areas;
     Setup has none since 2026-11-01).
   - `JourneysView`: the screens as a NavList on the left ("All screens", then each screen with
     how many reached it and a named attention dot on the biggest drop) and, beside it, either
     - **All screens**: two summary KpiCards with a caption (Started, Reached the end) and an
       InsightCard for the biggest drop that opens that screen; then one DataTable, a row per
       screen: the screen (its button opens it), reached (MeterBar against everyone who
       started), went on (a percent in the attention ink when under 75%, with how many stopped)
       and time on screen (RangeBar: most people's time, the median, the slowest 10%, on one 0–5
       minute scale, with the median in words), its Legend in the table's toolbar. It shows the
       three screens where people stop most until "Show all 9 screens"; or
     - **a screen**: one card — the "Biggest drop" badge when it is, the screen's name and how
       many reached it, a trio (went on, median time, slowest 10%), "What they did next" as a
       ShareBar with its legend when known, and "See who stopped here" (a link to People).
   The view, the "show all" switch, the dates and the entry are the caller's (the app keeps them
   in the URL); every derived number comes from `journey-rules.ts`, so the cards, table, nav and
   screen card agree. The data is `GET admin/usage/journeys` as sent (`JourneyUsage`, R21-21): the
   page works for any journey — a line (Setup), a branch (Sign-up), tasks with no time (one-step
   tasks show "—"), a journey with no entries (the segment is hidden). Durations are written the package's way (`formatDuration`: "8 s",
   "2 min"), not the mock's "1m 43s". Opening a screen (R21-18): its heading takes focus when the
   control that opened it went with the old view (a table row's button, the InsightCard), so a
   keyboard user lands on what they opened rather than on the page; from the nav, focus stays on
   the nav and the card is scrolled into view (on a phone it sits under the nav). A deep link to
   a screen moves nothing. States: `loading` (skeletons in place); `error`
   (couldn't load: a Callout with Try again, the nav keeps "All screens"); a host with no event
   store (a Callout above the numbers, which are all zero); a journey nobody started in the
   window (an EmptyState in the main column). "Open in Mixpanel" (`JourneysMixpanelLink`) is not
   rendered while Mixpanel is off (phase 4, George's sign-off on what leaves). */

/** What the page derives, once, from the screens. */
function journeyModel(usage: JourneyUsage | null) {
  const stats = usage ? screenStats(usage) : []
  const first = stats.find((s) => !s.optional)
  return { stats, first, started: usage?.people ?? 0, reachedEnd: usage?.reachedEnd ?? 0, drop: biggestDrop(stats), most: stopsMost(stats), domain: timeDomain(stats) }
}

/** The data colour for each kind of "what they did next". */
const NEXT_COLOR: Record<JourneyNextKind, ShareSegment["color"]> = { on: "brand", back: "neutral", elsewhere: "brand-subtle", left: "attention", other: "chart-5" }

const percent = (rate: number) => Math.round(rate * 100)

/** The segment's value for everyone (the API's `entry` is then left out). */
const EVERYONE = "everyone"

/** The dates and how they came in: a labelled Select and a segmented control. */
function JourneysToolbar({
  ranges,
  range,
  onRangeChange,
  entries,
  entry,
  onEntryChange,
}: {
  /** The date windows to choose from ("Last 7 days · 24–31 Oct"). */
  ranges: readonly { value: string; label: string }[]
  /** The chosen window. */
  range: string
  onRangeChange: (value: string) => void
  /** How everyone came in, with how many (the response's `entries`); empty hides the segment. */
  entries: readonly JourneyEntry[]
  /** The chosen entry; null for everyone. */
  entry: string | null
  onEntryChange: (entry: string | null) => void
}) {
  const everyone = entries.reduce((n, e) => n + e.people, 0)
  // A chosen entry the window doesn't list (nobody came in that way in these dates) stays in the
  // segment at 0, so the chosen one is always visible and can be changed.
  const shown = entry && !entries.some((e) => e.key === entry) ? [...entries, { key: entry, people: 0 }] : entries
  return (
    <Flex wrap align="center" gap={3} data-slot="journeys-toolbar">
      <Field orientation="horizontal" className="w-auto">
        <FieldLabel className="w-auto">Dates</FieldLabel>
        <Select options={ranges.map((r) => ({ value: r.value, label: r.label }))} value={range} onValueChange={onRangeChange} className="min-w-60" />
      </Field>
      {shown.length > 0 && (
        <ToggleGroup type="single" variant="segment" aria-label="How they came in" value={entry ?? EVERYONE} onValueChange={(v) => v && onEntryChange(v === EVERYONE ? null : v)}>
          <ToggleGroupItem value={EVERYONE} variant="segment">
            Everyone · {everyone}
          </ToggleGroupItem>
          {shown.map((e) => (
            <ToggleGroupItem key={e.key} value={e.key} variant="segment">
              {entryLabel(e.key)} · {e.people}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </Flex>
  )
}

/** The table's columns: the screen (a button that opens it), reached, went on and time on screen. */
function columnsFor(started: number, domain: readonly [number, number] | null, onOpen: (key: string) => void): DataTableColumn<ScreenStat>[] {
  return [
    {
      id: "screen",
      header: "Screen",
      cell: (s) => (
        <button type="button" onClick={() => onOpen(s.key)} className={cn(pressable, "rounded-xs text-left font-semibold text-card-foreground hover:underline")}>
          {s.label}
        </button>
      ),
    },
    {
      id: "reached",
      header: "Reached",
      cell: (s) => <MeterBar value={s.reached} max={started} label={`Reached ${s.label}`} showValue className="min-w-40" />,
    },
    {
      id: "wentOn",
      header: "Went on",
      numeric: true,
      cell: (s) =>
        s.wentOn === null ? (
          <span className="text-xs text-muted-foreground">{s.optional ? "shown to some" : "the end"}</span>
        ) : (
          <span className="text-xs whitespace-nowrap">
            <Formatted kind="percent" value={percent(s.wentOn)} tone={isLow(s.wentOn) ? "attention" : "strong"} className="font-bold" /> <span className="text-muted-foreground">· {s.stopped} stopped</span>
          </span>
        ),
    },
    {
      id: "time",
      header: domain ? `Time on screen (0–${formatDuration(domain[1])})` : "Time on screen",
      cell: (s) => {
        const t = s.activeSpread
        if (!domain || t.p25 === null || t.median === null || t.p75 === null || t.p90 === null) return <Formatted kind="duration" value={null} className="text-xs" />
        return (
          <span className="flex min-w-0 items-center gap-2">
            <RangeBar
              low={t.p25}
              high={t.p75}
              mark={t.median}
              whisker={t.p90}
              domain={domain}
              summary={`${s.label}: most people ${describeDuration(t.p25)} to ${describeDuration(t.p75)}, median ${describeDuration(t.median)}, slowest 10% ${describeDuration(t.p90)} or longer`}
              className="min-w-32 flex-1"
            />
            <Formatted kind="duration" value={t.median} className="w-12 shrink-0 text-right text-xs" />
          </span>
        )
      },
    },
  ]
}

/** One of the screen card's three facts: a label, the value and one line; Stat's type, for a value that is a duration. */
function ScreenFact({ label, value, caption }: { label: string; value: ReactNode; caption: string }) {
  return (
    <Card variant="muted" density="compact" className="border-transparent" data-slot="screen-fact">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-2xl leading-none font-bold tracking-tight text-foreground-strong">{value}</span>
      <span className="truncate text-xs text-foreground">{caption}</span>
    </Card>
  )
}

/** The screens of one journey: a NavList beside either the summary and the table (All screens) or one screen's card. */
function JourneysView({
  usage,
  window: span,
  view,
  onViewChange,
  expanded,
  onExpandedChange,
  whoStoppedHref,
  linkAs: Link = "a",
  loading = false,
  error,
}: {
  /** The journey for the window and entry asked for (`GET admin/usage/journeys`); null while loading or after an error. */
  usage: JourneyUsage | null
  /** The dates the numbers cover ("Last 7 days"), said to screen readers on each card. */
  window: string
  /** "all", or the id of the screen shown. */
  view: string
  onViewChange: (view: string) => void
  /** The table shows every screen (else the three where people stop most). */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Where "See who stopped here" goes for a screen (People, filtered). */
  whoStoppedHref: (screenId: string) => string
  /** The app's router link. */
  linkAs?: ElementType
  /** Skeletons in place while the journey loads. */
  loading?: boolean
  /** It couldn't be loaded: what to say, and the retry. */
  error?: { title: string; description?: string; onRetry?: () => void }
}) {
  const { stats, first, started, reachedEnd, drop, most, domain } = journeyModel(usage)
  const picked = stats.find((s) => s.key === view)
  const nobody = !loading && !error && started === 0

  // R21-18: when the view changes to a screen, take the person to it (see the header comment).
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownId = useRef(picked?.key)
  useEffect(() => {
    if (shownId.current === picked?.key) return
    shownId.current = picked?.key
    const heading = headingRef.current
    if (!heading) return
    if (document.activeElement === document.body || document.activeElement === null) heading.focus()
    else heading.closest("[data-slot=journey-screen]")?.scrollIntoView({ block: "nearest" })
  }, [picked?.key])

  const nav = loading ? (
    <Skeleton shape="block" className="h-96" />
  ) : (
    <NavList
      label="Screens"
      framed
      current={picked ? picked.key : "all"}
      onSelect={onViewChange}
      items={[{ id: "all", label: "All screens" }, ...(nobody ? [] : stats.map((s) => ({ id: s.key, label: s.label, count: s.reached, marker: s.key === drop?.key ? "Biggest drop" : undefined })))]}
    />
  )

  let main
  if (error && !loading) {
    main = (
      <Callout
        tone="attention"
        title={error.title}
        actions={
          error.onRetry && (
            <Button variant="secondary" size="sm" icon={<RotateCw aria-hidden />} onClick={error.onRetry}>
              Try again
            </Button>
          )
        }
      >
        {error.description}
      </Callout>
    )
  } else if (nobody) {
    main = (
      <Card density="compact">
        <EmptyState size="md" title={`Nobody started ${usage?.label ?? "this journey"} in these dates`} description="Pick a longer window, or everyone rather than one way in." />
      </Card>
    )
  } else if (picked) {
    main = <ScreenCard screen={picked} started={started} isDrop={picked.key === drop?.key} whoStoppedHref={whoStoppedHref(picked.key)} linkAs={Link} headingRef={headingRef} />
  } else {
    const rows = expanded ? stats : most
    main = (
      <Stack gap={4}>
        <Grid columns={{ base: 1, md: 3 }} gap="grid" aria-label="Summary" data-slot="journeys-summary">
          <KpiCard size="compact" label="Started" window={span} value={loading ? null : started} format={{ kind: "count" }} caption={first ? `people reached ${first.label}` : undefined} loading={loading} />
          <KpiCard
            size="compact"
            label="Reached the end"
            window={span}
            value={loading ? null : reachedEnd}
            format={{ kind: "count" }}
            caption={started ? `${percent(reachedEnd / started)}% of those who started` : undefined}
            loading={loading}
          />
          {loading ? (
            <Skeleton shape="block" className="h-full min-h-24 rounded-md" />
          ) : (
            drop && <InsightCard eyebrow="Biggest drop" title={`After ${drop.label}`} description={`${drop.stopped} of ${drop.reached} stopped`} action="Look at it" onSelect={() => onViewChange(drop.key)} />
          )}
        </Grid>
        <DataTable
          rows={rows}
          columns={columnsFor(started, domain, onViewChange)}
          getRowId={(s) => s.key}
          label={expanded ? "Every screen" : "Where people stop most"}
          title={expanded ? "Every screen" : "Where people stop most"}
          headingLevel={2}
          toolbar={
            <Legend
              label="Key"
              items={[
                { label: "Reached", color: "brand" },
                { label: "Most people’s time", color: "brand-subtle" },
                { label: "Median", color: "brand-ink", shape: "line" },
                { label: "Slowest 10%", color: "neutral", shape: "line" },
              ]}
            />
          }
          loading={loading}
          onRowClick={(s) => onViewChange(s.key)}
          columnsMenu={false}
          pageSize="all"
          maxHeight="none"
        />
        {!loading && (
          <Button variant="quiet" size="sm" className="self-start" icon={expanded ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />} aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)}>
            {expanded ? "Show only where people stop most" : `Show all ${stats.length} screens`}
          </Button>
        )}
      </Stack>
    )
  }

  const noEvents = usage && !usage.eventsAvailable && !loading
  return (
    <Flex wrap align="start" gap={4} data-slot="journeys-view">
      {noEvents && (
        <Callout tone="info" title="This host keeps no events" className="w-full">
          Every count is zero until it has an event store.
        </Callout>
      )}
      <div className="w-full shrink-0 md:w-60">{nav}</div>
      <div className="min-w-0 flex-1">{main}</div>
    </Flex>
  )
}

/** One screen: whether it is the biggest drop, how many reached it, the trio, what they did next, and who stopped. */
function ScreenCard({
  screen: s,
  started,
  isDrop,
  whoStoppedHref,
  linkAs: Link,
  headingRef,
}: {
  screen: ScreenStat
  started: number
  isDrop: boolean
  whoStoppedHref: string
  linkAs: ElementType
  headingRef: RefObject<HTMLHeadingElement | null>
}) {
  const reachedLine = s.optional ? `Shown to ${s.reached} people` : `${s.reached} of ${started} people reached it (${percent(s.share)}%)`
  const t = s.activeSpread
  return (
    <Card density="compact" className="scroll-mt-bar gap-4 px-5 py-5" aria-labelledby={`journey-screen-${s.key}`} role="region" data-slot="journey-screen">
      <Split align="end" aside={<span className="text-sm text-foreground">{reachedLine}</span>}>
        <Stack gap={1}>
          {isDrop && (
            <Badge tone="attention" className="self-start">
              Biggest drop
            </Badge>
          )}
          <h2 ref={headingRef} tabIndex={-1} id={`journey-screen-${s.key}`} className="self-start rounded-xs text-xl font-bold text-foreground-strong focus-ring">
            {s.label}
          </h2>
        </Stack>
      </Split>
      <Grid columns={{ base: 1, md: 3 }} gap="grid" data-slot="screen-facts">
        <ScreenFact
          label="Went on"
          value={s.wentOn === null ? <span className="text-muted-foreground">—</span> : <Formatted kind="percent" value={percent(s.wentOn)} tone={isLow(s.wentOn) ? "attention" : undefined} />}
          caption={s.wentOn !== null ? `${s.stopped} of ${s.reached} stopped here` : s.optional ? "optional screen" : "the last screen"}
        />
        <ScreenFact
          label="Median time here"
          value={<Formatted kind="duration" value={t.median} />}
          caption={t.p25 !== null && t.p75 !== null ? `most people ${formatDuration(t.p25)}–${formatDuration(t.p75)} · ${t.count} timed` : "nobody timed"}
        />
        <ScreenFact label="Slowest 10%" value={<Formatted kind="duration" value={t.p90} />} caption={t.p90 !== null ? "or longer" : "nobody timed"} />
      </Grid>
      {s.then.length > 0 && (
        <Stack gap={2}>
          <h3 className="text-sm font-semibold text-card-foreground">What they did next, by visit</h3>
          <ShareBar label="What they did next" segments={s.then.map((n) => ({ label: n.label, value: n.count, color: NEXT_COLOR[n.kind] }))} />
        </Stack>
      )}
      {s.wentOn !== null && (
        <Button asChild variant="quiet" size="inline" className="self-start text-sm" icon={<ArrowUpRight aria-hidden />}>
          <Link href={whoStoppedHref}>See who stopped here</Link>
        </Button>
      )}
    </Card>
  )
}

/** "Open in Mixpanel": the page's one action, a link out (a new tab) at the header's right. Not rendered until Mixpanel is on (phase 4). */
function JourneysMixpanelLink({ href }: { href: string }) {
  return (
    <Button asChild variant="secondary" size="sm" icon={<ArrowUpRight aria-hidden />} iconPosition="end">
      <a href={href} target="_blank" rel="noreferrer">
        Open in Mixpanel
      </a>
    </Button>
  )
}

export { JourneysMixpanelLink, JourneysToolbar, JourneysView, journeyModel }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type JourneysViewProps = Parameters<typeof JourneysView>[0]
export type JourneysToolbarProps = Parameters<typeof JourneysToolbar>[0]
