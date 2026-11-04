import dagre from "@dagrejs/dagre"

/* The graph frame's model (R9-06): pure functions over nodes and their dependencies, no React,
   no DOM, so `dag-model.test.ts` runs them under node --test. DagFrame (dag-frame.tsx)
   draws what these say: where each node sits (dagre, deterministic), the order Tab and the list
   view walk (dependencies first), a selection's upstream and downstream, a failure's downstream,
   and the one-line summary. */

import {
  ALT_STEP,
  CENTRE_GAP,
  edgesOf,
  NODE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  RANK_GAP,
  STATUS_LABEL,
  STATUS_ORDER,
  summarize,
  type DagEdge,
  type DagItem,
  type DagLayout,
  type DagStatus,
  type Point,
} from "./dag-shape.ts"

/* The vocabulary (statuses, node size, edges, the summary) is dag-shape.ts, which has no dagre,
   so dag-status.tsx and the lazy skeleton can use it outside the lazy chunk (R12-07). */

/** The graph's shape (ids, dependencies, layout), without statuses: layout re-runs only when this changes. */
function structureKey(items: readonly DagItem[], layout: DagLayout): string {
  return `${layout}|${items.map((i) => `${i.id}<${i.dependsOn.join(",")}`).join("|")}`
}

/** dagre's picture: top-left corners, ranked on x (LR) or y (TB). */
function dagreLayout(items: readonly DagItem[], rankdir: "LR" | "TB"): Map<string, Point> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir, nodesep: NODE_GAP, ranksep: RANK_GAP, marginx: 0, marginy: 0 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const i of items) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const e of edgesOf(items)) g.setEdge(e.source, e.target)
  dagre.layout(g)
  const out = new Map<string, Point>()
  for (const i of items) {
    const n = g.node(i.id)
    out.set(i.id, { x: Math.round(n.x - NODE_WIDTH / 2), y: Math.round(n.y - NODE_HEIGHT / 2) })
  }
  return out
}

/**
 * down-alternating (R10-02): dagre's top-to-bottom ranks and in-rank order, redrawn so rank 0
 * sits left of a centre line, rank 1 right, rank 2 left... A rank with more than one node stacks
 * them on its side (in dagre's order), so every node's inner edge faces the centre channel,
 * where the frame routes every edge (inner side out, down the channel, inner side in). Each rank
 * starts ALT_STEP below the one before, and never before the last rank on its side has ended.
 */
function alternatingLayout(items: readonly DagItem[]): Map<string, Point> {
  const tb = dagreLayout(items, "TB")
  const rankYs = [...new Set([...tb.values()].map((p) => p.y))].sort((a, b) => a - b)
  const ranks = rankYs.map((y) => items.filter((i) => tb.get(i.id)!.y === y).sort((a, b) => tb.get(a.id)!.x - tb.get(b.id)!.x))
  const out = new Map<string, Point>()
  const starts: number[] = []
  const ends: number[] = []
  ranks.forEach((rank, r) => {
    const start = r === 0 ? 0 : Math.max(starts[r - 1] + ALT_STEP, r >= 2 ? ends[r - 2] + NODE_GAP : 0)
    starts.push(start)
    ends.push(start + rank.length * NODE_HEIGHT + (rank.length - 1) * NODE_GAP)
    const x = r % 2 === 0 ? -CENTRE_GAP / 2 - NODE_WIDTH : CENTRE_GAP / 2
    rank.forEach((item, k) => out.set(item.id, { x, y: start + k * (NODE_HEIGHT + NODE_GAP) }))
  })
  return out
}

/** Top-left corner of every node, ranked by dependency (dagre). Same graph in, same picture out. */
function layoutDag(items: readonly DagItem[], layout: DagLayout = "right"): Map<string, Point> {
  if (layout === "down-alternating") return alternatingLayout(items)
  return dagreLayout(items, layout === "right" ? "LR" : "TB")
}

/** down-alternating: the side of the centre line a node sits on; its edges leave and arrive on the other (inner) side. */
const sideOf = (p: Point): "left" | "right" => (p.x < 0 ? "left" : "right")

const overlaps = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) < NODE_WIDTH + NODE_GAP / 2 && Math.abs(a.y - b.y) < NODE_HEIGHT + NODE_GAP / 2

/**
 * A live graph that gained nodes: existing nodes keep the place they had (nothing jumps), new
 * ones go to their rank from a fresh layout, moved along the rank until they overlap nothing.
 * With nothing placed before, it is the fresh layout.
 */
function placeIncrementally(previous: ReadonlyMap<string, Point>, items: readonly DagItem[], layout: DagLayout = "right"): Map<string, Point> {
  const fresh = layoutDag(items, layout)
  if (![...previous.keys()].some((id) => fresh.has(id))) return fresh
  if (layout === "down-alternating") {
    // Kept nodes stay; a new one takes its fresh place, moved down its side until it overlaps nothing.
    const placed = new Map<string, Point>()
    for (const i of items) if (previous.has(i.id)) placed.set(i.id, previous.get(i.id)!)
    for (const i of items) {
      if (placed.has(i.id)) continue
      const p = { ...fresh.get(i.id)! }
      while ([...placed.values()].some((q) => overlaps(p, q))) p.y += NODE_HEIGHT + NODE_GAP
      placed.set(i.id, p)
    }
    return placed
  }
  const rankAxis = layout === "right" ? "x" : "y"
  const crossAxis = layout === "right" ? "y" : "x"
  const step = layout === "right" ? NODE_HEIGHT + NODE_GAP : NODE_WIDTH + NODE_GAP
  const placed = new Map<string, Point>()
  // Where each fresh rank sits in the old picture: the old position of a kept node in that rank.
  const rankAt = new Map<number, number>()
  for (const i of items) {
    const old = previous.get(i.id)
    if (!old) continue
    placed.set(i.id, old)
    const rank = fresh.get(i.id)![rankAxis]
    if (!rankAt.has(rank)) rankAt.set(rank, old[rankAxis])
  }
  for (const i of items) {
    if (placed.has(i.id)) continue
    const f = fresh.get(i.id)!
    const p: Point = { x: f.x, y: f.y }
    p[rankAxis] = rankAt.get(f[rankAxis]) ?? f[rankAxis]
    while ([...placed.values()].some((q) => overlaps(p, q))) p[crossAxis] += step
    placed.set(i.id, p)
  }
  return placed
}

/** Dependencies first (a topological order), ties in the order given; nodes on a cycle go last, in the order given. */
function dependencyOrder(items: readonly DagItem[]): string[] {
  const edges = edgesOf(items)
  const indegree = new Map(items.map((i) => [i.id, 0]))
  const next = new Map<string, string[]>(items.map((i) => [i.id, []]))
  for (const e of edges) {
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1)
    next.get(e.source)!.push(e.target)
  }
  const position = new Map(items.map((i, n) => [i.id, n]))
  const ready = items.filter((i) => indegree.get(i.id) === 0).map((i) => i.id)
  const out: string[] = []
  while (ready.length) {
    ready.sort((a, b) => position.get(a)! - position.get(b)!)
    const id = ready.shift()!
    out.push(id)
    for (const t of next.get(id)!) {
      indegree.set(t, indegree.get(t)! - 1)
      if (indegree.get(t) === 0) ready.push(t)
    }
  }
  const seen = new Set(out)
  return [...out, ...items.filter((i) => !seen.has(i.id)).map((i) => i.id)]
}

function walk(start: string, step: Map<string, string[]>): Set<string> {
  const out = new Set<string>()
  const queue = [...(step.get(start) ?? [])]
  while (queue.length) {
    const id = queue.shift()!
    if (out.has(id)) continue
    out.add(id)
    queue.push(...(step.get(id) ?? []))
  }
  return out
}

/** Everything a node depends on, directly or not (not the node itself). */
function upstreamOf(id: string, items: readonly DagItem[]): Set<string> {
  const up = new Map<string, string[]>()
  for (const e of edgesOf(items)) up.set(e.target, [...(up.get(e.target) ?? []), e.source])
  return walk(id, up)
}

/** Everything that depends on a node, directly or not (not the node itself). */
function downstreamOf(id: string, items: readonly DagItem[]): Set<string> {
  const down = new Map<string, string[]>()
  for (const e of edgesOf(items)) down.set(e.source, [...(down.get(e.source) ?? []), e.target])
  return walk(id, down)
}

/** The edges on a failure's downstream path: out of a failed node, and on from everything downstream of one. */
function failurePath(items: readonly DagItem[]): Set<string> {
  const reached = new Set<string>()
  for (const i of items) if (i.status === "failed") for (const d of [i.id, ...downstreamOf(i.id, items)]) reached.add(d)
  return new Set(edgesOf(items).filter((e) => reached.has(e.source) && reached.has(e.target)).map((e) => e.id))
}

/** Which edges and nodes a selection lights: the node, its upstream and downstream, and the edges between them. */
function selectionPath(id: string, items: readonly DagItem[]): { nodes: Set<string>; edges: Set<string> } {
  const up = upstreamOf(id, items)
  const down = downstreamOf(id, items)
  const upSide = new Set([...up, id])
  const downSide = new Set([...down, id])
  const edges = edgesOf(items).filter((e) => (upSide.has(e.source) && upSide.has(e.target)) || (downSide.has(e.source) && downSide.has(e.target)))
  return { nodes: new Set([...up, id, ...down]), edges: new Set(edges.map((e) => e.id)) }
}

export {
  dependencyOrder,
  downstreamOf,
  edgesOf,
  failurePath,
  layoutDag,
  NODE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  placeIncrementally,
  selectionPath,
  sideOf,
  STATUS_LABEL,
  STATUS_ORDER,
  structureKey,
  summarize,
  upstreamOf,
}
export type { DagEdge, DagItem, DagLayout, DagStatus, Point }
