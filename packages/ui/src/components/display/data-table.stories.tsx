import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { RotateCw } from "lucide-react"

import { formatMetric } from "../../lib/metrics"
import { jobRuns, type JobRun } from "../../fixtures/admin"
import { Button } from "../actions/button"
import { RowActions } from "../actions/row-actions"
import { Badge } from "./badge"
import { DataTable, type DataTableColumn } from "./data-table"

/* DataTable (R8-10): sortable columns, numeric columns right-aligned, a sticky header, a Columns
   menu, pagination, and loading, empty and error states. */
const columns: DataTableColumn<JobRun>[] = [
  { id: "pipeline", header: "Pipeline", cell: (r) => <span className="font-medium text-card-foreground">{r.pipeline}</span>, sortValue: (r) => r.pipeline },
  {
    id: "status",
    header: "Status",
    cell: (r) => <Badge tone={r.status === "Failed" ? "attention" : r.status === "Running" ? "info" : "success"}>{r.status}</Badge>,
    sortValue: (r) => r.status,
  },
  { id: "started", header: "Started", cell: (r) => r.started, sortValue: (r) => r.started },
  { id: "duration", header: "Duration", numeric: true, cell: (r) => (r.durationSeconds === null ? "—" : `${r.durationSeconds}s`), sortValue: (r) => r.durationSeconds },
  { id: "rows", header: "Rows", numeric: true, cell: (r) => formatMetric(r.rows, { kind: "count" }, { compact: false }), sortValue: (r) => r.rows },
  { id: "trigger", header: "How it started", cell: (r) => r.trigger, defaultHidden: true },
]

const meta = {
  // Instantiated, so a story's own `columns` are typed against JobRun, not the constraint.
  component: DataTable as typeof DataTable<JobRun>,
  args: { rows: jobRuns, columns, getRowId: (r: JobRun) => r.id, label: "Job runs", initialSort: { id: "started", desc: true } },
  tags: ["r8-10", "r12-10"],
} satisfies Meta<typeof DataTable<JobRun>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    // 63 runs, 25 a page.
    await expect(c.getByText("1–25 of 63")).toBeInTheDocument()
    await expect(within(table).getAllByRole("row")).toHaveLength(26)
    // Numeric headers and cells are right-aligned.
    await expect(within(table).getByRole("columnheader", { name: /Duration/ })).toHaveClass("text-right")
    // Sorting: Duration ascending, then descending.
    const duration = within(table).getByRole("button", { name: /Duration/ })
    await userEvent.click(duration)
    await expect(within(table).getByRole("columnheader", { name: /Duration/ })).toHaveAttribute("aria-sort", "descending")
    await userEvent.click(c.getByRole("button", { name: "Next page" }))
    await expect(c.getByText("26–50 of 63")).toBeInTheDocument()
  },
}

/* R20-24: one Recipe instead of a story per combination. Its controls are the capability
   switches on one fixture; the code block under it is written from the switches (not from the
   render), so what a reader flips is what they copy. The capability stories further down are the
   same fixture with one switch on and a play each; the states (loading, empty, error, phone)
   are stories of their own because no switch shows them. */
type RecipeArgs = {
  /** Typed columns (`type` + `value`) in place of hand-written cells. */
  typed: boolean
  resizable: boolean
  reorderable: boolean
  /** Pipeline pinned at the start, "How it started" at the end. */
  pinned: boolean
  density: "default" | "compact"
  /** A detail panel under each row. */
  expandable: boolean
  /** A checkbox column. */
  selectable: boolean
  /** A ⋯ menu at the end of each row. */
  rowActions: boolean
  pageSize: 10 | 25 | "all"
  maxHeight: "none" | "md" | "lg"
  /** Only the rows in view in the DOM (needs a scrolling box). */
  virtualize: boolean
  /** 2,000 rows instead of 63. */
  manyRows: boolean
}

/** Many rows (2,000, one page), only the ones in view in the DOM. */
const manyRuns: JobRun[] = Array.from({ length: 2000 }, (_, i) => ({ ...jobRuns[i % jobRuns.length]!, id: `run-${i + 1}` }))

const pinColumns = (cols: DataTableColumn<JobRun>[]): DataTableColumn<JobRun>[] =>
  cols.map((c) => (c.id === "pipeline" ? { ...c, pin: "start" } : c.id === "trigger" ? { ...c, pin: "end" } : c))

function RecipeTable(a: RecipeArgs) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const base = a.typed ? typedColumns : columns
  return (
    <DataTable
      rows={a.manyRows ? manyRuns : jobRuns}
      columns={a.pinned ? pinColumns(base) : base}
      getRowId={(r) => r.id}
      label="Job runs"
      initialSort={{ id: "started", desc: true }}
      resizable={a.resizable}
      reorderable={a.reorderable}
      density={a.density}
      expandable={a.expandable ? runDetail : undefined}
      selection={a.selectable ? { selected, onSelectedChange: setSelected, rowLabel: (r) => `${r.pipeline} ${r.id}` } : undefined}
      rowActions={a.rowActions ? (r) => <RowActions label={`Actions for ${r.pipeline} ${r.id}`} actions={[{ kind: "action", id: "rerun", label: "Run again", icon: <RotateCw aria-hidden />, run: () => {} }]} /> : undefined}
      pageSize={a.pageSize}
      maxHeight={a.maxHeight}
      virtualize={a.virtualize}
    />
  )
}

/** The code a reader copies for the switches as set: the props that differ from the defaults, nothing else. */
function recipeCode(a: RecipeArgs) {
  const lines = [
    "<DataTable",
    `  rows={${a.manyRows ? "runs /* 2,000 */" : "runs"}}`,
    `  columns={${a.typed ? "typedColumns" : "columns"}}${a.pinned ? ' // with pin: "start" on Pipeline and pin: "end" on How it started' : ""}`,
    "  getRowId={(r) => r.id}",
    '  label="Job runs"',
    '  initialSort={{ id: "started", desc: true }}',
  ]
  if (a.resizable) lines.push("  resizable")
  if (a.reorderable) lines.push("  reorderable")
  if (a.density !== "default") lines.push(`  density="${a.density}"`)
  if (a.expandable) lines.push("  expandable={{ rowLabel: (r) => `${r.pipeline} ${r.id}`, content: (r) => <RunDetail run={r} /> }}")
  if (a.selectable) lines.push("  selection={{ selected, onSelectedChange: setSelected, rowLabel: (r) => `${r.pipeline} ${r.id}` }}")
  if (a.rowActions) lines.push("  rowActions={(r) => <RowActions label={`Actions for ${r.pipeline} ${r.id}`} actions={runActions(r)} />}")
  if (a.pageSize !== 25) lines.push(`  pageSize=${a.pageSize === "all" ? '"all"' : `{${a.pageSize}}`}`)
  if (a.maxHeight !== "lg") lines.push(`  maxHeight="${a.maxHeight}"`)
  if (a.virtualize) lines.push("  virtualize")
  lines.push("/>")
  return lines.join("\n")
}

const switchArg = (description: string) => ({ control: "boolean" as const, description, table: { type: { summary: "boolean" } } })

/** Flip the switches; the code block follows. Typed columns and resizing on, as an admin list is (R20-25). */
export const Recipe: StoryObj<RecipeArgs> = {
  tags: ["r20-24"],
  render: (a) => <RecipeTable {...a} />,
  args: { typed: true, resizable: true, reorderable: false, pinned: false, density: "default", expandable: false, selectable: false, rowActions: false, pageSize: 10, maxHeight: "none", virtualize: false, manyRows: false },
  // Spelled out: a switch that shares a name with a DataTable prop (`expandable`, `rowActions`)
  // would otherwise take the prop's docgen type and an object control.
  argTypes: {
    typed: switchArg("Typed columns (`type` + `value`) in place of hand-written cells."),
    resizable: switchArg("Drag a header's edge, or arrows on it."),
    reorderable: switchArg("A grip in each header; drag, or Space · arrows · Space."),
    pinned: switchArg('Pipeline `pin: "start"`, How it started `pin: "end"`.'),
    density: { control: "inline-radio", options: ["default", "compact"], description: "Row height; the header keeps its own.", table: { type: { summary: '"default" | "compact"' } } },
    expandable: switchArg("A detail panel under each row."),
    selectable: switchArg("A checkbox column (the page; mixed when some)."),
    rowActions: switchArg("A ⋯ menu at the end of each row."),
    pageSize: { control: "inline-radio", options: [10, 25, "all"], description: '"all" is one page of everything.', table: { type: { summary: '10 | 25 | "all"' } } },
    maxHeight: { control: "inline-radio", options: ["none", "md", "lg"], description: "The scroll box; none grows with the rows.", table: { type: { summary: '"none" | "md" | "lg"' } } },
    virtualize: switchArg("Only the rows in view in the DOM (needs a scroll box)."),
    manyRows: switchArg("2,000 rows instead of 63."),
  },
  parameters: {
    controls: { include: ["typed", "resizable", "reorderable", "pinned", "density", "expandable", "selectable", "rowActions", "pageSize", "maxHeight", "virtualize", "manyRows"], sort: "none" },
    docs: { source: { language: "tsx", transform: (_code: string, ctx: { args: unknown }) => recipeCode(ctx.args as RecipeArgs) } },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    // The defaults: typed cells, resize handles, no grips.
    await expect(canvasElement.querySelectorAll('[data-slot="formatted"]').length).toBeGreaterThan(0)
    await expect(within(table).getAllByRole("separator", { name: /^Resize/ }).length).toBeGreaterThan(0)
    await expect(within(table).queryByRole("button", { name: /to reorder$/ })).not.toBeInTheDocument()
    await expect(recipeCode({ typed: true, resizable: true, reorderable: false, pinned: false, density: "default", expandable: false, selectable: false, rowActions: false, pageSize: 10, maxHeight: "none", virtualize: false, manyRows: false }).split("\n")).toHaveLength(10)
  },
}

/** Header: title, description and actions in the toolbar row. */
export const WithHeader: Story = {
  name: "Header · title and actions",
  tags: ["r10-09"],
  args: {
    title: "Recent job runs",
    description: "Every scheduled and manual run, newest first.",
    actions: <Button variant="secondary" size="sm">Export</Button>,
    pageSize: 10,
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const heading = c.getByRole("heading", { level: 2, name: "Recent job runs" })
    const columns = c.getByRole("button", { name: "Columns" })
    const exportButton = c.getByRole("button", { name: "Export" })
    // One row: the title, the actions and the Columns menu share the toolbar.
    const row = canvasElement.querySelector('[data-slot="data-table-toolbar"]')!
    await expect(row).toContainElement(heading)
    await expect(row).toContainElement(columns)
    await expect(row).toContainElement(exportButton)
    // On one line: the title and the buttons share a centre line (within a pixel).
    const mid = (el: Element) => {
      const r = el.getBoundingClientRect()
      return (r.top + r.bottom) / 2
    }
    await expect(Math.abs(mid(heading) - mid(exportButton))).toBeLessThan(1.5)
    await expect(Math.abs(mid(exportButton) - mid(columns))).toBeLessThan(1.5)
  },
}

export const Short: Story = { name: "One page (no pagination, no scroll box)", args: { rows: jobRuns.slice(0, 6), maxHeight: "none" } }

export const StickyHeader: Story = {
  name: "Sticky header (scrolls under it)",
  tags: ["r13-12"],
  args: { maxHeight: "md", pageSize: 50 },
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>("table")!.parentElement!
    const head = canvasElement.querySelector<HTMLElement>("thead tr")!
    const th = canvasElement.querySelector<HTMLElement>("thead th")!
    // One line: the cells draw it (an inset shadow), the row has no border of its own.
    await expect(getComputedStyle(head).borderBottomWidth).toBe("0px")
    await expect(getComputedStyle(th).boxShadow).toMatch(/inset/)
    // Still there once the body has scrolled under the header.
    box.scrollTop = 200
    await new Promise((r) => requestAnimationFrame(r))
    await expect(getComputedStyle(th).boxShadow).toMatch(/inset/)
    await expect(Math.round(th.getBoundingClientRect().top)).toBe(Math.round(box.getBoundingClientRect().top + 1))
    // The scrollbar lives inside the rounded box, its track below the header.
    await expect(box.className).toMatch(/scrollbar-below-header/)
    box.scrollTop = 0
  },
}

export const ColumnsMenu: Story = {
  name: "Columns menu",
  tags: ["!autodocs"],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.queryByRole("columnheader", { name: "How it started" })).not.toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Columns" }))
    const doc = within(canvasElement.ownerDocument.body)
    await userEvent.click(await doc.findByRole("menuitemcheckbox", { name: "How it started" }))
    await expect(c.getByRole("columnheader", { name: "How it started" })).toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("table")).toHaveAttribute("aria-busy", "true")
  },
}

export const Empty: Story = { args: { rows: [], emptyMessage: "No runs yet. Scheduled jobs show here after their first run." } }

function ErrorThenRetry() {
  const [failed, setFailed] = useState(true)
  return (
    <DataTable
      rows={failed ? [] : jobRuns.slice(0, 8)}
      columns={columns}
      getRowId={(r) => r.id}
      label="Job runs"
      error={failed ? { message: "We couldn’t load the runs.", onRetry: () => setFailed(false) } : undefined}
    />
  )
}

export const ErrorState: Story = {
  name: "Error (retry in place)",
  render: () => <ErrorThenRetry />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("alert")).toHaveTextContent("We couldn’t load the runs.")
    await userEvent.click(c.getByRole("button", { name: "Try again" }))
    await expect(c.getAllByRole("row")).toHaveLength(9)
  },
}

/* R12-10: the list page pattern's additions. Selection (a checkbox column, select the page,
   mixed when some are), the row click (not from the checkbox, the menu or a link), the overflow
   menu column, and controlled sort and paging (the rows arrive sorted and paged). */
function SelectableRuns() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [opened, setOpened] = useState("")
  return (
    <div className="flex flex-col gap-3">
      <span role="status" className="text-sm font-medium">
        {selected.size} selected{opened && ` · opened ${opened}`}
      </span>
      <DataTable
        rows={jobRuns}
        columns={columns}
        getRowId={(r) => r.id}
        label="Job runs"
        pageSize={10}
        maxHeight="none"
        selection={{ selected, onSelectedChange: setSelected, rowLabel: (r) => `${r.pipeline} ${r.id}` }}
        onRowClick={(r) => setOpened(r.id)}
        rowActions={(r) => (
          <RowActions label={`Actions for ${r.pipeline} ${r.id}`} actions={[{ kind: "action", id: "rerun", label: "Run again", icon: <RotateCw aria-hidden />, run: () => setOpened(`rerun ${r.id}`) }]} />
        )}
      />
    </div>
  )
}

export const Selection: Story = {
  name: "Selection, row click and row actions",
  render: () => <SelectableRuns />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const header = within(table).getByRole("checkbox", { name: "Select all on this page" })
    const boxes = within(table).getAllByRole("checkbox", { name: /^Select (?!all)/ })
    await expect(boxes).toHaveLength(10)
    // One row: the header is mixed; the row is tinted; the row didn't open.
    await userEvent.click(boxes[0])
    await expect(header).toHaveAttribute("aria-checked", "mixed")
    await expect(boxes[0].closest("tr")).toHaveAttribute("data-state", "selected")
    await expect(c.getByRole("status")).toHaveTextContent("1 selected")
    // The header selects the page, then clears it.
    await userEvent.click(header)
    await expect(c.getByRole("status")).toHaveTextContent("10 selected")
    await userEvent.click(header)
    await expect(c.getByRole("status")).toHaveTextContent("0 selected")
    // A click on a plain cell opens the row; the actions button doesn't.
    const row = within(table).getAllByRole("row")[2]
    await userEvent.click(within(row).getAllByRole("cell")[3])
    await expect(c.getByRole("status")).toHaveTextContent(/opened run-/)
    const before = c.getByRole("status").textContent
    await userEvent.click(within(row).getByRole("button", { name: /^Actions for/ }))
    await expect(c.getByRole("status").textContent).toBe(before)
    await userEvent.keyboard("{Escape}")
  },
}

function ControlledRuns() {
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({ id: "rows", desc: true })
  const [page, setPage] = useState(1)
  const sorted = [...jobRuns].sort((a, b) => {
    if (!sort) return 0
    const key = sort.id as keyof JobRun
    const av = a[key] ?? -Infinity
    const bv = b[key] ?? -Infinity
    return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.desc ? -1 : 1)
  })
  return (
    <DataTable
      rows={sorted.slice((page - 1) * 10, page * 10)}
      columns={columns}
      getRowId={(r) => r.id}
      label="Job runs"
      maxHeight="none"
      sorting={{ sort, onSortChange: (s) => (setSort(s), setPage(1)) }}
      paging={{ page, pageSize: 10, total: jobRuns.length, onPageChange: setPage }}
    />
  )
}

/* R20-23: the grid's capabilities, each opt-in on the same DataTable: typed columns (the kind
   decides the cell, the sort and the alignment), resizing, pinning and density. */
const typedColumns: DataTableColumn<JobRun>[] = [
  { id: "pipeline", header: "Pipeline", width: 220, cell: (r) => <span className="font-medium text-card-foreground">{r.pipeline}</span>, sortValue: (r) => r.pipeline },
  {
    id: "status",
    header: "Status",
    width: 120,
    cell: (r) => <Badge tone={r.status === "Failed" ? "attention" : r.status === "Running" ? "info" : "success"}>{r.status}</Badge>,
    sortValue: (r) => r.status,
  },
  { id: "started", header: "Started", type: "datetime", width: 200, value: (r) => `${r.started.replace(" ", "T")}:00Z` },
  { id: "duration", header: "Duration", type: "duration", width: 110, value: (r) => r.durationSeconds },
  { id: "rows", header: "Rows", type: "count", width: 110, value: (r) => r.rows },
  // Cents, as the API sends money (Formatted's currency kind).
  { id: "cost", header: "Cost", type: "currency", width: 110, value: (r) => (r.rows === null ? null : Math.round(r.rows * 0.12)) },
  { id: "share", header: "Share", type: "percent", width: 100, value: (r) => (r.rows === null ? null : Math.round((r.rows / 50_000) * 1000) / 10) },
  { id: "trigger", header: "How it started", width: 140, cell: (r) => r.trigger },
]

/** Typed columns: `type` + `value` in place of `cell`; the kind formats, sorts and right-aligns. */
export const TypedColumns: Story = {
  name: "Typed columns",
  tags: ["r20-23"],
  args: { columns: typedColumns, pageSize: 10, maxHeight: "none" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    // A typed column is numeric unless told otherwise: right-aligned header, tabular cells.
    await expect(within(table).getByRole("columnheader", { name: /Started/ })).toHaveClass("text-right")
    const cells = canvasElement.querySelectorAll('[data-slot="formatted"][data-kind="duration"]')
    await expect(cells.length).toBe(10)
    // The kind formats: a duration reads as minutes and seconds, a count with its separators, money from cents.
    await expect(canvasElement.querySelector('[data-kind="count"]')?.textContent).toMatch(/^\d{1,3}(,\d{3})*$|^\d+(\.\d)?K$/)
    await expect(canvasElement.querySelector('[data-kind="currency"]')?.textContent).toMatch(/^\$/)
    // It sorts by its own value, biggest first, with no sortValue written.
    await userEvent.click(within(table).getByRole("button", { name: /Rows/ }))
    await expect(within(table).getByRole("columnheader", { name: /Rows/ })).toHaveAttribute("aria-sort", "descending")
    // A missing value is a dash, never 0.
    await userEvent.click(within(table).getByRole("button", { name: /Duration/ }))
    await userEvent.click(within(table).getByRole("button", { name: /Duration/ }))
    await expect(within(table).getByRole("columnheader", { name: /Duration/ })).toHaveAttribute("aria-sort", "ascending")
  },
}

/** Resizable columns: drag the header's edge, or focus it and press the arrows. */
export const Resizable: Story = {
  tags: ["r20-23"],
  args: { columns: typedColumns, resizable: true, pageSize: 10, maxHeight: "none" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    // Sized layout: the header cells carry their widths.
    await expect(table).toHaveClass("table-fixed")
    // The header is still named by its label alone, not "Pipeline Resize Pipeline".
    const pipeline = within(table).getByRole("columnheader", { name: "Pipeline" })
    await expect(pipeline.style.width).toBe("220px")
    // The handle is a separator with the width as its value; arrows nudge it 16px, Home puts it back.
    const handle = within(table).getByRole("separator", { name: "Resize Pipeline" })
    await expect(handle).toHaveAttribute("aria-valuenow", "220")
    handle.focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(handle).toHaveAttribute("aria-valuenow", "236")
    await expect(pipeline.style.width).toBe("236px")
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    await expect(handle).toHaveAttribute("aria-valuenow", "204")
    await userEvent.keyboard("{Home}")
    await expect(handle).toHaveAttribute("aria-valuenow", "220")
    // The last unpinned column has no fixed width: it takes what is left, so the table fills its box.
    const last = within(table).getByRole("columnheader", { name: "How it started" })
    await expect(last.style.width).toBe("")
  },
}

/** Pinned columns stay in view while the rest scroll sideways. */
export const Pinned: Story = {
  name: "Pinned columns · scrolls sideways",
  tags: ["r20-23"],
  args: {
    columns: typedColumns.map((col) => (col.id === "pipeline" ? { ...col, pin: "start" as const } : col.id === "cost" ? { ...col, pin: "end" as const, width: 110 } : { ...col, width: 240 })),
    resizable: true,
    pageSize: 10,
    maxHeight: "md",
    className: "max-w-3xl",
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const box = table.parentElement!
    const pipeline = within(table).getByRole("columnheader", { name: /Pipeline/ })
    const cost = within(table).getByRole("columnheader", { name: /Cost/ })
    await expect(getComputedStyle(pipeline).position).toBe("sticky")
    await expect(pipeline).toHaveClass("pinned-edge-start")
    await expect(cost).toHaveClass("pinned-edge-end")
    // The table is wider than its box; scrolled, the pinned header stays at the box's edge.
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth)
    box.scrollLeft = 300
    await new Promise((r) => requestAnimationFrame(r))
    await expect(Math.round(pipeline.getBoundingClientRect().left)).toBe(Math.round(box.getBoundingClientRect().left + 1))
    await expect(Math.round(cost.getBoundingClientRect().right)).toBeLessThanOrEqual(Math.round(box.getBoundingClientRect().right))
    box.scrollLeft = 0
  },
}

/** Compact density: tighter rows for a list read as a grid; the header row keeps its height. */
export const Compact: Story = {
  name: "Density · compact",
  tags: ["r20-23"],
  args: { columns: typedColumns, density: "compact", pageSize: 10, maxHeight: "none" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    await expect(table).toHaveAttribute("data-density", "compact")
    const rows = within(table).getAllByRole("row")
    const header = rows[0].getBoundingClientRect().height
    const body = rows[1].getBoundingClientRect().height
    await expect(body).toBeLessThan(header)
    await expect(within(rows[1]).getAllByRole("cell")[0]).toHaveClass("py-1.5")
  },
}

/** At a phone's width the table scrolls sideways inside its box; the page doesn't. */
export const Phone: Story = {
  name: "At 375 (phone)",
  tags: ["r20-24"],
  globals: { viewport: { value: "w375", isRotated: false } },
  args: { columns: typedColumns, pageSize: 10, maxHeight: "none" },
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>("[data-slot=data-table] table")!.parentElement!
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth)
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientWidth)
  },
}

/** What an open row shows: a few terms about the run (the Expandable story's and the Recipe's). */
function RunDetail({ run: r }: { run: JobRun }) {
  return (
    <dl className="flex flex-col gap-1 text-sm">
      {(
        [
          ["Run", <span className="font-medium text-card-foreground">{r.id}</span>],
          ["Trigger", r.trigger],
          ["Rows written", r.rows ?? "—"],
        ] as const
      ).map(([term, value]) => (
        <div key={term} className="flex gap-4">
          <dt className="w-28 shrink-0 text-muted-foreground">{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
const runDetail = { rowLabel: (r: JobRun) => `${r.pipeline} ${r.id}`, content: (r: JobRun) => <RunDetail run={r} /> }

/** Expandable rows: a chevron column opens a detail panel under the row. */
export const Expandable: Story = {
  name: "Expandable rows",
  tags: ["r20-23"],
  args: { columns: typedColumns, pageSize: 10, maxHeight: "none", expandable: runDetail },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const before = within(table).getAllByRole("row").length
    const toggle = within(table).getAllByRole("button", { name: /^Show details for/ })[0]
    await userEvent.click(toggle)
    // One more row: the detail, which the toggle now controls and names as open.
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(toggle).toHaveAccessibleName(/^Hide details for/)
    const detail = canvasElement.ownerDocument.getElementById(toggle.getAttribute("aria-controls")!)!
    await expect(detail).toHaveAttribute("data-slot", "data-table-detail")
    await expect(within(table).getAllByRole("row")).toHaveLength(before + 1)
    await expect(within(detail).getByText("Rows written")).toBeInTheDocument()
    // Closed again: the row is gone and the toggle is back to Show.
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(within(table).getAllByRole("row")).toHaveLength(before)
  },
}

export const Virtualized: Story = {
  name: "Virtualized · 2,000 rows",
  tags: ["r20-23"],
  args: {
    rows: manyRuns,
    columns: [{ id: "run", header: "Run", width: 110, cell: (r) => <span className="font-medium text-card-foreground">{r.id}</span> }, ...typedColumns.slice(1)],
    pageSize: "all",
    maxHeight: "md",
    virtualize: true,
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const box = table.parentElement!
    const firstRun = () => within(table).getAllByRole("row")[1]?.textContent ?? ""
    // A page of everything: no pager; far fewer rows in the DOM than in the data.
    await expect(c.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument()
    await expect(within(table).getAllByRole("row").length).toBeLessThan(80)
    const atTop = firstRun()
    // The scroll height is the whole list's; scrolled to the end, different rows are in the DOM and the first is gone.
    await expect(box.scrollHeight).toBeGreaterThan(2000 * 30)
    box.scrollTop = box.scrollHeight
    await new Promise((r) => setTimeout(r, 150))
    await expect(firstRun()).not.toBe(atTop)
    await expect(within(table).getAllByRole("row").length).toBeLessThan(80)
    box.scrollTop = 0
  },
}

/** Reorderable columns: a grip in each header; drag it, or Space · arrows · Space. */
export const Reorderable: Story = {
  name: "Reorderable columns",
  tags: ["r20-23"],
  args: { columns: typedColumns, reorderable: true, pageSize: 10, maxHeight: "none" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const order = () => within(table).getAllByRole("columnheader").map((th) => th.textContent?.replace(/Drag .*? to reorder|Resize .*/g, "").trim())
    await expect(order().slice(0, 3)).toEqual(["Pipeline", "Status", "Started"])
    // The header's name is its label alone, grip or not.
    await expect(within(table).getByRole("columnheader", { name: "Status" })).toBeInTheDocument()
    // Space picks the Status column up, ArrowRight moves it past Started, Space drops it.
    const grip = within(table).getByRole("button", { name: "Drag the Status column to reorder" })
    grip.focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(grip.closest("th")).toHaveAttribute("data-dragging"))
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(within(document.body).getByText(/the Status column is now at position 3 of 8/)).toBeInTheDocument())
    await userEvent.keyboard(" ")
    await waitFor(() => expect(order().slice(0, 3)).toEqual(["Pipeline", "Started", "Status"]))
    // The cells followed their header.
    const firstRow = within(table).getAllByRole("row")[1]!
    await expect(within(firstRow).getAllByRole("cell")[2]!.querySelector("[data-slot=badge], span")).toBeTruthy()
    await expect(within(firstRow).getAllByRole("cell")[1]!.querySelector("[data-kind=datetime]")).toBeTruthy()
  },
}

/** Controlled sort and paging (rows arrive as one page) */
export const Controlled: Story = {
  name: "Controlled sort and paging",
  render: () => <ControlledRuns />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText("1–10 of 63")).toBeInTheDocument()
    await expect(c.getByRole("columnheader", { name: /Rows/ })).toHaveAttribute("aria-sort", "descending")
    await userEvent.click(c.getByRole("button", { name: "Next page" }))
    await expect(c.getByText("11–20 of 63")).toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: /Pipeline/ }))
    await expect(c.getByText("1–10 of 63")).toBeInTheDocument()
    await expect(c.getByRole("columnheader", { name: /Pipeline/ })).toHaveAttribute("aria-sort", "ascending")
  },
}

/* R21-11: the row whose detail is showing keeps the hover wash and is aria-current; a click on
   another row moves it. The row's own button is the keyboard path (row click is the pointer's). */
function CurrentRun() {
  const rows = jobRuns.slice(0, 6)
  const [current, setCurrent] = useState(rows[2]!.id)
  const picked = rows.find((r) => r.id === current)!
  const pick: DataTableColumn<JobRun>[] = [
    {
      id: "pipeline",
      header: "Pipeline",
      cell: (r) => (
        <button type="button" onClick={() => setCurrent(r.id)} className="cursor-pointer rounded-xs font-medium text-card-foreground focus-ring">
          {r.pipeline}
        </button>
      ),
    },
    ...columns.slice(1, 4),
  ]
  return (
    <div className="flex flex-col gap-3">
      <DataTable rows={rows} columns={pick} getRowId={(r) => r.id} label="Job runs" maxHeight="none" columnsMenu={false} onRowClick={(r) => setCurrent(r.id)} currentRowId={current} />
      <span role="status" className="text-sm">
        Showing {picked.pipeline} {picked.id}
      </span>
    </div>
  )
}

/** `currentRowId`: the row whose detail is showing holds the hover wash and is `aria-current`; a click elsewhere moves it. */
export const CurrentRow: Story = {
  name: "Current row",
  tags: ["r21-11"],
  render: () => <CurrentRun />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Job runs" })
    const rows = within(table).getAllByRole("row").slice(1)
    await expect(rows.filter((r) => r.getAttribute("aria-current") === "true")).toHaveLength(1)
    await expect(rows[2]).toHaveAttribute("aria-current", "true")
    await expect(getComputedStyle(rows[2]!).backgroundImage).not.toBe("none")
    await userEvent.click(within(rows[4]!).getAllByRole("cell")[2]!)
    await expect(rows[4]).toHaveAttribute("aria-current", "true")
    await expect(rows[2]).not.toHaveAttribute("aria-current")
    // The keyboard path: the row's own button.
    within(rows[0]!).getByRole("button").focus()
    await userEvent.keyboard("{Enter}")
    await expect(rows[0]).toHaveAttribute("aria-current", "true")
  },
}
