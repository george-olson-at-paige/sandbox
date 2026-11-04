import { useEffect, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { DagFrame, type DagNode, type DagStatus } from "./dag-frame"
import { enter } from "../stories/typing"

/* DagFrame (R9-06; GraphFrame until R11-03): one story per row of REVIEW-9 § C's frame table,
   plus the header and footer (R11-01, correcting R10-01), alternating layout (R10-02), refits
   (R10-03), narrow frames (R10-14) and the design pass (R12-07: auto height, the footer's counted
   marks, the controls pill, the minimap only when needed, the list as the pane). Pages use
   LazyDagFrame (same props); these stories import the frame directly so plays can reach React
   Flow at once. DagFrame is the frame and its behaviour; the graph is the canvas inside it. */

const SIX: DagNode[] = [
  { id: "extract", label: "Extract customers", status: "succeeded", dependsOn: [], duration: "1m 04s" },
  { id: "prices", label: "Plan prices", status: "succeeded", dependsOn: [], duration: "6s" },
  { id: "usage", label: "Usage report", status: "running", dependsOn: ["extract", "prices"], duration: "2m 10s" },
  { id: "contacts", label: "Export the contact list to SendGrid with custom fields", status: "failed", dependsOn: ["extract"], duration: "1m 41s" },
  { id: "segments", label: "Contact segments", status: "skipped", dependsOn: ["contacts", "usage"], statusText: "Won't run" },
  { id: "email", label: "Usage report email", status: "queued", dependsOn: ["usage"] },
]

/** A deterministic layered graph of `n` nodes: `perRank` per rank, each depending on one or two nodes of the rank before. */
function makeGraph(n: number, perRank: number): DagNode[] {
  let seed = 7
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648)
  const statuses: DagStatus[] = ["succeeded", "succeeded", "succeeded", "succeeded", "running", "queued", "skipped", "failed", "canceled"]
  return Array.from({ length: n }, (_, i) => {
    const rank = Math.floor(i / perRank)
    const prev = Array.from({ length: perRank }, (_, k) => (rank - 1) * perRank + k).filter((k) => k >= 0)
    const deps = rank === 0 ? [] : [...new Set([prev[Math.floor(rand() * prev.length)], prev[Math.floor(rand() * prev.length)]])]
    return {
      id: `n${i}`,
      label: `Step ${rank + 1}.${(i % perRank) + 1}`,
      status: statuses[Math.floor(rand() * statuses.length)],
      dependsOn: deps.map((d) => `n${d}`),
      duration: `${Math.floor(rand() * 9)}m ${String(Math.floor(rand() * 60)).padStart(2, "0")}s`,
    }
  })
}
/** A mostly linear run: one chain, one side step. */
const LINEAR: DagNode[] = [
  { id: "stripe", label: "Stripe billing", status: "succeeded", dependsOn: [], duration: "19m 00s" },
  { id: "usage", label: "Usage report", status: "succeeded", dependsOn: ["stripe"], duration: "18s" },
  { id: "facts", label: "Subscription facts", status: "succeeded", dependsOn: ["usage"], duration: "1m 34s" },
  { id: "journeys", label: "Journeys rebuild", status: "running", dependsOn: ["facts"], duration: "10m 00s" },
  { id: "audit", label: "Audit the journey stages", status: "queued", dependsOn: ["facts"] },
  { id: "pulse", label: "Pulse snapshot", status: "queued", dependsOn: ["journeys"] },
  { id: "email", label: "Usage report email", status: "queued", dependsOn: ["pulse"] },
]
const MEDIUM = makeGraph(25, 5)
const LARGE = makeGraph(200, 10)

const meta = {
  component: DagFrame,
  args: { nodes: SIX, label: "Nightly usage refresh" },
  decorators: [(S, { parameters }) => <div className={parameters.wideFrame ? "w-6xl" : "max-w-4xl"}><S /></div>],
  tags: ["r9-06", "r13-17", "gaps-129", "r10-01", "r11-01", "r11-02", "r12-07", "r10-02", "r10-03", "r10-14", "gaps-115"],
  parameters: {
    docs: {
      description: {
        component: [
          "A DAG: steps and their dependencies (a pipeline run), in a frame that behaves like the run graphs of Dagster, Airflow, GitHub Actions and Argo. Pages import `LazyDagFrame` (React Flow and dagre load only when a graph renders); the frame contract, REVIEW-9 § C:",
          "",
          "- **Header**: the title (a heading) with Graph/List (the TabsPill) and full screen, nothing else. **Below the canvas**, one row: the summary, each count wearing its status mark (the counts are the legend; only the statuses on the graph). It is the live region.",
          "- **Canvas height**: `auto` (default) takes the graph's proportions (its height at 75% plus the fit padding, 288–560, from the dependencies alone, so the lazy skeleton matches); `md` 448 and `lg` 640 fix it. A growing graph can make it taller, never shorter.",
          "- **Opening view and refits**: one `viewAdjusted` state, set by a pan or zoom and cleared by Fit or Reset. Until you pan or zoom, the graph fits every node (never above 100%) on load and on any size change: the details panel opening (narrower) or closing (wider), full screen, the window. After, it keeps your view and only keeps the selected node in view. Zoom 25–200%.",
          "- **Too big to fit at 25%** (a narrow frame): it fits the selected node and its neighbours, or the first ranks, and a note offers the list view.",
          "- **Page scroll**: a plain wheel scrolls the page; Ctrl/⌘ + wheel or a pinch zooms; drag the background to pan.",
          "- **Controls** bottom left in one pill (zoom in, zoom out, fit, then reset), full screen in the header. The **minimap** (bottom right, 160 × 120) shows only while part of the graph is outside the canvas: a partial fit, a pan or a zoom; Fit hides it.",
          "- **Keyboard**: the canvas is one tab stop; arrows pan, + and − zoom, 0 fits; Tab walks the nodes in dependency order, Home/End jump; Enter opens a node, Escape closes it.",
          "- **Layout**: dagre, deterministic: `layout` right (default), down, or down-alternating (top to bottom, each rank alternately left and right of a centre line, edges down the middle; for mostly linear runs). It re-runs only when ids or dependencies change, never for a status, and new nodes don't move the others.",
          "- **Nodes**: fixed size, name truncated with a tooltip, status mark (queued, running, succeeded, failed, skipped, canceled), duration, selected ring; running marks turn only without reduced motion.",
          "- **Edges**: rounded right angles with arrowheads; a selection lights its upstream and downstream and dims the rest; a failure's downstream path is dashed.",
          "- **Selection**: opens a details panel inside the frame (`renderDetails`), 320 wide, 384 once the frame is 1024 or wider; controlled with `selectedId`/`onSelect` so the page keeps it in the URL.",
          "- **States**: loading (node-shaped skeletons), empty (a mark and \"Nothing has run yet\"), error with retry; each at the canvas's height.",
          "- **Accessibility**: a list view (ordered table) that is the pane itself (same height, the table edge to edge, header sticky, scrolling inside), and a text summary under the canvas that also names it.",
          "- **Scale**: smooth at 200 nodes; no virtualisation in v1. React Flow's attribution stays visible (muted): see the component's header comment.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof DagFrame>

export default meta
type Story = StoryObj<typeof meta>

const canvasOf = (el: HTMLElement) => waitFor(() => {
  const c = el.querySelector<HTMLElement>('[data-slot="dag-canvas"]')
  // Nodes first, then edges once React Flow has measured the nodes.
  const ready = Boolean(c?.querySelector(".react-flow__node") && c.querySelector(".dag-edge"))
  if (!c || ready === false) throw new Error("graph not rendered yet")
  return c
})
const transformOf = (el: HTMLElement) => el.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform ?? ""
const scaleOf = (el: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(transformOf(el))?.[1] ?? NaN)
const settle = () => new Promise((r) => setTimeout(r, 250))

/** Six steps: a failure, its downstream skipped, a running step, one queued. */
export const Small: Story = {
  name: "Small (6 steps)",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("status")).toHaveTextContent("6 steps: 2 succeeded, 1 failed, 1 running, 1 queued, 1 skipped")
    // R12-07: the counts wear their marks (only the statuses present: no canceled here).
    const marks = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="dag-footer"] [data-count]')].map((m) => m.dataset.count)
    await expect(marks).toEqual(["succeeded", "failed", "running", "queued", "skipped"])
    const canvas = await canvasOf(canvasElement)
    await expect(canvas).toHaveAccessibleName(/Nightly usage refresh\. 6 steps/)
    await expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(6)
    await expect(canvasElement.querySelectorAll('.dag-edge[data-tone="failure"]')).toHaveLength(1)
    // Everything fits, so no minimap; the canvas takes the graph's shape (two rows: the 384 floor).
    await expect(canvasElement.querySelector(".react-flow__minimap")).toBeNull()
    await expect(Math.round(canvasElement.querySelector('[data-slot="dag-body"]')!.getBoundingClientRect().height)).toBe(384)
  },
}

export const Medium: Story = { name: "Medium (25 steps)", args: { nodes: MEDIUM, label: "Twenty-five steps" } }

/** Large (200 steps: a partial fit, so the minimap) */
export const Large: Story = {
  name: "Large · 200 steps",
  args: { nodes: LARGE, label: "Two hundred steps", height: "lg" },
  play: async ({ canvasElement }) => {
    await canvasOf(canvasElement)
    await waitFor(() => expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(200))
    await waitFor(() => expect(canvasElement.querySelector(".react-flow__minimap")).not.toBeNull())
    // R13-17: the partial fit keeps the minimap's corner clear: the nodes it fitted (the first
    // ranks, from the left) end before the reserved corner, so none of them sits under it. Nodes
    // past the fit may still pass under it: they're the part the minimap is there to show.
    await new Promise((r) => setTimeout(r, 700))
    const map = canvasElement.querySelector(".react-flow__minimap")!.getBoundingClientRect()
    const rects = [...canvasElement.querySelectorAll(".react-flow__node")].map((n) => n.getBoundingClientRect())
    const firstRank = Math.min(...rects.map((r) => r.left))
    const fitted = rects.filter((r) => r.left < firstRank + 1)
    await expect(fitted.length).toBeGreaterThan(0)
    for (const r of fitted) await expect(r.left < map.right && r.right > map.left && r.top < map.bottom && r.bottom > map.top).toBe(false)
  },
}

/** Header and footer: title above, the counted marks below. */
export const Header: Story = {
  name: "Header and footer",
  args: { title: "This morning’s run" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const heading = c.getByRole("heading", { level: 2, name: "This morning’s run" })
    const summary = c.getByRole("status")
    // The header: the title with the view switch (the icon ToggleGroup, R20-13: a radiogroup of two) and full screen, nothing else.
    const header = heading.parentElement!
    await expect(header).toContainElement(c.getByRole("radiogroup", { name: "Show as" }))
    await expect(header).toContainElement(c.getByRole("button", { name: "Full screen" }))
    await expect(header).not.toContainElement(summary)
    // Below the canvas, one row (R12-07): the summary is the legend, each count with its mark.
    const canvas = await canvasOf(canvasElement)
    await expect(canvas.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(summary).toHaveTextContent("6 steps: 2 succeeded")
    await expect(summary.querySelectorAll("[data-count]")).toHaveLength(5)
    const footer = canvasElement.querySelector<HTMLElement>('[data-slot="dag-footer"]')!
    await expect(footer.getBoundingClientRect().height).toBeLessThan(52)
    await expect(c.getByRole("region", { name: "This morning’s run" })).toBeInTheDocument()
  },
}

export const TopToBottom: Story = { name: "Top to bottom", args: { layout: "down", height: "lg" } }

/* R12-07: the canvas takes the graph's proportions; the lazy skeleton computes the same height. */
export const AutoHeight: Story = {
  name: "Auto height: the graph's proportions",
  args: { nodes: LINEAR, layout: "down", label: "A mostly linear run" },
  play: async ({ canvasElement }) => {
    await canvasOf(canvasElement)
    // Six ranks top to bottom: (6 × 72 + 5 × 64) × 0.75 + 48 = 612, over the 560 ceiling.
    await expect(Math.round(canvasElement.querySelector('[data-slot="dag-body"]')!.getBoundingClientRect().height)).toBe(560)
  },
}

/* R12-07: the controls are one pill; the minimap appears only while part of the graph is out of view. */
export const ControlsAndMinimap: Story = {
  name: "Controls and minimap",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await canvasOf(canvasElement)
    const controls = c.getByRole("group", { name: "View" })
    await expect(within(controls).getAllByRole("button")).toHaveLength(4)
    await expect(canvasElement.querySelector(".react-flow__minimap")).toBeNull()
    // Zoom in until nodes leave the canvas: the overview appears, bottom right.
    for (let i = 0; i < 4; i++) await userEvent.click(c.getByRole("button", { name: "Zoom in" }))
    await waitFor(() => expect(canvasElement.querySelector(".react-flow__minimap")).not.toBeNull())
    await expect(canvasElement.querySelector(".react-flow__minimap")).toHaveClass("bottom")
    // Fit: everything in view again, the overview goes.
    await userEvent.click(c.getByRole("button", { name: "Fit to view" }))
    await waitFor(() => expect(canvasElement.querySelector(".react-flow__minimap")).toBeNull())
  },
}

export const DownAlternatingLinear: Story = {
  name: "Down, alternating: a mostly linear run",
  args: { nodes: LINEAR, layout: "down-alternating", height: "lg", label: "Nightly usage refresh" },
  play: async ({ canvasElement }) => {
    await canvasOf(canvasElement)
    const x = (id: string) => canvasElement.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)!.getBoundingClientRect().left
    // Ranks alternate sides down the chain.
    await expect(x("stripe")).toBeLessThan(x("usage"))
    await expect(x("facts")).toBeCloseTo(x("stripe"), 0)
    await expect(x("journeys")).toBeCloseTo(x("usage"), 0)
  },
}

export const DownAlternatingBranching: Story = {
  name: "Down, alternating: a branching run",
  args: { layout: "down-alternating", height: "lg" },
}

/** Refits: narrower with the panel, wider without it. */
export const RefitsWithThePanel: Story = {
  name: "Refits · with the panel",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const canvas = await canvasOf(canvasElement)
    await settle()
    const wide = scaleOf(canvasElement)
    await expect(canvas).not.toHaveAttribute("data-view-adjusted")
    // Open the panel: the canvas narrows and the graph refits smaller.
    await userEvent.click(await c.findByRole("button", { name: /^Usage report: Running/ }))
    await c.findByRole("complementary", { name: "Usage report" })
    await waitFor(() => expect(scaleOf(canvasElement)).toBeLessThan(wide))
    // Close it: the graph refits to the full width again.
    await userEvent.click(c.getByRole("button", { name: "Close details" }))
    await waitFor(() => expect(scaleOf(canvasElement)).toBeCloseTo(wide, 3))
    await expect(canvas).not.toHaveAttribute("data-view-adjusted")
  },
}

/** Refits: a panned view is kept; Fit clears it. */
export const PannedViewIsKept: Story = {
  name: "Refits · a panned view kept",
  // The 448 frame this play was measured in (a pan of one arrow keeps the node it opens in view).
  args: { height: "md" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const canvas = await canvasOf(canvasElement)
    await settle()
    // Pan: the view is now the person's.
    await enter(canvas)
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas).toHaveAttribute("data-view-adjusted", "true"))
    await settle()
    const panned = transformOf(canvasElement)
    // Open the panel on a node that stays in view: the view doesn't move.
    await userEvent.click(c.getByRole("button", { name: /^Extract customers/ }))
    await c.findByRole("complementary", { name: "Extract customers" })
    await settle()
    await expect(transformOf(canvasElement)).toBe(panned)
    // Fit hands the view back to the frame: it fits again, and refits from then on.
    await userEvent.click(c.getByRole("button", { name: "Fit to view" }))
    await waitFor(() => expect(canvas).not.toHaveAttribute("data-view-adjusted"))
    await waitFor(() => expect(transformOf(canvasElement)).not.toBe(panned))
  },
}

/** Narrow: part of the graph and the list hint. */
export const Narrow: Story = {
  name: "Narrow · the list hint",
  args: { nodes: MEDIUM, label: "Twenty-five steps" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await canvasOf(canvasElement)
    // It can't fit at 25%: it fits the first ranks (at the floor or above), not both sides clipped.
    const note = await waitFor(() => {
      const n = canvasElement.querySelector<HTMLElement>('[data-slot="dag-partial"]')
      if (!n) throw new Error("no note yet")
      return n
    })
    await settle()
    await expect(scaleOf(canvasElement)).toBeGreaterThanOrEqual(0.25)
    const first = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="n0"]')!.getBoundingClientRect()
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="dag-canvas"]')!.getBoundingClientRect()
    await expect(first.left).toBeGreaterThanOrEqual(box.left)
    await userEvent.click(within(note).getByRole("button", { name: "The list shows every step" }))
    await expect(c.getByRole("table", { name: "Twenty-five steps, as a list" })).toBeInTheDocument()
  },
}

export const Selection: Story = {
  name: "Selection: paths and the details panel",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await canvasOf(canvasElement)
    const usage = await c.findByRole("button", { name: /^Usage report: Running/ })
    await userEvent.click(usage)
    await expect(usage).toHaveAttribute("aria-expanded", "true")
    const panel = c.getByRole("complementary", { name: "Usage report" })
    await expect(panel).toHaveTextContent("Extract customers, Plan prices")
    // R12-07: 320 wide in a frame under 1024.
    await expect(Math.round(panel.getBoundingClientRect().width)).toBe(320)
    // Its paths light; the failed sibling's branch dims.
    await expect(canvasElement.querySelectorAll('.dag-edge[data-tone="path"]').length).toBe(4)
    await expect(c.getByRole("button", { name: /^Export the contact list/ })).toHaveAttribute("data-dim", "true")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(c.queryByRole("complementary")).toBeNull())
  },
}

/* R12-07: on a wide frame (1024 and up) the panel is 384, for error text and the logs link. */
export const WidePanel: Story = {
  name: "Details panel on a wide frame (384)",
  parameters: { wideFrame: true },
  args: { selectedId: "contacts" },
  play: async ({ canvasElement }) => {
    const panel = await within(canvasElement).findByRole("complementary", { name: /Export the contact list/ })
    await expect(Math.round(panel.getBoundingClientRect().width)).toBe(384)
  },
}

/** Keyboard: one tab stop, Tab in dependency order. */
export const Keyboard: Story = {
  name: "Keyboard · one tab stop",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const canvas = await canvasOf(canvasElement)
    await enter(canvas)
    await expect(canvas).toHaveFocus()
    await userEvent.keyboard("{Tab}")
    await expect(c.getByRole("button", { name: /^Extract customers/ })).toHaveFocus()
    await userEvent.keyboard("{Tab}")
    await expect(c.getByRole("button", { name: /^Plan prices/ })).toHaveFocus()
    await userEvent.keyboard("{Tab}")
    await expect(c.getByRole("button", { name: /^Usage report:/ })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(c.getByRole("complementary", { name: "Usage report" })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(c.queryByRole("complementary")).toBeNull())
    await userEvent.keyboard("{Shift>}{Tab}{Tab}{Tab}{/Shift}")
    await expect(canvas).toHaveFocus()
    // Arrows pan, + zooms, 0 fits again.
    const fitted = transformOf(canvasElement)
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(transformOf(canvasElement)).not.toBe(fitted))
    await userEvent.keyboard("0")
    await waitFor(() => expect(transformOf(canvasElement)).toBe(fitted))
  },
}

/** Wheel scrolls the page; Ctrl + wheel zooms. */
export const WheelScrollsThePage: Story = {
  name: "Wheel · Ctrl zooms",
  decorators: [(S) => <div className="flex flex-col gap-8"><p className="text-sm text-muted-foreground">Scroll with the wheel over the graph: the page moves. Hold Ctrl (⌘ on a Mac) to zoom.</p><S /><div aria-hidden className="h-160 rounded-lg bg-track" /></div>],
  play: async ({ canvasElement }) => {
    const canvas = await canvasOf(canvasElement)
    const pane = canvas.querySelector<HTMLElement>(".react-flow__pane")!
    const box = pane.getBoundingClientRect()
    const at = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, bubbles: true, cancelable: true }
    const before = transformOf(canvasElement)
    const plain = new WheelEvent("wheel", { ...at, deltaY: 120 })
    pane.dispatchEvent(plain)
    // Not cancelled: the browser scrolls the page. And the graph didn't zoom.
    await expect(plain.defaultPrevented).toBe(false)
    await new Promise((r) => setTimeout(r, 150))
    await expect(transformOf(canvasElement)).toBe(before)
    const zoom = new WheelEvent("wheel", { ...at, deltaY: -120, ctrlKey: true })
    pane.dispatchEvent(zoom)
    await expect(zoom.defaultPrevented).toBe(true)
    await waitFor(() => expect(transformOf(canvasElement)).not.toBe(before))
  },
}

export const ListView: Story = {
  name: "List view (the screen-reader path)",
  args: { defaultView: "list" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const table = c.getByRole("table", { name: "Nightly usage refresh, as a list" })
    // Header + six rows, dependencies first.
    const rows = within(table).getAllByRole("row")
    await expect(rows).toHaveLength(7)
    await expect(rows[1]).toHaveTextContent("Extract customers")
    await expect(rows[5]).toHaveTextContent("Contact segments")
    await userEvent.click(c.getByRole("button", { name: "Usage report" }))
    await expect(c.getByRole("complementary", { name: "Usage report" })).toBeInTheDocument()
    // R12-07: the table is the pane: it fills the body's box exactly, scrolls inside, and has no Columns menu.
    const body = canvasElement.querySelector<HTMLElement>('[data-slot="dag-body"]')!
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="dag-list"]')!
    const listHeight = body.getBoundingClientRect().height
    await expect(Math.round(list.getBoundingClientRect().height)).toBe(Math.round(listHeight))
    await expect(c.queryByRole("button", { name: "Columns" })).toBeNull()
    // R20-13: Graph/List is an icon ToggleGroup (single): radios, one checked.
    await userEvent.click(c.getByRole("radio", { name: "Graph" }))
    await canvasOf(canvasElement)
    await expect(c.getByRole("radio", { name: "Graph" })).toHaveAttribute("aria-checked", "true")
    // No jump between views.
    await expect(body.getBoundingClientRect().height).toBe(listHeight)
  },
}

export const Loading: Story = { args: { loading: true, nodes: [] } }
export const Empty: Story = {
  args: { nodes: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Nothing has run yet")).toBeInTheDocument()
  },
}
export const Error_: Story = {
  args: { nodes: [], error: { message: "We couldn't load this run.", onRetry: () => {} } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Try again" })).toBeInTheDocument()
  },
}

/** The selection kept outside (the page writes it to the URL); here it shows as the query string a page would carry. */
export const ControlledSelection: Story = {
  name: "Selection in the URL (controlled)",
  render: function Render(args) {
    const [step, setStep] = useState<string | null>("contacts")
    return (
      <div className="flex flex-col gap-3">
        <code className="text-xs text-muted-foreground">/admin/jobs/run{step ? `?step=${step}` : ""}</code>
        <DagFrame {...args} selectedId={step} onSelect={setStep} />
      </div>
    )
  },
}

/** Statuses move every 1.5s (in place, short transition); a new step arrives without moving the others. */
export const LiveUpdate: Story = {
  name: "Live update (simulated)",
  render: function Render(args) {
    const [tick, setTick] = useState(0)
    useEffect(() => {
      const t = window.setInterval(() => setTick((n) => (n + 1) % 6), 1500)
      return () => window.clearInterval(t)
    }, [])
    const base: DagNode[] = SIX.map((n) => ({ ...n, status: "queued", statusText: undefined, duration: undefined }))
    const done = (id: string, status: DagStatus = "succeeded"): Partial<DagNode> => ({ status, duration: `${(id.length * 7) % 50 + 3}s` })
    const steps: Record<number, Record<string, Partial<DagNode>>> = {
      0: {},
      1: { extract: { status: "running" }, prices: { status: "running" } },
      2: { extract: done("extract"), prices: done("prices"), usage: { status: "running" }, contacts: { status: "running" } },
      3: { extract: done("extract"), prices: done("prices"), usage: { status: "running" }, contacts: done("contacts", "failed") },
      4: { extract: done("extract"), prices: done("prices"), usage: done("usage"), contacts: done("contacts", "failed"), segments: { status: "skipped", statusText: "Won't run" }, email: { status: "running" } },
      5: { extract: done("extract"), prices: done("prices"), usage: done("usage"), contacts: done("contacts", "failed"), segments: { status: "skipped", statusText: "Won't run" }, email: done("email") },
    }
    const nodes = base.map((n) => ({ ...n, ...steps[tick][n.id] }))
    if (tick >= 4) nodes.push({ id: "archive", label: "Archive the report", status: tick === 5 ? "running" : "queued", dependsOn: ["usage"] })
    return <DagFrame {...args} nodes={nodes} />
  },
}
