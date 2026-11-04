"use client"

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react"
import {
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type PaginationState,
  type Row as TableRowModel,
  type SortingState,
  type ColumnVisibilityState,
  type Updater,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Columns3, GripVerticalIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import type { FormattedValue } from "../../lib/format-kind"
import type { Density } from "../../lib/vocabulary"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../base/table"
import { Button } from "../actions/button"
import { DropdownMenu } from "../actions/dropdown-menu"
import { EmptyState, type EmptyStateProps } from "../feedback/empty-state"
import { Skeleton } from "../feedback/skeleton"
import { Checkbox } from "../inputs/checkbox"
import { SORTABLE_COPY, sortableAnnouncements, useSortableSensors } from "../inputs/sortable"
import { pressable } from "../internal/control"
import { Formatted } from "./formatted"

/* @archetype Composite (ARCHETYPES.md).
   DataTable (R8-10): the shadcn data-table pattern (TanStack Table 9 over the upstream table
   base) behind a narrow, typed API: columns are { id, header, cell, sortValue?, numeric? } and
   rows are the caller's own objects; TanStack's types never reach a screen.
   - TanStack 9 (D-11, STACK.md): `useTable` with an explicit `tableFeatures` set — only the
     features this table uses are compiled in (sorting, pagination, column visibility, and
     their row models); the next ones (resizing, pinning, filters, expansion: R20-22…25) are
     added to `features` below, one line each, not by swapping the library.
   - Sorting: a column with `sortValue` gets a header button (ascending → descending → off; a
     numeric column starts descending: the biggest or newest first), and `aria-sort` on its
     header; empty values sort last either way.
   - Numeric columns (counts, money, durations, dates you compare) are right-aligned with
     tabular figures, header included, so digits line up.
   - The header sticks while the body scrolls inside the table's box (`maxHeight`, default lg
     640px; "none" for a short table, without the sticky header).
   - Columns menu: show or hide any column but the first (`hideable: false` pins one;
     `defaultHidden` starts one hidden).
   - Pagination: client-side, `pageSize` rows (default 25), "1–25 of 120" and previous/next; hidden
     when everything fits on one page.
   - States: loading (skeleton rows, aria-busy), error (the message and Retry, in place: input
     and position kept), empty (`emptyMessage`). No success banner: rows simply update.
   - Header (R10-09): `title` (a heading) and `actions` sit in one toolbar row with the screen's
     own controls (`toolbar`) and the Columns menu, on one line (centred on the control height),
     and `description` under it, so the table's buttons line up with its title instead of a
     hand-built heading above it.
   - Scrolling (R10-08): the box scrolls with the theme's thin scrollbar; with a max height it
     reserves the gutter (scrollbar-stable), so paging to a shorter page doesn't shift columns.
   - The header's line (R13-12): one line under the header, drawn by the header cells
     (`header-rule`, an inset shadow) rather than the row's border, which a collapsed-border
     table leaves behind when the sticky header moves; so it shows scrolled or not, and there's
     no second line where the header meets the first row. With a sticky header the vertical
     scrollbar starts below the header row and stays inside the rounded box
     (`scrollbar-below-header`; Firefox draws it full height, GAPS #137).
   - `maxHeight="fill"` (R12-07): the table is the whole of a fixed-height pane (DagFrame's list
     view): it takes the parent's height (a flex column or a sized box), the body scrolls under
     the sticky header, and the box drops its own border and radius because the pane is the
     surface.
   - The list page pattern (R12-10, rationale in REVIEW-12), all optional:
     · `selection`: a checkbox column first; the header box selects or clears the rows on this
       page (mixed when some are), each row's box names its row ("Select Ada Park"); selected
       rows are tinted. The selection is the caller's (a Set of row ids), so it can outlive a page.
     · `sorting` and `paging`: controlled. The rows given are then already sorted and are the one
       page to show (ListPage derives them, a server would send them); the header buttons and the
       pager report changes instead of acting. Without them the table sorts and pages itself.
     · `onRowClick`: a click on the row opens it (the row's own link stays the keyboard and
       new-tab path), except a click on a link, button, input or the checkbox cell, a click that
       comes from a portal (a menu, a dialog: outside the row in the DOM), or one that ends a text
       selection. While the row's link has keyboard focus the row takes the hover wash (R15-17),
       so the row you'd open reads as one; the link keeps its own ring (a link is a link).
     · `currentRowId` (R21-11): the row whose detail is showing beside or below the table (a
       picked screen on Journeys, Vue's `.is-picked`). It holds the hover wash and says so
       (`aria-current="true"`, `data-current`), so the row you are looking at stays marked while
       the pointer is elsewhere. The caller keeps it (with `onRowClick` and the row's own control).
     · `rowActions`: the row's overflow menu (RowActions) in a last, unlabelled column.
     · `emptyState`: what an empty table shows instead of `emptyMessage` (the no-results line with
       Clear all), as EmptyState props.
   Empty and error are one EmptyState (U-03): `emptyMessage` is its title (kind nothing-yet),
   `emptyState` is the whole of it, and `error` is the error kind with Try again.
   Filters and search are the screen's (ListPage's toolbar), not the table's — kept so in Round D
   (R20-23): ListPage already has option and date-range filters, chips and the search; a second
   set inside the table would be the clash STACK.md is written against.
   The grid's capabilities (R20-23), each opt-in and off by default, so every table above is as it was:
   - Typed columns: `type` (a Formatted kind: count, currency, percent, date, datetime, duration,
     fileSize) + `value` in place of `cell`; the kind decides the cell (Formatted), the sort (the
     value, biggest or newest first) and the alignment (numeric). `cell` still overrides.
   - `resizable`: a handle at each header's trailing edge (drag; or focus it and the arrows nudge
     16px, Home resets; a `separator` with the width as its value). Sizes the columns: `width`
     (default 150) and `minWidth` (48) per column, `resizable: false` opts one out. The table goes
     `table-fixed` from the header cells' widths; the last unpinned column takes what is left so
     the table still fills its box; past the box it scrolls sideways.
   - `pin: start | end` per column: sticky at that side while the rest scroll under (also sizes
     the columns: a sticky offset needs known widths). The selection and actions columns stick
     with them. The inner edge draws a rule (`pinned-edge-*`); a pinned cell repeats the row's
     hover wash and selected tint, being opaque.
   - `density: compact`: tighter body rows (`py-1.5`); the header keeps `h-row-header`, which the
     scrollbar track and the header rule are cut for.
   - `expandable: { content, rowLabel }`: a chevron in a first column (after the checkbox) opens
     a detail row under the row (one cell across, the recessed surface), `aria-expanded` and
     `aria-controls` on the toggle, "Show/Hide details for {row}". TanStack's expanding feature
     holds which rows are open (`getRowCanExpand` always true: these are details, not sub-rows).
   - `virtualize` (with `maxHeight` other than none; pair with `pageSize="all"`): only the rows in
     view are in the DOM (`@tanstack/react-virtual` over the scroll box), spacer rows above and
     below hold the scroll height, rows are measured once rendered so a two-line cell or an open
     detail counts for what it is. The body is one list of units (row, or an open row's detail) so
     a detail is its own measured item.
   - `reorderable`: a grip at the start of each unpinned header; drag it, or Space · arrows · Space
     (Escape cancels), the same words and sensors as Sortable (`inputs/sortable.tsx` exports them)
     — dnd-kit's sortable sits on the `th` itself, not a Sortable around the row, because Sortable
     is a `role=list` flex box and a table row is neither. A drop rewrites TanStack's column order;
     pinned columns stay where they are. The header's accessible name stays its label (the grip
     and the resize handle are named apart, `aria-labelledby`).
   Not here: inline cell editing and export (not asked for). */
const MAX_HEIGHT = { md: "max-h-table", lg: "max-h-table-lg", none: "", fill: "min-h-0 flex-1" } as const // the chart scale's table steps (T-05)

/** Controlled sort (R12-10): the rows arrive sorted; header clicks report the next sort. */
type DataTableSorting = { sort: { id: string; desc: boolean } | null; onSortChange: (sort: { id: string; desc: boolean } | null) => void }
/** Controlled paging (R12-10): the rows are this page; the pager reports the next page (1-based). */
type DataTablePaging = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }
/** Row expansion (R20-23): a detail panel under the row, opened from a chevron in a first column. */
type DataTableExpandable<Row> = {
  /** What the open row shows under itself (spans every column). */
  content: (row: Row) => ReactNode
  /** Names the row for its toggle ("Show details for Ada Park"). */
  rowLabel: (row: Row) => string
}

/** Row selection (R12-10): the caller's set of selected row ids. */
type DataTableSelection<Row> = {
  selected: ReadonlySet<string>
  onSelectedChange: (next: Set<string>) => void
  /** Names a row for its checkbox ("Select Ada Park"). */
  rowLabel: (row: Row) => string
}

/** What every column has: its header, how it sorts, where it sits and how wide it is. */
type DataTableColumnBase<Row> = {
  id: string
  header: string
  /** The value the column sorts by; omit for a column that doesn't sort (a typed column sorts by its `value`). Null sorts last. */
  sortValue?: (row: Row) => string | number | null
  /** Right-aligned, tabular figures: counts, money, durations (a typed column is, unless told otherwise). */
  numeric?: boolean
  /** Shown in the Columns menu (default true; the first column is always shown). */
  hideable?: boolean
  /** Starts hidden (the person can show it from the Columns menu). */
  defaultHidden?: boolean
  /** Starting width in px when the table sizes its columns (`resizable`, or any column pinned); default 150. */
  width?: number
  /** The narrowest a resize may make it (default 48). */
  minWidth?: number
  /** Opt this column out of resizing (default: every column, when the table is `resizable`). */
  resizable?: boolean
  /** Keep the column in view while the rest scroll sideways: `start` (left in LTR) or `end`. */
  pin?: "start" | "end"
}

/** A column that renders its own cell. */
type DataTableCustomColumn<Row> = DataTableColumnBase<Row> & {
  cell: (row: Row) => ReactNode
  type?: undefined
}

/** A typed column (R20-23): `type` is a Formatted kind, `value` reads the raw value, and the
    cell, the sort and the alignment follow from the kind — one place decides how a count, an
    amount or a date reads (`lib/format-kind.ts`). `cell` still overrides the rendering. */
type DataTableTypedColumn<Row> = {
  [K in FormattedValue["kind"]]: DataTableColumnBase<Row> &
    Omit<Extract<FormattedValue, { kind: K }>, "kind" | "value"> & {
      type: K
      value: (row: Row) => Extract<FormattedValue, { kind: K }>["value"]
      cell?: (row: Row) => ReactNode
    }
}[FormattedValue["kind"]]

/** One column: its header, how a row renders in it (`cell`, or `type` + `value`), and optionally how it sorts. */
type DataTableColumn<Row> = DataTableCustomColumn<Row> | DataTableTypedColumn<Row>

/** The column's cell, written or from its type. */
function cellOf<Row>(c: DataTableColumn<Row>): (row: Row) => ReactNode {
  if (c.cell) return c.cell
  if (!c.type) throw new Error(`DataTable column "${c.id}" needs a cell or a type.`)
  const { id: _id, header: _h, sortValue: _s, numeric: _n, hideable: _hd, defaultHidden: _dh, width: _w, minWidth: _mw, resizable: _r, pin: _p, cell: _c, type: kind, value, ...format } = c
  return (row: Row) => <Formatted {...({ kind, ...format, value: value(row) } as FormattedValue)} />
}
/** The column's sort value, written or its typed `value`. */
function sortValueOf<Row>(c: DataTableColumn<Row>): ((row: Row) => string | number | null) | undefined {
  if (c.sortValue) return c.sortValue
  if (c.type) return (row: Row) => c.value(row) ?? null
  return undefined
}
/** Right-aligned: said so, or a typed column that didn't say otherwise. */
function isNumeric<Row>(c: DataTableColumn<Row>): boolean {
  return c.numeric ?? Boolean(c.type)
}

type DataTableProps<Row> = {
  rows: ReadonlyArray<Row>
  columns: ReadonlyArray<DataTableColumn<Row>>
  /** A stable id per row (React key). */
  getRowId: (row: Row) => string
  /** What the table lists; its accessible name (a hidden caption). */
  label: string
  /** The table's heading, at the left of its toolbar row (R10-09). */
  title?: ReactNode
  /** The heading's level: 2 (default) for a table that is a page section, 3 inside one. */
  headingLevel?: 2 | 3
  /** One line under the title. */
  description?: ReactNode
  /** The table's own actions (export, refresh), at the right of the toolbar row, before the Columns menu. */
  actions?: ReactNode
  /** Skeleton rows while the data loads. */
  loading?: boolean
  /** The load failed: the message, and a retry if there is one. */
  error?: { message: string; onRetry?: () => void }
  /** What an empty table says. */
  emptyMessage?: string
  /** Rows per page (default 25); `"all"` for one page of everything (with `virtualize` for a long list). */
  pageSize?: number | "all"
  /** The sort on first render. */
  initialSort?: { id: string; desc?: boolean }
  /** The body scrolls under a sticky header past this height: md 384 · lg 640 (default) · none · fill (the parent's height, no border of its own: a table that is a whole pane). */
  maxHeight?: keyof typeof MAX_HEIGHT
  /** The screen's own controls (filters, search) at the left of the toolbar. */
  toolbar?: ReactNode
  /** A checkbox column and the caller's selected ids (R12-10). */
  selection?: DataTableSelection<Row>
  /** Controlled sort: the rows arrive sorted (R12-10). */
  sorting?: DataTableSorting
  /** Controlled paging: the rows are the page to show (R12-10). */
  paging?: DataTablePaging
  /** A click on the row (not on its controls) opens it (R12-10). */
  onRowClick?: (row: Row) => void
  /** The id (`getRowId`) of the row whose detail is showing: it keeps the hover wash and is `aria-current` (R21-11). */
  currentRowId?: string
  /** The row's overflow menu, in a last column (R12-10). */
  rowActions?: (row: Row) => ReactNode
  /** Replaces `emptyMessage` (the no-results line with its own action): the EmptyState to show. */
  emptyState?: EmptyStateProps
  /** Show the Columns menu (default true). */
  columnsMenu?: boolean
  /** Column widths can be dragged (and nudged from the keyboard) at the header's edge (R20-23). Sizes the columns: `width` per column, the last unpinned one taking what is left. */
  resizable?: boolean
  /** The rows' density (the Item axis, carried by the table): default, or compact for a list read as a grid (R20-23). The header row keeps its height either way. */
  density?: Extract<Density, "default" | "compact">
  /** A detail panel under each row, opened from a chevron in a first column (R20-23). */
  expandable?: DataTableExpandable<Row>
  /** Render only the rows in view (R20-23): for a long page (`pageSize="all"`, or hundreds a page) inside a scrolling box (`maxHeight` other than none). */
  virtualize?: boolean
  /** Columns can be reordered by a grip in each header (R20-23): drag it, or focus it and Space · arrows · Space (Escape cancels). Pinned columns stay put. */
  reorderable?: boolean
  className?: string
}

/** The selection and actions columns' width (w-12), added to pinned offsets. */
const SIDE_W = 48
const DEFAULT_WIDTH = 150
const MIN_WIDTH = 48
/** One arrow key's worth of resize. */
const RESIZE_STEP = 16
/** Cell padding per density; the header keeps `h-row-header` (the scrollbar track and the header rule are cut for it). */
const CELL_PAD = { default: "px-3 py-2.5", compact: "px-3 py-1.5" } as const
/** A row's likely height per density, the virtualizer's first guess before it measures. */
const ROW_ESTIMATE = { default: 41, compact: 33 } as const
/** `pageSize="all"`: one page that holds everything. */
const ALL = Number.MAX_SAFE_INTEGER
/** A spacer row's height: the virtualizer's measurement, not a design value, so an inline style is the honest place for it. */
const spacer = (height: number): CSSProperties => ({ height })

/** Elements a row click never opens the row from. */
const INTERACTIVE = "a,button,input,select,textarea,label,[role='checkbox'],[role='menuitem'],[data-row-click='ignore']"

/** The TanStack features this table compiles in; built once, shared by every instance. */
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnOrderingFeature,
  rowExpandingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})
type Features = typeof features

type ColumnReorderProps = {
  enabled: boolean
  id: string
  sensors: ReturnType<typeof useSortableSensors>
  /** The reorderable column ids, in their current order. */
  items: string[]
  announcements: ReturnType<typeof sortableAnnouncements>
  onDragEnd: (e: DragEndEvent) => void
  children: ReactNode
}

/** The drag context around the table when columns reorder (no DOM of its own); the children alone otherwise. */
function ColumnReorder({ enabled, id, sensors, items, announcements, onDragEnd, children }: ColumnReorderProps) {
  if (!enabled) return children
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements, screenReaderInstructions: { draggable: SORTABLE_COPY.instructions } }} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

type OrderableHeadProps = ComponentProps<typeof TableHead> & {
  /** The column id (the sortable item). */
  id: string
  /** The column's name, for the grip's label and the announcements. */
  name: string
}

/** A header cell that can be picked up and moved among its siblings (R20-23): dnd-kit's sortable on the `th`, the grip at its start the activator (pointer drag, or Space · arrows · Space). */
function OrderableHead({ id, name, style, className, children, ...props }: OrderableHeadProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id })
  // dnd-kit's measurement, not a design value (as SortableItem's): translate only, no scale, so the cell keeps its width while it slides.
  const sliding: CSSProperties = { ...style, transform: CSS.Translate.toString(transform), transition }
  return (
    <TableHead
      ref={setNodeRef}
      style={sliding}
      data-dragging={isDragging ? "" : undefined}
      className={cn(className, isDragging && "z-raised bg-card shadow-lift")}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={SORTABLE_COPY.handleFor(`the ${name} column`)}
          data-slot="data-table-grip"
          className={cn(pressable, "-ml-1 grid size-icon-xl shrink-0 cursor-grab touch-none place-items-center rounded-sm text-muted-foreground opacity-quiet hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing", isDragging && "cursor-grabbing opacity-100")}
        >
          <GripVerticalIcon aria-hidden className="size-icon-sm" />
        </button>
        {children}
      </span>
    </TableHead>
  )
}

/** A table of rows from data: sortable columns, numeric columns right-aligned, a sticky header, a Columns menu, pagination, and loading, empty and error states. */
function DataTable<Row extends object>({
  rows,
  columns,
  getRowId,
  label,
  title,
  headingLevel = 2,
  description,
  actions,
  loading = false,
  error,
  emptyMessage = "Nothing to show yet.",
  pageSize = 25,
  initialSort,
  maxHeight = "lg",
  toolbar,
  selection,
  sorting: controlledSort,
  paging,
  onRowClick,
  currentRowId,
  rowActions,
  emptyState,
  columnsMenu = true,
  resizable = false,
  density = "default",
  expandable,
  virtualize = false,
  reorderable = false,
  className,
}: DataTableProps<Row>) {
  const baseId = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const sensors = useSortableSensors()
  const ownPageSize = pageSize === "all" ? ALL : pageSize
  const [ownSorting, setOwnSorting] = useState<SortingState>(initialSort ? [{ id: initialSort.id, desc: Boolean(initialSort.desc) }] : [])
  const [visibility, setVisibility] = useState<ColumnVisibilityState>(() => Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, false])))
  const [ownPagination, setOwnPagination] = useState({ pageIndex: 0, pageSize: ownPageSize })
  const sorting: SortingState = controlledSort ? (controlledSort.sort ? [controlledSort.sort] : []) : ownSorting
  const pagination: PaginationState = paging ? { pageIndex: paging.page - 1, pageSize: paging.pageSize } : ownPagination
  const setSorting = (u: Updater<SortingState>) => {
    const next = typeof u === "function" ? u(sorting) : u
    if (controlledSort) controlledSort.onSortChange(next[0] ? { id: next[0].id, desc: next[0].desc } : null)
    else setOwnSorting(next)
  }
  const setPagination = (u: Updater<PaginationState>) => {
    const next = typeof u === "function" ? u(pagination) : u
    if (paging) paging.onPageChange(next.pageIndex + 1)
    else setOwnPagination(next)
  }
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])
  const defs = useMemo<ColumnDef<Features, Row>[]>(
    () =>
      columns.map((c, i) => {
        const cell = cellOf(c)
        const sortValue = sortValueOf(c)
        return {
          id: c.id,
          header: c.header,
          accessorFn: (row: Row) => sortValue?.(row) ?? undefined,
          cell: ({ row }) => cell(row.original),
          enableSorting: Boolean(sortValue),
          // Counts, money and dates you compare start high/newest (R12-10); text starts at A.
          sortDescFirst: isNumeric(c),
          enableHiding: i > 0 && c.hideable !== false,
          sortUndefined: "last",
          size: c.width ?? DEFAULT_WIDTH,
          minSize: c.minWidth ?? MIN_WIDTH,
          enableResizing: c.resizable !== false,
          enablePinning: true,
        }
      }),
    [columns]
  )
  const initialPinning = useMemo(
    () => ({ start: columns.filter((c) => c.pin === "start").map((c) => c.id), end: columns.filter((c) => c.pin === "end").map((c) => c.id) }),
    [columns]
  )
  const table = useTable({
    features,
    data: rows as Row[],
    columns: defs,
    getRowId: (row) => getRowId(row),
    state: { sorting, columnVisibility: visibility, pagination },
    initialState: { columnPinning: initialPinning },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onPaginationChange: setPagination,
    manualSorting: Boolean(controlledSort),
    manualPagination: Boolean(paging),
    rowCount: paging?.total,
    autoResetPageIndex: !paging,
    enableColumnResizing: resizable,
    columnResizeMode: "onChange",
    // Every row has a detail (not sub-rows): without this TanStack lets no row expand.
    enableExpanding: Boolean(expandable),
    getRowCanExpand: () => Boolean(expandable),
  })

  // Sized mode (R20-23): with resizing, or any column pinned, the table lays out `table-fixed`
  // from the header cells' widths (TanStack's sizes), the last unpinned column taking whatever is
  // left so the table still fills its box; past the box it scrolls sideways. Without either the
  // layout is the browser's auto one, as before.
  const pinned = table.getIsSomeColumnsPinned()
  const sized = resizable || pinned
  /** What sits before the data columns: the selection and the expand columns (w-12 each). */
  const startSide = (selection ? SIDE_W : 0) + (expandable ? SIDE_W : 0)
  const centerVisible = table.getCenterVisibleLeafColumns()
  const flexColumnId = sized ? centerVisible[centerVisible.length - 1]?.id : undefined
  /** The sticky offsets and width of a cell in its column (the selection column's width added at the start, the actions' at the end). */
  const cellStyle = (col: Column<Features, Row>): CSSProperties | undefined => {
    if (!sized) return undefined
    const pin = col.getIsPinned()
    const width = col.id === flexColumnId ? undefined : col.getSize()
    if (pin === "start") return { width, left: col.getStart("start") + startSide }
    if (pin === "end") return { width, right: col.getAfter("end") + (rowActions ? SIDE_W : 0) }
    return { width, minWidth: col.id === flexColumnId ? col.getSize() : undefined }
  }
  /** The classes a cell takes from its pin: sticky, above the scrolling cells, its surface opaque, a rule at the inner edge. */
  const pinClass = (col: Column<Features, Row>) => {
    const pin = col.getIsPinned()
    if (!pin) return undefined
    const edge = pin === "start" ? table.getStartVisibleLeafColumns().at(-1)?.id === col.id : table.getEndVisibleLeafColumns()[0]?.id === col.id
    // Opaque, so the scrolling cells pass under it; the row's hover wash and selected tint are
    // repeated on it (the row's own are behind the cell's surface).
    return cn(
      "sticky z-raised bg-card group-hover:layer-hover group-has-[a:focus-visible]:layer-hover group-data-[state=selected]:bg-accent",
      edge && (pin === "start" ? "pinned-edge-start" : "pinned-edge-end")
    )
  }
  // Reordering (R20-23): the unpinned visible columns are the sortable set; a drop rewrites the
  // whole column order (hidden columns keep their place in it) through TanStack's ordering feature.
  const orderIds = centerVisible.map((c) => c.id)
  const nameOf = (id: string | number) => byId.get(String(id))?.header ?? String(id)
  const announcements = sortableAnnouncements({ nameOf: (id) => `the ${nameOf(id)} column`, positionOf: (id) => orderIds.indexOf(String(id)) + 1, total: orderIds.length })
  const onColumnDrop = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const order = table.state.columnOrder.length ? [...table.state.columnOrder] : defs.map((d) => d.id!)
    const from = order.indexOf(String(active.id))
    const to = order.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    table.setColumnOrder(arrayMove(order, from, to))
  }
  /** Arrow keys nudge a column's width; Home puts it back. */
  const resizeKey = (e: KeyboardEvent, col: Column<Features, Row>) => {
    const delta = e.key === "ArrowLeft" ? -RESIZE_STEP : e.key === "ArrowRight" ? RESIZE_STEP : e.key === "Home" ? null : undefined
    if (delta === undefined) return
    e.preventDefault()
    if (delta === null) col.resetSize()
    else table.setColumnSizing((old) => ({ ...old, [col.id]: Math.max(col.columnDef.minSize ?? MIN_WIDTH, col.getSize() + delta) }))
  }

  const visible = table.getVisibleLeafColumns()
  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide())
  const total = paging ? paging.total : rows.length
  const size = paging ? paging.pageSize : ownPageSize
  const { pageIndex } = table.state.pagination
  const from = total === 0 ? 0 : pageIndex * size + 1
  const to = Math.min(total, (pageIndex + 1) * size)
  const pageRows = table.getRowModel().rows
  const pageIds = pageRows.map((r) => r.id)
  const onPage = selection ? pageIds.filter((id) => selection.selected.has(id)).length : 0
  const headerChecked: boolean | "mixed" = onPage === 0 ? false : onPage === pageIds.length ? true : "mixed"
  /** Every column, the checkbox, expand and actions columns included. */
  const span = visible.length + (selection ? 1 : 0) + (expandable ? 1 : 0) + (rowActions ? 1 : 0)

  // What the body renders, in order: each row, and under an open row its detail (R20-23). One
  // list so the virtualizer counts and measures a detail as its own item — a detail is taller
  // than a row and would throw the scroll height off if it hid inside the row's measurement.
  type Unit = { key: string; row: TableRowModel<Features, Row>; detail: boolean }
  const units: Unit[] = []
  for (const row of pageRows) {
    units.push({ key: row.id, row, detail: false })
    if (expandable && row.getIsExpanded()) units.push({ key: `${row.id}:detail`, row, detail: true })
  }
  // Virtualized (R20-23): only the units in view are in the DOM, a spacer row above and below
  // holds the scroll height; rows are measured once rendered (`measureElement`), so a two-line
  // cell or a detail panel is sized by what it is, not a guess. Off, every unit renders.
  const virtualizer = useVirtualizer({
    count: units.length,
    enabled: virtualize && maxHeight !== "none",
    getScrollElement: () => boxRef.current,
    estimateSize: () => ROW_ESTIMATE[density],
    overscan: 8,
    getItemKey: (i) => units[i]!.key,
  })
  const virtualItems = virtualizer.getVirtualItems()
  const virtual = virtualize && maxHeight !== "none"
  const padTop = virtual && virtualItems.length > 0 ? virtualItems[0]!.start : 0
  const padBottom = virtual && virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end : 0
  const shown = virtual ? virtualItems.map((v) => ({ unit: units[v.index]!, index: v.index })) : units.map((unit, index) => ({ unit, index }))
  function rowClick(e: MouseEvent<HTMLTableRowElement>, row: Row) {
    if (!onRowClick || e.button !== 0 || e.defaultPrevented) return
    const target = e.target as HTMLElement
    // From a portal (a menu or dialog the row opened): not inside the row in the DOM.
    if (!e.currentTarget.contains(target)) return
    if (target.closest(INTERACTIVE)) return
    if (window.getSelection()?.toString()) return
    onRowClick(row)
  }
  const numericId = (id: string) => {
    const c = byId.get(id)
    return c ? isNumeric(c) : false
  }
  const align = (id: string) => (numericId(id) ? "text-right tabular-nums" : undefined)
  const Heading = headingLevel === 3 ? "h3" : "h2"
  const pad = CELL_PAD[density]
  /** The selection and actions cells stay in view with the pinned columns. */
  const sideClass = pinned ? "sticky z-raised bg-card group-hover:layer-hover group-has-[a:focus-visible]:layer-hover group-data-[state=selected]:bg-accent" : undefined

  let body: ReactNode
  if (loading)
    body = Array.from({ length: Math.min(size, 5) }, (_, r) => (
      <TableRow key={`s${r}`} className="hover:bg-transparent">
        {selection && <TableCell className="w-12 px-4 py-3" />}
        {expandable && <TableCell className="w-12 px-3 py-3" />}
        {visible.map((c) => (
          <TableCell key={c.id} className="px-3 py-3" style={cellStyle(c)}>
            <Skeleton width={numericId(c.id) ? "1/2" : "3/4"} className={numericId(c.id) ? "ml-auto" : undefined} />
          </TableCell>
        ))}
        {rowActions && <TableCell className="w-12 px-2 py-3" />}
      </TableRow>
    ))
  else if (error)
    body = (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={span} className="p-0 whitespace-normal">
          <EmptyState
            kind="error"
            title={error.message}
            actions={
              error.onRetry && (
                <Button variant="secondary" size="sm" onClick={error.onRetry}>
                  Try again
                </Button>
              )
            }
          />
        </TableCell>
      </TableRow>
    )
  else if (total === 0)
    body = (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={span} className="p-0 whitespace-normal">
          <EmptyState {...(emptyState ?? { title: emptyMessage })} />
        </TableCell>
      </TableRow>
    )
  else
    body = shown.map(({ unit, index }) => {
      const { row } = unit
      const selected = selection?.selected.has(row.id) ?? false
      const measure = virtual ? virtualizer.measureElement : undefined
      if (unit.detail)
        return (
          <TableRow key={unit.key} ref={measure} data-index={index} id={`${baseId}-${row.id}-detail`} data-slot="data-table-detail" className="border-divider hover:bg-transparent">
            {/* One cell across the table; inset like a cell's content, on the recessed surface so it reads as the row's, not a row. */}
            <TableCell colSpan={span} className="bg-muted/40 px-3 py-3 whitespace-normal">
              {expandable!.content(row.original)}
            </TableCell>
          </TableRow>
        )
      const expanded = expandable ? row.getIsExpanded() : false
      return (
        <TableRow
          key={unit.key}
          ref={measure}
          data-index={index}
          data-state={selected ? "selected" : undefined}
          data-expanded={expanded || undefined}
          data-current={row.id === currentRowId || undefined}
          aria-current={row.id === currentRowId ? "true" : undefined}
          onClick={onRowClick ? (e) => rowClick(e, row.original) : undefined}
          className={cn("group border-divider hover:bg-transparent hover:layer-hover data-[current]:layer-hover data-[state=selected]:bg-accent", onRowClick && "cursor-pointer has-[a:focus-visible]:layer-hover", expanded && "border-b-0")}
        >
          {selection && (
            // The cell is the checkbox's target: a click anywhere in it toggles, never opens the row.
            <TableCell
              data-row-click="ignore"
              className={cn("w-12 cursor-pointer px-4 py-2.5 left-0", sideClass)}
              onClick={(e) => {
                if (e.target === e.currentTarget) selection.onSelectedChange(toggle(selection.selected, row.id))
              }}
            >
              <Checkbox
                checked={selected}
                aria-label={`Select ${selection.rowLabel(row.original)}`}
                onCheckedChange={() => selection.onSelectedChange(toggle(selection.selected, row.id))}
                className="align-middle"
              />
            </TableCell>
          )}
          {expandable && (
            <TableCell data-row-click="ignore" className={cn("w-12 px-3 py-1.5", selection ? "left-12" : "left-0", sideClass)}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={expanded ? `${baseId}-${row.id}-detail` : undefined}
                aria-label={`${expanded ? "Hide" : "Show"} details for ${expandable.rowLabel(row.original)}`}
                onClick={row.getToggleExpandedHandler()}
                className={cn(pressable, "grid size-icon-xl place-items-center rounded-sm text-muted-foreground hover:text-card-foreground")}
              >
                <ChevronDown aria-hidden className={cn("size-icon transition-transform", expanded ? undefined : "-rotate-90")} />
              </button>
            </TableCell>
          )}
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id} className={cn(pad, align(cell.column.id), pinClass(cell.column), sized && "truncate")} style={cellStyle(cell.column)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
          {rowActions && (
            <TableCell data-row-click="ignore" className={cn("w-12 px-2 py-1.5 text-right right-0", sideClass)}>
              {rowActions(row.original)}
            </TableCell>
          )}
        </TableRow>
      )
    })

  return (
    <div
      data-slot="data-table"
      data-state={loading ? "loading" : error ? "error" : total === 0 ? "empty" : "ready"}
      className={cn("flex flex-col gap-3", maxHeight === "fill" && "h-full min-h-0", className)}
    >
      {(title || description || toolbar || actions || (columnsMenu && hideable.length > 0)) && (
        // R10-09: one row, the title, the screen's controls, the table's actions, then Columns,
        // centred on the 36px control line so the title's text and the buttons' text share a line
        // (a baseline row would follow the icons' bottoms: an icon button has no text baseline).
        // The description goes under the row; the row wraps when it runs out.
        <div data-slot="data-table-toolbar" className="flex flex-col gap-0.5">
          <div className="flex min-h-control-sm flex-wrap items-center gap-2">
            {title && <Heading className="mr-2 min-w-0 text-base font-semibold text-foreground-strong">{title}</Heading>}
            {/* `grow`, not `flex-1` (R21-19): the controls keep their own width, so on a narrow table they drop under the title as a whole instead of squeezing into a sliver beside it. */}
            <div className="flex grow flex-wrap items-center gap-2">{toolbar}</div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            {columnsMenu && hideable.length > 0 && (
              <DropdownMenu
                aria-label="Columns"
                modal={false}
                trigger={
                  <Button variant="secondary" size="sm" icon={<Columns3 aria-hidden />}>
                    Columns
                  </Button>
                }
                items={[
                  { kind: "label", label: "Show columns" },
                  ...hideable.map((c) => ({
                    kind: "checkbox" as const,
                    label: byId.get(c.id)?.header ?? c.id,
                    checked: c.getIsVisible(),
                    onCheckedChange: (v: boolean) => c.toggleVisibility(v),
                  })),
                ]}
              />
            )}
          </div>
          {description && <p className="text-sm font-medium text-body-muted">{description}</p>}
        </div>
      )}
      <ColumnReorder enabled={reorderable} id={`${baseId}-dnd`} sensors={sensors} items={orderIds} announcements={announcements} onDragEnd={onColumnDrop}>
      <div
        ref={boxRef}
        className={cn(
          "relative w-full overflow-auto rounded-lg border border-surface-edge bg-card",
          maxHeight !== "none" ? "scrollbar-below-header scrollbar-stable" : "scrollbar-thin",
          maxHeight === "fill" && "rounded-none border-0",
          MAX_HEIGHT[maxHeight]
        )}
      >
        <table
          aria-busy={loading || undefined}
          data-density={density}
          className={cn("w-full caption-bottom text-sm", sized && "table-fixed")}
          // Sized: the columns' widths add up past the box → the table grows and the box scrolls sideways.
          style={sized ? { minWidth: table.getTotalSize() + startSide + (rowActions ? SIDE_W : 0) } : undefined}
        >
          <caption className="sr-only">{label}</caption>
          <TableHeader className={cn("bg-card [&_tr]:border-b-0 [&_th]:header-rule", maxHeight !== "none" && "sticky top-0 z-sticky")}>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {selection && (
                  <TableHead scope="col" className={cn("h-row-header w-12 bg-card px-4 left-0", pinned && "sticky z-raised")}>
                    <Checkbox
                      checked={headerChecked}
                      disabled={loading || pageIds.length === 0}
                      aria-label="Select all on this page"
                      onCheckedChange={() => {
                        const next = new Set(selection.selected)
                        if (headerChecked === true) for (const id of pageIds) next.delete(id)
                        else for (const id of pageIds) next.add(id)
                        selection.onSelectedChange(next)
                      }}
                      className="align-middle"
                    />
                  </TableHead>
                )}
                {expandable && (
                  <TableHead scope="col" className={cn("h-row-header w-12 bg-card px-3", selection ? "left-12" : "left-0", pinned && "sticky z-raised")}>
                    <span className="sr-only">Details</span>
                  </TableHead>
                )}
                {group.headers.map((header) => {
                  const col = header.column
                  const numeric = numericId(col.id)
                  const sorted = col.getIsSorted()
                  const SortIcon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown
                  const canResize = resizable && col.getCanResize()
                  const canOrder = reorderable && col.getIsPinned() === false
                  // With a handle or a grip inside it the header's name would read "Pipeline Resize Pipeline"; the label names it instead.
                  const labelId = canResize || canOrder ? `${baseId}-${col.id}` : undefined
                  const headProps = {
                    scope: "col" as const,
                    "aria-labelledby": labelId,
                    "aria-sort": col.getCanSort() ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : undefined,
                    className: cn("h-row-header bg-card px-3 text-xs font-semibold text-muted-foreground", numeric && "text-right", (canResize || canOrder) && col.getIsPinned() === false && "relative", pinClass(col), sized && "truncate"),
                    style: cellStyle(col),
                  } satisfies ComponentProps<typeof TableHead>
                  const content = (
                    <>
                      {col.getCanSort() ? (
                        <button
                          type="button"
                          onClick={col.getToggleSortingHandler()}
                          className={cn(
                            "-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-1 focus-ring hover:layer-hover",
                            numeric && "flex-row-reverse",
                            sorted && "text-foreground"
                          )}
                        >
                          <span id={labelId}>{String(header.column.columnDef.header)}</span>
                          <SortIcon aria-hidden className={cn("size-icon-sm", sorted ? undefined : "opacity-quiet")} />
                        </button>
                      ) : (
                        <span id={labelId}>{String(header.column.columnDef.header)}</span>
                      )}
                      {canResize && (
                        // The header's trailing edge: drag it, or focus it and use the arrows (16px a press,
                        // Home puts the width back). A separator, so a screen reader hears a value, not a button.
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${String(header.column.columnDef.header)}`}
                          aria-valuenow={Math.round(col.getSize())}
                          aria-valuemin={col.columnDef.minSize ?? MIN_WIDTH}
                          tabIndex={0}
                          data-slot="data-table-resize"
                          data-state={col.getIsResizing() ? "resizing" : undefined}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => col.resetSize()}
                          onKeyDown={(e) => resizeKey(e, col)}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute inset-y-0 right-0 w-2 cursor-col-resize touch-none select-none focus-ring",
                            "after:absolute after:inset-y-2 after:right-0.5 after:w-0.5 after:rounded-full after:bg-border after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:after:opacity-100 data-[state=resizing]:after:bg-primary data-[state=resizing]:after:opacity-100"
                          )}
                        />
                      )}
                    </>
                  )
                  return canOrder ? (
                    <OrderableHead key={header.id} id={col.id} name={nameOf(col.id)} {...headProps}>
                      {content}
                    </OrderableHead>
                  ) : (
                    <TableHead key={header.id} {...headProps}>
                      {content}
                    </TableHead>
                  )
                })}
                {rowActions && (
                  <TableHead scope="col" className={cn("h-row-header w-12 bg-card px-2 right-0", pinned && "sticky z-raised")}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {padTop > 0 && (
              <tr aria-hidden data-slot="data-table-spacer" style={spacer(padTop)}>
                <td colSpan={span} className="p-0" />
              </tr>
            )}
            {body}
            {padBottom > 0 && (
              <tr aria-hidden data-slot="data-table-spacer" style={spacer(padBottom)}>
                <td colSpan={span} className="p-0" />
              </tr>
            )}
          </TableBody>
        </table>
      </div>
      </ColumnReorder>
      {!loading && !error && total > size && (
        <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span aria-live="polite" className="tabular-nums">
            {from}–{to} of {total}
          </span>
          <Button variant="secondary" size="icon" aria-label="Previous page" icon={<ChevronLeft aria-hidden />} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
          <Button variant="secondary" size="icon" aria-label="Next page" icon={<ChevronRight aria-hidden />} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
        </div>
      )}
    </div>
  )
}

function toggle(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export { DataTable }
export type { DataTableColumn, DataTableCustomColumn, DataTableExpandable, DataTablePaging, DataTableProps, DataTableSelection, DataTableSorting, DataTableTypedColumn }
