"use client"

import { lazy, Suspense } from "react"

import { cn } from "../lib/utils"

import type { DagFrameProps, DagLayout, DagNode } from "./dag-frame"
import { autoCanvasHeight } from "./internal/dag-shape"
import { dagHeight } from "./internal/heights"

/* @archetype Chart (ARCHETYPES.md).
   LazyDagFrame (R9-06): the entry pages use for a graph. dag-frame.tsx (and React Flow and
   dagre with it, plus React Flow's base CSS) is a dynamic import, so it loads only when a graph
   renders: never in a customer page's bundle (they never import charts/), and not in an admin
   page's first load either. While it loads, a frame-shaped skeleton at the same height holds
   the space, so nothing shifts: the header row, the canvas at the height DagFrame will give it
   (R12-07: `height="auto"` comes from dag-shape.ts, which has no dagre, so the skeleton
   computes the same value), and the footer row. Same props as DagFrame. The fallback is drawn here, not
   imported from ./dag-frame, which would pull the module back into the eager bundle. */
const HEIGHT = dagHeight // the same map DagFrame reads (T-05)
const LoadedDagFrame = lazy(() => import("./dag-frame").then((m) => ({ default: m.DagFrame })))

/** A DagFrame that loads the DAG libraries only when it renders, with a same-size skeleton meanwhile. */
function LazyDagFrame<T extends DagNode = DagNode>(props: DagFrameProps<T>) {
  const height = props.height ?? "auto"
  const fallback = (
    <div data-slot="dag-frame" data-state="loading" aria-busy className={cn("flex flex-col overflow-hidden rounded-lg border bg-card", props.className)}>
      {/* DagFrame's header row (title, Graph/List, full screen), its canvas and its one-row footer (R12-07).
          The header is a small control tall (its icon button) plus py-2, the same token DagFrame's
          header reads (min-h-control-sm, T-01); it was 44 here, 8px taller than the real one. */}
      <div className="flex items-center border-b px-4 py-2">
        <div className="h-control-sm" />
      </div>
      <div className={cn("animate-pulse bg-track motion-reduce:animate-none", height === "auto" ? autoCanvasHeight(props.nodes, props.layout ?? "right").className : HEIGHT[height])} />
      <div className="border-t px-4 py-2.5">
        <div className="h-5" />
      </div>
      <span className="sr-only">Loading {props.label}</span>
    </div>
  )
  return (
    <Suspense fallback={fallback}>
      {/* The lazy component loses the generic; the props are the same object. */}
      <LoadedDagFrame {...(props as unknown as DagFrameProps)} />
    </Suspense>
  )
}

export { LazyDagFrame }
export type { DagFrameProps, DagLayout, DagNode }
