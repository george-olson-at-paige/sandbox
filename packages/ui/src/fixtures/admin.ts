import type { AdminMetric } from "../admin/metric-card"
import type { PipelineRun, PipelineRunStep } from "../admin/pipeline-graph"

/* Admin data for the stories and the app's /admin (R8-07…R8-11; one copy, R17-03): month-end and
   per-month series shaped like the admin site's Pulse cards (a 12-month window is 13 month-end
   points for a level metric, 12 monthly counts for a flow), job runs, a pipeline run, and the
   Pulse page's cards built from the same series. Numbers are invented at the scale of the
   customer profile (~2,300 customers). The month-end series are not straight lines (R20-05): a
   January bump (annual plans bought after the holidays), a spring plateau, a June dip (a
   card-expiry wave: subscribers and MRR down, churn and past-due up), then a recovery. Each ends
   where it always ended (2,333 subscribers, $16,349, 3.1%, 21 past due), so the stories'
   year-ago deltas hold. Fixtures only: package code never imports this folder
   (check-layers); it goes when the API serves the data. */

export const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"] as const
export const MONTH_LABELS = ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"] as const

/** Active subscribers at each month end (level): a January bump, flat in March to May, down 46 in June, then up. */
export const activeSubscribers = [1984, 2010, 2041, 2139, 2171, 2188, 2188, 2191, 2145, 2182, 2236, 2297, 2333]
/** Monthly recurring revenue at each month end, in cents (level): follows the subscribers, about $7.00 each, so it plateaus and dips with them. */
export const mrrCents = [1_402_000, 1_418_500, 1_431_000, 1_498_200, 1_521_400, 1_533_900, 1_534_600, 1_541_200, 1_508_100, 1_525_400, 1_568_300, 1_611_700, 1_634_900]
/** Signups per month, the last one still running (flow). */
export const signups = [141, 128, 96, 188, 172, 165, 150, 177, 169, 158, 181, 176, 92]
/** Monthly churn, percent (level, lower is better): lowest in January, flat at 2.4 from March to May, a spike to 3.6 in June. */
export const churnPercent = [2.1, 2.3, 2.0, 1.8, 2.2, 2.4, 2.4, 2.4, 3.6, 2.8, 2.6, 2.9, 3.1]

export type JobRun = { id: string; pipeline: string; status: "Succeeded" | "Failed" | "Running"; started: string; durationSeconds: number | null; trigger: string; rows: number | null }

const PIPELINES = ["Nightly usage report", "Stripe sync", "SendGrid contacts", "Journeys rebuild", "Partner scorecards"]
const TRIGGERS = ["Schedule", "Schedule", "Schedule", "By hand", "Retry"]
export const jobRuns: JobRun[] = Array.from({ length: 63 }, (_, i) => {
  const status = i === 2 ? "Running" : i % 9 === 4 ? "Failed" : "Succeeded"
  const day = 19 - Math.floor(i / 4)
  return {
    id: `run-${1000 - i}`,
    pipeline: PIPELINES[i % PIPELINES.length],
    status,
    started: `2026-10-${String(Math.max(day, 1)).padStart(2, "0")} 0${i % 6}:${String((i * 7) % 60).padStart(2, "0")}`,
    durationSeconds: status === "Running" ? null : 3 + ((i * 37) % 420),
    trigger: TRIGGERS[i % TRIGGERS.length],
    rows: status === "Failed" ? null : 120 + ((i * 1931) % 24000),
  }
})

/* A jobs pipeline run (R9-07), shaped like the pipeline endpoint's run detail
   (Paige.Application/Admin/Jobs, RunPipeline.md). The first three steps are the worker's real
   nightly-usage pipeline with their configured titles; the rest are plausible siblings. The run
   is still going: one step failed (its downstream won't run), one is running, two wait. */

const runAt = (minutes: number) => new Date(Date.UTC(2026, 9, 19, 6, 30) + minutes * 60_000).toISOString()
const pipelineStep = (name: string, title: string, kind: string, dependsOn: string[], status: PipelineRunStep["status"], extra: Partial<PipelineRunStep> = {}): PipelineRunStep => ({
  name,
  title,
  kind,
  queue: "sync",
  dependsOn,
  status,
  attempts: status === "NotStarted" ? 0 : 1,
  jobId: status === "NotStarted" ? null : `job-${name}`,
  ...extra,
})

/** "Now" for the run fixture: 31 minutes after it started. */
export const pipelineNow = Date.parse(runAt(31))

export const pipelineRun: PipelineRun = {
  id: "7f3b9c1e-5a2d-4f60-9b1c-2d8e4a6c0002",
  pipeline: "nightly-usage",
  pipelineTitle: "Nightly usage refresh",
  steps: [
    pipelineStep("stripe-reporting", "Stripe billing", "stripe.reporting", [], "Succeeded", { startedAt: runAt(0), completedAt: runAt(19), durationSeconds: 1140, typicalSeconds: 1180, typicalOf: 14, description: "Reads every Stripe customer, subscription, price and product again (about 20 minutes)." }),
    pipelineStep("plan-prices", "Plan prices", "sql.load", [], "Succeeded", { startedAt: runAt(0), completedAt: runAt(0.1), durationSeconds: 6, typicalSeconds: 6, typicalOf: 14, description: "Copies the plan catalogue: each Stripe price and the wills it grants." }),
    pipelineStep("sendgrid-contacts", "SendGrid contacts", "sendgrid.contacts", [], "Failed", { startedAt: runAt(0), completedAt: runAt(2), durationSeconds: 101, attempts: 3, typicalSeconds: 48, typicalOf: 9, errorMessage: "HttpRequestException: The request was canceled due to the configured HttpClient.Timeout of 100 seconds elapsing.", description: "Exports the contact list and its custom fields to SendGrid." }),
    pipelineStep("user-usage", "Usage report", "sql.load", ["stripe-reporting", "plan-prices"], "Succeeded", { startedAt: runAt(19.1), completedAt: runAt(19.4), durationSeconds: 18, typicalSeconds: 21, typicalOf: 14, description: "Rebuilds the usage report, one row per user, with subscriptions from the Stripe tables." }),
    pipelineStep("subscription-facts", "Subscription facts", "sql.load", ["user-usage"], "Succeeded", { startedAt: runAt(19.4), completedAt: runAt(21), durationSeconds: 94, typicalSeconds: 90, typicalOf: 12 }),
    pipelineStep("journeys-rebuild", "Journeys rebuild", "sql.command", ["user-usage"], "Running", { startedAt: runAt(21), typicalSeconds: 840, typicalOf: 11, description: "Recomputes each customer's journey stage from the usage report." }),
    pipelineStep("partner-scorecards", "Partner scorecards", "sql.load", ["subscription-facts"], "Running", { startedAt: runAt(21), typicalSeconds: 420, typicalOf: 10 }),
    pipelineStep("contact-segments", "Contact segments for the newsletter", "sql.load", ["sendgrid-contacts", "user-usage"], "NotStarted", { typicalSeconds: 35, typicalOf: 9 }),
    pipelineStep("sendgrid-lists", "SendGrid lists", "sendgrid.lists", ["contact-segments"], "NotStarted", { typicalSeconds: 60, typicalOf: 9 }),
    pipelineStep("pulse-snapshot", "Pulse snapshot", "sql.load", ["journeys-rebuild", "partner-scorecards"], "NotStarted", { typicalSeconds: 12, typicalOf: 14 }),
    pipelineStep("usage-email", "Usage report email", "email.send", ["pulse-snapshot"], "NotStarted"),
  ],
}

/* The Pulse page's data (R8-11, R12-08), from the series above. */
const series = (values: readonly number[]) => values.map((value, i) => ({ period: MONTH_LABELS[i + (MONTH_LABELS.length - values.length)], value }))
/** Signups as the flow they are: the 12 monthly counts of the window (the first point is the month before). */
const monthlySignups = signups.slice(1)

export const pulse = {
  metrics: [
    { id: "active", label: "Active subscribers", format: { kind: "count" }, kind: "level", points: series(activeSubscribers), window: "Last 12 months", change: "net", good: "up" },
    { id: "mrr", label: "MRR", format: { kind: "currency" }, kind: "level", points: series(mrrCents), window: "Last 12 months", change: "percent", good: "up" },
    { id: "signups", label: "Signups", format: { kind: "count" }, kind: "flow", points: series(monthlySignups), window: "Last 12 months", change: "percent", good: "up", previousTotal: 1890, partialLast: true },
  ] satisfies AdminMetric[],
  /* R12-08: the second row, five compact cards (stand-ins until people choose their cards). */
  more: [
    { id: "churn", label: "Monthly churn", format: { kind: "percent" }, kind: "level", points: series(churnPercent), window: "Last 12 months", change: "points", good: "down" },
    { id: "trials", label: "Trials started", format: { kind: "count" }, kind: "flow", points: series([64, 51, 88, 79, 74, 70, 82, 77, 71, 85, 80, 41]), window: "Last 12 months", change: "percent", good: "up", previousTotal: 790, partialLast: true },
    { id: "cancellations", label: "Cancellations", format: { kind: "count" }, kind: "flow", points: series([38, 41, 35, 47, 44, 40, 46, 43, 52, 49, 55, 27]), window: "Last 12 months", change: "percent", good: "down", previousTotal: 498, partialLast: true },
    { id: "past-due", label: "Past due", format: { kind: "count" }, kind: "level", points: series([31, 29, 34, 26, 28, 30, 30, 30, 44, 35, 27, 23, 21]), window: "Last 12 months", change: "net", good: "down" },
    { id: "failed-runs", label: "Failed job runs", format: { kind: "count" }, kind: "flow", points: series([9, 7, 12, 6, 5, 8, 4, 6, 3, 5, 4, 2]), window: "Last 12 months", change: "net", good: "down", previousTotal: 96, partialLast: true },
  ] satisfies AdminMetric[],
  growth: MONTH_LABELS.slice(1).map((month, i) => {
    const member = Math.round(monthlySignups[i] * 0.62)
    return { month: month.slice(0, 3), member, partner: monthlySignups[i] - member }
  }),
  runs: jobRuns.slice(0, 40),
}
export type Pulse = typeof pulse
