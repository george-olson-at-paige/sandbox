"use client"

import type { ComponentProps } from "react"

import { Button } from "../components/actions/button"
import { Dialog } from "../components/overlays/dialog"
import { Stack } from "../primitives/stack"
import type { RemovalKind } from "./stack-rules"

/* @archetype Composite (ARCHETYPES.md).
   RemoveDialog (ADR 0076 amendment rule 6): what × on a stack entry asks. Two ways off, and
   Cancel:
   - **Take {name} off {this list}**: the role or placement goes; the contact stays in People.
     Primary: it can be undone (R2-03: red is for irreversible actions only).
   - **Delete {name} from People**: the contact goes everywhere. Red (`destructive`): once it
     stands it can't be undone. `allowDelete` false leaves only Take off (a stack that never
     deletes contacts).
   - **Cancel** takes focus when the dialog opens, so Enter never removes by reflex; Escape and the
     close button cancel too.
   - Choosing closes the dialog at once and calls `onChoose`: nothing is written yet. The entry
     stays in place, struck through, with Undo, until the person leaves the page (StackEntry,
     PeopleStack); leaving makes it stand. So there's no pending or failure state here: those
     belong to the write on leave.
   - Where coming off means something else (the Delegate: revoking a grant) the item replaces ×
     with that action and doesn't use this dialog. */
/** What × on a stack entry asks: take them off this list, or delete them from People; Cancel is the default. */
function RemoveDialog({
  open,
  onOpenChange,
  name,
  listLabel,
  allowDelete = true,
  onChoose,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The person's name, as the entry shows it. */
  name: string
  /** What they come off, in the owner's words ("your emergency contacts", "this list"). */
  listLabel: string
  /** Offer Delete from People. Default true. */
  allowDelete?: boolean
  /** The choice; the caller strikes the entry and offers Undo. */
  onChoose: (kind: RemovalKind) => void
}) {
  const choose = (kind: RemovalKind) => {
    onOpenChange(false)
    onChoose(kind)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={`Remove ${name}?`}
      description={allowDelete ? `Take them off ${listLabel} and keep them in People, or delete them from People everywhere.` : `They stay in People.`}
    >
      <Stack gap={2} data-slot="remove-dialog">
        <Button variant="primary" onClick={() => choose("take-off")} className={WRAP}>
          Take {name} off {listLabel}
        </Button>
        {allowDelete && (
          <Button variant="destructive" onClick={() => choose("delete")} className={WRAP}>
            Delete {name} from People
          </Button>
        )}
        <Button variant="quiet" autoFocus onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </Stack>
    </Dialog>
  )
}

/** A name and a list can make a long label: let it wrap inside the pill instead of overflowing. */
const WRAP = "h-auto min-h-control py-2 whitespace-normal"

export { RemoveDialog }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type RemoveDialogProps = ComponentProps<typeof RemoveDialog>
