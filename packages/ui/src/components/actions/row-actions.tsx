"use client"

import type { ComponentProps } from "react"
import type { ElementType } from "react"

import { useActionMenu } from "./action-menu"
import type { ListAction, ListActionConfirm, RunnableAction } from "../internal/list-action"

/* @archetype Composite (ARCHETYPES.md).
   RowActions (R12-10, rationale in REVIEW-12): the overflow menu at the end of a table row, a
   `⋯` icon button opening a DropdownMenu of typed actions (ListAction):
   - Order: the entries as given, grouped under their `group` heading (the person page's groups:
     View, then Sign-in, then Billing), a rule between groups; `destructive` entries always last,
     after a rule, whatever order they came in.
   - Every destructive entry confirms (ConfirmDialog; the type requires `confirm`); red only when
     it can't be undone (`irreversible`, R2-03). Other actions confirm when they say so (a reason
     for the audit trail, or fields such as a plan).
   - An action that can't apply to this row stays in the menu, off, with its reason under the
     label ("Email already verified"), so the menu teaches the rule instead of hiding it. The off
     item stays in the arrow-key order with the reason as its description (R13-21, GAPS #136):
     DropdownMenu's `disabledReason`.
   - Items under a group heading are indented one step (R13-05, every menu).
   - A label ending in "…" asks for more before it acts.
   - A `menu` entry is a submenu that opens to the side (R15-07: Copy signup link → one item per
     plan); its items are links and actions like any other.
   - The button's name says whose actions they are ("Actions for Ada Park"); it is the row
     click's exception (DataTable never opens the row from it), and focus comes back to it when
     the menu or the confirm closes.
   The entries, the runner and the ⋯ are useActionMenu's (action-menu.tsx, S-41), shared with
   Item, which also offers them on right-click. The menu is non-modal so the confirm can open from it cleanly; the result of an action shows
   in place (the row's data, the list's status line), never as a banner. */

/** A row's overflow menu (⋯): its actions grouped, destructive last and confirmed, an action that can't apply shown off with why. */
function RowActions({
  actions,
  label,
  linkAs,
  onDone,
}: {
  /** The row's actions, in order (destructive ones move last). */
  actions: readonly ListAction[]
  /** The button's accessible name: whose actions ("Actions for Ada Park"). */
  label: string
  /** The app's router link for `link` actions. */
  linkAs?: ElementType
  /** Hears each action that worked (after its confirm). */
  onDone?: (action: RunnableAction) => void
}) {
  // The ⋯ and the rules are useActionMenu's (shared with Item); a row offers only the ⋯.
  const { trigger, dialog } = useActionMenu({ actions, label, linkAs, onDone })
  return (
    <>
      {trigger}
      {dialog}
    </>
  )
}

export { RowActions }
export type { ListAction, ListActionConfirm, RunnableAction }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type RowActionsProps = ComponentProps<typeof RowActions>
