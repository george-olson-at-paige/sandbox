// @public-entry-points-only — check:exports (PROOF) fails on any relative or non-entry import here.
import { useState, type ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { MetricCard } from "@paige/ui/admin/metric-card"
import { PipelineGraph } from "@paige/ui/admin/pipeline-graph"
import { LazyChart } from "@paige/ui/charts/lazy-chart"
import { Badge } from "@paige/ui/components/display/badge"
import { Card } from "@paige/ui/components/display/card"
import { DataTable, type DataTableColumn } from "@paige/ui/components/display/data-table"
import { pipelineNow, pipelineRun, pulse, type JobRun } from "@paige/ui/fixtures/admin"
import { formatMetric } from "@paige/ui/lib/metrics"
import { KpiRow } from "@paige/ui/patterns/kpi-row"
import { AccountMenu } from "@paige/ui/shell/account-menu"
import { AdminPage } from "@paige/ui/templates/admin-page"

/* R8-11 · Pulse, the admin home (named for its screen, R17-22; it was AdminProof): the admin
   readiness proof. One admin page composed the way an app route would compose it: only public
   entry points (`@paige/ui/…`, the exports map), no relative imports, no story helpers; its data
   is the app's (`@paige/ui/fixtures/admin`, R17-03), so the two show the same numbers. AdminPage (its sidebar is its own, R12-09), the admin home's two KPI rows (R12-08: three
   `lg` MetricCards, then five `compact` ones under one window caption; number + sparkline + one
   delta, one window), a LazyChart (Recharts loads when it renders), the run graph and a
   DataTable. Which cards a person sees is chosen later (R12-08, noted, not built); the second
   row's metrics are stand-ins at the customer profile's scale. The same page is the
   app's /admin route (apps/web/app/admin/page.tsx), which is how the bundle check runs.
   Verdict and evidence: ORGANIZATION.md § Admin readiness (R8-11). */

const COLUMNS: DataTableColumn<JobRun>[] = [
  { id: "pipeline", header: "Pipeline", cell: (r) => <span className="font-medium text-card-foreground">{r.pipeline}</span>, sortValue: (r) => r.pipeline },
  { id: "status", header: "Status", cell: (r) => <Badge tone={r.status === "Failed" ? "attention" : r.status === "Running" ? "info" : "success"}>{r.status}</Badge>, sortValue: (r) => r.status },
  { id: "started", header: "Started", cell: (r) => r.started, sortValue: (r) => r.started },
  { id: "duration", header: "Duration", numeric: true, cell: (r) => (r.durationSeconds === null ? "—" : `${r.durationSeconds}s`), sortValue: (r) => r.durationSeconds },
  { id: "rows", header: "Rows", numeric: true, cell: (r) => formatMetric(r.rows, { kind: "count" }, { compact: false }), sortValue: (r) => r.rows },
]

function StubLink({ href, children, ...props }: { href: string; children?: ReactNode; className?: string }) {
  return (
    <a href={href} {...props} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  )
}

function Pulse({ loading = false }: { loading?: boolean }) {
  // The app keeps the step in the URL (?step=…); the story keeps it in state.
  const [step, setStep] = useState<string | null>(null)
  return (
    <AdminPage
      current="pulse"
      navBadges={{ jobs: "4" }}
      linkAs={StubLink}
      title="Pulse"
      description="Subscribers, revenue and signups over the last 12 months."
      globalActions={
        <AccountMenu name="George Olson" email="george@example.com" items={[{ label: "Sign out", href: "#sign-out" }]} linkAs={StubLink} />
      }
    >
      {/* R12-08: the admin home's two KPI rows. */}
      <KpiRow columns={3} label="Headline numbers">
        {pulse.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} size="lg" loading={loading} />
        ))}
      </KpiRow>
      <KpiRow columns={5} label="More numbers" caption="Last 12 months">
        {pulse.more.map((m) => (
          <MetricCard key={m.id} metric={m} size="compact" loading={loading} />
        ))}
      </KpiRow>
      <Card className="gap-4 px-5 py-5">
        <h2 className="text-base font-semibold text-foreground-strong">New subscribers per month</h2>
        <LazyChart
          kind="bar"
          stacked
          loading={loading}
          data={pulse.growth}
          x="month"
          series={[{ key: "member", label: "Member-billed" }, { key: "partner", label: "Partner-billed" }]}
          format={{ kind: "count" }}
          label="New subscribers per month by who is billed, last 12 months"
        />
      </Card>
      {/* R10-01 / R10-09: the graph's and the table's titles are their own headers, in line with their controls. */}
      <PipelineGraph
        run={pipelineRun}
        title="Nightly usage refresh: this morning’s run"
        now={pipelineNow}
        loading={loading}
        selectedStep={step}
        onSelectStep={setStep}
        linkAs={StubLink}
        logsHref={(s) => (s.jobId ? `/admin/jobs/${s.jobId}/logs` : undefined)}
      />
      <DataTable rows={pulse.runs} columns={COLUMNS} getRowId={(r) => r.id} label="Recent job runs" title="Recent job runs" loading={loading} initialSort={{ id: "started", desc: true }} pageSize={10} maxHeight="md" />
    </AdminPage>
  )
}

const meta = {
  component: AdminPage,
  parameters: { layout: "fullscreen" },
  // The viewport's height (R12-09): the fixed sidebar, footer included, sits inside the frame.
  decorators: [(S) => <div data-slot="proof-frame" className="relative h-screen overflow-auto transform-gpu"><S /></div>],
  tags: ["r8-11", "!autodocs", "r12-08"],
} satisfies Meta<typeof AdminPage>

export default meta
type Story = StoryObj

export const Default: Story = {
  name: "The admin home",
  render: () => <Pulse />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("heading", { level: 1, name: "Pulse" })).toBeInTheDocument()
    await expect(within(c.getByRole("navigation", { name: "Admin" })).getByRole("link", { name: "Pulse" })).toHaveAttribute("aria-current", "page")
    // R12-08: three lg cards, then five compact ones; each one number + one delta + one sparkline.
    const headline = c.getByRole("region", { name: "Headline numbers" })
    const more = c.getByRole("region", { name: "More numbers" })
    await expect(within(headline).getAllByRole("group")).toHaveLength(3)
    await expect(within(more).getAllByRole("group")).toHaveLength(5)
    await expect(headline.querySelectorAll('[data-slot="kpi-card"][data-size="lg"]')).toHaveLength(3)
    await expect(more.querySelectorAll('[data-slot="kpi-card"][data-size="compact"]')).toHaveLength(5)
    await expect(c.getAllByRole("img", { name: /Last 12 months/ })).toHaveLength(8)
    // R12-09: the admin nav's footer Collapse is on screen, inside the frame.
    const frame = canvasElement.querySelector<HTMLElement>('[data-slot="proof-frame"]')!.getBoundingClientRect()
    const collapse = c.getByRole("button", { name: "Collapse" }).getBoundingClientRect()
    await expect(collapse.height > 0 && collapse.bottom <= frame.bottom).toBe(true)
    // The run graph and the chart arrive lazily.
    await waitFor(() => expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(11))
    await waitFor(() => expect(c.getByRole("table", { name: /New subscribers per month/ })).toBeInTheDocument())
    await userEvent.click(c.getByRole("button", { name: /Duration/ }))
    await expect(c.getByRole("columnheader", { name: /Duration/ })).toHaveAttribute("aria-sort", "descending")
    // The graph and the table carry their own titles (R10-01, R10-09).
    await expect(c.getByRole("heading", { level: 2, name: "Nightly usage refresh: this morning’s run" })).toBeInTheDocument()
    await expect(c.getByRole("heading", { level: 2, name: "Recent job runs" })).toBeInTheDocument()
  },
}

export const Loading: Story = { name: "Loading (every card and the chart)", render: () => <Pulse loading /> }

export const At1024: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1024" } }, render: () => <Pulse /> }

/* R12-08: the two rows where they're designed: 1280 (row 2 five across from xl) and 1440. */
const rowsCheck = async (canvasElement: HTMLElement) => {
  const tops = (name: string) =>
    [...within(canvasElement).getByRole("region", { name }).querySelectorAll<HTMLElement>('[data-slot="kpi-card"]')].map((el) => Math.round(el.getBoundingClientRect().top))
  // One line each: three across, then five across.
  await expect(new Set(tops("Headline numbers")).size).toBe(1)
  await expect(new Set(tops("More numbers")).size).toBe(1)
}
export const At1280: Story = { name: "At 1280: two KPI rows", tags: ["!autodocs"], globals: { viewport: { value: "w1280" } }, render: () => <Pulse />, play: async ({ canvasElement }) => rowsCheck(canvasElement) }
export const At1440: Story = { name: "At 1440: two KPI rows", tags: ["!autodocs"], globals: { viewport: { value: "w1440" } }, render: () => <Pulse />, play: async ({ canvasElement }) => rowsCheck(canvasElement) }
