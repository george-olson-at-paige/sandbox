"use client"

import { useEffect, useId, useMemo, useRef, useState, type ElementType, type ReactNode } from "react"
import { formatCount } from "../lib/format"

import {
  changeListState,
  clearListState,
  deriveList,
  normalizeQuery,
  selectionScope,
  sortValuesOf,
  type ListConfig,
  type ListFilter,
  type ListSegment,
  type ListSort,
  type ListState,
} from "../lib/list-query"
import { Button } from "../components/actions/button"
import { RowActions, type ListAction, type RunnableAction } from "../components/actions/row-actions"
import { DataTable, type DataTableColumn, type DataTableProps } from "../components/display/data-table"
import type { EmptyStateProps } from "../components/feedback/empty-state"
import { BulkActionBar } from "../patterns/bulk-action-bar"
import { FilterCardRow } from "../patterns/filter-card-row"
import { FilterChips } from "../patterns/filter-chips"
import { ListToolbar } from "../patterns/list-toolbar"
import { Stack } from "../primitives/stack"

/* @archetype Frame (ARCHETYPES.md).
   ListPage (R12-10, rationale in REVIEW-12): the list page pattern every admin page like People
   uses: filter cards (FilterCardRow) → the toolbar (ListToolbar: search, Filters, chips, Clear
   all, the status line and the count) → the table (DataTable with a checkbox column, the row
   click, the overflow menu), the toolbar row becoming the BulkActionBar while rows are selected.
   It sits in AdminPage's children (the page frame stays AdminPage's).
   What ListPage owns, the same on every page:
   - The state's shape and its derivation (`lib/list-query.ts`, tested): segment AND search AND
     filters; each card's count under the same search and filters; sort; page (reset on any
     change to what matches, clamped). The state is the page's (`state` / `onStateChange`), so the
     app keeps it in the URL (all but the search, which is PII-shaped: rule 7).
   - Selection: kept across pages and sorts, cleared when the segment, search or filters change
     (a bulk action never reaches rows you can no longer see) and after a bulk action works;
     select-all-matching from the bar; when it ends, focus goes back to the search.
   - The states: loading (card counts and rows as skeletons), error (in place with Retry; cards
     and search stay usable), empty (`emptyMessage`: nothing exists yet), no results (what was
     searched, and Clear all).
   What a page supplies is data: its noun, segments, filters, the search match, columns, row and
   bulk actions, the row's link. Derivation is in memory; a server-backed list (counts and one
   page from the API) would pass those in instead: DataTable's controlled sort and page are that
   seam (not built: no list needs it yet, GAPS #133). */

type ListPageProps<Row> = {
  /** What a row is, singular and plural ({ one: "person", other: "people" }). */
  noun: { one: string; other: string }
  /** The table's accessible name ("People"). */
  label: string
  /** Every row (the list fits in memory). */
  rows: readonly Row[]
  getRowId: (row: Row) => string
  /** Names a row (the checkbox's and the menu's labels: "Select Ada Park", "Actions for Ada Park"). */
  rowLabel: (row: Row) => string
  columns: ReadonlyArray<DataTableColumn<Row>>
  /** The filter cards, two to five; the first is the default ("All"). */
  segments: readonly ListSegment<Row>[]
  /** The toolbar's Filters groups. */
  filters?: readonly ListFilter<Row>[]
  /** What the search matches (normalised text, never ""), its label and placeholder. */
  search: { match: (row: Row, q: string) => boolean; label: string; placeholder: string }
  /** The sort a page opens with. */
  defaultSort?: ListSort
  /** The view: segment, search, filters, sort, page (the page keeps it, in the URL). */
  state: ListState
  onStateChange: (next: ListState) => void
  /** Rows per page (default 25). */
  pageSize?: number
  /** Column widths can be dragged (DataTable's `resizable`, R20-25): the columns' `width`s size the table. */
  resizable?: boolean
  /** The rows' density (DataTable's): default, or compact for a list read as a grid (R20-25). */
  density?: DataTableProps<Row>["density"]
  /** Opens the row (its page); the row's own link in a cell is the keyboard path. */
  onRowClick?: (row: Row) => void
  /** The row's overflow menu entries. */
  rowActions?: (row: Row) => ListAction[]
  /** The selection's actions; omit for a list without selection. */
  bulkActions?: (selected: Row[]) => ListAction[]
  /** Hears an action that worked (row or bulk) with the rows it ran on: show the result in `status` or in the rows. */
  onActionDone?: (action: RunnableAction, rows: Row[]) => void
  /** An action's result, in the toolbar row ("Verification email sent to Ada Park."). */
  status?: ReactNode
  /** The list is loading. */
  loading?: boolean
  /** The load failed. */
  error?: { message: string; onRetry?: () => void }
  /** What the table says when nothing exists at all ("No people yet."). */
  emptyMessage: string
  /** The app's router link (row actions' links). */
  linkAs?: ElementType
  /** Today (ISO): the date filters' presets and chips. Required (R17-05): a missing one fell back to
      the local date, which differs between a server render and the browser. */
  today: string
}

/** The list page pattern: filter cards, a toolbar (search, filters, count), the table with selection, row actions and the bulk action bar; state in the caller's hands (the URL). */
function ListPage<Row extends object>({
  noun,
  label,
  rows,
  getRowId,
  rowLabel,
  columns,
  segments,
  filters,
  search,
  defaultSort = null,
  state,
  onStateChange,
  pageSize = 25,
  resizable = false,
  density = "default",
  onRowClick,
  rowActions,
  bulkActions,
  onActionDone,
  status,
  loading = false,
  error,
  emptyMessage,
  linkAs,
  today,
}: ListPageProps<Row>) {
  const searchId = useId()
  const sortValues = useMemo(() => sortValuesOf(columns), [columns])
  const config: ListConfig<Row> = useMemo(() => ({ segments, filters, search: search.match, sortValues, defaultSort }), [segments, filters, search.match, sortValues, defaultSort])
  const view = useMemo(() => deriveList(loading || error ? [] : rows, config, state, pageSize), [rows, config, state, pageSize, loading, error])
  const word = (n: number) => (n === 1 ? noun.one : noun.other)

  // Selection: cleared when what matches changes; ended by Clear, Escape or a bulk action that worked.
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const scope = selectionScope(state)
  const lastScope = useRef(scope)
  useEffect(() => {
    if (lastScope.current !== scope) {
      lastScope.current = scope
      setSelected(new Set())
    }
  }, [scope])
  const refocus = useRef(false)
  useEffect(() => {
    if (refocus.current && selected.size === 0) {
      refocus.current = false
      document.getElementById(searchId)?.focus()
    }
  }, [selected, searchId])
  const endSelection = () => {
    refocus.current = true
    setSelected(new Set())
  }

  const change = (patch: Partial<ListState>) => onStateChange(changeListState(state, patch))
  const clearAll = () => onStateChange(clearListState(state, config))
  const pageIds = view.pageRows.map(getRowId)
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const selectedRows = selected.size ? view.matching.filter((r) => selected.has(getRowId(r))) : []
  const segmentLabel = segments.find((s) => s.id === state.segment)?.label
  const q = normalizeQuery(state.q)

  // U-03: the no-results EmptyState DataTable shows in place of its rows.
  const noResults: EmptyStateProps = {
    kind: "no-results",
    title: (
      <>
        No {noun.other} match
        {q ? ` “${state.q.trim()}”` : " these filters"}
        {state.segment !== segments[0]?.id && segmentLabel ? ` in ${segmentLabel}` : ""}.
      </>
    ),
    actions: (
      <Button variant="secondary" size="sm" onClick={clearAll}>
        Clear all
      </Button>
    ),
  }

  const controls =
    bulkActions && selected.size > 0 ? (
      <BulkActionBar
        count={selected.size}
        noun={noun}
        matching={view.matching.length}
        pageAllSelected={pageAllSelected}
        onSelectAllMatching={() => setSelected(new Set(view.matching.map(getRowId)))}
        onClear={endSelection}
        actions={bulkActions(selectedRows)}
        linkAs={linkAs}
        status={status}
        onDone={(a) => {
          onActionDone?.(a, selectedRows)
          endSelection()
        }}
      />
    ) : (
      <ListToolbar
        searchId={searchId}
        search={{ value: state.q, onChange: (v) => change({ q: v }), label: search.label, placeholder: search.placeholder }}
        filters={filters}
        values={state.filters}
        onFiltersChange={(next) => change({ filters: next })}
        today={today}
        status={status}
        count={loading || error ? "" : `${formatCount(view.matching.length)} ${word(view.matching.length)}`}
      />
    )
  // The applied filters get their own row under the toolbar (R13-04), kept while rows are selected
  // (the bar takes only the controls' row), so the bar's swap never moves the table.
  const toolbar = (
    <div className="flex w-full flex-col gap-2">
      {controls}
      {filters && <FilterChips filters={filters} values={state.filters} onChange={(next) => change({ filters: next })} today={today} />}
    </div>
  )

  return (
    <Stack gap={4} data-slot="list-page">
      <FilterCardRow
        label={`${label}: segments`}
        cards={segments.map((s) => ({ id: s.id, label: s.label, description: s.description, count: error ? null : (view.counts[s.id] ?? 0) }))}
        value={state.segment}
        onValueChange={(id) => change({ segment: id })}
        loading={loading}
      />
      <DataTable
        rows={view.pageRows}
        columns={columns}
        getRowId={getRowId}
        label={label}
        toolbar={toolbar}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        emptyState={rows.length > 0 && !loading && !error ? noResults : undefined}
        maxHeight="none"
        columnsMenu={false}
        resizable={resizable}
        density={density}
        sorting={{ sort: state.sort, onSortChange: (sort) => change({ sort }) }}
        paging={{ page: view.page, pageSize, total: view.matching.length, onPageChange: (page) => change({ page }) }}
        selection={bulkActions ? { selected, onSelectedChange: setSelected, rowLabel } : undefined}
        onRowClick={onRowClick}
        rowActions={
          rowActions
            ? (row) => (
                <RowActions
                  actions={rowActions(row)}
                  label={`Actions for ${rowLabel(row)}`}
                  linkAs={linkAs}
                  onDone={(a) => onActionDone?.(a, [row])}
                />
              )
            : undefined
        }
      />
    </Stack>
  )
}

/* R13-02: ListPage's children's types, re-exported under the pattern's names, so a screen (or the
   adapter from an API's generated types) imports the one template and types its data against it. */
/** One column of a list page (DataTable's column). */
type ListColumn<Row> = DataTableColumn<Row>
/** One row or bulk action (link · action · destructive). */
type RowAction = ListAction

export { ListPage }
export type { ListColumn, ListFilter, ListPageProps, ListSegment, ListSort, ListState, RowAction, RunnableAction }
