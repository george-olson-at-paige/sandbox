import type { ComponentProps } from "react"
import { FileQuestionIcon, PenLineIcon } from "lucide-react"

import { FileIcon } from "../../../components/display/file-icon"
import type { VaultDocument } from "../views/data"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). The top of a document's record, PersonLetterhead's shape
   (George 2026-11-04): the record's head reads the same in People and Documents.
   - The tile where the avatar would be: a rounded square, not a circle, holding the file's type
     icon (FileIcon, with its format band from 32: PNG, PDF). A document Paige made has the pen;
     one with no file yet has a question. No picture of the document here: a real preview waits
     until we have one, and gets thought through then (VIEWS-PLAN.md).
   - The name in the display face. Its type ("ID") is the stage bar's chip, not repeated here
     (George 2026-11-04).
   - The file, as a link that opens it, where a person's phone and email are, then when it came
     in. Then the facts ("Original · Wallet") and the note, quiet. */

/** A document's head: file-type tile, name, type, the file (a link) and when it came in, its facts. */
export function DocumentLetterhead({ document }: { document: VaultDocument }) {
  const fileName = document.fileName
  return (
    <header data-slot="document-letterhead" className="flex items-start gap-4">
      <span
        data-slot="document-letterhead-tile"
        aria-hidden
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border-medium bg-surface-page text-muted-foreground [&>svg]:size-icon-xl"
      >
        {document.generated ? (
          <PenLineIcon />
        ) : fileName ? (
          <FileIcon kind={document.file?.kind} file={{ name: fileName }} className="size-8" />
        ) : (
          <FileQuestionIcon />
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 pt-1">
        <h3 className="font-display text-2xl leading-tight font-bold wrap-anywhere text-foreground-strong">{document.title}</h3>
        <p data-slot="document-file" className="mt-1 flex flex-wrap gap-x-2 text-sm font-semibold">
          {fileName && document.file ? (
            <a href={document.file.src} target="_blank" rel="noreferrer" className="rounded-sm text-primary focus-ring hover:underline">
              {fileName}
            </a>
          ) : (
            fileName && <span>{fileName}</span>
          )}
          {fileName && (
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
          )}
          <span className="font-medium text-muted-foreground">{document.added}</span>
        </p>
        {document.facts.length > 0 && (
          <dl className="mt-1 flex flex-wrap gap-x-4 text-sm">
            {document.facts.map((f) => (
              <div key={f.label} className="flex items-baseline gap-2">
                <dt className="font-medium text-muted-foreground">{f.label}</dt>
                <dd className="font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {document.note && <p className="mt-1 text-sm font-medium text-muted-foreground">{document.note}</p>}
      </div>
    </header>
  )
}

export type DocumentLetterheadProps = ComponentProps<typeof DocumentLetterhead>
