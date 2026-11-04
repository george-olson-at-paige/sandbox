"use client"

import { useRef, type ElementType, type ReactElement, type ReactNode } from "react"
import { MoreHorizontal } from "lucide-react"

import type { Shape } from "../../lib/vocabulary"
import { Button } from "./button"
import { ContextMenu } from "./context-menu"
import { DropdownMenu } from "./dropdown-menu"
import { actionEntries, useListActionRunner, type ListAction, type RunnableAction } from "../internal/list-action"

/* useActionMenu (S-41, George 2026-10-29): one list of typed actions (ListAction), three ways in,
   one set of rules. What used to live inside RowActions, so a table row (RowActions) and an Item
   act alike:
   - `trigger`: the ⋯ that opens the actions (a DropdownMenu). Always shown: the way in everyone
     can see and reach.
   - `withContextMenu(target)`: the same actions when the target is right-clicked (ContextMenu;
     long-press on touch, Shift+F10 or the Menu key from something focused inside). A shortcut
     only, beside the ⋯, never instead of it.
   - `dialog`: the confirm, rendered once. Both menus start actions through the same runner, so a
     destructive action confirms however it was chosen, and focus returns to the ⋯ after.
   The rules (R12-10, rationale in REVIEW-12): entries grouped under their headings, destructive
   last after a rule, red only when irreversible (R2-03), every destructive one confirmed; an
   action that can't apply stays in the menu, off, with its reason; a `menu` action is a
   submenu. The ⋯ is `ghost` in a table and `quiet` on an Item (S-35). */

/** One list of actions as a ⋯ menu, a right-click menu around a target, and their confirm. */
function useActionMenu({
  actions,
  label,
  linkAs,
  onDone,
  variant = "ghost",
  shape = "pill",
}: {
  /** The actions, in order (destructive ones move last). */
  actions: readonly ListAction[]
  /** Whose actions, for screen readers ("Actions for Ada Park"): names the ⋯ and both menus. */
  label: string
  /** The app's router link for `link` actions. */
  linkAs?: ElementType
  /** Hears each action that worked (after its confirm). */
  onDone?: (action: RunnableAction) => void
  /** The ⋯'s look: `ghost` (a table row) or `quiet` (an Item). */
  variant?: "ghost" | "quiet"
  /** The ⋯'s outline: `pill` (default) or `rect`, a tool in a bar of tools (a View's stage bar, D-V2). */
  shape?: Extract<Shape, "pill" | "rect">
}): { trigger: ReactNode; withContextMenu: (target: ReactElement) => ReactNode; dialog: ReactNode } {
  const trigger = useRef<HTMLButtonElement>(null)
  const { start, dialog } = useListActionRunner({ onDone, returnFocusTo: () => trigger.current })
  const items = actionEntries(actions, (a) => void start(a))
  return {
    trigger: (
      <DropdownMenu
        aria-label={label}
        modal={false}
        linkAs={linkAs}
        trigger={<Button ref={trigger} data-slot="row-actions" variant={variant} shape={shape} size="icon" aria-label={label} icon={<MoreHorizontal aria-hidden />} />}
        items={items}
      />
    ),
    withContextMenu: (target) => (
      <ContextMenu aria-label={label} linkAs={linkAs} items={items}>
        {target}
      </ContextMenu>
    ),
    dialog,
  }
}

export { useActionMenu }
export type { ListAction, RunnableAction }
