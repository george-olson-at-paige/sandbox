"use client"

import type { ComponentProps, ElementType, ReactNode } from "react"
import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"

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
   - "Needs you", the owner's to-dos, only when there are any, in the attention ink, at the top
     (George 2026-11-04: the queue): the values waiting, each on its own line (SaidList) with its
     act, Looks right or Fix (not checked yet) or Use this / Keep mine (checked, for the
     Vault); its right says how many and has Confirm all when more than one isn't checked (no
     decline all). Then anything else it needs ("No file yet"). The only place a value is acted on.
   - "In your Vault": Area by Area, what the document is there ("A government photo ID").
   - "What we read" (George 2026-11-04: Paige speaking, "we", the relationship, not the paper):
     a value once settled moves here from Needs you, with what became of it: the Area it went to
     (a link), "You kept yours" or "Not in your Vault". No acts. When it was read at its right.
   - "Who it names": each person's avatar and name, a link to their record.
   A section with nothing in it isn't drawn (George 2026-11-04).
   - "Who it's shared with": each person's avatar, name and when it takes effect. Sharing is the stage bar's Share.
   What the owner does here holds until the caller hands back the document with it. Edit (name,
   type, where the original is, the note) and Remove are the stage bar's (⋯). */

type Result = void | { error: string }

export type DocumentRecordCopy = {
  /** The to-dos' legend ("Needs you"); its right: how many values wait ("3 to check"), Confirm all. */
  needs: string
  waiting: (n: number) => string
  confirmAll: string
  /** What it is, Area by Area ("In your Vault"). */
  inVault: string
  /** The values settled ("What we read"); its right says when it was read. */
  read: string
  said: SaidListCopy
  /** Who it names. */
  names: string
  /** Who it's shared with ("Who it’s shared with"). */
  sharedWith: string
  /** A named person's link ("Open in People"). */
  openPerson: string
}

/** A person on a document's record: their avatar, their name, a quieter line, and what sits at the end. */
function PersonLine({ name, detail, end }: { name: string; detail?: string; end?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
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
  const settled = said.filter((v) => v.state !== "read" && v.state !== "proposed")
  const lists = {
    copy: copy.said,
    busy,
    onBusy: setBusy,
    linkAs: Link,
    onConfirm: onConfirm && ((key: string) => then(onConfirm([key]), () => change([key], (v) => ({ state: checked(v) })))),
    onFix: onFix && ((key: string, value: string) => then(onFix(key, value), () => change([key], () => ({ value })))),
    onUse: (key: string) => then(onUse(key), () => change([key], () => ({ state: "used" }))),
    onKeep: (key: string) => then(onKeep(key), () => change([key], () => ({ state: "kept" }))),
  }
  // The values waiting are Needs you's own lines; the list's "review" need is that.
  const needs = document.needs.filter((n) => n.kind !== "review")
  return (
    <RecordCard label={document.title}>
      <DocumentLetterhead document={document} />
      {needs.length > 0 || waiting.length > 0 ? (
        <RecordSection
          audience="shared"
          attention
          title={copy.needs}
          aside={
            waiting.length > 0 && (
              <>
                <span className="text-attention">{copy.waiting(waiting.length)}</span>
                {onConfirm && unchecked.length > 1 && (
                  <Button variant="link" size="inline" className="eyebrow text-primary" disabled={busy !== null} onClick={confirmAll}>
                    {busy === "*" ? copy.said.saving : copy.confirmAll}
                  </Button>
                )}
              </>
            )
          }
        >
          {confirmError && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {confirmError}
            </p>
          )}
          {waiting.length > 0 && <SaidList queue values={waiting} {...lists} />}
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
        <RecordSection audience="shared" title={copy.read} aside={document.said.readOn}>
          <SaidList values={settled} {...lists} />
        </RecordSection>
      )}
      {document.names.length > 0 && (
        <RecordSection audience="shared" title={copy.names}>
          <ul className="flex flex-col">
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
      {document.shares.length > 0 && (
        <RecordSection audience="shared" title={copy.sharedWith}>
          <ul className="flex flex-col">
            {document.shares.map((s) => (
              <PersonLine key={s.id} name={s.who} detail={s.when} />
            ))}
          </ul>
        </RecordSection>
      )}
    </RecordCard>
  )
}

export type DocumentRecordProps = ComponentProps<typeof DocumentRecord>
