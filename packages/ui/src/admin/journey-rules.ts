/* Journey rules (R21-14, R21-21): what the Journeys page derives from one journey's usage, pure and
   tested (journey-rules.test.ts), so the summary cards, the table, the nav's marker and the screen
   card can't disagree. The input is `GET admin/usage/journeys` as the API sends it: `JourneyUsage`
   is a structural subset of its response (R13-02: no mapper where the shapes line up), so a screen
   passes the response straight in and a wire change fails the typecheck here.
   A journey is a graph of tasks (screens) joined by `edges`; `tasks` are in reading order. Setup is
   a line with one optional screen on a branch; Sign-up branches (an account, then the phone and the
   email in either order); an Area fans out to its items and back in.
   - Went on: the people who reached the next task over the people who reached this one, at most
     100%. The next tasks are those an edge leads to that aren't optional; when there are several
     (Sign-up's phone and email, an Area's essentials) every one is required, so the one fewest
     people reached is the measure. A task nothing
     required comes after is "the end"; an optional task has no rate ("shown to some").
     Not the API's `edges[].continued`: that counts people who *completed* this task and reached
     the next, and on today's events most people's tasks never show completed (Setup's
     `setup.step.left` arrived with PR 596), so it read 6 of 106 going on from Welcome when 94
     reached About you. `reached` isn't monotonic either (people resume past a screen, or join
     mid-way: Your people 95 after About you 94), hence the cap.
   - Stopped: this task's people minus the next one's, never below 0.
   - The biggest drop: the lowest went-on rate among tasks where someone stopped (ties: the
     earlier task); none when nobody stopped (one person who went all the way has no drop).
   - Where people stop most: the three lowest went-on rates, in reading order.
   - Low: a went-on rate under `LOW_RATE` (75%) is drawn in the attention ink.
   - What they did next: the API's `next` keys (`continue`, `back`, `exit`, `away`, `navigate`, a
     place for an Area: `home`, `people`, `area.money`…) fold into five kinds with their words;
     an unknown key is "other", never an error (API-NEEDS A50: the closed list).
   - The time column's scale: 0 to a round step above the slowest 10% of any task.
   Times are seconds; the page writes them with `formatDuration` (lib/format-kind.ts). */

/** Seconds at the 25th, 50th, 75th and 90th percentile, of `count` people; null where nobody was timed. */
type JourneySpread = { count: number; p25: number | null; median: number | null; p75: number | null; p90: number | null }

/** One task (a screen) of a journey, as the API sends it. */
type JourneyTask = {
  key: string
  label: string
  /** Shown to some people only (Setup's Check what we read; an Area's depth items). */
  optional: boolean
  /** People with an attempt at it. */
  reached: number
  /** Active time on it, of the people who finished it. */
  activeSpread: JourneySpread
  /** What people did after each visit, most first. */
  next: readonly { key: string; visits: number }[]
}

/** One arrow: `from` comes before `to`. */
type JourneyEdge = { from: string; to: string }

/** One way people came in (an Area's `not-started`, `in-progress`, `set-up`), with how many. Setup has none (2026-11-01). */
type JourneyEntry = { key: string; people: number }

/** A journey to pick (a tab), as the API lists them. */
type JourneyOption = { key: string; label: string; group: string | null }

/** `GET admin/usage/journeys`: one journey for everyone, or for one way of coming in. */
type JourneyUsage = {
  /** The host has an event store; without one every count is zero. */
  eventsAvailable: boolean
  /** Every journey, for the tabs. */
  journeys: readonly JourneyOption[]
  key: string
  label: string
  /** The tab it sits under (`areas`); null for its own. */
  group: string | null
  /** Everyone, by how they came in (always of everyone); empty for a journey with no entry. */
  entries: readonly JourneyEntry[]
  /** The entry the rest is of; null for everyone. */
  entry: string | null
  /** People who joined it; every other count is out of them. */
  people: number
  /** People who started it and reached its last task. */
  reachedEnd: number
  tasks: readonly JourneyTask[]
  edges: readonly JourneyEdge[]
}

/** What people did next, folded: on to a next task, back, elsewhere in Paige, out of it, or a key the page doesn't know. */
type JourneyNextKind = "on" | "back" | "elsewhere" | "left" | "other"
type JourneyNext = { kind: JourneyNextKind; label: string; count: number }

/** A task with what the page derives for it. */
type ScreenStat = JourneyTask & {
  /** The next task's people over this one's (0–1, at most 1); null for the end and for an optional task. */
  wentOn: number | null
  /** People who reached this task and not the next; null where `wentOn` is. */
  stopped: number | null
  /** The next task's label (of several, the one fewest reached); null where `wentOn` is. */
  nextLabel: string | null
  /** Share of the people who joined that reached it (0–1). */
  share: number
  /** What they did next, folded and worded; empty when unknown. */
  then: JourneyNext[]
}

const LOW_RATE = 0.75

/** The words and kind for each `next` key the API sends today. */
const NEXT_WORDS: Record<string, { kind: JourneyNextKind; label: string }> = {
  continue: { kind: "on", label: "Went on" },
  saved: { kind: "on", label: "Saved" },
  declined: { kind: "on", label: "Said they don’t have one" },
  back: { kind: "back", label: "Went back" },
  cancelled: { kind: "back", label: "Cancelled" },
  navigate: { kind: "elsewhere", label: "Went elsewhere in Paige" },
  link: { kind: "elsewhere", label: "Followed a link" },
  home: { kind: "elsewhere", label: "Home" },
  people: { kind: "elsewhere", label: "People" },
  documents: { kind: "elsewhere", label: "Documents" },
  exit: { kind: "left", label: "Left it" },
  away: { kind: "left", label: "Left Paige" },
  signout: { kind: "left", label: "Signed out" },
}

/** One `next` key as a kind and words: an Area place (`area.money`) is elsewhere, anything unknown is other. */
function nextOf(key: string, count: number): JourneyNext {
  const known = NEXT_WORDS[key]
  if (known) return { ...known, count }
  if (key.startsWith("area.")) return { kind: "elsewhere", label: `To ${key.slice(5).replace(/^\w/, (c) => c.toUpperCase())}`, count }
  return { kind: "other", label: key === "unknown" ? "Not known" : key, count }
}

/** Each task with its went-on rate, stopped count, share reached and what they did next. */
function screenStats(usage: Pick<JourneyUsage, "tasks" | "edges" | "people">): ScreenStat[] {
  const byKey = new Map(usage.tasks.map((t) => [t.key, t]))
  return usage.tasks.map((t) => {
    const share = usage.people > 0 ? t.reached / usage.people : 0
    const then = t.next.map((n) => nextOf(n.key, n.visits))
    const nexts = usage.edges.filter((e) => e.from === t.key).map((e) => byKey.get(e.to)).filter((n): n is JourneyTask => !!n && !n.optional)
    if (t.optional || nexts.length === 0) return { ...t, wentOn: null, stopped: null, nextLabel: null, share, then }
    const next = nexts.reduce((a, b) => (b.reached < a.reached ? b : a))
    return {
      ...t,
      wentOn: t.reached > 0 ? Math.min(1, next.reached / t.reached) : null,
      stopped: Math.max(0, t.reached - next.reached),
      nextLabel: next.label,
      share,
      then,
    }
  })
}

/** The task with the lowest went-on rate where someone stopped (the earlier on a tie); null when nobody stopped anywhere. */
function biggestDrop(stats: readonly ScreenStat[]): ScreenStat | null {
  return stats.reduce<ScreenStat | null>((low, s) => (s.wentOn !== null && (s.stopped ?? 0) > 0 && (low === null || s.wentOn < (low.wentOn ?? Infinity)) ? s : low), null)
}

/** The `n` tasks where people stop most (lowest went-on), in reading order. */
function stopsMost(stats: readonly ScreenStat[], n = 3): ScreenStat[] {
  const ranked = stats.filter((s) => s.wentOn !== null).sort((a, b) => (a.wentOn ?? 0) - (b.wentOn ?? 0)).slice(0, n)
  return stats.filter((s) => ranked.includes(s))
}

/** Whether a went-on rate is low enough to draw in the attention ink. */
const isLow = (rate: number | null) => rate !== null && rate < LOW_RATE

/** Round steps for the time scale, in seconds: 30 s up to an hour. */
const TIME_STEPS = [30, 60, 120, 300, 600, 1800, 3600] as const

/** The time column's scale, [0, a round step at or above the slowest 10% of any task]; null when no task was timed. */
function timeDomain(stats: readonly JourneyTask[]): readonly [number, number] | null {
  const slowest = Math.max(0, ...stats.map((s) => s.activeSpread.p90 ?? 0))
  if (!stats.some((s) => s.activeSpread.p90 !== null)) return null
  return [0, TIME_STEPS.find((step) => step >= slowest) ?? Math.ceil(slowest / 3600) * 3600]
}

/** The words for a way of coming in (Product to confirm; the closed list is API-NEEDS A50); an unknown key is shown as sent. */
const ENTRY_WORDS: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "set-up": "Set up",
  unknown: "Not known",
}
const entryLabel = (key: string) => ENTRY_WORDS[key] ?? key

/** The date windows the page offers. The API takes a start only (`from`; API-NEEDS A48 asks for an end), so each is "from a day until now". */
const journeyRanges = [
  { value: "all", label: "All time", days: null },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
] as const
type JourneyRange = (typeof journeyRanges)[number]["value"]

/** A range's start: local midnight `days` before `today` (the day itself counts), as an ISO instant; null for all time. */
function fromForRange(range: JourneyRange, today: Date): string | null {
  const days = journeyRanges.find((r) => r.value === range)?.days ?? null
  if (days === null) return null
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)
  return start.toISOString()
}

/** A range from a URL value; anything else is the default, the last 7 days. */
const rangeOf = (value: string | null | undefined): JourneyRange => journeyRanges.find((r) => r.value === value)?.value ?? "7d"

export { biggestDrop, entryLabel, fromForRange, isLow, journeyRanges, nextOf, rangeOf, screenStats, stopsMost, timeDomain }
export type { JourneyRange, JourneyEdge, JourneyEntry, JourneyNext, JourneyNextKind, JourneyOption, JourneySpread, JourneyTask, JourneyUsage, ScreenStat }
