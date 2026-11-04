"use client"

import type { ComponentProps } from "react"
import { useId, useRef, useState } from "react"
import { RotateCcwIcon, UploadIcon, XIcon } from "lucide-react"

import { Attachment, AttachmentAction, type AttachmentStatus } from "../../components/display/attachment"
import { cn } from "../../lib/utils"
import type { FileKind } from "../../lib/file-kind"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §3 (George 2026-11-04): the files on an item
   being edited — a memory's one photo, a message's two files, an account's any number — and
   the way to add more. Generic; Documents' add dialog needs it too.
   - The files as Attachments, each with × (remove) or, failed, ↺ (try again). Uploading and
     failed are the Attachment's own states; the caller owns the upload and passes `status`.
   - Under them a drop zone, a button you can also drop files on: "Add a file" (or the caller's
     words), the accepted kinds and the limit in its line. With `max` 1 and a file there, it
     says "Replace" and the new one takes the old one's place (the caller's `onAdd` decides).
   - Too many, or a kind it doesn't take: the reason under the zone, and nothing is added.
   - At `max` (above 1) the zone goes and the line says the limit. */

export type FileFieldFile = {
  id: string
  name: string
  kind?: FileKind
  /** uploading · reading · done (default) · failed. */
  status?: AttachmentStatus
}

/** An item's files and the way to add more: Attachments with ×, a drop zone, a limit and kinds. */
export function FileField({
  files,
  onAdd,
  onRemove,
  onRetry,
  onOpen,
  max,
  accept,
  copy,
  disabled = false,
}: {
  files: FileFieldFile[]
  /** Files picked or dropped (already checked against `max` and `accept`). With `max` 1 and a file there, the caller replaces it. */
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  /** Try a failed upload again. Without it, a failed file only has ×. */
  onRetry?: (id: string) => void
  /** Opens a file that's done. */
  onOpen?: (id: string) => void
  /** The most files. */
  max?: number
  /** The kinds it takes, as an input's `accept` ("image/*,video/*,application/pdf"). */
  accept?: string
  /** The words: the zone's verb ("Add a file"), its replace verb, its line (kinds and limit), the errors, × and ↺'s names. */
  copy: {
    add: string
    replace: string
    line?: string
    full?: string
    tooMany: (max: number) => string
    wrongKind: string
    remove: (name: string) => string
    retry: (name: string) => string
  }
  disabled?: boolean
}) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")
  const replacing = max === 1 && files.length === 1
  const full = max !== undefined && max > 1 && files.length >= max

  function take(list: FileList | null) {
    if (!list?.length) return
    const picked = [...list]
    setError("")
    if (accept && !picked.every((f) => accepts(accept, f))) return setError(copy.wrongKind)
    const room = max === undefined ? Infinity : replacing ? 1 : max - files.length
    if (picked.length > room) return setError(copy.tooMany(max!))
    onAdd(picked)
  }

  return (
    <div data-slot="file-field" className="flex flex-col gap-2">
      {files.map((f) => (
        <Attachment
          key={f.id}
          name={f.name}
          kind={f.kind}
          status={f.status}
          onOpen={onOpen && (f.status ?? "done") === "done" ? () => onOpen(f.id) : undefined}
          actions={
            <>
              {f.status === "failed" && onRetry && (
                <AttachmentAction type="button" icon={<RotateCcwIcon />} aria-label={copy.retry(f.name)} onClick={() => onRetry(f.id)} disabled={disabled} />
              )}
              <AttachmentAction type="button" icon={<XIcon />} aria-label={copy.remove(f.name)} onClick={() => onRemove(f.id)} disabled={disabled} />
            </>
          }
        />
      ))}
      {full ? (
        copy.full && <p className="text-sm font-medium text-muted-foreground">{copy.full}</p>
      ) : (
        <label
          htmlFor={inputId}
          data-slot="file-field-zone"
          data-dragging={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!disabled) take(e.dataTransfer.files)
          }}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-focus-halo hover:layer-hover",
            "data-[dragging]:border-primary data-[dragging]:bg-accent",
            disabled ? "pointer-events-none opacity-disabled" : "",
          )}
        >
          <UploadIcon aria-hidden className="size-icon text-muted-foreground" />
          <span className="flex min-w-0 flex-col">
            <span className="font-semibold text-primary">{replacing ? copy.replace : copy.add}</span>
            {copy.line && <span className="text-xs font-medium text-muted-foreground">{copy.line}</span>}
          </span>
          <input
            ref={input}
            id={inputId}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={max === undefined || max - files.length > 1}
            disabled={disabled}
            onChange={(e) => {
              take(e.target.files)
              e.target.value = ""
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/* Whether a file matches an input's `accept`: extensions (.pdf), exact types, or a family (image/*). */
function accepts(accept: string, file: File) {
  return accept.split(",").some((raw) => {
    const a = raw.trim().toLowerCase()
    if (a.startsWith(".")) return file.name.toLowerCase().endsWith(a)
    if (a.endsWith("/*")) return file.type.toLowerCase().startsWith(a.slice(0, -1))
    return file.type.toLowerCase() === a
  })
}

export type FileFieldProps = ComponentProps<typeof FileField>
