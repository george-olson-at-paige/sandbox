"use client"

import type { ComponentProps, ElementType, ReactNode } from "react"
import { useState } from "react"
import { ArrowDownIcon, ArrowUpRightIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { Avatar } from "../../../components/display/avatar"
import { AreaLines, RecordCard, RecordSection } from "../record-section"
import type { SaidValue, VaultDocument } from "../views/data"
import { StatusLine } from "../views/row-parts"
import { DocumentLetterhead } from "./document-letterhead"
import { SaidList, type SaidListCopy } from "./said-list"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/documents/). A document's record on the stage, the owner's view, top to bottom:
   - its head, DocumentLetterhead: PersonLetterhead's shape with a file-type tile for the
     avatar, the file as its link, the facts and note (George 2026-11-04). No preview of the
     document for now; DocumentPreview stays in labs until we have real previews.
   - "Needs you", the owner's to-dos, only when there are any (it is why most people open a
     document just after adding it), in the attention ink: how many values wait in What it says
     (a link down to it), then anything else it needs ("No file yet").
   - "In your Vault": Area by Area, what the document is there ("A government photo ID").
   - "What it says", once it has been read: every value it says (SaidList), in the document's
     order, each with what is next for it on its own line: Looks right or Fix (not checked
     yet), Use this / Keep mine (checked, for the Vault), or what became of it, with Fix. The one
     place a value is acted on (George 2026-11-04: a value stays where it is; a review queue can
     gather the same lines later). The legend's right says how many wait, with Confirm all
     when more than one hasn't been checked (no decline all), or when it was read.
   - "Who it names", when it names anyone: each person's avatar and name, a link to their record.
   - "Who it's shared with": each person's avatar, name and when it takes effect, or a compact
     empty line. Sharing is the stage bar's Share.
   What the owner does here holds until the caller hands back the document with it. Edit (name,
   type, where the original is, the note) and Remove are the stage bar's (⋯). */

type Result = void | { error: string }

export type DocumentRecordCopy = {
  /** The to-dos' legend ("Needs you"), and its line for values waiting ("3 values to check"). */
  needs: string
  toCheck: (n: number) => string
  /** What it is, Area by Area ("In your Vault"). */
  inVault: string
  /** Every value it says ("What it says"); the legend's right: how many wait ("3 to check"), Confirm all. */
  says: string
  waiting: (n: number) => string
  confirmAll: string
  said: SaidListCopy
  names: string
  /** Who it's shared with ("Who it’s shared with"), and the line with nobody. */
  sharedWith: string
  sharedWithEmpty: string
  /** A named person's link ("Open in People"). */
  openPerson: string
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

/* Checked, a value goes on by what the Vault holds: no Vault fact for it, unused; the Vault
   already holds the same, used; otherwise proposed. */
function checked(v: SaidValue): SaidValue["state"] {
  if (!v.area) return "unused"
  return v.current === v.value ? "used" : "proposed"
}

/** A document's record (the owner's): its letterhead, what needs you, where it is in your Vault, what it says, who it names, and who it's shared with. */
export function DocumentRecord({
  document,
  copy,
  onConfirm,
  onFix,
  onUse,
  onKeep,
  linkAs: Link = "a",
}: {
  document: VaultDocument
  /** The record's words (docs/views.md). */
  copy: DocumentRecordCopy
  /** The owner checked these values: they are what it says. Without it, no Looks right or Confirm all. */
  onConfirm?: (keys: string[]) => Promise<Result>
  /** The owner fixed a value's reading. Without it, no Fix. */
  onFix?: (key: string, value: string) => Promise<Result>
  /** Use a proposed value in the Vault. */
  onUse: (key: string) => Promise<Result>
  /** Keep the Vault's own. */
  onKeep: (key: string) => Promise<Result>
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [changed, setChanged] = useState<Record<string, Partial<SaidValue>>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState("")
  const said = (document.said?.values ?? []).map((v) => ({ ...v, ...changed[v.key] }))
  const unchecked = said.filter((v) => v.state === "read")
  const waiting = said.filter((v) => v.state === "read" || v.state === "proposed")
  const change = (keys: string[], to: (v: SaidValue) => Partial<SaidValue>) =>
    setChanged((c) => {
      const next = { ...c }
      for (const v of said.filter((s) => keys.includes(s.key))) next[v.key] = { ...c[v.key], ...to(v) }
      return next
    })
  // Run an act; when it doesn't fail, record what it changed here.
  async function then(act: Promise<Result>, done: () => void) {
    const result = await act
    if (!(result && "error" in result)) done()
    return result
  }
  async function confirmAll() {
    setBusy("*")
    setConfirmError("")
    const keys = unchecked.map((v) => v.key)
    const result = await onConfirm!(keys)
    setBusy(null)
    if (result && "error" in result) setConfirmError(result.error)
    else change(keys, (v) => ({ state: checked(v) }))
  }
  const saysId = `says-${document.id}`
  // Values have their own line in Needs you (waiting.length); the list's "review" need is that.
  const needs = document.needs.filter((n) => n.kind !== "review")
  return (
    <RecordCard label={document.title}>
      <DocumentLetterhead document={document} />
      {needs.length > 0 || waiting.length > 0 ? (
        <RecordSection audience="shared" attention title={copy.needs}>
          {waiting.length > 0 && (
            <a
              href={`#${saysId}`}
              className="inline-flex items-center gap-1 self-start rounded-sm text-sm font-semibold text-attention focus-ring hover:underline [&_svg]:size-icon-xs"
            >
              {copy.toCheck(waiting.length)}
              <ArrowDownIcon aria-hidden />
            </a>
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
      {document.said && said.length > 0 && (
        <RecordSection
          id={saysId}
          audience="shared"
          title={copy.says}
          aside={
            waiting.length > 0 ? (
              <>
                <span className="text-attention">{copy.waiting(waiting.length)}</span>
                {onConfirm && unchecked.length > 1 && (
                  <Button variant="link" size="inline" className="eyebrow" disabled={busy !== null} onClick={confirmAll}>
                    {busy === "*" ? copy.said.saving : copy.confirmAll}
                  </Button>
                )}
              </>
            ) : (
              document.said.readOn
            )
          }
        >
          {confirmError && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {confirmError}
            </p>
          )}
          <SaidList
            values={said}
            copy={copy.said}
            busy={busy}
            onBusy={setBusy}
            linkAs={Link}
            onConfirm={onConfirm && ((key) => then(onConfirm([key]), () => change([key], (v) => ({ state: checked(v) }))))}
            onFix={onFix && ((key, value) => then(onFix(key, value), () => change([key], () => ({ value }))))}
            onUse={(key) => then(onUse(key), () => change([key], () => ({ state: "used" })))}
            onKeep={(key) => then(onKeep(key), () => change([key], () => ({ state: "kept" })))}
          />
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
