import type { ElementType } from "react"
import { FileQuestionIcon, FileTextIcon, PenLineIcon } from "lucide-react"

import type { VaultDocument } from "../views/data"
import { AreaDots, StatusLine, ViewRow } from "../views/row-parts"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for vault/documents/).
   DocumentRow: a document in Documents' list, a link to its record. The tile is tinted by the
   document's first Area (neutral with none) and says what it is: a page, a pen for one Paige
   made, a question for one with no type yet. Then the name; "ID · DriverLicense.png" (its type,
   unless that is the name, and its file); one status line, what it needs or "Ready"; a dot per
   Area it is filed in. */

/** A document in Documents' list: Area-tinted tile, name, type and file, needs or Ready, its Areas. */
export function DocumentRow({
  document,
  href,
  current = false,
  ready,
  linkAs,
}: {
  /** The document (labs/vault/views/data.ts). */
  document: VaultDocument
  /** Its record. */
  href: string
  /** Its record is the one open. */
  current?: boolean
  /** The status line's word when it needs nothing ("Ready", the View's words). */
  ready: string
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [first, ...more] = document.needs
  const area = document.areas[0]
  const Glyph = document.generated ? PenLineIcon : document.type || document.areas.length ? FileTextIcon : FileQuestionIcon
  return (
    <ViewRow
      href={href}
      current={current}
      linkAs={linkAs}
      media={
        <span
          data-slot="document-tile"
          data-area={area?.id}
          aria-hidden
          className={
            area
              ? "inline-flex size-control-sm items-center justify-center rounded-md bg-area-tint text-area-ink [&_svg]:size-icon"
              : "inline-flex size-control-sm items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-icon"
          }
        >
          <Glyph />
        </span>
      }
      title={document.title}
      description={[document.type !== document.title ? document.type : undefined, document.fileName].filter(Boolean).join(" · ") || undefined}
      status={<StatusLine need={first && (more.length ? `${first.text} · +${more.length}` : first.text)} ready={first ? undefined : ready} />}
      meta={<AreaDots areas={document.areas} />}
    />
  )
}
