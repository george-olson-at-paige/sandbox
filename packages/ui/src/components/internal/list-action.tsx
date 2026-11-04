"use client"

import { useState, type ReactNode } from "react"

import { ConfirmDialog, type ActionResult, type ConfirmDialogProps } from "../overlays/confirm-dialog"
import type { ContextMenuEntry } from "../actions/context-menu"

/* The typed action a list offers on a row (RowActions) or on a selection (BulkActionBar), R12-10,
   and the runner both use: an action with `confirm` opens ConfirmDialog and runs on its confirm;
   one without runs at once. Internal: the public type is re-exported from row-actions.tsx.
   Every action carries an icon, required by type (`icon: ReactNode` on all four kinds and on a
   menu's items), so a menu of actions never shows one entry bare; a pick-list's entries (choose
   a value) are Menu's raw `item`, which keeps `icon?` (R20-04, George 2026-10-31). */

/** What the confirm asks: ConfirmDialog's words, its reason field, and any fields the action needs. */
type ListActionConfirm = Pick<ConfirmDialogProps, "title" | "description" | "confirmLabel" | "reason" | "reasonLabel" | "children" | "canConfirm">

type ListActionBase = {
  id: string
  label: string
  /** Required: every action carries an icon (R20-04). */
  icon: ReactNode
  /** Entries with the same group sit together under its heading (in a menu), in the order given. */
  group?: string
}

/** Go somewhere ("View person"); a link, so it opens in a new tab too. */
type ListLinkAction = ListActionBase & { kind: "link"; href: string }

/** Do something. With `confirm` it asks first; with `disabledReason` it shows, off, with why. */
type ListRunAction = ListActionBase & {
  kind: "action"
  disabledReason?: string
  confirm?: ListActionConfirm
  run: (ctx: { reason: string }) => ActionResult | Promise<ActionResult>
}

/** One action on a row or a selection. */
type ListAction =
  | ListLinkAction
  | ListRunAction
  /** A submenu of links and actions that opens to the side ("Copy signup link" → Customer, VIP,
      Employee; R15-07). Rows only: BulkActionBar leaves it out. An empty `items` shows nothing;
      when none can apply, offer a plain action with `disabledReason` instead. */
  | (ListActionBase & { kind: "menu"; items: Array<ListLinkAction | ListRunAction> })
  /** Takes something away (disable, remove): always last, always confirmed; red only if `irreversible` (R2-03). */
  | (ListActionBase & {
      kind: "destructive"
      irreversible?: boolean
      disabledReason?: string
      confirm: ListActionConfirm
      run: (ctx: { reason: string }) => ActionResult | Promise<ActionResult>
    })

type RunnableAction = Exclude<ListAction, { kind: "link" } | { kind: "menu" }>

/** Destructive entries last, keeping the order given within each kind. */
function orderActions(actions: readonly ListAction[]): ListAction[] {
  return [...actions.filter((a) => a.kind !== "destructive"), ...actions.filter((a) => a.kind === "destructive")]
}

/** Runs actions: `start(action)` confirms first when it should; render `dialog` once. `onDone` hears each success. */
function useListActionRunner({ onDone, returnFocusTo }: { onDone?: (action: RunnableAction) => void; returnFocusTo?: () => HTMLElement | null | undefined } = {}) {
  const [active, setActive] = useState<RunnableAction | null>(null)
  const [open, setOpen] = useState(false)

  async function start(action: RunnableAction) {
    if (action.disabledReason) return
    if (action.confirm) {
      setActive(action)
      setOpen(true)
      return
    }
    const result = await action.run({ reason: "" })
    if (!(result && "error" in result)) onDone?.(action)
  }

  const dialog = active?.confirm ? (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      {...active.confirm}
      tone={active.kind === "destructive" && active.irreversible ? "destructive" : "default"}
      returnFocusTo={returnFocusTo}
      onConfirm={async (ctx) => {
        const result = await active.run(ctx)
        if (!(result && "error" in result)) onDone?.(active)
        return result
      }}
    />
  ) : null

  return { start, dialog }
}

/** A list of actions as menu entries (a ⋯ or a right-click menu): groups with headings, destructive last. */
function actionEntries(actions: readonly ListAction[], start: (a: RunnableAction) => void): ContextMenuEntry[] {
  const entries: ContextMenuEntry[] = []
  let group: string | undefined
  let destructiveStarted = false
  for (const action of orderActions(actions)) {
    const first = entries.length === 0
    if (action.kind === "destructive" && !destructiveStarted) {
      destructiveStarted = true
      if (!first) entries.push({ kind: "separator" })
    } else if (action.kind !== "destructive" && action.group !== group) {
      if (!first) entries.push({ kind: "separator" })
      if (action.group) entries.push({ kind: "label", label: action.group })
    }
    group = action.group
    if (action.kind === "link") entries.push({ kind: "link", label: action.label, icon: action.icon, href: action.href })
    else if (action.kind === "menu") {
      if (action.items.length === 0) continue
      entries.push({
        kind: "sub",
        label: action.label,
        icon: action.icon,
        items: action.items.map((i) =>
          i.kind === "link"
            ? { kind: "link", label: i.label, icon: i.icon, href: i.href }
            : { kind: "item", label: i.label, icon: i.icon, disabledReason: i.disabledReason, onSelect: () => start(i) }
        ),
      })
    } else
      entries.push({
        kind: "item",
        label: action.label,
        icon: action.icon,
        disabledReason: action.disabledReason,
        tone: action.kind === "destructive" && action.irreversible ? "destructive" : "default",
        onSelect: () => start(action),
      })
  }
  return entries
}

export { actionEntries, orderActions, useListActionRunner }
export type { ListAction, ListActionConfirm, RunnableAction }
