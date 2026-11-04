/* @level 0 — sketch (LEVELS.md). A fact list's behaviour as a pure state machine (TS-BAR §1):
   (state, event) → state, no React. Skeleton scope: rule 1's open thing for entries only. The
   Add region, struck entries with Undo, and commit on leave arrive as later events. */
import { assertNever, pathOf, type FactPath, type FactRef } from "./kinds"

/** The list's one open thing (ADR 0076 amendment rule 1). */
export type ListOpen = { readonly kind: "rest" } | { readonly kind: "fact"; readonly path: FactPath }

export type ListEvent =
  /** Open a fact, or close it when it is the open thing. */
  | { readonly kind: "toggle"; readonly ref: FactRef }
  /** Close whatever is open. */
  | { readonly kind: "close" }

export const LIST_REST: ListOpen = { kind: "rest" }

/** The next open thing. Pure: asking about unsaved input is the caller's, before it sends the event. */
export function listReducer(state: ListOpen, event: ListEvent): ListOpen {
  switch (event.kind) {
    case "toggle": {
      const path = pathOf(event.ref)
      return state.kind === "fact" && state.path === path ? LIST_REST : { kind: "fact", path }
    }
    case "close":
      return LIST_REST
    default:
      return assertNever(event)
  }
}

/** Whether this ref is the list's open thing. */
export const isOpen = (state: ListOpen, ref: FactRef): boolean => state.kind === "fact" && state.path === pathOf(ref)
