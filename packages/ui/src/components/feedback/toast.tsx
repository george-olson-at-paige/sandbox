"use client"

import type { ComponentProps, CSSProperties } from "react"
import { toast, type ExternalToast } from "sonner"

import { cn } from "../../lib/utils"
import { Toaster as UiToaster } from "../../base/sonner"
import { buttonClassName } from "../actions/button"
import { Attachment, type AttachmentProps } from "../display/attachment"

/* @archetype Overlay (ARCHETYPES.md).
   Toast (R19-04, R19-05; shadcn sonner, 2026-10-30): a short message that arrives over the page
   and leaves — "Saved", "We couldn't reach the server", an undo — and, with `attachmentToast`,
   the one that stays: a document in flight, updated as its stream moves (R19-06). Named for
   what a person sees, as Dialog is not called Radix: the engine is sonner, and it appears only
   in src/base/sonner.tsx and package.json; the app imports `Toaster` and `toast` from here, so
   the engine can change under the name. shadcn's `toast` (Base UI, 2026) is not used: Base UI
   never lands beside Radix (INTAKE I-02).
   - `Toaster` is mounted once, at the app's root (the Storybook stories mount their own). Light
     only (`theme="light"`: the base reads the OS theme through next-themes; Paige has no dark
     theme, so the OS setting must not flip it). Bottom right, a close button on every toast
     (inside, top right, the ghost icon Button Dialog's close is; a loading toast has none, as
     sonner has it), three visible before they stack, five seconds for the ones that leave on
     their own.
   - The look is Paige's, not sonner's: sonner's own stylesheet is unlayered CSS, which beats
     any Tailwind utility (they sit in a cascade layer), so a class on the toast could not
     change what sonner had set. `unstyled` turns sonner's box, type and button styles off
     (its stacking, swipe and motion stay) and `classNames` draws the card from tokens: the
     popover surface with the pop shadow, 600 title, muted description, the type's icon in its
     tone. The one thing a class cannot reach is the toaster's font (sonner sets it on the
     list itself), so it is passed as a style.
   - The call is sonner's `toast`: `toast("Saved")`, `toast.success(…)`, `toast.error(…)`,
     `toast.promise(…)`, `toast.dismiss(id)`; `{ description, action, duration, id }`. For a real
     Paige button in a toast pass `action` as JSX (`action: <Button size="sm">Undo</Button>`);
     the string form (`{ label, onClick }`) is a button sonner draws, given Button's own sm
     classes (`buttonClassName`), so the two look the same.
   - `attachmentToast(id, props)` shows an Attachment inside a toast and keeps it there
     (`duration: Infinity`): George 2026-10-30, "persistent until navigated away or dismissed".
     Calling it again with the same `id` updates the toast in place, so one call per stage of
     the stream is the whole pattern (uploading with an estimate → reading → done, or failed,
     which stays too, with the reason in the row's line). Leaving the page is the caller's
     `toast.dismiss(id)` (a cleanup effect; the story shows it): the Toaster sits above the
     router, so nothing else would take the toast down. The row is Paige's Attachment with its
     frame off, compact, so the toast's own card is the one frame.
   - A toast is never the only place information lives (R4-07's rule for Tooltip holds here):
     the page shows the same state on the thing it is about. */
const CLASS_NAMES = {
  // Two of sonner's own rules are gated on data-styled and so lost with `unstyled`; both are
  // redrawn here: a toast behind the front one hides its contents while the stack is collapsed
  // (the children, not the card: the card is the deck's edge), and the icon box is `relative`
  // because the loading spinner is absolutely placed inside it.
  // The close button sits inside, top right, so its whole hit area is on the card (George
  // 2026-10-31: half outside, it was harder to hit); the card keeps room for it only when it is
  // there (a loading toast has none).
  toast:
    "group/toast flex w-(--width) items-start gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-pop has-[[data-close-button]]:pr-12 data-[expanded=false]:data-[front=false]:*:opacity-0",
  content: "flex min-w-0 flex-1 flex-col gap-0.5",
  title: "font-semibold leading-snug text-card-foreground",
  description: "font-medium text-muted-foreground",
  icon: "relative mt-0.5 flex size-icon shrink-0 items-center justify-center [&_svg]:size-icon",
  success: "[&_[data-icon]]:text-success",
  info: "[&_[data-icon]]:text-info",
  warning: "[&_[data-icon]]:text-attention",
  error: "[&_[data-icon]]:text-destructive",
  loading: "[&_[data-icon]]:text-muted-foreground",
  // sonner draws the string-form action, cancel and close buttons itself, so they get Button's
  // classes; the close is the same ghost icon Button Dialog's close is.
  actionButton: cn(buttonClassName("primary", "sm"), "ml-auto shrink-0"),
  cancelButton: cn(buttonClassName("secondary", "sm"), "shrink-0"),
  closeButton: cn(buttonClassName("ghost", "icon"), "absolute top-2 right-2"),
} as const

/** The toaster's font: sonner sets its own on the list, unlayered, so only a style reaches it. */
const TOASTER_STYLE: CSSProperties = { fontFamily: "var(--font-sans)" }

/** Default life of a toast that leaves on its own, ms. */
const DURATION = 5000

/** A short message over the page that leaves on its own (`toast`), or a document in flight that stays (`attachmentToast`); mount the Toaster once at the root. */
function Toaster({ toastOptions, style, ...props }: ComponentProps<typeof UiToaster>) {
  // The font is a token (--font-sans) reaching sonner's list the only way it can: as a style.
  const toasterStyle = { ...TOASTER_STYLE, ...style }
  return (
    <UiToaster
      theme="light"
      position="bottom-right"
      closeButton
      visibleToasts={3}
      duration={DURATION}
      style={toasterStyle}
      toastOptions={{ unstyled: true, classNames: CLASS_NAMES, ...toastOptions }}
      {...props}
    />
  )
}

/** Options a toast call takes: description, action, duration, id, onDismiss… (sonner's). */
export type ToastOptions = ExternalToast

/** Shows an Attachment in a toast that stays until dismissed; call again with the same `id` to update it in place (one call per stage). */
function attachmentToast(id: string | number, props: AttachmentProps, options?: Omit<ToastOptions, "id" | "duration">) {
  return toast(<Attachment density="compact" {...props} framed={false} />, { id, duration: Number.POSITIVE_INFINITY, ...options })
}

export { Toaster, attachmentToast, toast }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ToasterProps = ComponentProps<typeof Toaster>
