"use client"


import { MetricCard } from "@paige/ui/admin/metric-card"
import { LazyChart } from "@paige/ui/charts/lazy-chart"
import { Badge } from "@paige/ui/components/display/badge"
import { Card } from "@paige/ui/components/display/card"
import { DataTable, type DataTableColumn } from "@paige/ui/components/display/data-table"
import { formatMetric } from "@paige/ui/lib/metrics"
import { KpiRow } from "@paige/ui/patterns/kpi-row"

import { pipelineNow, pipelineRun, type JobRun, type Pulse } from "@paige/ui/fixtures/admin"
import { AdminScreen } from "./admin-screen"
import { PipelineRunSection } from "./pipeline-run-section"

/* The admin Pulse page (R8-11): template + admin nav + MetricCards + LazyChart + DataTable,
   from public entry points only. Desktop-first. R9-07: plus this morning's pipeline run as a
   graph (PipelineGraph on the lazy DagFrame), its selected step in the URL. R10-01/R10-09: the
   graph and the table carry their own titles, in line with their controls. R12-08: the admin
   home's two KPI rows (three lg cards, five compact under one window caption). R12-09: AdminPage
   renders the admin sidebar itself (`current`). */
const COLUMNS: DataTableColumn<JobRun>[] = [
  { id: "pipeline", header: "Pipeline", cell: (r) => <span className="font-medium text-card-foreground">{r.pipeline}</span>, sortValue: (r) => r.pipeline },
  { id: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Failed" ? "attention" : r.status === "Running" ? "info" : "success"}>{r.status}</Badge>, sortValue: (r) => r.status },
  { id: "started", header: "Started", cell: (r) => r.started, sortValue: (r) => r.started },
  { id: "duration", header: "Duration", numeric: true, cell: (r) => (r.durationSeconds === null ? "—" : `${r.durationSeconds}s`), sortValue: (r) => r.durationSeconds },
  { id: "rows", header: "Rows", numeric: true, cell: (r) => formatMetric(r.rows, { kind: "count" }, { compact: false }), sortValue: (r) => r.rows },
]

export function PulseScreen({ pulse }: { pulse: Pulse }) {
  return (
    <AdminScreen
      current="pulse"
      title="Pulse"
      description="Subscribers, revenue and signups over the last 12 months."
    >
      <KpiRow columns={3} label="Headline numbers">
        {pulse.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} size="lg" />
        ))}
      </KpiRow>
      <KpiRow columns={5} label="More numbers" caption="Last 12 months">
        {pulse.more.map((m) => (
          <MetricCard key={m.id} metric={m} size="compact" />
        ))}
      </KpiRow>
      <Card className="gap-4 px-5 py-5">
        <h2 className="text-base font-semibold text-foreground-strong">New subscribers per month</h2>
        <LazyChart
          kind="bar"
          stacked
          data={pulse.growth}
          x="month"
          series={[{ key: "member", label: "Member-billed" }, { key: "partner", label: "Partner-billed" }]}
          format={{ kind: "count" }}
          label="New subscribers per month by who is billed, last 12 months"
        />
      </Card>
      <PipelineRunSection run={pipelineRun} now={pipelineNow} />
      {/* R10-09: the table's title sits in its toolbar row, in line with the Columns menu. */}
      <DataTable rows={pulse.runs} columns={COLUMNS} getRowId={(r) => r.id} label="Recent job runs" title="Recent job runs" initialSort={{ id: "started", desc: true }} pageSize={10} maxHeight="md" />
    </AdminScreen>
  )
}
