"use client"

import type { ComponentProps, ElementType, ReactNode } from "react"
import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"

import { Avatar } from "../../../components/display/avatar"
import { AreaLines, RecordCard, RecordSection } from "../record-section"
import type { SaidState, SaidValue, VaultDocument } from "../views/data"
import { StatusLine } from "../views/row-parts"
import { DocumentLetterhead } from "./document-letterhead"
import { ValuesToCheck, type ValuesToCheckProps } from "./values-to-check"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/documents/). A document's record on the stage, the owner's view, top to bottom:
   - its head, DocumentLetterhead: PersonLetterhead's shape with a file-type tile for the
     avatar, the file as its link, the facts and note (George 2026-11-04). No preview of the
     document for now; DocumentPreview stays in labs until we have real previews.
   - "Needs you", the owner's to-dos, only when there are any (it is why most people open a
     document just after adding it): the values proposed for the Vault (Use this / Keep mine),
     then anything else it needs ("No file yet"), in the attention ink.
   - "In your Vault": Area by Area, what the document is there ("A government photo ID").
   - "What it says", once it has been read: every value it says, one line each, its name, the
     value and what became of it: the Area it went to (a link), "You kept yours", or "Not in
     your Vault". A value is in one place at a time: proposed ones are in Needs you, and move
     here once answered. When it was read sits at the legend's right. Not a tab: a record is
     short, and a tab would hide what needs the owner (George 2026-11-04).
   - "Who it names", when it names anyone: each person's avatar and name, a link to their record.
   - "Who it's shared with": each person's avatar, name and when it takes effect. Sharing is the
     stage bar's Share. A plain section, not the owner's set-back one (George 2026-11-04).
   View only in this pass; Edit (name, type, where the original is, the note) and Remove are the
   stage bar's (⋯). */

export type DocumentRecordCopy = {
  /** The to-dos' legend ("Needs you"). */
  needs: string
  /** What it is, Area by Area ("In your Vault"). */
  inVault: string
  /** Every value it says ("What it says"), and a line's words when the owner kept theirs or there's no Vault fact for it. */
  says: string
  kept: string
  unused: string
  names: string
  /** Who it's shared with ("Who it’s shared with"), and the line with nobody. */
  sharedWith: string
  sharedWithEmpty: string
  /** A named person's link ("Open in People"). */
  openPerson: string
  values: ValuesToCheckProps["copy"]
}

/** A person on a document's record: their avatar, their name, a quieter line, and what sits at the end. */
function PersonLine({ name, detail, end }: { name: string; detail?: string; end?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1">
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={name} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{name}</span>
          {detail && <span className="truncate text-sm font-medium text-muted-foreground">{detail}</span>}
        </span>
      </span>
      {end}
    </li>
  )
}

/** One value the document says: its name, the value, and what became of it. Stacks below sm. */
function SaidLine({ value, copy, linkAs: Link }: { value: SaidValue; copy: Pick<DocumentRecordCopy, "kept" | "unused">; linkAs: ElementType }) {
  return (
    <li
      data-slot="said-line"
      data-state={value.state}
      className="flex flex-col gap-x-3 gap-y-0.5 py-1 text-sm sm:grid sm:grid-cols-record-said sm:items-baseline"
    >
      <span className="font-medium text-muted-foreground">{value.label}</span>
      <span className="font-semibold wrap-anywhere">{value.value}</span>
      {value.state === "used" && value.open ? (
        <Link
          href={value.open.href}
          className="inline-flex items-center gap-1 self-start rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs"
        >
          {value.open.label}
          <ArrowUpRightIcon aria-hidden />
        </Link>
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          {value.state === "kept" ? copy.kept : value.state === "unused" ? copy.unused : null}
        </span>
      )}
    </li>
  )
}

/** A document's record (the owner's): its letterhead, what needs you, where it is in your Vault, what it says, who it names, and who it's shared with. */
export function DocumentRecord({
  document,
  copy,
  onUse,
  onKeep,
  linkAs: Link = "a",
}: {
  document: VaultDocument
  /** The record's words (docs/views.md). */
  copy: DocumentRecordCopy
  /** Use a proposed value. Resolving without an error moves it from Needs you to What it says, used. */
  onUse: ValuesToCheckProps["onUse"]
  /** Keep the Vault's own. Resolving without an error moves it to What it says, kept. */
  onKeep: ValuesToCheckProps["onKeep"]
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  // What the owner answered here, until the caller hands back the document with it.
  const [answered, setAnswered] = useState<Record<string, SaidState>>({})
  const said = (document.said?.values ?? []).map((v) => (answered[v.key] ? { ...v, state: answered[v.key] } : v))
  const proposed = said.filter((v) => v.state === "proposed")
  const settled = said.filter((v) => v.state !== "proposed")
  const answer = (state: SaidState, act: ValuesToCheckProps["onUse"]) => async (key: string) => {
    const result = await act(key)
    if (!(result && "error" in result)) setAnswered((a) => ({ ...a, [key]: state }))
    return result
  }
  // The values to check are their own to-do; the other needs are lines under them.
  const needs = document.needs.filter((n) => n.kind !== "review")
  return (
    <RecordCard label={document.title}>
      <DocumentLetterhead document={document} />
      {needs.length > 0 || proposed.length > 0 ? (
        <RecordSection audience="shared" attention title={copy.needs}>
          {proposed.length > 0 && (
            <ValuesToCheck values={proposed} onUse={answer("used", onUse)} onKeep={answer("kept", onKeep)} copy={copy.values} />
          )}
          {needs.map((n) => (
            <StatusLine key={n.kind} need={n.text} />
          ))}
        </RecordSection>
      ) : null}
      {document.forWhat.length > 0 && (
        <RecordSection audience="shared" title={copy.inVault}>
          <AreaLines groups={document.forWhat} linkAs={Link} />
        </RecordSection>
      )}
      {document.said && settled.length > 0 && (
        <RecordSection audience="shared" title={copy.says} aside={document.said.readOn}>
          <ul className="flex flex-col">
            {settled.map((v) => (
              <SaidLine key={v.key} value={v} copy={copy} linkAs={Link} />
            ))}
          </ul>
        </RecordSection>
      )}
      {document.names.length > 0 && (
        <RecordSection audience="shared" title={copy.names}>
          <ul className="flex flex-col gap-1">
            {document.names.map((n) => (
              <PersonLine
                key={n.id}
                name={n.name}
                end={
                  <Link
                    href={n.href}
                    className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs"
                  >
                    {copy.openPerson}
                    <ArrowUpRightIcon aria-hidden />
                  </Link>
                }
              />
            ))}
          </ul>
        </RecordSection>
      )}
      <RecordSection audience="shared" title={copy.sharedWith} empty={document.shares.length === 0 ? copy.sharedWithEmpty : undefined}>
        {document.shares.length > 0 && (
          <ul className="flex flex-col gap-1">
            {document.shares.map((s) => (
              <PersonLine key={s.id} name={s.who} detail={s.when} />
            ))}
          </ul>
        )}
      </RecordSection>
    </RecordCard>
  )
}

export type DocumentRecordProps = ComponentProps<typeof DocumentRecord>
