"use client"

import "@xyflow/react/dist/base.css"
import "./dag-frame.css"

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import {
  getSmoothStepPath,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { ListIcon, Maximize2Icon, Minimize2Icon, MinusIcon, PlusIcon, RotateCcwIcon, ScanIcon, WorkflowIcon, XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../components/actions/button"
import { DataTable, type DataTableColumn } from "../components/display/data-table"
import { EmptyState } from "../components/feedback/empty-state"
import { Skeleton } from "../components/feedback/skeleton"
import { Callout, CalloutAction } from "../components/feedback/callout"
import { StatusMark } from "../components/display/status-mark"
import { Tooltip } from "../components/overlays/tooltip"
import { ButtonGroup, ButtonGroupSeparator } from "../components/actions/button-group"
import { ToggleGroup, ToggleGroupItem } from "../components/inputs/toggle-group"
import { dagMark, dagStatusLabel } from "./dag-status"
import {
  dependencyOrder,
  edgesOf,
  failurePath,
  NODE_HEIGHT,
  NODE_WIDTH,
  placeIncrementally,
  selectionPath,
  sideOf,
  structureKey,
  summarize,
  type DagLayout,
  type DagStatus,
  type Point,
} from "./internal/dag-model"
import { autoCanvasHeight, statusCounts, STATUS_LABEL } from "./internal/dag-shape"
import { dagHeight } from "./internal/heights"
import { useReducedMotion } from "./internal/reduced-motion"

/* @archetype Chart (ARCHETYPES.md).
   DagFrame (R9-06, renamed from GraphFrame in R11-03): a DAG, steps and their dependencies (a
   pipeline run), in a frame that behaves the
   way the run graphs of Dagster, Airflow, GitHub Actions and Argo do. React Flow (@xyflow/react,
   MIT) is the viewport, dagre (@dagrejs/dagre, MIT) the layout; the nodes, edges, controls and
   states are ours. This module imports both libraries: pages load it through
   lazy-dag-frame.tsx, so they arrive only when a graph renders and never on customer pages.
   Names (R10-02): DagFrame is the frame and its behaviour (header, controls, panel, list,
   states); the graph is the canvas inside it.
   The frame contract (REVIEW-9 § C, row by row, with round 10's changes):
   - Header (R11-01, correcting R10-01): the title (a heading) with Graph/List and full screen at
     the end, nothing else. Graph/List was the TabsPill (R11-02); since R20-13 it is the icon
     ToggleGroup (a Workflow glyph and a List glyph, each named and in a Tooltip): one of two is
     on, which is a toggle group's job, where the zoom column below is a ButtonGroup (actions,
     nothing stays pressed). Below the canvas, one row (R12-07): the
     summary with each count wearing its status mark, so the counts are the legend (only the
     statuses on the graph); the live region.
   - Canvas (R12-07): `height="auto"` (default) takes the graph's proportions: its height at a
     readable 75% plus the fit padding, 384–560 in 32px steps (384: the details panel's room), from the dependencies alone
     (dag-shape.ts), so the lazy skeleton reserves the same height. md/lg fix it.
   - Opening view and refits (R10-03): one `viewAdjusted` state, set when the person pans or
     zooms and cleared by Fit or Reset. While it's false the graph fits every node (padding,
     never above 100%) on load and on any size change (the details panel opening or closing, full
     screen, the window); while it's true the view stays put and only the selected node is kept
     in view. Zoom 25%–200%. When the graph can't fit even at 25% (a narrow frame, a long run;
     R10-14) it fits the selected node's neighbourhood, or the first ranks, instead of clipping
     both sides, and a note offers the list view.
   - Page scroll: a plain wheel scrolls the page (zoomOnScroll and panOnScroll off,
     preventScrolling off, so the wheel event is never cancelled); Ctrl/⌘ + wheel or a pinch
     zooms; dragging the background pans. Double-click doesn't zoom.
   - Controls, bottom left (R12-07): one vertical pill, zoom in, zoom out, fit, a rule, reset
     (fresh layout, fitted, auto-fit back on); full screen in the header. The minimap (R12-07)
     shows only while part of the graph is outside the canvas (a partial fit, or a pan or zoom
     that put nodes out of view), bottom right, 160 × 120; Fit hides it again. A partial fit
     keeps its corner clear (R13-17): extra padding on the right or the bottom, whichever costs
     the canvas less, so no node the fit shows sits under it.
   - Keyboard: the canvas is one tab stop. Arrows pan, + and − zoom, 0 fits. Tab and Shift+Tab
     walk the nodes in dependency order (the first Shift+Tab goes back to the canvas, Tab after
     the last node leaves the frame), Home/End jump to the first/last; Enter opens the focused
     node; Escape closes the details. A node scrolled off is brought into view when it takes focus.
   - Layout: dagre, ranked by dependency, deterministic: `layout` "right" (default), "down", or
     "down-alternating" (R10-02: top to bottom, each rank alternately left and right of a centre
     line, edges leaving and arriving on the inner side and running down the centre channel;
     reads well for a mostly linear run). It re-runs only when the shape changes (ids,
     dependencies, layout), never for a status; nodes that arrive later are placed without moving
     the others (dag-model.ts).
   - Nodes: 240 × 72, name (truncated, the full name in a Tooltip), status mark and text,
     duration; selected ring; running marks turn only without reduced motion.
   - Edges: right angles with rounded corners and arrowheads. A selection lights its upstream
     and downstream paths and dims the rest; a failure's downstream path is dashed in the
     attention colour; an edge into a running node flows (motion-safe only).
   - Selection: a node opens its details in a panel inside the frame (`renderDetails`); the
     selection is controlled (`selectedId` / `onSelect`) so the page keeps it in the URL. The
     panel is 320 wide, 384 once the frame is 1024 or wider (a container query on the frame).
   - States: loading (node-shaped skeletons), empty (a mark and "Nothing has run yet"), error
     with retry, all at the canvas's height, so nothing jumps when the data arrives.
   - Live updates: statuses change in place with a short transition (none under reduced motion).
   - Accessibility: a list view (an ordered table: #, name, status, depends on, duration) is the
     screen-reader path and the fallback for large graphs; it is the pane itself (R12-07): the
     table fills the canvas's box edge to edge, header sticky, scrolling inside, so switching
     views never changes the frame's height. The footer carries the text summary ("12 steps: 9
     succeeded, 1 failed, 2 skipped"), which also names the canvas.
   - Scrollbars: the list and the details panel scroll with the theme's thin scrollbar (R10-08).
   - Scale: smooth at 200 nodes (memoised nodes and edges, no virtualisation in v1).
   Attribution: React Flow's MIT licence would allow hiding it, but its maintainers ask
   organisations that hide it (proOptions.hideAttribution) to subscribe to React Flow Pro; Paige
   doesn't, so it stays, small and muted in the bottom-right corner (dag-frame.css). */

/** One node of the graph. */
type DagNode = {
  id: string
  /** The name on the node, truncated to the node's width (the full name shows in a tooltip, the panel and the list). */
  label: string
  status: DagStatus
  /** Ids of the nodes this one waits for. An id that isn't in the graph is ignored. */
  dependsOn: readonly string[]
  /** The status as the domain says it ("Not started", "Waiting"); default the tone's name. */
  statusText?: string
  /** Formatted already ("3m 12s"). */
  duration?: string
}

type DagFrameProps<T extends DagNode = DagNode> = {
  /** The nodes, in the order the domain defines them (ties in the layout and the list keep it). */
  nodes: readonly T[]
  /** What the graph is ("Nightly usage refresh, run of Oct 12"): the canvas's and the list's name, and the title unless `title` is given. */
  label: string
  /** The header's heading (R10-01). Default `label`. */
  title?: string
  /** The heading's level: 2 (default) for a graph that is a page section, 3 inside one. */
  headingLevel?: 2 | 3
  /** The node's noun in the summary. Default step/steps. */
  noun?: { one: string; other: string }
  /** right (default) · down · down-alternating (top to bottom, ranks alternating left and right of a centre line). */
  layout?: DagLayout
  /** The selected node (controlled; keep it in the URL). Undefined: the frame keeps its own. */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** The details panel's body for the selected node. Default: status, duration, depends on. */
  renderDetails?: (node: T) => ReactNode
  loading?: boolean
  error?: { message: string; onRetry?: () => void }
  /** Shown when there are no nodes. */
  emptyMessage?: string
  /** auto (default): the graph's proportions, 384–560 · md 448 · lg 640; full screen fills the screen. */
  height?: "auto" | "md" | "lg"
  /** Open on the list instead of the graph. */
  defaultView?: "graph" | "list"
  className?: string
}

/** Fit padding: clear of the control column on the left (12 inset + 36 buttons + 24). */
const FIT = { padding: { top: "24px", right: "24px", bottom: "24px", left: "72px" }, maxZoom: 1 } as const
/** The fit padding's totals, for "does it fit at the zoom floor" (R10-14). */
const FIT_PAD = { x: 24 + 72, y: 24 + 24 }
/** The minimap's corner (R13-17): 160 × 120 plus its margins (12 right, 24 bottom, dag-frame.css) and a 12px gap. */
const MINIMAP_ROOM = { x: 160 + 12 + 12, y: 120 + 24 + 12 }
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const PAN_STEP = 64
/** Names longer than this get a tooltip (the node fits about this many characters). */
const LABEL_FITS = 24
const BODY_HEIGHT = dagHeight // the chart scale (T-05), shared with LazyDagFrame's skeleton

type NodeData = {
  item: DagNode
  statusText: string
  selected: boolean
  dim: boolean
  /** Where its edges arrive and leave: left/right ("right"), top/bottom ("down"), both on the inner side ("down-alternating"). */
  handles: { target: Position; source: Position }
  /** Which side the full-name tooltip opens on. */
  tooltipSide: "top" | "right" | "left"
  panelId: string
}
type EdgeData = { path: "on" | "off"; dim: boolean; failure: boolean; running: boolean; markers: string }
type FlowNode = Node<NodeData, "graph">
type FlowEdge = Edge<EdgeData, "graph">

const DagNodeView = memo(function DagNodeView({ data }: NodeProps<FlowNode>) {
  const { item, statusText, selected, dim, handles, tooltipSide, panelId } = data
  const button = (
    <button
      type="button"
      tabIndex={-1}
      data-dag-node={item.id}
      aria-label={`${item.label}: ${statusText}${item.duration ? `, ${item.duration}` : ""}`}
      aria-expanded={selected}
      aria-controls={selected ? panelId : undefined}
      data-dim={dim || undefined}
      // A mouse press doesn't move focus by itself: focusing a node the frame half hides would
      // make the browser scroll React Flow's clipped box and shift the whole picture. The click
      // handler focuses it with preventScroll instead.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "flex size-full cursor-pointer flex-col justify-center gap-1.5 rounded-lg border bg-card px-3 text-left shadow-card focus-ring hover:layer-hover",
        "transition motion-reduce:transition-none",
        selected && "border-primary ring-2 ring-primary",
        // Dimmed off the selection's paths: a muted card and ink (text keeps 4.5:1), a faded mark.
        dim && "bg-muted shadow-none"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <StatusMark status={dagMark(item.status)} className={cn(dim && "opacity-dim")} />
        <span className={cn("truncate text-sm font-semibold", dim ? "text-muted-foreground" : "text-card-foreground")}>{item.label}</span>
      </span>
      {/* The spaces keep the visible text readable as words, so it matches the accessible name
          (axe label-content-name-mismatch reads the text nodes as written). */}{" "}
      <span className="flex min-w-0 items-center justify-between gap-2 pl-7 text-xs font-medium text-muted-foreground">
        <span className="shrink-0">{statusText}</span>{" "}
        {item.duration && <span className="truncate tabular-nums">{item.duration}</span>}
      </span>
    </button>
  )
  return (
    <>
      <Handle type="target" position={handles.target} isConnectable={false} className="invisible" />
      {item.label.length > LABEL_FITS ? (
        <Tooltip content={item.label} side={tooltipSide}>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <Handle type="source" position={handles.source} isConnectable={false} className="invisible" />
    </>
  )
})

const DagEdgeView = memo(function DagEdgeView(props: EdgeProps<FlowEdge>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const [d] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 10, offset: 20 })
  const tone = data?.failure ? "failure" : data?.path === "on" ? "path" : "default"
  return (
    <path
      d={d}
      className="dag-edge"
      data-tone={tone}
      data-dim={data?.dim || undefined}
      data-running={data?.running || undefined}
      markerEnd={`url(#${data?.markers}-${tone})`}
    />
  )
})

const nodeTypes = { graph: DagNodeView }
const edgeTypes = { graph: DagEdgeView }

/** A node's handles and tooltip side for the layout (R10-02). */
function nodeSides(layout: DagLayout, at: Point): Pick<NodeData, "handles" | "tooltipSide"> {
  if (layout === "right") return { handles: { target: Position.Left, source: Position.Right }, tooltipSide: "top" }
  if (layout === "down") return { handles: { target: Position.Top, source: Position.Bottom }, tooltipSide: "right" }
  // down-alternating: in and out on the side facing the centre channel; the tooltip opens outward.
  const left = sideOf(at) === "left"
  const inner = left ? Position.Right : Position.Left
  return { handles: { target: inner, source: inner }, tooltipSide: left ? "left" : "right" }
}

/** The status colour a minimap node takes. */
const MINIMAP_FILL: Record<DagStatus, string> = {
  queued: "var(--track)",
  running: "var(--primary)",
  succeeded: "var(--success)",
  failed: "var(--warning)",
  skipped: "var(--border)",
  canceled: "var(--border)",
}

function Canvas<T extends DagNode>({
  nodes,
  label,
  summary,
  noun,
  layout,
  selectedId,
  select,
  showList,
  panelId,
}: {
  nodes: readonly T[]
  label: string
  summary: string
  noun: { one: string; other: string }
  layout: DagLayout
  selectedId: string | null
  select: (id: string | null) => void
  showList: () => void
  panelId: string
}) {
  const flow = useReactFlow<FlowNode, FlowEdge>()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const markers = `dag-arrow-${uid}`
  const helpId = `dag-help-${uid}`
  const canvasRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 200
  /** R10-03: the person has panned or zoomed. Set by a pan or zoom (pointer, wheel, keys, a node
      brought into view), cleared by Fit or Reset. While false the graph refits on every size
      change; while true it keeps the view and only keeps the selected node visible. The ref is
      what the observers read; the state is what renders (`data-view-adjusted`). */
  const [viewAdjusted, setViewAdjustedState] = useState(false)
  const adjusted = useRef(false)
  const setViewAdjusted = useCallback((v: boolean) => {
    adjusted.current = v
    setViewAdjustedState(v)
  }, [])
  /** R10-14: the whole graph can't fit at the zoom floor; the fit shows part of it and a note offers the list. */
  const [partial, setPartial] = useState(false)
  /** R12-07: some of the graph is outside the canvas (a partial fit, a pan or a zoom): the minimap shows. */
  const [offCanvas, setOffCanvas] = useState(false)
  const moveFrom = useRef<{ x: number; y: number; zoom: number } | null>(null)
  const [epoch, setEpoch] = useState(0)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId

  // Layout: only when the shape changes. A grown graph keeps its nodes where they were.
  const shape = structureKey(nodes, layout)
  const placed = useRef<{ key: string; epoch: number; layout: DagLayout; at: Map<string, Point> }>({ key: "", epoch: -1, layout, at: new Map() })
  const positions = useMemo(() => {
    const prev = placed.current
    const keep = prev.epoch === epoch && prev.layout === layout ? prev.at : new Map<string, Point>()
    const at = placeIncrementally(keep, nodes, layout)
    placed.current = { key: shape, epoch, layout, at }
    return at
    // Statuses don't change the shape: `nodes` is read for its ids and dependencies only.
  }, [shape, epoch, layout])

  const order = useMemo(() => dependencyOrder(nodes), [shape])
  const edges = useMemo(() => edgesOf(nodes), [shape])
  const failing = useMemo(() => failurePath(nodes), [nodes])
  const lit = useMemo(() => (selectedId && nodes.some((n) => n.id === selectedId) ? selectionPath(selectedId, nodes) : null), [selectedId, shape])

  const flowNodes = useMemo<FlowNode[]>(
    () =>
      nodes.map((item) => ({
        id: item.id,
        type: "graph",
        position: positions.get(item.id) ?? { x: 0, y: 0 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        draggable: false,
        connectable: false,
        selectable: false,
        focusable: false,
        data: {
          item,
          statusText: item.statusText ?? dagStatusLabel(item.status),
          selected: item.id === selectedId,
          dim: Boolean(lit && !lit.nodes.has(item.id)),
          ...nodeSides(layout, positions.get(item.id) ?? { x: 0, y: 0 }),
          panelId,
        },
      })),
    [nodes, positions, selectedId, lit, layout, panelId]
  )
  const statusOf = useMemo(() => new Map(nodes.map((n) => [n.id, n.status])), [nodes])
  const flowEdges = useMemo<FlowEdge[]>(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "graph",
        focusable: false,
        selectable: false,
        data: {
          path: lit?.edges.has(e.id) ? "on" : "off",
          dim: Boolean(lit && !lit.edges.has(e.id)),
          failure: failing.has(e.id),
          running: statusOf.get(e.target) === "running",
          markers,
        },
      })),
    [edges, lit, failing, statusOf, markers]
  )

  /** The bounding box of some nodes, in graph units. */
  const boundsOf = useCallback(
    (ids: readonly string[]) => {
      const ps = ids.map((id) => positions.get(id)).filter((p): p is Point => Boolean(p))
      const xs = ps.map((p) => p.x)
      const ys = ps.map((p) => p.y)
      return { w: Math.max(...xs) - Math.min(...xs) + NODE_WIDTH, h: Math.max(...ys) - Math.min(...ys) + NODE_HEIGHT }
    },
    [positions]
  )

  /** Fit the view (R10-03, R10-14): every node if they fit at the 25% floor; otherwise the
      selected node with its direct neighbours (or the node alone), else the first ranks. */
  const fit = useCallback(
    (animate = true) => {
      const box = canvasRef.current?.getBoundingClientRect()
      const ids = [...positions.keys()]
      const opts = { ...FIT, duration: animate ? duration : 0 }
      if (!box || box.width === 0 || ids.length === 0) return void flow.fitView(opts)
      const fits = (some: readonly string[]) => {
        const b = boundsOf(some)
        return Math.min((box.width - FIT_PAD.x) / b.w, (box.height - FIT_PAD.y) / b.h) >= MIN_ZOOM
      }
      if (fits(ids)) {
        setPartial(false)
        return void flow.fitView(opts)
      }
      setPartial(true)
      // A partial fit leaves part of the graph outside the canvas, so the minimap shows (R12-07):
      // keep its corner clear (R13-17), on whichever side costs the canvas less (a wide canvas
      // gives up width, a tall one height). Anything this fit shows lands outside the minimap.
      const byWidth = MINIMAP_ROOM.x / box.width <= MINIMAP_ROOM.y / box.height
      const room = byWidth ? { x: MINIMAP_ROOM.x, y: 0 } : { x: 0, y: MINIMAP_ROOM.y }
      const roomFits = (some: readonly string[]) => {
        const b = boundsOf(some)
        return Math.min((box.width - FIT_PAD.x - room.x) / b.w, (box.height - FIT_PAD.y - room.y) / b.h) >= MIN_ZOOM
      }
      const padding = {
        ...FIT.padding,
        right: `${24 + room.x}px` as `${number}px`,
        bottom: `${24 + room.y}px` as `${number}px`,
      }
      const sel = selectedRef.current
      let focus: string[]
      if (sel && positions.has(sel)) {
        const near = [sel, ...edges.filter((e) => e.source === sel || e.target === sel).map((e) => (e.source === sel ? e.target : e.source))]
        focus = roomFits(near) ? near : [sel]
      } else {
        // The first ranks: from the start of the rank axis, as many as fit at the floor.
        const axis = layout === "right" ? "x" : "y"
        const size = layout === "right" ? NODE_WIDTH : NODE_HEIGHT
        const span = (layout === "right" ? box.width - FIT_PAD.x - room.x : box.height - FIT_PAD.y - room.y) / MIN_ZOOM
        const start = Math.min(...ids.map((id) => positions.get(id)![axis]))
        focus = ids.filter((id) => positions.get(id)![axis] - start + size <= span)
        if (focus.length === 0) focus = [order[0]]
      }
      void flow.fitView({ ...opts, padding, nodes: focus.map((id) => ({ id })) })
    },
    [flow, duration, positions, boundsOf, edges, layout, order]
  )

  /** R12-07: is any node outside the canvas at this viewport? (The minimap shows only then.) */
  const checkOffCanvas = useCallback(
    (v: { x: number; y: number; zoom: number }) => {
      const box = canvasRef.current?.getBoundingClientRect()
      if (!box || box.width === 0 || positions.size === 0) return
      const ps = [...positions.values()]
      const left = Math.min(...ps.map((p) => p.x)) * v.zoom + v.x
      const top = Math.min(...ps.map((p) => p.y)) * v.zoom + v.y
      const right = (Math.max(...ps.map((p) => p.x)) + NODE_WIDTH) * v.zoom + v.x
      const bottom = (Math.max(...ps.map((p) => p.y)) + NODE_HEIGHT) * v.zoom + v.y
      const out = left < -1 || top < -1 || right > box.width + 1 || bottom > box.height + 1
      setOffCanvas((was) => (was === out ? was : out))
    },
    [positions]
  )

  /** Bring a node into view at the current zoom if any of it is outside the canvas. Returns whether the view moved. */
  const bringIntoView = useCallback(
    (id: string) => {
      const el = canvasRef.current?.querySelector<HTMLElement>(`[data-dag-node="${CSS.escape(id)}"]`)
      const p = positions.get(id)
      if (!el || !p) return false
      const box = canvasRef.current!.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      if (r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom) return false
      void flow.setCenter(p.x + NODE_WIDTH / 2, p.y + NODE_HEIGHT / 2, { zoom: flow.getZoom(), duration })
      return true
    },
    [flow, positions, duration]
  )

  // Any size change (the window, the details panel opening or closing, full screen): refit while
  // the view isn't adjusted; once it is, keep it and only keep the selected node in view.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (!adjusted.current) fit(false)
      else if (selectedRef.current) bringIntoView(selectedRef.current)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit, bringIntoView])
  // The graph grew (or was reset): refit unless the view is adjusted.
  useEffect(() => {
    if (!adjusted.current) requestAnimationFrame(() => fit(false))
  }, [positions, fit])
  // A new selection with the panel already open (no size change): an adjusted view brings it into
  // view; a partial fit moves to its neighbourhood.
  useEffect(() => {
    if (!selectedId) return
    requestAnimationFrame(() => {
      if (adjusted.current) bringIntoView(selectedId)
      else if (partial) fit(false)
    })
    // Only on a selection change: a resize has its own observer.
  }, [selectedId])
  // React Flow's box clips (overflow hidden) but can still be scrolled by the browser (a focused
  // element brought into view, find-in-page): keep it at the origin so the picture never shifts.
  useEffect(() => {
    const box = canvasRef.current?.querySelector<HTMLElement>(".react-flow")
    if (!box) return
    const reset = () => {
      if (box.scrollLeft || box.scrollTop) box.scrollTo(0, 0)
    }
    box.addEventListener("scroll", reset)
    return () => box.removeEventListener("scroll", reset)
  }, [])

  const focusNode = useCallback(
    (id: string) => {
      const el = canvasRef.current?.querySelector<HTMLElement>(`[data-dag-node="${CSS.escape(id)}"]`)
      if (!el) return
      if (bringIntoView(id)) setViewAdjusted(true)
      el.focus({ preventScroll: true })
    },
    [bringIntoView, setViewAdjusted]
  )

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const current = (e.target as HTMLElement).closest<HTMLElement>("[data-dag-node]")?.dataset.dagNode ?? null
    const pan = (dx: number, dy: number) => {
      e.preventDefault()
      setViewAdjusted(true)
      const v = flow.getViewport()
      void flow.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom }, { duration: reduce ? 0 : 120 })
    }
    switch (e.key) {
      case "ArrowLeft":
        return pan(PAN_STEP, 0)
      case "ArrowRight":
        return pan(-PAN_STEP, 0)
      case "ArrowUp":
        return pan(0, PAN_STEP)
      case "ArrowDown":
        return pan(0, -PAN_STEP)
      case "+":
      case "=":
        e.preventDefault()
        setViewAdjusted(true)
        return void flow.zoomIn({ duration })
      case "-":
      case "_":
        e.preventDefault()
        setViewAdjusted(true)
        return void flow.zoomOut({ duration })
      case "0":
        e.preventDefault()
        setViewAdjusted(false)
        return fit()
      case "Home":
      case "End":
        if (!order.length) return
        e.preventDefault()
        return focusNode(e.key === "Home" ? order[0] : order[order.length - 1])
      case "Escape":
        if (selectedId) {
          e.preventDefault()
          select(null)
        }
        return
      case "Tab": {
        if (!order.length) return
        const at = current ? order.indexOf(current) : -1
        if (e.shiftKey) {
          if (at < 0) return // from the canvas: leave the frame backwards
          e.preventDefault()
          if (at === 0) canvasRef.current?.focus()
          else focusNode(order[at - 1])
          return
        }
        if (at === order.length - 1) return // after the last node: leave the frame
        e.preventDefault()
        return focusNode(order[at + 1])
      }
    }
  }

  /** R12-07: the controls share one surface (a vertical pill); each button is a ghost inside it. */
  const control = "text-muted-foreground hover:text-card-foreground"
  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={canvasRef}
        tabIndex={0}
        role="group"
        data-view-adjusted={viewAdjusted || undefined}
        aria-roledescription="graph"
        aria-label={`${label}. ${summary}`}
        aria-describedby={helpId}
        onKeyDown={onKeyDown}
        data-slot="dag-canvas"
        className="dag-canvas size-full focus-ring"
      >
        <ReactFlow<FlowNode, FlowEdge>
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(e, n) => {
            select(n.id === selectedId ? null : n.id)
            // Focus follows the click without scrolling (see the node's onMouseDown), so Escape
            // and Tab carry on from here.
            ;(e.target as HTMLElement).closest<HTMLElement>("[data-dag-node]")?.focus({ preventScroll: true })
          }}
          // A press that doesn't move the view (a click on a node) isn't an interaction; a drag,
          // a Ctrl/⌘ + wheel or a pinch that moved it is (event is null for our own fits).
          onMoveStart={(event, viewport) => {
            if (event) moveFrom.current = viewport
          }}
          onMoveEnd={(event, viewport) => {
            const from = moveFrom.current
            moveFrom.current = null
            if (event && from && (from.x !== viewport.x || from.y !== viewport.y || from.zoom !== viewport.zoom)) setViewAdjusted(true)
            checkOffCanvas(viewport)
          }}
          onInit={(instance) => checkOffCanvas(instance.getViewport())}
          fitView
          fitViewOptions={FIT}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          disableKeyboardA11y
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          panOnDrag
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          panActivationKeyCode={null}
          attributionPosition="bottom-right"
          colorMode="light"
        >
          {offCanvas && (
            <MiniMap<FlowNode>
              position="bottom-right"
              ariaLabel={`Overview of all ${nodes.length} nodes`}
              nodeColor={(n) => MINIMAP_FILL[n.data.item.status]}
              nodeStrokeWidth={0}
              nodeBorderRadius={8}
              bgColor="var(--card)"
              maskColor="color-mix(in oklab, var(--muted) 70%, transparent)"
              className="dag-minimap overflow-hidden rounded-lg border shadow-card"
            />
          )}
        </ReactFlow>
      </div>
      <svg aria-hidden className="pointer-events-none absolute size-0 overflow-hidden">
        <defs>
          {(["default", "path", "failure"] as const).map((tone) => (
            <marker key={tone} id={`${markers}-${tone}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="dag-arrow" data-tone={tone} />
            </marker>
          ))}
        </defs>
      </svg>
      {/* R20-13: the zoom column is a vertical ButtonGroup (actions side by side, nothing pressed), framed as a card. */}
      <ButtonGroup orientation="vertical" label="View" className="absolute bottom-3 left-3 z-raised rounded-full border bg-card p-0.5 shadow-card">
        <Button variant="ghost" size="icon" className={control} aria-label="Zoom in" icon={<PlusIcon aria-hidden />} onClick={() => (setViewAdjusted(true), void flow.zoomIn({ duration }))} />
        <Button variant="ghost" size="icon" className={control} aria-label="Zoom out" icon={<MinusIcon aria-hidden />} onClick={() => (setViewAdjusted(true), void flow.zoomOut({ duration }))} />
        <Button variant="ghost" size="icon" className={control} aria-label="Fit to view" icon={<ScanIcon aria-hidden />} onClick={() => (setViewAdjusted(false), fit())} />
        <ButtonGroupSeparator orientation="horizontal" className="mx-2! w-auto" />
        <Button
          variant="ghost"
          size="icon"
          className={control}
          aria-label="Reset the layout and view"
          icon={<RotateCcwIcon aria-hidden />}
          onClick={() => {
            setViewAdjusted(false)
            setEpoch((n) => n + 1)
          }}
        />
      </ButtonGroup>
      {partial && (
        // Clear of the control column on the left; centred over the canvas.
        <div className="pointer-events-none absolute inset-x-14 top-3 z-raised flex justify-center">
          <p data-slot="dag-partial" className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 rounded-full border bg-card px-3 py-1.5 text-center text-xs font-medium text-body-muted shadow-card">
            <span>Showing part of the graph.</span>
            <Button variant="link" size="inline" onClick={showList}>
              The list shows every {noun.one}
            </Button>
          </p>
        </div>
      )}
      <p id={helpId} className="sr-only">
        Arrow keys pan, plus and minus zoom, 0 fits. Tab moves through the nodes in dependency order, Enter opens one, Escape closes it. The list view shows the same graph as a table.
      </p>
    </div>
  )
}

/** The default details: status, duration, what it depends on. */
function DefaultDetails({ node, nameOf }: { node: DagNode; nameOf: (id: string) => string }) {
  return (
    <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Status</dt>
      <dd className="col-span-2 text-card-foreground">{node.statusText ?? dagStatusLabel(node.status)}</dd>
      <dt className="text-muted-foreground">Duration</dt>
      <dd className="col-span-2 tabular-nums text-card-foreground">{node.duration ?? "—"}</dd>
      <dt className="text-muted-foreground">Depends on</dt>
      <dd className="col-span-2 text-card-foreground">{node.dependsOn.length ? node.dependsOn.map(nameOf).join(", ") : "Nothing"}</dd>
    </dl>
  )
}

/** A DAG (steps and their dependencies) in a frame: fitted, zoomable without stealing the page's scroll, keyboard and list view, a details panel for the selected step. */
function DagFrame<T extends DagNode = DagNode>({
  nodes,
  label,
  title,
  headingLevel = 2,
  noun = { one: "step", other: "steps" },
  layout = "right",
  selectedId: controlled,
  onSelect,
  renderDetails,
  loading = false,
  error,
  emptyMessage = "Nothing has run yet",
  height = "auto",
  defaultView = "graph",
  className,
}: DagFrameProps<T>) {
  const [own, setOwn] = useState<string | null>(null)
  const selectedId = controlled === undefined ? own : controlled
  const select = useCallback(
    (id: string | null) => {
      if (controlled === undefined) setOwn(id)
      onSelect?.(id)
    },
    [controlled, onSelect]
  )
  const [view, setView] = useState(defaultView)
  const rootRef = useRef<HTMLElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const panelId = `dag-panel-${uid}`
  const titleId = `dag-title-${uid}`
  const Heading = headingLevel === 3 ? "h3" : "h2"
  const PanelHeading = headingLevel === 3 ? "h4" : "h3"
  const summary = loading ? `Loading ${noun.other}` : summarize(nodes, noun)
  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : undefined
  const nameOf = useCallback((id: string) => nodes.find((n) => n.id === id)?.label ?? id, [nodes])
  const shape = structureKey(nodes, layout)
  // R12-07: the canvas's height follows the graph's shape (the same in the lazy skeleton). A
  // graph that grows while you watch can make the frame taller, never shorter, so a live run
  // never makes the page below it jump back and forth.
  const tallest = useRef<{ px: number; className: string } | null>(null)
  const bodyHeight = useMemo(() => {
    if (height !== "auto") return BODY_HEIGHT[height]
    const next = autoCanvasHeight(nodes, layout)
    if (!tallest.current || next.px > tallest.current.px) tallest.current = next
    return tallest.current.className
  }, [height, shape])
  const counts = useMemo(() => statusCounts(nodes), [nodes])

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener("fullscreenchange", on)
    return () => document.removeEventListener("fullscreenchange", on)
  }, [])
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen?.()
  }

  const closeDetails = () => {
    const id = selectedId
    select(null)
    // Back to the node that was open, so keyboard focus isn't lost with the panel.
    if (id) requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-dag-node="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }))
  }

  const order = useMemo(() => dependencyOrder(nodes), [nodes])
  const rows = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    return order.map((id, i) => ({ n: i + 1, node: byId.get(id)! }))
  }, [nodes, order])
  type Row = (typeof rows)[number]
  const columns = useMemo<DataTableColumn<Row>[]>(
    () => [
      { id: "n", header: "#", numeric: true, cell: (r) => r.n, sortValue: (r) => r.n, hideable: false },
      {
        id: "name",
        header: noun.one.charAt(0).toUpperCase() + noun.one.slice(1),
        cell: (r) => (
          <Button variant="link" size="inline" aria-expanded={r.node.id === selectedId} aria-controls={r.node.id === selectedId ? panelId : undefined} onClick={() => select(r.node.id)}>
            {r.node.label}
          </Button>
        ),
        sortValue: (r) => r.node.label,
        hideable: false,
      },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span className="inline-flex items-center gap-2">
            <StatusMark status={dagMark(r.node.status)} size="sm" />
            {r.node.statusText ?? dagStatusLabel(r.node.status)}
          </span>
        ),
        sortValue: (r) => r.node.status,
        hideable: false,
      },
      { id: "deps", header: "Depends on", cell: (r) => (r.node.dependsOn.length ? r.node.dependsOn.map(nameOf).join(", ") : "—"), hideable: false },
      { id: "duration", header: "Duration", numeric: true, cell: (r) => r.node.duration ?? "—", hideable: false },
    ],
    [noun.one, nameOf, panelId, select, selectedId]
  )

  const state = loading ? "loading" : error ? "error" : nodes.length === 0 ? "empty" : "ready"

  let body: ReactNode
  if (state === "loading") {
    // Node-shaped blocks in ranks (1, 2, 2, 1), centred like a fitted run, so the graph replaces
    // them in place.
    body = (
      <div aria-busy className="flex flex-1 items-center justify-center gap-12 overflow-hidden px-10">
        {[1, 2, 2, 1].map((n, r) => (
          <div key={r} className="flex w-48 shrink-0 flex-col gap-4">
            {Array.from({ length: n }, (_, i) => (
              <Skeleton key={i} shape="block" className="h-14" />
            ))}
          </div>
        ))}
        <span className="sr-only">{summary}</span>
      </div>
    )
  } else if (state === "error") {
    body = (
      <div className="flex flex-1 items-center justify-center px-6">
        <Callout tone="attention" title={error!.message} actions={error!.onRetry && <CalloutAction onClick={error!.onRetry}>Try again</CalloutAction>} />
      </div>
    )
  } else if (state === "empty") {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={<WorkflowIcon />} title={emptyMessage} />
      </div>
    )
  } else if (view === "list") {
    body = (
      // R12-07: the table is the pane: it fills the canvas's box edge to edge (no inset, no box of
      // its own, no Columns menu), its header sticks and the rows scroll inside; every row on one
      // page, so the pane's height never changes between views.
      <div data-slot="dag-list" className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DataTable rows={rows} columns={columns} getRowId={(r) => r.node.id} label={`${label}, as a list`} initialSort={{ id: "n" }} pageSize={Math.max(rows.length, 1)} maxHeight="fill" />
      </div>
    )
  } else {
    body = (
      <ReactFlowProvider>
        <Canvas nodes={nodes} label={label} summary={summary} noun={noun} layout={layout} selectedId={selectedId} select={select} showList={() => setView("list")} panelId={panelId} />
      </ReactFlowProvider>
    )
  }

  return (
    <section
      ref={rootRef}
      aria-labelledby={titleId}
      data-slot="dag-frame"
      data-state={state}
      data-view={view}
      className={cn("@container/dag flex flex-col overflow-hidden rounded-lg border border-surface-edge bg-card", fullscreen && "h-full rounded-none border-0", className)}
    >
      {/* R11-01: the header is the title and the view controls only; the legend and the summary
          (the live region) sit below the canvas. R20-13: Graph/List is the icon ToggleGroup. */}
      <header data-slot="dag-header" className="flex min-h-control-sm items-center gap-2 border-b px-4 py-2">
        <Heading id={titleId} className="min-w-0 flex-1 text-base font-semibold break-words text-card-foreground">
          {title ?? label}
        </Heading>
        <ToggleGroup type="single" variant="icon" aria-label="Show as" value={view} onValueChange={(v) => v && setView(v as "graph" | "list")}>
          <Tooltip content="Graph">
            <ToggleGroupItem value="graph" variant="icon" aria-label="Graph">
              <WorkflowIcon aria-hidden />
            </ToggleGroupItem>
          </Tooltip>
          <Tooltip content="List">
            <ToggleGroupItem value="list" variant="icon" aria-label="List">
              <ListIcon aria-hidden />
            </ToggleGroupItem>
          </Tooltip>
        </ToggleGroup>
        <Button
          variant="ghost"
          size="icon"
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
          icon={fullscreen ? <Minimize2Icon aria-hidden /> : <Maximize2Icon aria-hidden />}
          onClick={toggleFullscreen}
        />
      </header>
      <div data-slot="dag-body" className={cn("flex min-h-0", fullscreen ? "flex-1" : bodyHeight)}>
        {body}
        {selected && state === "ready" && (
          <aside
            id={panelId}
            aria-labelledby={`${panelId}-title`}
            data-slot="dag-details"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault()
                closeDetails()
              }
            }}
            className="flex w-popover shrink-0 flex-col border-l bg-card @5xl/dag:w-popover-wide"
          >
            <div className="flex items-start gap-2 border-b py-2 pr-2 pl-4">
              <StatusMark status={dagMark(selected.status)} className="mt-2" />
              <PanelHeading id={`${panelId}-title`} className="min-w-0 flex-1 py-2 text-sm font-semibold break-words text-card-foreground">
                {selected.label}
              </PanelHeading>
              <Button variant="ghost" size="icon" aria-label="Close details" icon={<XIcon aria-hidden />} onClick={closeDetails} />
            </div>
            <div tabIndex={0} aria-labelledby={`${panelId}-title`} role="region" className="min-h-0 flex-1 overflow-auto px-4 py-4 scrollbar-thin scrollbar-stable focus-ring">{renderDetails ? renderDetails(selected) : <DefaultDetails node={selected} nameOf={nameOf} />}</div>
          </aside>
        )}
      </div>
      {/* R12-07: one row. The counts are the legend: each wears its status mark, only the
          statuses on the graph. The sentence is what the live region says. */}
      <footer data-slot="dag-footer" className="border-t px-4 py-2.5">
        <p role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="sr-only">{summary}</span>
          <span aria-hidden className="font-medium text-card-foreground">
            {loading ? summary : `${nodes.length} ${nodes.length === 1 ? noun.one : noun.other}`}
          </span>
          {!loading &&
            counts.map(({ status, count }) => (
              <span key={status} aria-hidden data-count={status} className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <StatusMark status={dagMark(status)} size="sm" />
                <span className="tabular-nums">{count}</span> {STATUS_LABEL[status].toLowerCase()}
              </span>
            ))}
        </p>
      </footer>
    </section>
  )
}

export { DagFrame }
export type { DagFrameProps, DagLayout, DagNode, DagStatus }
