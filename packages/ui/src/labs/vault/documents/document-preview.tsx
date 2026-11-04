"use client"

import type { ComponentProps } from "react"
import { FileIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { cn } from "../../../lib/utils"
import type { VaultDocument } from "../views/data"

/* @archetype Media (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for vault/documents/).
   The document itself, beside its text on the record (George 2026-11-02: "the doc preview on the
   right side of some text", the way a résumé carries a photo). Every file the same size: a strip
   150 high. An image shows whole, scaled into it; a page (a PDF, a will) shows its top, with a
   fade for the rest. Expand shows all of it in place (the record lays it out full width under the
   text); Collapse puts the strip back. Under it, as text links (three fit the 240 column), what a file needs: Expand, Open full size, and
   Download (an `a download`). A document recorded by name only says so instead, in the strip's
   place, never cropped. The words are the caller's. */

/** A document's file as a 150px strip (an image whole, a page its top), with Expand, Open full size and Download. */
export function DocumentPreview({
  document,
  expanded,
  onExpandedChange,
  copy,
}: {
  /** The document; its `file` is what shows. */
  document: VaultDocument
  /** Shown in full (controlled: the record moves it to its own row). */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** The actions' words and the no-file line. */
  copy: { expand: string; collapse: string; openFull: string; download: string; noFile: string }
}) {
  const file = document.file
  if (!file) {
    return (
      <figure data-slot="document-preview" data-state="none" className="m-0 flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-divider bg-muted p-4 text-center">
        <FileIcon aria-hidden className="size-icon-xl text-muted-foreground" />
        <figcaption className="text-sm font-medium text-muted-foreground">{copy.noFile}</figcaption>
      </figure>
    )
  }
  const page = file.kind === "pdf" || document.generated
  return (
    <figure data-slot="document-preview" data-expanded={expanded || undefined} className="m-0 flex flex-col gap-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-divider bg-muted",
          expanded ? "" : "h-36",
          !expanded && page && "after:absolute after:inset-x-0 after:bottom-0 after:h-9 after:bg-linear-to-b after:from-transparent after:to-muted",
        )}
      >
        <img
          src={file.src}
          alt={document.title}
          className={cn("block w-full", expanded ? "h-auto" : page ? "h-auto" : "h-full object-contain p-2")}
        />
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Button variant="link" size="inline" aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)}>
          {expanded ? copy.collapse : copy.expand}
        </Button>
        <Button asChild variant="link" size="inline">
          <a href={file.src} target="_blank" rel="noreferrer">
            {copy.openFull}
          </a>
        </Button>
        <Button asChild variant="link" size="inline">
          <a href={file.src} download={document.fileName ?? document.title}>
            {copy.download}
          </a>
        </Button>
      </figcaption>
    </figure>
  )
}

export type DocumentPreviewProps = ComponentProps<typeof DocumentPreview>
