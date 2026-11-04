"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import {
  Dialog as UiDialog,
  DialogClose as UiDialogClose,
  DialogDescription as UiDialogDescription,
  DialogOverlay as UiDialogOverlay,
  DialogPortal as UiDialogPortal,
  DialogTitle as UiDialogTitle,
} from "../../base/dialog"
import { Button } from "../actions/button"

/* @archetype Overlay (ARCHETYPES.md).
   Dialog (R15-15): a modal panel for work that isn't a yes/no confirm, such as managing a list (a
   partner's ad strip offers). ConfirmDialog stays the confirm for one action.
   Over upstream Dialog (GAPS #145): root, portal, overlay, title, description and close are the
   base's. The content layer is the primitive's: the base's DialogContent brings its own overlay
   (bg-black/50), which this layer can't restyle, and a centred box that can't cap its height at
   the viewport without an arbitrary value.
   - Modal: focus is trapped and goes back to what opened it; Escape and the close button (X, top
     right, "Close") close it. A click outside does nothing, so work in it is never lost by a stray
     click.
   - `onCloseRequest`: asked before Escape or the close button closes it; return false to stay
     (a form inside with unsaved changes asks first).
   - `size`: md (448, a form), lg (640), xl (896, a list beside an editor or a preview).
   - The panel is at most the viewport's height less 16px each side; the body scrolls inside it and
     the title row stays. */

const SIZE = { md: "max-w-dialog-sm", lg: "max-w-dialog", xl: "max-w-dialog-lg" } as const // the overlay scale (T-04); the prop's words are D-12's

/** A modal panel with a title, a close button and a scrolling body, for work that isn't a single confirm. */
function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "lg",
  onCloseRequest,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What the panel is for ("Manage Cedar Trust's offers"). */
  title: string
  /** One or two sentences under the title. */
  description?: ReactNode
  /** md 448 · lg 640 (default) · xl 896. */
  size?: keyof typeof SIZE
  /** Asked before Escape or the close button closes it; false keeps it open. */
  onCloseRequest?: () => boolean
  children: ReactNode
  /** Placement of the body, not restyling. */
  className?: string
}) {
  const close = () => {
    if (onCloseRequest && !onCloseRequest()) return
    onOpenChange(false)
  }
  return (
    <UiDialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <UiDialogPortal>
        <UiDialogOverlay className="bg-overlay-scrim" />
        {/* The content layer fills the viewport (16px in) and centres the panel, so the panel can
            be at most the viewport's height without an arbitrary value; the body scrolls inside. */}
        <DialogPrimitive.Content
          data-slot="dialog"
          onInteractOutside={(e) => e.preventDefault()}
          className="pointer-events-none fixed inset-0 z-overlay flex items-center justify-center p-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div data-slot="dialog-panel" className={cn("pointer-events-auto flex max-h-full w-full flex-col rounded-xl border bg-popover text-popover-foreground shadow-pop", SIZE[size])}>
            <div className="flex items-start gap-4 px-6 pt-6 pb-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <UiDialogTitle className="text-lg font-semibold text-foreground-strong">{title}</UiDialogTitle>
                {description ? (
                  <UiDialogDescription className="text-sm font-medium text-body-muted">{description}</UiDialogDescription>
                ) : (
                  <UiDialogDescription className="sr-only">{title}</UiDialogDescription>
                )}
              </div>
              {/* Closing goes through the root's onOpenChange, so onCloseRequest is asked. */}
              <UiDialogClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close" icon={<X aria-hidden />} className="-mt-1 -mr-2 shrink-0" />
              </UiDialogClose>
            </div>
            <div data-slot="dialog-body" className={cn("min-h-0 flex-1 overflow-auto px-6 pb-6 scrollbar-thin", className)}>
              {children}
            </div>
          </div>
        </DialogPrimitive.Content>
      </UiDialogPortal>
    </UiDialog>
  )
}

export { Dialog }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type DialogProps = Parameters<typeof Dialog>[0]
