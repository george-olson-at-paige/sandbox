import { useEffect, useRef, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { RotateCcwIcon } from "lucide-react"

import { Toaster, attachmentToast, toast } from "./toast"
import { AttachmentAction, type AttachmentStatus } from "../display/attachment"
import { Button } from "../actions/button"
import { Inline } from "../../primitives/inline"
import { Stack } from "../../primitives/stack"

const meta = {
  component: Toaster,
  tags: ["r19-04", "r19-05", "r19-06", "r19-07"],
  parameters: {
    docs: {
      description: {
        component:
          "**Toast** (R19-04, shadcn sonner, 2026-10-30): a short message that arrives over the page and leaves — and, with `attachmentToast`, the one that stays. Named for what a person sees; the engine (sonner) appears only in `src/base/sonner.tsx`, so the app imports `Toaster` (mounted once at the root) and `toast` (the call) from here. Light only, bottom right, a close button on every toast, three visible before they stack, five seconds for the ones that leave on their own. The look is Paige's card from tokens: sonner's own styles are turned off (`unstyled`) because, being unlayered CSS, they would beat any Tailwind class. `attachmentToast(id, props)` carries an Attachment row and keeps it until dismissed; calling it again with the same id updates it in place, one call per stage of a document's stream; leaving the page is the caller's `toast.dismiss(id)`. A toast is never the only place information lives: the page shows the same state on the thing it is about.",
      },
    },
  },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

/** The kinds: a plain message, and the five types with their icon in its tone. Each leaves after five seconds. */
export const Kinds: Story = {
  render: () => (
    <>
      <Inline gap={2}>
        <Button variant="secondary" size="sm" onClick={() => toast("Your changes are saved")}>Plain</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.success("Family is set up", { description: "Three people, two of them guardians." })}>Success</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.info("Three details need a look", { description: "We found them in your uploaded documents." })}>Info</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.warning("Your session ends in two minutes")}>Warning</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.error("That didn’t save", { description: "Try again in a moment." })}>Error</Button>
        <Button variant="secondary" size="sm" onClick={() => toast.loading("Sending…")}>Loading</Button>
      </Inline>
      <Toaster />
    </>
  ),
}

/** An action: pass a Paige Button as JSX for the real thing; the string form gets a small pill. */
export const WithAction: Story = {
  name: "With an action",
  tags: ["!autodocs"],
  render: () => (
    <>
      <Inline gap={2}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const id = toast("Removed Maria from Family", {
              action: (
                <Button size="sm" className="ml-auto shrink-0" onClick={() => toast.dismiss(id)}>
                  Undo
                </Button>
              ),
            })
          }}
        >
          Undo as a Button
        </Button>
        <Button variant="secondary" size="sm" onClick={() => toast("Removed Maria from Family", { action: { label: "Undo", onClick: () => {} } })}>
          Undo as a string
        </Button>
      </Inline>
      <Toaster />
    </>
  ),
}

/** Persistent: `duration: Infinity` keeps it until the person closes it or the caller dismisses it. */
export const Persistent: Story = {
  tags: ["!autodocs"],
  render: () => (
    <>
      <Inline gap={2}>
        <Button variant="secondary" size="sm" onClick={() => toast.error("We couldn’t reach the server", { id: "offline", description: "Your changes are kept here until it’s back.", duration: Number.POSITIVE_INFINITY })}>
          Show
        </Button>
        <Button variant="quiet" size="sm" onClick={() => toast.dismiss("offline")}>
          Dismiss from code
        </Button>
      </Inline>
      <Toaster />
    </>
  ),
}

/** `toast.promise`: one toast that moves from loading to success or error with the work. */
export const WithPromise: Story = {
  name: "With a promise",
  tags: ["!autodocs"],
  render: () => (
    <>
      <Inline gap={2}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            toast.promise(new Promise<void>((resolve) => setTimeout(resolve, 1800)), {
              loading: "Saving your will…",
              success: "Your will is saved",
              error: "That didn’t save",
            })
          }
        >
          Save (succeeds)
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            toast.promise(new Promise<void>((_, reject) => setTimeout(reject, 1800)), {
              loading: "Saving your will…",
              success: "Your will is saved",
              error: "That didn’t save",
            })
          }
        >
          Save (fails)
        </Button>
      </Inline>
      <Toaster />
    </>
  ),
}

/* ---------- A document in flight (R19-06, R19-07) ----------
   The stream has two beats the person waits through (uploadProgress.ts): `uploading` until the
   server says stored, `reading` until it says complete, then the snapshot. The server sends no
   bytes, so the percent is estimated (George 2026-10-30): a creep toward a ceiling per stage
   that only passes it when the server moves on. The words are the status; the number keeps
   the row from looking frozen. This helper is the story's; the app's lives beside its adapter. */
const CEILING: Record<Exclude<AttachmentStatus, "done" | "failed">, number> = { uploading: 60, reading: 95 }
const ID = "document:photo-id"
const NAME = "IMG_4821.jpg"
/* The pretend server's timers, one story instance at a time. */
const TIMERS: number[] = []
const clearTimers = () => {
  for (const t of TIMERS.splice(0)) window.clearTimeout(t)
}

function useDocumentStream() {
  const [stage, setStage] = useState<AttachmentStatus | "idle">("idle")
  const estimate = useRef(0)

  const show = (status: AttachmentStatus, description?: string, retry?: () => void) => {
    attachmentToast(ID, {
      name: NAME,
      file: { type: "image/jpeg", size: 1.1 * 1024 * 1024 },
      status,
      description,
      actions: retry ? <AttachmentAction icon={<RotateCcwIcon />} aria-label={`Try ${NAME} again`} onClick={retry} /> : undefined,
    })
  }

  /* The estimate ticks every 150ms toward the stage's ceiling, slower as it nears it. */
  const tick = (status: "uploading" | "reading") => {
    const ceiling = CEILING[status]
    estimate.current = Math.min(ceiling, estimate.current + Math.max(1, Math.round((ceiling - estimate.current) / 8)))
    show(status, `${status === "uploading" ? "Uploading" : "Reading"} · ${estimate.current}%`)
    TIMERS.push(window.setTimeout(() => tick(status), 150))
  }

  const send = (outcome: "read" | "fails") => {
    clearTimers()
    estimate.current = 0
    setStage("uploading")
    tick("uploading")
    // The server says stored; each server event clears the ticker and schedules the next event.
    TIMERS.push(
      window.setTimeout(() => {
        clearTimers()
        setStage("reading")
        estimate.current = Math.max(estimate.current, CEILING.uploading)
        tick("reading")
        // The server says complete (the snapshot), or the stream fails.
        TIMERS.push(
          window.setTimeout(() => {
            clearTimers()
            if (outcome === "read") {
              setStage("done")
              show("done", "Driver’s license · read and filled in for you")
            } else {
              setStage("failed")
              show("failed", "We couldn’t make out the photo. Try a clearer one.", () => send("read"))
            }
          }, 3000)
        )
      }, 2200)
    )
  }

  const dismiss = () => {
    clearTimers()
    setStage("idle")
    toast.dismiss(ID)
  }

  // Leaving the page: the toast goes with it (the caller's job; here, the story unmounting).
  useEffect(
    () => () => {
      clearTimers()
      toast.dismiss(ID)
    },
    []
  )

  return { stage, send, dismiss }
}

function DocumentInFlight() {
  const { stage, send, dismiss } = useDocumentStream()
  const busy = stage === "uploading" || stage === "reading"
  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Button size="sm" disabled={busy} onClick={() => send("read")}>
          Send a photo (it reads)
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => send("fails")}>
          Send a photo (it fails)
        </Button>
        <Button variant="quiet" size="sm" onClick={dismiss}>
          Leave the page
        </Button>
      </Inline>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {stage === "idle" && "One toast, updated as the stream moves: uploading with an estimate, then reading, then the result. It stays until dismissed or the page is left."}
        {stage === "uploading" && "Uploading — until the server says stored."}
        {stage === "reading" && "Reading — until the server says complete."}
        {stage === "done" && "Read. The card the photo came from now shows the result; the toast stays until dismissed."}
        {stage === "failed" && "Failed. The toast stays with the reason; the card shows it too."}
      </p>
    </Stack>
  )
}

/** The document in flight: `attachmentToast` once per stage, the same id, persistent; the estimate is the story's. */
export const ADocumentInFlight: Story = {
  name: "A document in flight",
  tags: ["!autodocs"],
  render: () => (
    <>
      <DocumentInFlight />
      <Toaster />
    </>
  ),
}
