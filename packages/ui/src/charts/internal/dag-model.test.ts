// The graph frame's model (R9-06). node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  dependencyOrder,
  downstreamOf,
  edgesOf,
  failurePath,
  layoutDag,
  NODE_HEIGHT,
  NODE_WIDTH,
  placeIncrementally,
  selectionPath,
  sideOf,
  structureKey,
  summarize,
  upstreamOf,
  type DagItem,
} from "./dag-model.ts"

// a → c, b → c, c → d, c → e; e → f
const G: DagItem[] = [
  { id: "a", dependsOn: [], status: "succeeded" },
  { id: "b", dependsOn: [], status: "succeeded" },
  { id: "c", dependsOn: ["a", "b"], status: "failed" },
  { id: "d", dependsOn: ["c"], status: "skipped" },
  { id: "e", dependsOn: ["c"], status: "skipped" },
  { id: "f", dependsOn: ["e", "ghost", "f"], status: "skipped" },
]

test("edges ignore missing and self dependencies", () => {
  assert.deepEqual(
    edgesOf(G).map((e) => e.id),
    ["a->c", "b->c", "c->d", "c->e", "e->f"]
  )
})

test("layout is deterministic and ranked left to right by dependency", () => {
  const one = layoutDag(G, "right")
  const two = layoutDag(structuredClone(G), "right")
  assert.deepEqual([...one], [...two])
  assert.ok(one.get("a")!.x < one.get("c")!.x)
  assert.ok(one.get("c")!.x < one.get("e")!.x && one.get("e")!.x < one.get("f")!.x)
  assert.equal(one.get("a")!.x, one.get("b")!.x)
})

test("top to bottom ranks on y", () => {
  const tb = layoutDag(G, "down")
  assert.ok(tb.get("a")!.y < tb.get("c")!.y && tb.get("c")!.y < tb.get("d")!.y)
})

test("the structure key ignores status", () => {
  const changed = G.map((i) => ({ ...i, status: "running" as const }))
  assert.equal(structureKey(G, "right"), structureKey(changed, "right"))
  assert.notEqual(structureKey(G, "right"), structureKey(G, "down"))
})

test("a new node leaves existing nodes where they were and overlaps none", () => {
  const before = layoutDag(G, "right")
  const grown = [...G, { id: "g", dependsOn: ["c"] }]
  const after = placeIncrementally(before, grown, "right")
  for (const [id, p] of before) assert.deepEqual(after.get(id), p, `${id} moved`)
  const g = after.get("g")!
  for (const [id, p] of before)
    assert.ok(Math.abs(p.x - g.x) >= NODE_WIDTH || Math.abs(p.y - g.y) >= NODE_HEIGHT, `g overlaps ${id}`)
  assert.equal(g.x, before.get("d")!.x, "g sits in c's downstream rank")
})

const noOverlaps = (at: Map<string, { x: number; y: number }>) => {
  const all = [...at]
  for (const [i, [a, p]] of all.entries())
    for (const [b, q] of all.slice(i + 1)) assert.ok(Math.abs(p.x - q.x) >= NODE_WIDTH || Math.abs(p.y - q.y) >= NODE_HEIGHT, `${a} overlaps ${b}`)
}

test("down-alternating: a linear run alternates sides, top to bottom, deterministically", () => {
  const run = ["a", "b", "c", "d", "e"].map((id, n, ids) => ({ id, dependsOn: n ? [ids[n - 1]] : [] }))
  const at = layoutDag(run, "down-alternating")
  assert.deepEqual([...at], [...layoutDag(structuredClone(run), "down-alternating")])
  assert.deepEqual(run.map((i) => sideOf(at.get(i.id)!)), ["left", "right", "left", "right", "left"])
  for (let n = 1; n < run.length; n++) assert.ok(at.get(run[n].id)!.y > at.get(run[n - 1].id)!.y, "each rank is lower")
  // Neighbours overlap in height (the zig-zag is compact); same-side ranks clear each other.
  assert.ok(at.get("b")!.y < at.get("a")!.y + NODE_HEIGHT)
  noOverlaps(at)
})

test("down-alternating: a branching rank stacks on its side, nothing overlaps", () => {
  const at = layoutDag(G, "down-alternating")
  assert.equal(sideOf(at.get("a")!), "left")
  assert.equal(sideOf(at.get("b")!), "left")
  assert.equal(at.get("a")!.x, at.get("b")!.x, "a rank's nodes share one column")
  assert.equal(sideOf(at.get("c")!), "right")
  assert.equal(sideOf(at.get("d")!), "left")
  assert.equal(sideOf(at.get("f")!), "right")
  noOverlaps(at)
  // A new node keeps the others where they were.
  const after = placeIncrementally(at, [...G, { id: "g", dependsOn: ["c"] }], "down-alternating")
  for (const [id, p] of at) assert.deepEqual(after.get(id), p, `${id} moved`)
  noOverlaps(after)
})

test("dependency order puts dependencies first, ties in the given order", () => {
  assert.deepEqual(dependencyOrder(G), ["a", "b", "c", "d", "e", "f"])
  assert.deepEqual(dependencyOrder([{ id: "z", dependsOn: ["y"] }, { id: "y", dependsOn: [] }]), ["y", "z"])
  // A cycle doesn't lose nodes.
  assert.deepEqual(dependencyOrder([{ id: "p", dependsOn: ["q"] }, { id: "q", dependsOn: ["p"] }, { id: "r", dependsOn: [] }]), ["r", "p", "q"])
})

test("upstream and downstream", () => {
  assert.deepEqual([...upstreamOf("f", G)].sort(), ["a", "b", "c", "e"])
  assert.deepEqual([...downstreamOf("c", G)].sort(), ["d", "e", "f"])
})

test("a selection lights its paths, not its siblings", () => {
  const { nodes, edges } = selectionPath("e", G)
  assert.deepEqual([...nodes].sort(), ["a", "b", "c", "e", "f"])
  assert.ok(!edges.has("c->d"))
  assert.ok(edges.has("a->c") && edges.has("e->f"))
})

test("a failure marks its downstream edges", () => {
  assert.deepEqual([...failurePath(G)].sort(), ["c->d", "c->e", "e->f"])
})

test("summary counts by status", () => {
  assert.equal(summarize(G), "6 steps: 2 succeeded, 1 failed, 3 skipped")
  assert.equal(summarize([{ id: "x", dependsOn: [], status: "running" }]), "1 step: 1 running")
  assert.equal(summarize([], { one: "task", other: "tasks" }), "No tasks")
})

// R12-07: the shape without the layout library (dag-shape.ts).
import { autoCanvasHeight, graphHeight, ranksOf, statusCounts } from "./dag-shape.ts"

test("ranks are the longest path from a root; a cycle doesn't loop", () => {
  const r = ranksOf(G)
  assert.deepEqual([...r.entries()], [["a", 0], ["b", 0], ["c", 1], ["d", 2], ["e", 2], ["f", 3]])
  const cyc = ranksOf([{ id: "x", dependsOn: ["y"] }, { id: "y", dependsOn: ["x"] }])
  assert.equal(cyc.size, 2)
})

test("the estimated graph height matches dagre's picture", () => {
  for (const layout of ["right", "down", "down-alternating"] as const) {
    const at = [...layoutDag(G, layout).values()]
    const actual = Math.max(...at.map((p) => p.y)) - Math.min(...at.map((p) => p.y)) + NODE_HEIGHT
    assert.equal(graphHeight(G, layout), actual, layout)
  }
})

test("auto canvas height: the graph's proportions at 75%, 384–560 in 32px steps", () => {
  // Two nodes per rank at most, left to right: 168 × 0.75 + 48 = 174 → the 384 floor.
  assert.deepEqual(autoCanvasHeight(G, "right"), { px: 384, className: "h-96" })
  // Four ranks top to bottom: (4 × 72 + 3 × 64) × 0.75 + 48 = 408 → 416.
  assert.deepEqual(autoCanvasHeight(G, "down"), { px: 416, className: "h-104" })
  // A long chain top to bottom hits the 560 ceiling.
  const chain: DagItem[] = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, dependsOn: i ? [`n${i - 1}`] : [] }))
  assert.deepEqual(autoCanvasHeight(chain, "down"), { px: 560, className: "h-140" })
  // Six wide in one rank, left to right: (6 × 72 + 5 × 24) × 0.75 + 48 = 462 → 480.
  const wide: DagItem[] = Array.from({ length: 6 }, (_, i) => ({ id: `w${i}`, dependsOn: [] }))
  assert.equal(autoCanvasHeight(wide, "right").px, 480)
  assert.equal(autoCanvasHeight([], "right").px, 384)
})

test("status counts: only the statuses present, in the legend's order", () => {
  assert.deepEqual(statusCounts(G), [{ status: "succeeded", count: 2 }, { status: "failed", count: 1 }, { status: "skipped", count: 3 }])
})
