"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import {
  AlertDialog as UiAlertDialog,
  AlertDialogDescription as UiAlertDialogDescription,
  AlertDialogOverlay as UiAlertDialogOverlay,
  AlertDialogPortal as UiAlertDialogPortal,
  AlertDialogTitle as UiAlertDialogTitle,
} from "../../base/alert-dialog"
import { Button } from "../actions/button"
import { Textarea } from "../inputs/textarea"

/* @archetype Overlay (ARCHETYPES.md).
   ConfirmDialog (R12-10): the one confirm for an action that changes someone's account, with
   Radix's AlertDialog behaviour (modal, focus trapped, Escape and Cancel close it, focus goes
   back to what opened it; a click outside does nothing, so it's never dismissed by accident).
   Over upstream AlertDialog (GAPS #131): root, portal, overlay, title and description are the
   base's. The content and Cancel are the primitive's: the base's AlertDialogContent brings its
   own overlay (bg-black/50) this layer can't restyle, and its Cancel paints the base Button, not
   Paige's.
   - The title says what will happen ("Disable Ada Park's account?"), the description the effect;
     the confirm button names the action ("Disable account"), never "OK" or "Yes".
   - `tone="destructive"` paints the confirm red: irreversible actions only (R2-03). Anything that
     can be undone confirms with the primary button, however serious.
   - `reason`: support actions go in the audit trail, so the dialog can ask why (required: the
     confirm stays off until there's text; optional: it's offered). The reason field takes focus;
     without one Cancel does, so Enter never confirms by reflex.
   - `children`: what the action needs beyond a reason (a plan to move to, a date); the caller owns
     that state and says when it's complete with `canConfirm`.
   - The four states: idle; pending (the confirm says "Working…", every control is off, Escape is
     ignored, so nothing can go twice); success (onConfirm returns nothing: the dialog closes and
     the caller shows the result in place, never a banner); failure (onConfirm returns
     `{ error }` or throws: the message shows in the dialog, announced, the input kept, the
     confirm ready to try again). */

/** What an action reports back: nothing when it worked, or a message for the person. */
type ActionResult = void | { error: string }

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What will happen, as a question ("Disable Ada Park's account?"). */
  title: string
  /** The effect, in a sentence or two. */
  description?: ReactNode
  /** The confirm button: the action's name ("Disable account"). */
  confirmLabel: string
  cancelLabel?: string
  /** destructive: a red confirm, for irreversible actions only (R2-03). */
  tone?: "default" | "destructive"
  /** Ask for a reason (it goes in the audit trail): required keeps the confirm off until there's text. */
  reason?: "required" | "optional"
  /** The reason field's label. */
  reasonLabel?: string
  /** Fields the action needs beyond the reason; the caller owns their state. */
  children?: ReactNode
  /** False while `children` are incomplete (default true). */
  canConfirm?: boolean
  /** Runs the action. Return nothing on success (the dialog closes) or `{ error }` (it stays, showing it). */
  onConfirm: (ctx: { reason: string }) => ActionResult | Promise<ActionResult>
  /** Where focus goes when it closes; default: back to what had it when it opened (Radix). */
  returnFocusTo?: () => HTMLElement | null | undefined
}

const FAILED = "That didn't go through. Try again in a moment."

/** A modal confirm for an action: what will happen, an optional reason, then Cancel or the action; shows pending and failure in place. */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  reason,
  reasonLabel = "Reason",
  children,
  canConfirm = true,
  onConfirm,
  returnFocusTo,
}: ConfirmDialogProps) {
  const [text, setText] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reasonId = useId()
  const hintId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)

  // Each opening starts clean.
  useEffect(() => {
    if (open) {
      setText("")
      setError(null)
      setPending(false)
    }
  }, [open])

  const ready = canConfirm && (reason !== "required" || text.trim() !== "")

  async function confirm() {
    if (!ready || pending) return
    setPending(true)
    setError(null)
    let result: ActionResult
    try {
      result = await onConfirm({ reason: text.trim() })
    } catch {
      result = { error: FAILED }
    }
    setPending(false)
    if (result && "error" in result) setError(result.error || FAILED)
    else onOpenChange(false)
  }

  return (
    <UiAlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <UiAlertDialogPortal>
        <UiAlertDialogOverlay className="bg-overlay-scrim" />
        <AlertDialogPrimitive.Content
          data-slot="confirm-dialog"
          data-tone={tone}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(reason ? reasonRef.current : cancelRef.current)?.focus()
          }}
          onEscapeKeyDown={(e) => pending && e.preventDefault()}
          onCloseAutoFocus={(e) => {
            const to = returnFocusTo?.()
            if (to && to.isConnected) {
              e.preventDefault()
              to.focus()
            }
          }}
          className="fixed top-1/2 left-1/2 z-overlay flex w-full max-w-dialog-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-xl border bg-popover p-6 text-popover-foreground shadow-pop data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex flex-col gap-2">
            <UiAlertDialogTitle className="text-lg font-semibold text-foreground-strong">{title}</UiAlertDialogTitle>
            {description ? (
              <UiAlertDialogDescription className="text-sm font-medium text-body-muted">{description}</UiAlertDialogDescription>
            ) : (
              // Radix asks for a description; without one the title carries the dialog.
              <UiAlertDialogDescription className="sr-only">{title}</UiAlertDialogDescription>
            )}
          </div>
          {children && <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">{children}</fieldset>}
          {reason && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={reasonId} className="text-sm font-semibold text-card-foreground">
                {reasonLabel}
                {reason === "optional" && <span className="font-medium text-muted-foreground"> (optional)</span>}
              </label>
              <Textarea
                ref={reasonRef}
                id={reasonId}
                aria-describedby={hintId}
                aria-required={reason === "required" || undefined}
                value={text}
                readOnly={pending}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    void confirm()
                  }
                }}
              />
              <p id={hintId} className="text-xs font-medium text-muted-foreground">
                It goes in the audit trail with your name.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" data-slot="confirm-dialog-error" className="rounded-md bg-attention-subtle px-3 py-2 text-sm font-medium text-attention-foreground">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button ref={cancelRef} variant="secondary" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            {/* Not AlertDialog.Action: that closes the dialog on click, before the action has answered. */}
            <Button
              variant={tone === "destructive" ? "destructive" : "primary"}
              aria-disabled={!ready || pending || undefined}
              data-pending={pending || undefined}
              onClick={() => void confirm()}
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </UiAlertDialogPortal>
    </UiAlertDialog>
  )
}

export { ConfirmDialog }
export type { ActionResult, ConfirmDialogProps }
