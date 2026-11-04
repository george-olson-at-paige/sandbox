"use client"

import type { ComponentProps } from "react"
import { useRef, type ReactNode } from "react"
import { CameraIcon, CheckIcon, FileTextIcon, IdCardIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../../components/actions/button"
import { Spinner } from "../../components/feedback/spinner"
import { Split } from "../../primitives/split"

export type UploadRowFile = {
  /** The file's name as filed. */
  name: string
  /** Which part it is, for a two-sided card: "front", "back". Shown after the name. */
  part?: string
}

export type UploadRowUpload = {
  /** The button's label: "Upload a document", "Add the front", "Add the back". */
  label: string
  /** Called with the file the owner picked. The input is cleared after, so the same file can be picked again. */
  onFile: (file: File) => void
  /** File types the picker offers. Default "image/*,.pdf". */
  accept?: string
  /** Off until the unit is ready (no document type chosen yet). */
  disabled?: boolean
}

/* @archetype Item (ARCHETYPES.md).
   UploadRow (R2-49, R6-05; prototype components/capture/DocumentCapture.tsx, styles/capture.css
   .vt-dcap): one document being filed into an Area, as a row: an icon, what will happen to it
   (or the files given so far), a note, and the upload button at the end, dropping under the
   text on a narrow row (Split).
   - States, from the props: open (nothing given: `promise` says what will happen, "We’ll keep
     it safe, filed in this area"), partial (`files` has some parts, `given` false: a two-sided
     card with its front in), given (`given`: success border and wash, the files listed with a
     tick), busy (`busy`: a spinner beside the note, "Reading…", and no upload).
   - `kind` picks the icon: "document" (a page) or "card" (an ID or health card the app reads).
   - The upload is a real button that opens the browser's file picker (a hidden file input,
     out of the tab order); on a phone the picker offers the camera. Which file types, and what
     happens to the file, are the caller's. No drag and drop: the prototype has none.
   - The note is the caller's copy (the reading result, "The back carries the Rx numbers…").
     Failure is a note too: the row never turns red ("nothing red", capture.css).
   - `actions` replaces the upload button once the unit is complete (Done). */
/** One document being filed into an Area: icon, what happens to it or the files given, a note, and the upload button. */
function UploadRow({
  kind = "document",
  promise,
  files = [],
  given = false,
  note,
  busy = false,
  busyLabel = "Reading",
  upload,
  actions,
  className,
}: {
  /** document (a page icon, default) · card (an ID or insurance card the app reads). */
  kind?: "document" | "card"
  /** Before any file: what will happen to it ("We’ll keep it safe, filed in this area"). */
  promise: ReactNode
  /** The parts given so far, each with a tick. */
  files?: UploadRowFile[]
  /** Complete: every part is in. The row turns to the success look and the upload goes. */
  given?: boolean
  /** A line under the files: what's still needed, or what reading found. */
  note?: ReactNode
  /** Working on the file (reading it): a spinner beside the note, and no upload or actions. */
  busy?: boolean
  /** The spinner's accessible name. Default "Reading". */
  busyLabel?: string
  /** The upload button, while the row isn't complete. */
  upload?: UploadRowUpload
  /** The row's actions once it is complete (Done). */
  actions?: ReactNode
  /** Placement (margins), not restyling. */
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const KindIcon = kind === "card" ? IdCardIcon : FileTextIcon
  const aside = busy ? null : given ? (actions ?? null) : upload ? (
    <>
      <Button size="sm" icon={<CameraIcon />} disabled={upload.disabled} onClick={() => input.current?.click()}>
        {upload.label}
      </Button>
      <input
        ref={input}
        type="file"
        accept={upload.accept ?? "image/*,.pdf"}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload.onFile(file)
          e.target.value = ""
        }}
      />
    </>
  ) : null
  return (
    <div
      data-slot="upload-row"
      data-state={given ? "given" : "open"}
      className={cn(
        "rounded-xl border bg-card px-4.5 py-4 data-[state=given]:border-success-border data-[state=given]:bg-success-subtle",
        className
      )}
    >
      <Split gap={4} contentMin="sm" aside={aside}>
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted [&>svg]:size-icon-lg",
              given ? "text-success" : "text-muted-foreground"
            )}
          >
            <KindIcon aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {files.length === 0 ? (
              <span className="text-sm font-semibold text-muted-foreground">{promise}</span>
            ) : (
              files.map((f) => (
                <span key={`${f.name}-${f.part ?? ""}`} className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-success-foreground">
                  <CheckIcon aria-hidden className="size-icon-sm shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{f.name}</span>
                  {f.part && <span className="shrink-0">· {f.part}</span>}
                </span>
              ))
            )}
            {(note || busy) && (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground" aria-live="polite">
                {busy && <Spinner label={busyLabel} />}
                {note}
              </span>
            )}
          </div>
        </div>
      </Split>
    </div>
  )
}

export { UploadRow }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type UploadRowProps = ComponentProps<typeof UploadRow>
