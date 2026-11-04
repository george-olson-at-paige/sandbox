"use client"

import type { ComponentProps, ElementType } from "react"
import { useState } from "react"
import { ArrowUpRightIcon, Share2Icon, UserRoundIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { cn } from "../../../lib/utils"
import { AreaLines, RecordCard, RecordSection } from "../record-section"
import type { VaultDocument } from "../views/data"
import { DocumentPreview, type DocumentPreviewProps } from "./document-preview"
import { ValuesToCheck, type ValuesToCheckProps } from "./values-to-check"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/documents/). A document's record on the stage, top to bottom:
   - its head: what it is on the left (facts such as where the original is, who made it; the
     note), the document on the right as a 150 strip (DocumentPreview). Expanded, the document
     takes the full width under the text. Below sm the two stack, the document first.
   - "What it's for", shared: where it is filed, Area by Area.
   - "What we read from it", shared: the values waiting for a yes (in View: the to-do where the
     value shows), then what it filled in.
   - "Who it names", shared, when it names anyone: each a link to their record.
   - "Who can see it", owner: each share and when it takes effect; Share it (a tool).
   View only in this pass; Edit (name, type, where the original is, the note) and Remove are the
   stage bar's (⋯). */

export type DocumentRecordCopy = {
  forWhat: string
  read: string
  names: string
  canSee: string
  canSeeEmpty: string
  ownerOnly: string
  shareIt: string
  /** A named person's link ("Open in People"). */
  openPerson: string
  preview: DocumentPreviewProps["copy"]
  values: ValuesToCheckProps["copy"]
}

/** A document's record: what it is beside the document itself, what it's for, what was read, who it names, and (owner only) who can see it. */
export function DocumentRecord({
  document,
  copy,
  onUse,
  onKeep,
  onShare,
  linkAs: Link = "a",
}: {
  document: VaultDocument
  /** The record's words (docs/views.md). */
  copy: DocumentRecordCopy
  onUse: ValuesToCheckProps["onUse"]
  onKeep: ValuesToCheckProps["onKeep"]
  /** Share it. Without it, no button. */
  onShare?: () => void
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [expanded, setExpanded] = useState(false)
  const hasText = document.facts.length > 0 || Boolean(document.note)
  const preview = <DocumentPreview document={document} expanded={expanded} onExpandedChange={setExpanded} copy={copy.preview} />
  return (
    <RecordCard label={document.title}>
      <div data-slot="document-head" className={cn("grid gap-5", hasText && (expanded ? "" : "sm:grid-cols-document-head"))}>
        {hasText && (
          <div className={cn("flex min-w-0 flex-col gap-3", expanded ? "" : "order-last sm:order-first")}>
            {document.facts.length > 0 && (
              <dl className="flex flex-col gap-1 text-sm">
                {document.facts.map((f) => (
                  <div key={f.label} className="flex items-baseline gap-3">
                    <dt className="eyebrow text-muted-foreground">{f.label}</dt>
                    <dd className="font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {document.note && <p className="text-sm text-muted-foreground italic">{document.note}</p>}
          </div>
        )}
        {preview}
      </div>
      {document.forWhat.length > 0 && (
        <RecordSection audience="shared" title={copy.forWhat}>
          <AreaLines groups={document.forWhat} linkAs={Link} />
        </RecordSection>
      )}
      {(document.waiting.length > 0 || document.read.length > 0) && (
        <RecordSection audience="shared" title={copy.read}>
          {document.waiting.length > 0 && <ValuesToCheck values={document.waiting} onUse={onUse} onKeep={onKeep} copy={copy.values} />}
          {document.read.length > 0 && <AreaLines groups={document.read} linkAs={Link} />}
        </RecordSection>
      )}
      {document.names.length > 0 && (
        <RecordSection audience="shared" title={copy.names}>
          <ul className="flex flex-col">
            {document.names.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-1">
                <span className="flex items-center gap-2 font-semibold [&_svg]:size-icon [&_svg]:text-muted-foreground">
                  <UserRoundIcon aria-hidden />
                  {n.name}
                </span>
                <Link href={n.href} className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs">
                  {copy.openPerson}
                  <ArrowUpRightIcon aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </RecordSection>
      )}
      <RecordSection audience="owner" ownerLabel={copy.ownerOnly} title={copy.canSee} empty={document.shares.length === 0 ? copy.canSeeEmpty : undefined}>
        {document.shares.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {document.shares.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-semibold">{s.who}</span>
                <span className="block font-medium text-muted-foreground">{s.when}</span>
              </li>
            ))}
          </ul>
        )}
        {onShare && (
          <Button variant="secondary" size="sm" shape="rect" icon={<Share2Icon />} onClick={onShare} className="self-start">
            {copy.shareIt}
          </Button>
        )}
      </RecordSection>
    </RecordCard>
  )
}

export type DocumentRecordProps = ComponentProps<typeof DocumentRecord>
