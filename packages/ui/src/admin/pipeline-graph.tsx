"use client"

import type { ComponentProps } from "react"
import { formatCount } from "../lib/format"
import type { ElementType, ReactNode } from "react"

import { StatusMark } from "../components/display/status-mark"
import { dagMark, type DagStatus } from "../charts/dag-status"
import { LazyDagFrame, type DagLayout, type DagNode } from "../charts/lazy-dag-frame"

/* @archetype Chart (ARCHETYPES.md).
   PipelineGraph (R9-07): one jobs pipeline run as a graph, on DagFrame (charts/, loaded
   lazily). The data is the pipeline endpoints' run detail (Paige.Application/Admin/Jobs,
   RunPipeline.md; the Vue admin's features/admin-jobs/types.ts is the same shape): steps with
   their dependencies, status, attempts, times, the median of past runs, the error. The Vue
   admin's PipelineGraph/StepNode/Legend/RunView were the needs list, not the design.
   Mapping onto the graph's six tones: NotStarted, Queued and Waiting are queued (each keeps its
   own words); Canceled is canceled; a step that hasn't started while a step it depends on has
   failed is shown skipped, "Won't run": dependsOn names the steps that must succeed before a
   step starts (the contract), so it can't. A running step shows its elapsed time and the usual
   time left when `now` ticks (the page owns the clock).
   The details panel: status, started, finished, duration, the usual duration, attempts, kind,
   queue, what it depends on, the description, the error, and a logs link (`logsHref`; the
   route is the page's). Inputs and outputs (R10-11, GAPS #112) show when the step has them:
   the run contract doesn't carry them yet (an API addition for stream B,
   CONTRACTS.md), so until then they're absent, never an empty section. Selection is controlled
   (`selectedStep`), so the page keeps it in the URL (/admin?step=…). The title is the frame's
   heading (R10-01): the page doesn't add its own above it. */

/** A step's job state on a run, as the endpoint sends it. */
type PipelineStepStatus = "NotStarted" | "Queued" | "Waiting" | "Running" | "Succeeded" | "Failed" | "Canceled" | "Skipped"

/** One named value a step took in or produced ("Rows read": 12840, "Template": "usage-v2"). */
type PipelineStepValue = { name: string; value: string | number | boolean | null }

/** One step of a run (the endpoint's PipelineStep). Times are ISO 8601 UTC. */
type PipelineRunStep = {
  name: string
  title?: string | null
  kind: string
  description?: string | null
  queue: string
  dependsOn: string[]
  status: PipelineStepStatus
  jobId?: string | null
  attempts: number
  startedAt?: string | null
  completedAt?: string | null
  durationSeconds?: number | null
  errorMessage?: string | null
  /** The median of this step's past successful runs, in seconds. */
  typicalSeconds?: number | null
  typicalOf?: number | null
  /** What the step took in (R10-11). Not in the run contract yet: absent until the API sends it. */
  inputs?: PipelineStepValue[] | null
  /** What the step produced (R10-11). Not in the run contract yet: absent until the API sends it. */
  outputs?: PipelineStepValue[] | null
}

/** A run with every step of its pipeline (the endpoint's PipelineRunDetail, flattened). */
type PipelineRun = {
  id: string
  pipeline: string
  pipelineTitle?: string | null
  steps: PipelineRunStep[]
}

const TONE: Record<PipelineStepStatus, DagStatus> = {
  NotStarted: "queued",
  Queued: "queued",
  Waiting: "queued",
  Running: "running",
  Succeeded: "succeeded",
  Failed: "failed",
  Canceled: "canceled",
  Skipped: "skipped",
}
const WORDS: Record<PipelineStepStatus, string> = {
  NotStarted: "Not started",
  Queued: "Queued",
  Waiting: "Waiting",
  Running: "Running",
  Succeeded: "Succeeded",
  Failed: "Failed",
  Canceled: "Canceled",
  Skipped: "Skipped",
}

/** `45s`, `3m 12s`, `1h 05m`. */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  if (total < 3600) return `${minutes}m ${String(total % 60).padStart(2, "0")}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
}
// Pinned to UTC and said so (R17-05): the server renders in UTC and a browser in local time, so an
// unpinned time differed between the two for a step opened from the URL.
const WHEN = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "UTC", timeZoneName: "short" })
const formatWhen = (iso?: string | null) => (iso ? WHEN.format(new Date(iso)) : "—")
const elapsed = (step: PipelineRunStep, now?: number) => (step.startedAt && now != null ? Math.max(0, (now - Date.parse(step.startedAt)) / 1000) : null)

type StepNode = DagNode & { step: PipelineRunStep; blockedBy?: string }

function toNodes(run: PipelineRun, now?: number): StepNode[] {
  const byName = new Map(run.steps.map((s) => [s.name, s]))
  const titleOf = (name: string) => byName.get(name)?.title || name
  /** The failed step upstream of `s`, if any (so `s` can't run). */
  const failedAbove = (s: PipelineRunStep, seen = new Set<string>()): string | undefined => {
    for (const d of s.dependsOn) {
      if (seen.has(d)) continue
      seen.add(d)
      const dep = byName.get(d)
      if (!dep) continue
      if (dep.status === "Failed") return d
      const above = failedAbove(dep, seen)
      if (above) return above
    }
    return undefined
  }
  return run.steps.map((s) => {
    const blockedBy = s.status === "NotStarted" ? failedAbove(s) : undefined
    const running = s.status === "Running" ? elapsed(s, now) : null
    const left = running != null && s.typicalSeconds != null ? s.typicalSeconds - running : null
    const duration =
      running != null
        ? [formatDuration(running), left != null ? (left > 0 ? `~${formatDuration(left)} left` : "longer than usual") : null].filter(Boolean).join(" · ")
        : s.durationSeconds != null
          ? [formatDuration(s.durationSeconds), s.attempts > 1 ? `attempt ${s.attempts}` : null].filter(Boolean).join(" · ")
          : undefined
    return {
      id: s.name,
      label: s.title || s.name,
      status: blockedBy ? "skipped" : TONE[s.status],
      statusText: blockedBy ? "Won't run" : WORDS[s.status],
      dependsOn: s.dependsOn,
      duration,
      step: s,
      blockedBy: blockedBy ? titleOf(blockedBy) : undefined,
    }
  })
}

const formatValue = (v: PipelineStepValue["value"]) => (v === null ? "—" : typeof v === "number" ? formatCount(v) : typeof v === "boolean" ? (v ? "Yes" : "No") : v)

/** Inputs or outputs as a titled list; nothing at all when the step has none. */
function Values({ title, values }: { title: string; values?: PipelineStepValue[] | null }) {
  if (!values?.length) return null
  return (
    <section className="flex flex-col gap-2">
      {/* todo: Component */}
      <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
        {values.map((v) => (
          <Row key={v.name} term={v.name}>
            <span className="tabular-nums">{formatValue(v.value)}</span>
          </Row>
        ))}
      </dl>
    </section>
  )
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="col-span-2 min-w-0 break-words text-card-foreground">{children}</dd>
    </>
  )
}

/** One pipeline run as a graph: steps, their status and timing, and a details panel with the error and a logs link. */
function PipelineGraph({
  run,
  selectedStep,
  onSelectStep,
  logsHref,
  linkAs: Link = "a",
  now,
  loading,
  error,
  height,
  defaultView,
  title,
  layout,
}: {
  /** The run detail from the pipeline endpoint. */
  run: PipelineRun
  /** The step whose details are open (from the URL). */
  selectedStep?: string | null
  /** Called with a step name, or null when the details close: write it to the URL. */
  onSelectStep?: (step: string | null) => void
  /** Where a step's logs are; no link when it returns undefined (a step with no job yet). */
  logsHref?: (step: PipelineRunStep, run: PipelineRun) => string | undefined
  /** The app's router link (next/link). Default a plain <a>. */
  linkAs?: ElementType
  /** The ticking clock (ms) while the run goes, for a running step's elapsed time and time left. */
  now?: number
  /** The run is loading. */
  loading?: boolean
  /** The run couldn't be loaded. */
  error?: { message: string; onRetry?: () => void }
  /** auto (default): the run's proportions (R12-07) · md 448 · lg 640. */
  height?: "auto" | "md" | "lg"
  /** Open on the list instead of the graph. */
  defaultView?: "graph" | "list"
  /** The frame's heading. Default the pipeline's title and the run's short id. */
  title?: string
  /** right (default) · down · down-alternating. */
  layout?: DagLayout
}) {
  const nodes = toNodes(run, now)
  const titleOf = (name: string) => run.steps.find((s) => s.name === name)?.title || name
  return (
    <LazyDagFrame<StepNode>
      nodes={nodes}
      label={`${run.pipelineTitle || run.pipeline}, run ${run.id.slice(0, 8)}`}
      title={title}
      layout={layout}
      selectedId={selectedStep}
      onSelect={onSelectStep}
      loading={loading}
      error={error}
      height={height}
      defaultView={defaultView}
      renderDetails={(node) => {
        const s = node.step
        const logs = logsHref?.(s, run)
        return (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <Row term="Status">
                <span className="inline-flex items-center gap-2">
                  <StatusMark status={dagMark(node.status)} size="sm" />
                  {node.blockedBy ? `Won't run: ${node.blockedBy} failed` : node.statusText}
                </span>
              </Row>
              <Row term="Started">{formatWhen(s.startedAt)}</Row>
              <Row term="Finished">{formatWhen(s.completedAt)}</Row>
              <Row term="Duration">{node.duration ?? "—"}</Row>
              <Row term="Usually">{s.typicalSeconds != null ? `${formatDuration(s.typicalSeconds)}${s.typicalOf ? ` (median of ${s.typicalOf} runs)` : ""}` : "No history yet"}</Row>
              <Row term="Attempts">{s.attempts}</Row>
              <Row term="Kind">
                <code className="text-xs">{s.kind}</code>
              </Row>
              <Row term="Queue">{s.queue}</Row>
              <Row term="Depends on">{s.dependsOn.length ? s.dependsOn.map(titleOf).join(", ") : "Nothing"}</Row>
            </dl>
            {s.description && <p className="text-sm font-medium text-body-muted">{s.description}</p>}
            <Values title="Inputs" values={s.inputs} />
            <Values title="Outputs" values={s.outputs} />
            {s.errorMessage && (
              <div className="rounded-md border border-attention-border bg-attention-subtle px-3 py-2 text-sm text-attention-foreground">
                <p className="font-semibold">What it said</p>
                <p className="mt-1 break-words">{s.errorMessage}</p>
              </div>
            )}
            {logs && (
              <Link href={logs} className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-ring">
                Open the logs
              </Link>
            )}
          </div>
        )
      }}
    />
  )
}

export { PipelineGraph }
export type { PipelineRun, PipelineRunStep, PipelineStepStatus, PipelineStepValue }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PipelineGraphProps = ComponentProps<typeof PipelineGraph>
