import type { ComponentProps } from "react"
import { cn } from "../lib/utils"
import { StatusMark, type WorkStatus } from "../components/display/status-mark"
import { STATUS_LABEL, STATUS_ORDER, type DagStatus } from "./internal/dag-shape"

/* @archetype Chart (ARCHETYPES.md).
   Graph status (R9-06, R10-12): what a graph node's six states look like and the legend that
   names them, in a module without React Flow, so a page (PipelineGraph's details panel, a runs
   table) can show them without loading the graph library. The mark is StatusMark
   (components/display), the same one the Vault's StatusDot draws: queued is its `waiting`,
   running `working`, succeeded `done`, failed `attention`, skipped and canceled their own.
   en-US spelling, "Canceled" (R5-01). */

/** The StatusMark a graph status draws. */
const DAG_MARK: Record<DagStatus, WorkStatus> = {
  queued: "waiting",
  running: "working",
  succeeded: "done",
  failed: "attention",
  skipped: "skipped",
  canceled: "canceled",
}
const dagMark = (status: DagStatus): WorkStatus => DAG_MARK[status]

/** What a DAG's status marks mean: the six tones in a row, each with its name. */
function DagLegend({ className }: { className?: string }) {
  return (
    <ul aria-label="Status key" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground", className)}>
      {STATUS_ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StatusMark status={dagMark(s)} size="sm" />
          {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  )
}

/** The on-screen name of a status ("Succeeded", "Canceled"). */
const dagStatusLabel = (status: DagStatus) => STATUS_LABEL[status]

export { DagLegend, dagMark, dagStatusLabel }
export type { DagStatus }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type DagLegendProps = ComponentProps<typeof DagLegend>
