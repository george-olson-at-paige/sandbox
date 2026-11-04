"use client"

import { Suspense, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { journeyRanges, rangeOf, type JourneyUsage } from "@paige/ui/admin/journey-rules"
import { JourneysToolbar, JourneysView } from "@paige/ui/admin/pages/journeys"
import { TabsLineList, tabsLineTriggerVariants } from "@paige/ui/components/navigation/tabs-line"

import { AdminScreen } from "./admin-screen"
import { journeysSource, loadJourneyUsage, type JourneyQuery } from "./journeys-data"

/* /admin/journeys (R21-14, R21-21): AdminPage with the trail, the journey tabs, the source line;
   then the dates, how they came in, and JourneysView, on `GET admin/usage/journeys` through
   `journeys-data.ts` (recordings until the app has its API module). Everything a person chooses is
   in the URL — `?journey=sign-up&range=30d&screen=verify-phone&all=1`, and `entry` for a journey with entries (the Areas) — so a view
   deep-links, back walks it, and a refresh keeps it. A new journey, window or entry drops the
   screen (its key belongs to the journey, and the numbers changed). The tabs are the journeys
   with no group in the API's list (Sign-up, Essential Setup, First things), named here so they
   draw before the numbers land (no layout shift); a key the API doesn't know comes back as the
   error state. Areas and Getting around come with Lane 3's phases. "Open in Mixpanel" is off until Mixpanel is (phase 4). useSearchParams
   needs a Suspense boundary for the static build. */
const DEFAULT_JOURNEY = "essential-setup"
const JOURNEY_TABS = [
  ["sign-up", "Sign-up"],
  ["essential-setup", "Essential Setup"],
  ["first-things", "First things in the Vault"],
] as const

/** The frame: AdminPage with the trail, the journey tabs (as links; the current one marked) and the source line. */
function Frame({ journey, hrefFor, children }: { journey: string | null; hrefFor: (journey: string) => string; children: ReactNode }) {
  return (
    <AdminScreen
      current="journeys"
      breadcrumb={[
        { label: "Admin", href: adminHref("pulse") },
        { label: "Usage", href: adminHref("usage") },
      ]}
      title="Journeys"
      meta={journeysSource}
      tabs={
        <TabsLineList aria-label="Journeys">
          {JOURNEY_TABS.map(([key, label]) => (
            <Link key={key} href={hrefFor(key)} aria-current={key === journey ? "page" : undefined} className={tabsLineTriggerVariants()}>
              {label}
            </Link>
          ))}
        </TabsLineList>
      }
    >
      {children}
    </AdminScreen>
  )
}

/** The usage for a query, with loading and a retry. The last good answer stays (`last`) through a load or a failure, so the segment keeps its entries. */
function useJourneyUsage(query: JourneyQuery) {
  const [state, setState] = useState<{ last: JourneyUsage | null; loading: boolean; failed: boolean }>({ last: null, loading: true, failed: false })
  const [attempt, setAttempt] = useState(0)
  const { journey, range, entry } = query
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, failed: false }))
    loadJourneyUsage({ journey, range, entry }).then(
      (usage) => live && setState((s) => ({ last: usage ?? s.last, loading: false, failed: usage === null })),
      () => live && setState((s) => ({ ...s, loading: false, failed: true }))
    )
    return () => {
      live = false
    }
  }, [journey, range, entry, attempt])
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

function Journeys() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query: JourneyQuery = { journey: params.get("journey") ?? DEFAULT_JOURNEY, range: rangeOf(params.get("range")), entry: params.get("entry") }
  const view = params.get("screen") ?? "all"
  const expanded = params.get("all") === "1"
  const { last, loading, failed, retry } = useJourneyUsage(query)

  /** Sets URL values (null removes one); `fresh` also drops the screen, for a new journey, window or entry. */
  const setParams = (values: Record<string, string | null>, fresh = false) => {
    const q = new URLSearchParams(params.toString())
    if (fresh) q.delete("screen")
    for (const [key, value] of Object.entries(values)) {
      if (value) q.set(key, value)
      else q.delete(key)
    }
    const s = q.toString()
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }
  /** A tab's link: the journey and the chosen window (an entry and a screen belong to the journey they were picked on). */
  const hrefFor = (journey: string) => {
    const q = new URLSearchParams()
    if (journey !== DEFAULT_JOURNEY) q.set("journey", journey)
    if (query.range !== "7d") q.set("range", query.range)
    const s = q.toString()
    return s ? `${pathname}?${s}` : pathname
  }

  return (
    <Frame journey={query.journey} hrefFor={hrefFor}>
      <JourneysToolbar
        ranges={journeyRanges}
        range={query.range}
        onRangeChange={(range) => setParams({ range: range === "7d" ? null : range }, true)}
        entries={last?.entries ?? []}
        entry={query.entry}
        onEntryChange={(entry) => setParams({ entry }, true)}
      />
      <JourneysView
        usage={loading || failed ? null : last}
        window={journeyRanges.find((r) => r.value === query.range)!.label}
        view={view}
        onViewChange={(v) => setParams({ screen: v === "all" ? null : v })}
        expanded={expanded}
        onExpandedChange={(on) => setParams({ all: on ? "1" : null })}
        // People has no "stopped at" filter yet (API-NEEDS A51); the link carries the journey and the screen for it.
        whoStoppedHref={(key) => `${adminHref("people")}?journey=${query.journey}&stoppedAt=${key}`}
        linkAs={Link}
        loading={loading}
        error={failed ? { title: "No numbers for this choice", description: "The recordings cover Sign-up, Essential Setup and First things for these windows. Live numbers come with the app’s API module.", onRetry: retry } : undefined}
      />
    </Frame>
  )
}

export function JourneysScreen() {
  return (
    <Suspense
      fallback={
        <Frame journey={null} hrefFor={(key) => (key === DEFAULT_JOURNEY ? adminHref("journeys") : `${adminHref("journeys")}?journey=${key}`)}>
          <JourneysView usage={null} window="" view="all" onViewChange={() => {}} expanded={false} onExpandedChange={() => {}} whoStoppedHref={() => ""} loading />
        </Frame>
      }
    >
      <Journeys />
    </Suspense>
  )
}
