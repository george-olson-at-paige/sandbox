"use client"

import type { ComponentProps, ElementType } from "react"
import { ArrowUpRightIcon, Share2Icon, UserRoundIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { AreaLines, RecordCard, RecordSection } from "../record-section"
import type { AreaGroup, VaultDocument } from "../views/data"
import { StatusLine } from "../views/row-parts"
import { DocumentLetterhead } from "./document-letterhead"
import { ValuesToCheck, type ValuesToCheckProps } from "./values-to-check"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/documents/). A document's record on the stage, top to bottom:
   - its head, DocumentLetterhead: PersonLetterhead's shape with a file-type tile for the
     avatar, the file as its link, the facts and note (George 2026-11-04). No preview of the
     document for now; DocumentPreview stays in labs until we have real previews.
   - "Needs you", the owner's to-dos, only when there are any (George 2026-11-04: it is why most
     people open a document just after adding it): the values waiting for a yes, then anything
     else it needs ("No file yet"), in the attention ink.
   - "In your Vault", shared: Area by Area, what the document is there and, under it, what it
     filled in, name and value (one section: "What it's for" and "What we read from it" said
     the same Area twice). A value joins it once it's accepted.
   - "Who it names", shared, when it names anyone: each a link to their record.
   - "Who can see it", owner: each share and when it takes effect; Share it (a tool).
   View only in this pass; Edit (name, type, where the original is, the note) and Remove are the
   stage bar's (⋯). */

export type DocumentRecordCopy = {
  /** The to-dos' legend ("Needs you"). */
  needs: string
  /** Where it is filed and what it filled in ("In your Vault"). */
  inVault: string
  names: string
  canSee: string
  canSeeEmpty: string
  ownerOnly: string
  shareIt: string
  /** A named person's link ("Open in People"). */
  openPerson: string
  values: ValuesToCheckProps["copy"]
}

/* What it's for and what it filled in, as one set of Area groups: an Area's facts (the read
   lines' name and value) sit under its first line. An Area it filled in but isn't filed for
   keeps the read lines as lines. */
function inVault(forWhat: AreaGroup[], read: AreaGroup[]): AreaGroup[] {
  const groups = forWhat.map((g) => {
    const filled = read.find((r) => r.area.id === g.area.id)?.lines ?? []
    if (!filled.length || !g.lines.length) return g
    const [first, ...rest] = g.lines
    return { area: g.area, lines: [{ ...first, facts: filled.map((l) => ({ key: l.key, label: l.label, value: l.detail ?? "" })) }, ...rest] }
  })
  return [...groups, ...read.filter((r) => !forWhat.some((g) => g.area.id === r.area.id))]
}

/** A document's record: its letterhead, what needs you, where it is in your Vault, who it names, and (owner only) who can see it. */
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
  // The values to check are their own to-do; the other needs are lines under them.
  const needs = document.needs.filter((n) => n.kind !== "review")
  const vault = inVault(document.forWhat, document.read)
  return (
    <RecordCard label={document.title}>
      <DocumentLetterhead document={document} />
      {needs.length > 0 || document.waiting.length > 0 ? (
        <RecordSection audience="shared" attention title={copy.needs}>
          {document.waiting.length > 0 && <ValuesToCheck values={document.waiting} onUse={onUse} onKeep={onKeep} copy={copy.values} />}
          {needs.map((n) => (
            <StatusLine key={n.kind} need={n.text} />
          ))}
        </RecordSection>
      ) : null}
      {vault.length > 0 && (
        <RecordSection audience="shared" title={copy.inVault}>
          <AreaLines groups={vault} linkAs={Link} />
        </RecordSection>
      )}
      {document.names.length > 0 && (
        <RecordSection audience="shared" title={copy.names}>
          <ul className="flex flex-col">
            {document.names.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-1">
                <span className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-icon [&_svg]:text-muted-foreground">
                  <UserRoundIcon aria-hidden />
                  {n.name}
                </span>
                <Link
                  href={n.href}
                  className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs"
                >
                  {copy.openPerson}
                  <ArrowUpRightIcon aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </RecordSection>
      )}
      <RecordSection
        audience="owner"
        ownerLabel={copy.ownerOnly}
        title={copy.canSee}
        empty={document.shares.length === 0 ? copy.canSeeEmpty : undefined}
      >
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
