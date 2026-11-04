// The list page pattern's state and derivation (R12-10). node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  changeListState,
  clearListState,
  defaultListState,
  deriveList,
  isNarrowed,
  normalizeQuery,
  pageSelection,
  parseListState,
  selectionScope,
  serializeListState,
  sortRows,
  sortValuesOf,
  togglePageSelection,
  toggleRowSelection,
  rangeState,
  rangeValue,
  type ListConfig,
  type ListState,
} from "./list-query.ts"

type P = { id: string; name: string; email: string; plan: "direct" | "trial" | "free" | "sponsored"; partner: string | null; created: string; lastActive: string | null }

const rows: P[] = [
  { id: "1", name: "Ada Park", email: "ada@example.com", plan: "direct", partner: null, created: "2025-01-04", lastActive: "2026-10-01" },
  { id: "2", name: "Ben Ortiz", email: "ben@example.com", plan: "trial", partner: null, created: "2026-09-30", lastActive: null },
  { id: "3", name: "Cora Smith", email: "cora.smith@example.com", plan: "sponsored", partner: "Cedar Trust", created: "2024-06-11", lastActive: "2026-10-19" },
  { id: "4", name: "Dev Smithers", email: "dev@example.com", plan: "free", partner: null, created: "2023-02-20", lastActive: "2026-03-02" },
  { id: "5", name: "Eli Smith", email: "eli@example.com", plan: "trial", partner: null, created: "2026-10-12", lastActive: "2026-10-18" },
]

const config: ListConfig<P> = {
  segments: [
    { id: "all", label: "All" },
    { id: "trial", label: "Trial", match: (r) => r.plan === "trial" },
    { id: "sponsored", label: "Sponsored", match: (r) => r.plan === "sponsored" },
  ],
  filters: [
    { id: "plan", label: "Plan", multiple: true, options: [{ value: "direct", label: "Direct" }, { value: "trial", label: "Trial" }, { value: "free", label: "Free" }, { value: "sponsored", label: "Sponsored" }], match: (r, v) => v.includes(r.plan) },
    { id: "partner", label: "Partner", options: [{ value: "cedar", label: "Cedar Trust" }], match: (r, v) => v.includes("cedar") && r.partner === "Cedar Trust" },
    { kind: "date-range", id: "lastActive", label: "Last active", date: (r) => r.lastActive },
  ],
  search: (r, q) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
  sortValues: { name: (r) => r.name, created: (r) => r.created, lastActive: (r) => r.lastActive },
  defaultSort: { id: "created", desc: true },
}

const state = (patch: Partial<ListState> = {}): ListState => ({ ...defaultListState(config), ...patch })

test("defaults: the first segment, no search or filters, the default sort, page 1", () => {
  assert.deepEqual(defaultListState(config), { segment: "all", q: "", filters: {}, sort: { id: "created", desc: true }, page: 1 })
})

test("sortValuesOf: a column's sortValue; a typed column's value (undefined read as null); a plain cell column doesn't sort", () => {
  const sorts = sortValuesOf<P>([
    { id: "name", sortValue: (r) => r.name },
    { id: "created", type: "date", value: (r) => r.created },
    { id: "lastActive", type: "date", value: (r) => r.lastActive ?? undefined },
    { id: "plan" },
  ])
  assert.deepEqual(Object.keys(sorts), ["name", "created", "lastActive"])
  assert.equal(sorts.created!(rows[0]!), "2025-01-04")
  assert.equal(sorts.lastActive!(rows[1]!), null)
})

test("normalizeQuery trims, lowers and collapses whitespace", () => {
  assert.equal(normalizeQuery("  Cora   SMITH "), "cora smith")
  assert.equal(normalizeQuery("   "), "")
})

test("counts follow the search and filters; each segment counts under them", () => {
  const v = deriveList(rows, config, state({ q: "smith" }), 25)
  assert.deepEqual(v.counts, { all: 3, trial: 1, sponsored: 1 })
  assert.deepEqual(v.matching.map((r) => r.id), ["5", "3", "4"]) // created desc
  const f = deriveList(rows, config, state({ filters: { plan: ["trial", "free"] } }), 25)
  assert.deepEqual(f.counts, { all: 3, trial: 2, sponsored: 0 })
})

test("the segment narrows the rows but not the counts", () => {
  const v = deriveList(rows, config, state({ segment: "trial" }), 25)
  assert.deepEqual(v.matching.map((r) => r.id), ["5", "2"])
  assert.deepEqual(v.counts, { all: 5, trial: 2, sponsored: 1 })
})

test("paging slices the sorted matches and clamps a page past the end", () => {
  const v = deriveList(rows, config, state({ sort: { id: "name", desc: false }, page: 2 }), 2)
  assert.deepEqual(v.pageRows.map((r) => r.id), ["3", "4"])
  assert.equal(v.pageCount, 3)
  const past = deriveList(rows, config, state({ page: 9 }), 2)
  assert.equal(past.page, 3)
  assert.equal(past.pageRows.length, 1)
  const none = deriveList(rows, config, state({ q: "nobody" }), 2)
  assert.equal(none.page, 1)
  assert.equal(none.pageCount, 1)
  assert.deepEqual(none.pageRows, [])
})

test("sortRows: nulls last in both directions, stable, unknown id keeps order", () => {
  assert.deepEqual(sortRows(rows, { id: "lastActive", desc: true }, config).map((r) => r.id), ["3", "5", "1", "4", "2"])
  assert.deepEqual(sortRows(rows, { id: "lastActive", desc: false }, config).map((r) => r.id), ["4", "1", "5", "3", "2"])
  assert.deepEqual(sortRows(rows, { id: "nope", desc: false }, config).map((r) => r.id), ["1", "2", "3", "4", "5"])
})

test("parse: reads segment, filters, sort and page; unknown values fall back", () => {
  const p = parseListState(new URLSearchParams("segment=trial&plan=free,direct,bogus&partner=cedar,x&sort=name&page=3&q=ada"), config)
  assert.deepEqual(p, { segment: "trial", filters: { plan: ["free", "direct"], partner: ["cedar"] }, sort: { id: "name", desc: false }, page: 3 })
  const bad = parseListState(new URLSearchParams("segment=nope&plan=bogus&sort=email.desc&page=-2"), config)
  assert.deepEqual(bad, { segment: "all", filters: {}, sort: { id: "created", desc: true }, page: 1 })
  assert.equal(parseListState({ page: "2.5" }, config).page, 1)
  assert.deepEqual(parseListState({ sort: "none" }, config).sort, null)
  assert.equal("q" in parseListState(new URLSearchParams("q=ada"), config), false, "the search never comes from the URL")
})

test("serialize: defaults omitted, fixed key and option order, never the search", () => {
  assert.equal(serializeListState(state({ q: "ada@example.com" }), config), "")
  assert.equal(
    serializeListState(state({ page: 2, sort: { id: "name", desc: false }, filters: { plan: ["free", "direct"] }, segment: "trial", q: "x" }), config),
    "segment=trial&plan=direct,free&sort=name&page=2"
  )
  assert.equal(serializeListState(state({ sort: null }), config), "sort=none")
})

test("parse(serialize(state)) round-trips everything but the search", () => {
  const s = state({ segment: "sponsored", filters: { plan: ["sponsored"], partner: ["cedar"] }, sort: { id: "lastActive", desc: true }, page: 4, q: "smith" })
  assert.deepEqual({ ...parseListState(new URLSearchParams(serializeListState(s, config)), config), q: s.q }, s)
})

test("changeListState: a change to what matches or the order goes back to page 1; paging doesn't", () => {
  const s = state({ page: 3 })
  assert.equal(changeListState(s, { segment: "trial" }).page, 1)
  assert.equal(changeListState(s, { q: "a" }).page, 1)
  assert.equal(changeListState(s, { filters: { plan: ["free"] } }).page, 1)
  assert.equal(changeListState(s, { sort: null }).page, 1)
  assert.equal(changeListState(s, { page: 4 }).page, 4)
  assert.equal(changeListState(s, { segment: "all" }).page, 3, "choosing the segment already chosen keeps the page")
})

test("isNarrowed and clearListState", () => {
  assert.equal(isNarrowed(state(), config), false)
  assert.equal(isNarrowed(state({ q: "  " }), config), false)
  assert.equal(isNarrowed(state({ filters: { plan: ["free"] } }), config), true)
  const cleared = clearListState(state({ segment: "trial", q: "a", filters: { plan: ["free"] }, sort: { id: "name", desc: false }, page: 3 }), config)
  assert.deepEqual(cleared, state({ sort: { id: "name", desc: false } }))
})

test("selection: page state, the header toggle keeps other pages, row toggle", () => {
  const sel = new Set(["9"])
  assert.equal(pageSelection(["1", "2"], sel), "none")
  const all = togglePageSelection(["1", "2"], sel)
  assert.deepEqual([...all].sort(), ["1", "2", "9"])
  assert.equal(pageSelection(["1", "2"], all), "all")
  const some = toggleRowSelection("2", all)
  assert.equal(pageSelection(["1", "2"], some), "some")
  assert.deepEqual([...togglePageSelection(["1", "2"], some)].sort(), ["1", "2", "9"], "mixed → whole page")
  assert.deepEqual([...togglePageSelection(["1", "2"], all)], ["9"], "all → page cleared, other pages kept")
})

test("selectionScope changes with segment, search and filters, not with sort or page", () => {
  const base = selectionScope(state())
  assert.equal(selectionScope(state({ sort: null, page: 4 })), base)
  assert.equal(selectionScope(state({ q: "  ADA " })), selectionScope(state({ q: "ada" })))
  assert.notEqual(selectionScope(state({ segment: "trial" })), base)
  assert.notEqual(selectionScope(state({ filters: { plan: ["free"] } })), base)
  assert.equal(selectionScope(state({ filters: { plan: ["free", "direct"] } })), selectionScope(state({ filters: { plan: ["direct", "free"] } })))
})

test("date-range filters (R13-06): inclusive match, never-active rows out, from..to in the URL", () => {
  const s = state({ filters: { lastActive: rangeState({ from: "2026-10-01", to: "2026-10-18" }) } })
  assert.deepEqual(deriveList(rows, config, s, 25).matching.map((r) => r.id).sort(), ["1", "5"])
  assert.equal(serializeListState(s, config), "lastActive=2026-10-01..2026-10-18")
  assert.deepEqual(parseListState(new URLSearchParams("lastActive=2026-10-18..2026-10-01"), config).filters, { lastActive: ["2026-10-01..2026-10-18"] })
  assert.deepEqual(parseListState(new URLSearchParams("lastActive=junk"), config).filters, {})
  assert.deepEqual(rangeValue(s.filters.lastActive), { from: "2026-10-01", to: "2026-10-18" })
  assert.deepEqual(rangeState({ from: "", to: "" }), [])
})
