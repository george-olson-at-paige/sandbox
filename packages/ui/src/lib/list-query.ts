/* The list page pattern's state and derivation (R12-10, rationale in REVIEW-12): pure functions,
   no React, tested under node (list-query.test.ts). ListPage (templates/list-page.tsx) runs them
   for a list that fits in memory; the app keeps the state in the URL with parse/serialize.

   State: one segment (a filter card), the search text, the page's filters (each a set of chosen
   option values), the sort and the page (1-based). The URL carries everything but the search:
   a typed email is PII, and PII stays out of URLs (product-engineering.md rule 7); the app keeps
   the search per tab instead. */

import { EMPTY_RANGE, inRange, parseRange, serializeRange, type DateRange } from "./date-range.ts"

/** A sort: a column id and its direction; null = the page's natural order. */
export type ListSort = { id: string; desc: boolean } | null

/** Everything a list page's view depends on. */
export type ListState = {
  /** The chosen segment's id (a filter card). */
  segment: string
  /** The search as typed (matched normalised: trimmed, lower case, single spaces). */
  q: string
  /** Chosen option values per filter id; a filter with nothing chosen is absent. */
  filters: Readonly<Record<string, readonly string[]>>
  sort: ListSort
  /** 1-based. */
  page: number
}

/** A segment: a named question with a count (one filter card). No `match` = every row ("All"). */
export type ListSegment<Row> = { id: string; label: string; description?: string; match?: (row: Row) => boolean }

/** One option of a filter. */
export type ListFilterOption = { value: string; label: string }

/** A filter of chosen options. `multiple`: any of the chosen values (a MultiSelect); otherwise one (a Select). */
export type ListOptionFilter<Row> = {
  kind?: "options"
  id: string
  label: string
  options: readonly ListFilterOption[]
  multiple?: boolean
  /** What the control says with nothing chosen ("Any plan"). */
  placeholder?: string
  /** True when the row passes with these values chosen (never called with an empty list). */
  match: (row: Row, values: readonly string[]) => boolean
}

/** A filter on one of the row's dates (R13-06): a DateRangeField. Its value in the state is one
    string, the range as `from..to` (lib/date-range.ts), so the state and the URL stay string lists. */
export type ListDateRangeFilter<Row> = {
  kind: "date-range"
  id: string
  label: string
  /** The row's date (ISO date or date-time); null never matches a set range. */
  date: (row: Row) => string | null
}

/** A filter group in the toolbar's Filters popover. */
export type ListFilter<Row> = ListOptionFilter<Row> | ListDateRangeFilter<Row>

/** The range a date filter's state value holds (the empty range when none). */
export function rangeValue(values: readonly string[] | undefined): DateRange {
  return parseRange(values?.[0]) ?? EMPTY_RANGE
}

/** A date filter's state value for a range ([] when empty). */
export function rangeState(range: DateRange): string[] {
  const s = serializeRange(range)
  return s ? [s] : []
}

/** True when the row passes the filter with these values (never called with an empty list). */
export function filterMatches<Row>(filter: ListFilter<Row>, row: Row, values: readonly string[]): boolean {
  if (filter.kind === "date-range") return inRange(filter.date(row), rangeValue(values))
  return filter.match(row, values)
}

/** What the derivation needs from a page. */
export type ListConfig<Row> = {
  segments: readonly ListSegment<Row>[]
  filters?: readonly ListFilter<Row>[]
  /** True when the row matches the normalised search text (never called with ""). */
  search?: (row: Row, q: string) => boolean
  /** Column ids a sort may name (from the URL), and how each sorts. */
  sortValues?: Readonly<Record<string, (row: Row) => string | number | null>>
  defaultSort?: ListSort
}

type SortableColumn<Row> = {
  id: string
  sortValue?: (row: Row) => string | number | null
  /** A typed column (DataTable, R20-23) sorts by its raw `value` when it has no `sortValue`. */
  type?: string
  value?: (row: Row) => string | number | null | undefined
}

/** The sort functions of the columns that sort (DataTable's columns, structurally, typed ones by their `value`): `sortValues` for a config. */
export function sortValuesOf<Row>(columns: ReadonlyArray<SortableColumn<Row>>): Record<string, (row: Row) => string | number | null> {
  const sortOf = (c: SortableColumn<Row>) => c.sortValue ?? (c.type && c.value ? (row: Row) => c.value!(row) ?? null : undefined)
  return Object.fromEntries(columns.flatMap((c) => (sortOf(c) ? [[c.id, sortOf(c)!]] : [])))
}

/** URL keys the pattern reserves; a filter id may not be one of them. */
const RESERVED = new Set(["segment", "q", "sort", "page"])

/** The state a list page opens with. */
export function defaultListState<Row>(config: ListConfig<Row>): ListState {
  return { segment: config.segments[0]?.id ?? "all", q: "", filters: {}, sort: config.defaultSort ?? null, page: 1 }
}

/** Trimmed, lower case, inner whitespace collapsed: what `search` receives. */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ")
}

type ParamSource = URLSearchParams | Readonly<Record<string, string | readonly string[] | undefined>>
function read(params: ParamSource, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const v = params[key]
  return Array.isArray(v) ? v[0] : (v as string | undefined)
}

/** The URL's part of the state (all but `q`). Unknown segments, options and sort ids fall back to the defaults; a bad page is 1. */
export function parseListState<Row>(params: ParamSource, config: ListConfig<Row>): Omit<ListState, "q"> {
  const d = defaultListState(config)
  const seg = read(params, "segment")
  const segment = seg && config.segments.some((s) => s.id === seg) ? seg : d.segment
  const filters: Record<string, string[]> = {}
  for (const f of config.filters ?? []) {
    if (RESERVED.has(f.id)) throw new Error(`list-query: filter id "${f.id}" is reserved`)
    const raw = read(params, f.id)
    if (!raw) continue
    if (f.kind === "date-range") {
      const range = parseRange(raw)
      if (range) filters[f.id] = rangeState(range)
      continue
    }
    const known = new Set(f.options.map((o) => o.value))
    const values = [...new Set(raw.split(",").filter((v) => known.has(v)))]
    const kept = f.multiple ? values : values.slice(0, 1)
    if (kept.length) filters[f.id] = kept
  }
  let sort = d.sort
  const rawSort = read(params, "sort")
  if (rawSort === "none") sort = null
  else if (rawSort) {
    const [id, dir] = rawSort.split(".")
    if (config.sortValues && id in config.sortValues && (dir === undefined || dir === "desc" || dir === "asc")) sort = { id, desc: dir === "desc" }
  }
  const n = Number(read(params, "page"))
  const page = Number.isInteger(n) && n >= 1 ? n : 1
  return { segment, filters, sort, page }
}

/** The query string for the state (no `?`), defaults left out, `q` never written. Keys in a fixed order, values in option order, so equal states give equal strings. */
export function serializeListState<Row>(state: ListState, config: ListConfig<Row>): string {
  const d = defaultListState(config)
  const out = new URLSearchParams()
  if (state.segment !== d.segment) out.set("segment", state.segment)
  for (const f of config.filters ?? []) {
    if (f.kind === "date-range") {
      const v = serializeRange(rangeValue(state.filters[f.id]))
      if (v) out.set(f.id, v)
      continue
    }
    const chosen = new Set(state.filters[f.id] ?? [])
    const values = f.options.map((o) => o.value).filter((v) => chosen.has(v))
    if (values.length) out.set(f.id, values.join(","))
  }
  const sameSort = (a: ListSort, b: ListSort) => (a === null ? b === null : b !== null && a.id === b.id && a.desc === b.desc)
  if (!sameSort(state.sort, d.sort)) out.set("sort", state.sort === null ? "none" : `${state.sort.id}${state.sort.desc ? ".desc" : ""}`)
  if (state.page > 1) out.set("page", String(state.page))
  // URLSearchParams escapes "," as %2C; the lists read better plain, and "," is safe in a query.
  return out.toString().replace(/%2C/g, ",")
}

/** The next state after a change. Any change to what matches (segment, search, filters) or to the order goes back to page 1. */
export function changeListState(state: ListState, patch: Partial<ListState>): ListState {
  const next = { ...state, ...patch }
  const reset = ("segment" in patch && patch.segment !== state.segment) || ("q" in patch && patch.q !== state.q) || "filters" in patch || "sort" in patch
  return reset && !("page" in patch) ? { ...next, page: 1 } : next
}

/** True when anything beyond the defaults narrows the list (Clear all shows). */
export function isNarrowed<Row>(state: ListState, config: ListConfig<Row>): boolean {
  return state.segment !== defaultListState(config).segment || normalizeQuery(state.q) !== "" || Object.values(state.filters).some((v) => v.length > 0)
}

/** The state with segment, search and filters back to the defaults (sort kept). */
export function clearListState<Row>(state: ListState, config: ListConfig<Row>): ListState {
  return { ...state, segment: defaultListState(config).segment, q: "", filters: {}, page: 1 }
}

/** Rows passing the search and filters (not the segment). */
function passBase<Row>(rows: readonly Row[], config: ListConfig<Row>, state: ListState): Row[] {
  const q = normalizeQuery(state.q)
  const filters = (config.filters ?? []).filter((f) => (state.filters[f.id]?.length ?? 0) > 0)
  return rows.filter((r) => (q === "" || !config.search || config.search(r, q)) && filters.every((f) => filterMatches(f, r, state.filters[f.id]!)))
}

/** Compares two sort values: numbers numerically, strings by locale, null last in either direction. */
function compare(a: string | number | null, b: string | number | null, desc: boolean): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1
  const c = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "en-US", { sensitivity: "base", numeric: true })
  return desc ? -c : c
}

/** A stable sort of the rows by the state's sort (unchanged order without one, or for an unknown id). */
export function sortRows<Row>(rows: readonly Row[], sort: ListSort, config: ListConfig<Row>): Row[] {
  const value = sort && config.sortValues?.[sort.id]
  if (!sort || !value) return [...rows]
  return rows
    .map((row, i) => ({ row, i, v: value(row) }))
    .sort((a, b) => compare(a.v, b.v, sort.desc) || a.i - b.i)
    .map((x) => x.row)
}

/** What a list page shows for a state. */
export type ListView<Row> = {
  /** Every row the state matches, sorted. */
  matching: Row[]
  /** The current page of `matching`. */
  pageRows: Row[]
  /** The page actually shown (the state's, clamped to the last page). */
  page: number
  pageCount: number
  /** Per segment: how many rows it would show with the current search and filters. */
  counts: Record<string, number>
}

/** Derives the view: search and filters, the segment, the sort, the page; and every segment's count under the same search and filters. */
export function deriveList<Row>(rows: readonly Row[], config: ListConfig<Row>, state: ListState, pageSize: number): ListView<Row> {
  const base = passBase(rows, config, state)
  const counts: Record<string, number> = {}
  for (const s of config.segments) counts[s.id] = s.match ? base.filter(s.match).length : base.length
  const segment = config.segments.find((s) => s.id === state.segment)
  const matching = sortRows(segment?.match ? base.filter(segment.match) : base, state.sort, config)
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize))
  const page = Math.min(Math.max(1, state.page), pageCount)
  return { matching, pageRows: matching.slice((page - 1) * pageSize, page * pageSize), page, pageCount, counts }
}

/** How much of a page is selected: drives the header checkbox (unchecked, mixed, checked). */
export function pageSelection(pageIds: readonly string[], selected: ReadonlySet<string>): "none" | "some" | "all" {
  const n = pageIds.filter((id) => selected.has(id)).length
  return n === 0 ? "none" : n === pageIds.length ? "all" : "some"
}

/** The header checkbox's toggle: a fully selected page is deselected, otherwise the whole page is added. Rows on other pages are kept. */
export function togglePageSelection(pageIds: readonly string[], selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected)
  if (pageSelection(pageIds, selected) === "all") for (const id of pageIds) next.delete(id)
  else for (const id of pageIds) next.add(id)
  return next
}

/** One row's checkbox. */
export function toggleRowSelection(id: string, selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** The key that clears a selection when it changes: segment, normalised search and filters (not sort or page). */
export function selectionScope(state: ListState): string {
  const filters = Object.keys(state.filters)
    .sort()
    .map((k) => `${k}=${[...state.filters[k]].sort().join(",")}`)
  return [state.segment, normalizeQuery(state.q), ...filters].join("|")
}
