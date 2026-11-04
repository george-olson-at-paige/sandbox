/* The DAG's vocabulary and shape without the layout library (R12-07). Everything here is pure and
   imports nothing, so the pieces that must stay out of the lazy chunk can use it: dag-status.tsx
   (the marks and labels a page shows without the graph) and lazy-dag-frame.tsx (the skeleton,
   which reserves the canvas's exact height before the graph loads). dag-model.ts adds dagre's
   layout on top and re-exports these. Tested under node (dag-model.test.ts). */

/** A node's state, in the StatusDot work vocabulary's six graph tones. en-US spelling: canceled. */
type DagStatus = "queued" | "running" | "succeeded" | "failed" | "skipped" | "canceled"

/** What the model needs of a node. */
type DagItem = { id: string; dependsOn: readonly string[]; status?: DagStatus }

/** How the graph is laid out (R10-02): ranks left to right, top to bottom, or top to bottom
    with each rank alternately left and right of a centre line (Raygun's run view), which reads
    well for a mostly linear run. */
type DagLayout = "right" | "down" | "down-alternating"
type Point = { x: number; y: number }
type DagEdge = { id: string; source: string; target: string }

/** A node's box in graph units; the node component is drawn at exactly this size (w-60 h-18). */
const NODE_WIDTH = 240
const NODE_HEIGHT = 72
const NODE_GAP = 24
const RANK_GAP = 64
/** down-alternating: the channel between the two sides that every edge runs down. */
const CENTRE_GAP = 64
/** down-alternating: how far each rank starts below the one before (half a node and a gap), so a
    rank overlaps its neighbour on the other side and two ranks on one side clear each other. */
const ALT_STEP = (NODE_HEIGHT + NODE_GAP) / 2

const STATUS_ORDER: readonly DagStatus[] = ["succeeded", "failed", "running", "queued", "skipped", "canceled"]

const STATUS_LABEL: Record<DagStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  skipped: "Skipped",
  canceled: "Canceled",
}

/** The edges: one per dependency that names a node in the graph (a missing or self dependency is ignored). */
function edgesOf(items: readonly DagItem[]): DagEdge[] {
  const ids = new Set(items.map((i) => i.id))
  return items.flatMap((i) =>
    [...new Set(i.dependsOn)].filter((d) => d !== i.id && ids.has(d)).map((d) => ({ id: `${d}->${i.id}`, source: d, target: i.id }))
  )
}

/** How many nodes have each status, in the legend's order, only the statuses present (R12-07: the footer's counted marks). */
function statusCounts(items: readonly DagItem[]): Array<{ status: DagStatus; count: number }> {
  const counts = new Map<DagStatus, number>()
  for (const i of items) if (i.status) counts.set(i.status, (counts.get(i.status) ?? 0) + 1)
  return STATUS_ORDER.filter((s) => counts.get(s)).map((status) => ({ status, count: counts.get(status)! }))
}

/** The one-line summary: "12 steps: 9 succeeded, 1 failed, 2 skipped". */
function summarize(items: readonly DagItem[], noun: { one: string; other: string } = { one: "step", other: "steps" }): string {
  if (items.length === 0) return `No ${noun.other}`
  const parts = statusCounts(items).map(({ status, count }) => `${count} ${STATUS_LABEL[status].toLowerCase()}`)
  const head = `${items.length} ${items.length === 1 ? noun.one : noun.other}`
  return parts.length ? `${head}: ${parts.join(", ")}` : head
}

/** Each node's rank: 0 with no dependency in the graph, else one more than its deepest dependency (the longest path; dagre's ranks are close to it). */
function ranksOf(items: readonly DagItem[]): Map<string, number> {
  const byId = new Map(items.map((i) => [i.id, i]))
  const rank = new Map<string, number>()
  const visiting = new Set<string>()
  const visit = (id: string): number => {
    const known = rank.get(id)
    if (known !== undefined) return known
    if (visiting.has(id)) return 0 // a cycle isn't a DAG; don't loop
    visiting.add(id)
    const deps = [...new Set(byId.get(id)!.dependsOn)].filter((d) => d !== id && byId.has(d))
    const r = deps.length ? Math.max(...deps.map(visit)) + 1 : 0
    visiting.delete(id)
    rank.set(id, r)
    return r
  }
  for (const i of items) visit(i.id)
  return rank
}

/** The heights `height="auto"` can take, in px, with their classes (static, so Tailwind sees them).
    The floor, 384, is what the details panel beside the graph needs to show a step's main facts
    without scrolling; the ceiling, 560, keeps a tall graph from taking the whole screen (full
    screen is there for that). */
const AUTO_HEIGHTS = [
  [384, "h-96"],
  [416, "h-104"],
  [448, "h-112"],
  [480, "h-120"],
  [512, "h-128"],
  [544, "h-136"],
  [560, "h-140"],
] as const
/** The zoom the auto height is sized for: nodes still readable (12px text at 75% of 16). */
const AUTO_ZOOM = 0.75
/** The fit's top and bottom padding (dag-frame.tsx FIT). */
const AUTO_PAD = 48

/** The graph's height in graph units for a layout, from its ranks alone (no layout run). */
function graphHeight(items: readonly DagItem[], layout: DagLayout): number {
  if (items.length === 0) return 0
  const ranks = ranksOf(items)
  const perRank: number[] = []
  for (const r of ranks.values()) perRank[r] = (perRank[r] ?? 0) + 1
  const span = (n: number, gap: number) => n * NODE_HEIGHT + (n - 1) * gap
  if (layout === "right") return span(Math.max(...perRank), NODE_GAP)
  if (layout === "down") return span(perRank.length, RANK_GAP)
  // down-alternating: the same stacking as dag-model's alternatingLayout.
  const starts: number[] = []
  const ends: number[] = []
  perRank.forEach((n, r) => {
    const start = r === 0 ? 0 : Math.max(starts[r - 1] + ALT_STEP, r >= 2 ? ends[r - 2] + NODE_GAP : 0)
    starts.push(start)
    ends.push(start + span(n, NODE_GAP))
  })
  return Math.max(...ends)
}

/**
 * The canvas height for `height="auto"` (R12-07): the graph's own proportions at a readable zoom
 * (75%), plus the fit's padding, between 384 and 560, snapped up to a 32px step. Computed from the
 * dependencies alone, so the lazy skeleton reserves the same height the graph will take.
 */
function autoCanvasHeight(items: readonly DagItem[], layout: DagLayout): { px: number; className: string } {
  const want = graphHeight(items, layout) * AUTO_ZOOM + AUTO_PAD
  const hit = AUTO_HEIGHTS.find(([px]) => px >= want) ?? AUTO_HEIGHTS[AUTO_HEIGHTS.length - 1]
  return { px: hit[0], className: hit[1] }
}

export {
  ALT_STEP,
  autoCanvasHeight,
  CENTRE_GAP,
  edgesOf,
  graphHeight,
  NODE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  RANK_GAP,
  ranksOf,
  STATUS_LABEL,
  STATUS_ORDER,
  statusCounts,
  summarize,
}
export type { DagEdge, DagItem, DagLayout, DagStatus, Point }
