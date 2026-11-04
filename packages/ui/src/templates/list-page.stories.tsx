import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { RotateCcw } from "lucide-react"

import { defaultListState, type ListFilter, type ListSegment, type ListState } from "../lib/list-query"
import type { DataTableColumn } from "../components/display/data-table"
import { Badge } from "../components/display/badge"
import { formatMetric } from "../lib/metrics"
import { jobRuns, type JobRun } from "../fixtures/admin"
import { typeKeys } from "../stories/typing"
import { ListPage } from "./list-page"

/* ListPage (R12-10): the list page pattern with something other than people, to show what a page
   supplies (data only: noun, segments, filters, search match, columns, actions) and what the
   template owns (the arrangement, the state rules, selection and the bulk bar, the states).
   Admin › PeoplePage is the People instance in its admin frame. */
const columns: DataTableColumn<JobRun>[] = [
  { id: "pipeline", header: "Pipeline", sortValue: (r) => r.pipeline, cell: (r) => <span className="font-medium text-card-foreground">{r.pipeline}</span> },
  { id: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <Badge tone={r.status === "Failed" ? "attention" : r.status === "Running" ? "info" : "success"}>{r.status}</Badge> },
  { id: "started", header: "Started", sortValue: (r) => r.started, cell: (r) => r.started },
  { id: "rows", header: "Rows", numeric: true, sortValue: (r) => r.rows, cell: (r) => formatMetric(r.rows, { kind: "count" }, { compact: false }) },
]
const segments: ListSegment<JobRun>[] = [
  { id: "all", label: "All runs" },
  { id: "failed", label: "Failed", match: (r) => r.status === "Failed" },
  { id: "running", label: "Running", match: (r) => r.status === "Running" },
  { id: "manual", label: "Started by hand", match: (r) => r.trigger !== "Schedule" },
]
const pipelines = [...new Set(jobRuns.map((r) => r.pipeline))]
const filters: ListFilter<JobRun>[] = [
  { id: "pipeline", label: "Pipeline", multiple: true, options: pipelines.map((p) => ({ value: p.toLowerCase().replace(/\s+/g, "-"), label: p })), match: (r, v) => v.includes(r.pipeline.toLowerCase().replace(/\s+/g, "-")) },
]
const search = { match: (r: JobRun, q: string) => r.pipeline.toLowerCase().includes(q) || r.id.includes(q), label: "Search runs", placeholder: "Search by pipeline or run id" }
const defaultSort = { id: "started", desc: true }

function Runs({ loading, error, rows = jobRuns }: { loading?: boolean; error?: boolean; rows?: JobRun[] }) {
  const [state, setState] = useState<ListState>(() => defaultListState({ segments, defaultSort }))
  const [status, setStatus] = useState<string>()
  const [opened, setOpened] = useState("")
  return (
    <div data-surface="page" className="flex flex-col gap-3 bg-surface-page p-6">
      <ListPage
        today="2026-10-20"
        noun={{ one: "run", other: "runs" }}
        label="Job runs"
        rows={rows}
        getRowId={(r) => r.id}
        rowLabel={(r) => `${r.pipeline} ${r.id}`}
        columns={columns}
        segments={segments}
        filters={filters}
        search={search}
        defaultSort={defaultSort}
        state={state}
        onStateChange={(s) => {
          setStatus(undefined)
          setState(s)
        }}
        pageSize={10}
        onRowClick={(r) => setOpened(r.id)}
        rowActions={(r) => [{ kind: "action", id: "rerun", label: "Run again", icon: <RotateCcw aria-hidden />, disabledReason: r.status === "Running" ? "Still running" : undefined, run: () => setStatus(`${r.pipeline} queued again.`) }]}
        bulkActions={(sel) => [{ kind: "action", id: "rerun", label: "Run again", icon: <RotateCcw aria-hidden />, confirm: { title: `Run ${sel.length} again?`, confirmLabel: "Run again" }, run: () => setStatus(`${sel.length} runs queued again.`) }]}
        status={status}
        loading={loading}
        error={error ? { message: "We couldn’t load the runs.", onRetry: fn() } : undefined}
        emptyMessage="No runs yet. Scheduled jobs show here after their first run."
      />
      <span data-testid="url-state" className="text-xs text-muted-foreground">
        {JSON.stringify({ ...state, q: undefined })}
        {opened && ` · opened ${opened}`}
      </span>
    </div>
  )
}

const meta = {
  component: ListPage,
  // The stories render their own harness; these args only fill the docs table.
  args: { noun: { one: "run", other: "runs" }, label: "Job runs", rows: jobRuns, getRowId: (r: JobRun) => r.id, rowLabel: (r: JobRun) => r.id, columns, segments, search, state: defaultListState({ segments }), onStateChange: fn(), emptyMessage: "", today: "2026-10-20" },
  parameters: { layout: "fullscreen" },
  tags: ["r12-10"],
} satisfies Meta<typeof ListPage<JobRun>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "Filter, find, select (job runs)",
  render: () => <Runs />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const cards = c.getByRole("radiogroup", { name: "Job runs: segments" })
    const total = jobRuns.length
    const failed = jobRuns.filter((r) => r.status === "Failed").length
    await expect(c.getByText(`${total} runs`)).toBeInTheDocument()
    // A card filters the table; its count matches the rows.
    await userEvent.click(within(cards).getByRole("radio", { name: /Failed/ }))
    await expect(c.getByText(`${failed} ${failed === 1 ? "run" : "runs"}`)).toBeInTheDocument()
    await expect(c.getByTestId("url-state")).toHaveTextContent('"segment":"failed"')
    // Counts follow the search.
    await userEvent.click(within(cards).getByRole("radio", { name: /All runs/ }))
    await typeKeys(c.getByRole("searchbox", { name: "Search runs" }), "stripe")
    const stripe = jobRuns.filter((r) => r.pipeline.toLowerCase().includes("stripe"))
    await waitFor(() => expect(within(cards).getByRole("radio", { name: /All runs/ })).toHaveTextContent(String(stripe.length)))
    await expect(within(cards).getByRole("radio", { name: /Failed/ })).toHaveTextContent(String(stripe.filter((r) => r.status === "Failed").length))
    // Selecting rows turns the toolbar into the bulk bar; Clear brings the toolbar back.
    const boxes = c.getAllByRole("checkbox", { name: /^Select (?!all)/ })
    await userEvent.click(boxes[0])
    await userEvent.click(boxes[1])
    await expect(c.getByText("2 runs selected")).toBeInTheDocument()
    await expect(c.queryByRole("searchbox")).toBeNull()
    await userEvent.click(c.getByRole("button", { name: "Clear selection" }))
    await waitFor(() => expect(c.getByRole("searchbox", { name: "Search runs" })).toHaveFocus())
    // A change to what matches clears the selection.
    await userEvent.click(boxes[0])
    await expect(c.getByText("1 run selected")).toBeInTheDocument()
    await userEvent.click(within(cards).getByRole("radio", { name: /Failed/ }))
    await expect(c.queryByText(/selected$/)).toBeNull()
  },
}

export const NoResults: Story = {
  name: "No results (with Clear all)",
  render: () => <Runs />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await typeKeys(c.getByRole("searchbox", { name: "Search runs" }), "zzz")
    await expect(await c.findByText("No runs match “zzz”.")).toBeInTheDocument()
    await userEvent.click(within(c.getByRole("table")).getByRole("button", { name: "Clear all" }))
    await expect(c.getByText(`${jobRuns.length} runs`)).toBeInTheDocument()
  },
}

export const Loading: Story = { render: () => <Runs loading /> }
export const Empty: Story = { name: "Empty (nothing yet)", render: () => <Runs rows={[]} /> }
export const ErrorState: Story = { name: "Error (in place, Retry)", render: () => <Runs error /> }
