"use client"

import type { ComponentProps } from "react"
import { useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from "react"

import { ConfirmDialog } from "../../components/overlays/confirm-dialog"
import type { FormResult } from "../../forms/form"
import { PersonAddForm, type KinshipChoice, type PersonDraft } from "./person-add-form"
import { RemoveDialog } from "../remove-dialog"
import { StackAdd, type StackAddState } from "./stack-add"
import { StackEntry, type StackEntryState, type StackPerson } from "./stack-entry"
import {
  kinshipHasRoom,
  pickCandidates,
  pickMode as toPickMode,
  quickAddFor,
  sameOpenThing,
  STACK_REST,
  stackHasRoom,
  stackOpenReducer,
  type QuickAddOption,
  type RemovalKind,
  type StackContext,
  type StackOpen,
  type StackOpenAction,
} from "../stack-rules"

export type { KinshipChoice, PersonDraft, QuickAddOption, RemovalKind, StackContext, StackPerson }

/** What an add hands back: the new person's id when it worked, or what went wrong (shown in the form). */
export type StackAddResult = { id: string } | { error?: string; errors?: Record<string, string | undefined> }

/** What a pick hands back: nothing when it worked, or a message. */
export type StackPickResult = void | { error: string }

/** How long a new entry stays marked new. */
const NEW_MARK_MS = 4000

/* @archetype Composite (ARCHETYPES.md).
   PeopleStack (ADR 0076 amendment, rules 1-7): the people a Vault item holds, and how they come
   and go. It composes StackEntry, StackAdd (PersonPicker → QuickAdd → PersonAddForm) and
   RemoveDialog around one state, `StackOpen` (stack-rules.ts), so every screen that shows a stack
   gets the behaviour without re-deciding it.
   1. One open thing: an entry's expand or the Add region, never two. Opening one closes the other;
      when the Add form has unsaved input, "Discard changes?" asks first, and No keeps it open.
   2. Blue is the open thing (the entry's or the region's `bg-accent`); a new entry is marked New.
   3. Add starts with the book: candidates are `book` less who is on the stack; pills to five,
      search from six; nobody to pick → the form at once.
   4. Caps: `context` (role, multi) and the kinship caps decide whether Add shows, which quick-add
      pills show, and which kinships the form offers. Struck entries still count until they stand.
   5. The form's fields come from `contactFieldsFor(kinship, "create", { role })`.
   6. × asks (RemoveDialog); the entry stays, struck through, with Undo. `onCommitRemoval` runs for
      each one still struck when the stack goes away (route change, unmount) or the page hides
      (tab close: `pagehide`), so leaving makes it stand. The caller writes it (a keepalive fetch
      on pagehide is the caller's).
   7. Saves: the form's four states (PersonAddForm); a pick shows its pending pill and a failure
      in the region; after an add or a pick the region closes, the entry is marked New and takes
      focus. Escape closes the open thing.
   Writes are the caller's: `onPick` and `onAdd` return what happened; nothing is optimistic. */
/** The people a Vault item holds: one open thing (an entry or the Add), Add from the book first, caps, × with Undo until you leave. */
function PeopleStack({
  people,
  book,
  quick,
  kinships,
  context,
  listLabel,
  addLabel,
  quickAtRest = false,
  allowDelete = true,
  onPick,
  onAdd,
  onCommitRemoval,
  renderOpen,
}: {
  /** Who is on the stack, in order. */
  people: readonly StackPerson[]
  /** Everyone named (the book); the Add offers whoever isn't on the stack. */
  book: readonly StackPerson[]
  /** Quick-add kinships, before caps. */
  quick: readonly QuickAddOption[]
  /** The kinships the form offers, before caps. */
  kinships: readonly KinshipChoice[]
  /** Why the stack is here: its role, and whether the item takes many. */
  context: StackContext
  /** What people come off, in the owner's words ("your emergency contacts"). Also the list's name. */
  listLabel: string
  /** The Add's label. Default "Add someone". */
  addLabel?: string
  /** Quick-add pills at rest. Default true (pending George). */
  quickAtRest?: boolean
  /** Offer Delete from People in the remove dialog. Default true. */
  allowDelete?: boolean
  /** Put someone from the book on the stack. */
  onPick: (id: string) => StackPickResult | Promise<StackPickResult>
  /** Add someone new (and put them on the stack). */
  onAdd: (draft: PersonDraft) => StackAddResult | Promise<StackAddResult>
  /** A removal stands (the person left the page with it struck). */
  onCommitRemoval: (id: string, kind: RemovalKind) => void
  /** An entry's expand. None: entries don't open. */
  renderOpen?: (person: StackPerson) => ReactNode
}) {
  const [open, dispatch] = useReducer(stackOpenReducer, STACK_REST)
  const [asking, setAsking] = useState<StackOpenAction | null>(null)
  const [removing, setRemoving] = useState<StackPerson | null>(null)
  const [struck, setStruck] = useState<Record<string, RemovalKind>>({})
  const [newId, setNewId] = useState<string | null>(null)
  const [pendingPickId, setPendingPickId] = useState<string | undefined>()
  const [pickError, setPickError] = useState<string | undefined>()
  const dirty = useRef(false)
  const entries = useRef(new Map<string, HTMLLIElement>())

  // Rules 3 and 4.
  const hasRoom = stackHasRoom(people, context)
  const candidates = pickCandidates(book, people)
  const mode = toPickMode(candidates.length, hasRoom)
  const quickNow = quickAddFor(quick, people, context)
  const kinshipsNow = kinships.filter((k) => kinshipHasRoom(k.value, people))

  // Rule 1: every move goes through here; leaving a dirty Add form asks first.
  const request = useCallback(
    (action: StackOpenAction) => {
      const next = stackOpenReducer(open, action)
      if (dirty.current && !sameOpenThing(open, next)) setAsking(action)
      else {
        if (!sameOpenThing(open, next)) dirty.current = false
        dispatch(action)
      }
    },
    [open]
  )

  // Rule 6: removals stand when the stack goes away or the page hides.
  const commit = useRef(onCommitRemoval)
  commit.current = onCommitRemoval
  const struckRef = useRef(struck)
  struckRef.current = struck
  useEffect(() => {
    const flush = () => {
      for (const [id, kind] of Object.entries(struckRef.current)) commit.current(id, kind)
      struckRef.current = {}
    }
    window.addEventListener("pagehide", flush)
    return () => {
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [])

  // Rule 7: a new entry is marked for a moment and takes focus.
  useEffect(() => {
    if (!newId) return
    entries.current.get(newId)?.focus()
    const t = setTimeout(() => setNewId(null), NEW_MARK_MS)
    return () => clearTimeout(t)
  }, [newId])

  async function pick(id: string) {
    setPendingPickId(id)
    setPickError(undefined)
    let result: StackPickResult
    try {
      result = await onPick(id)
    } catch {
      result = { error: "That didn't go through. Try again in a moment." }
    }
    setPendingPickId(undefined)
    if (result && "error" in result) return setPickError(result.error)
    dispatch({ type: "close" })
    setNewId(id)
  }

  async function add(draft: PersonDraft): Promise<FormResult> {
    const result = await onAdd(draft)
    if ("id" in result) {
      dirty.current = false
      dispatch({ type: "close" })
      setNewId(result.id)
      return
    }
    return result
  }

  function strike(person: StackPerson, kind: RemovalKind) {
    if (open.kind === "entry" && open.id === person.id) dispatch({ type: "close" })
    setStruck((s) => ({ ...s, [person.id]: kind }))
  }

  function undo(person: StackPerson) {
    setStruck(({ [person.id]: _, ...rest }) => rest)
    requestAnimationFrame(() => entries.current.get(person.id)?.focus())
  }

  function entryState(person: StackPerson): StackEntryState {
    const removal = struck[person.id]
    if (removal) return { kind: "struck", removal }
    if (open.kind === "entry" && open.id === person.id) return { kind: "open" }
    if (newId === person.id) return { kind: "new" }
    return { kind: "rest" }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape" || e.defaultPrevented || open.kind !== "entry") return
    e.preventDefault()
    const id = open.id
    request({ type: "close" })
    entries.current.get(id)?.querySelector<HTMLElement>("button[aria-expanded]")?.focus()
  }

  const addState: StackAddState = open.kind === "add" ? (open.step === "form" ? { step: "form", kinship: open.kinship } : { step: "choose" }) : { step: "rest" }

  return (
    <div data-slot="people-stack" onKeyDown={onKeyDown} className="overflow-hidden rounded-lg border bg-card">
      {people.length > 0 && (
        <ul aria-label={listLabel} className="flex flex-col">
          {people.map((p) => (
            <StackEntry
              key={p.id}
              ref={(el) => {
                if (el) entries.current.set(p.id, el)
                else entries.current.delete(p.id)
              }}
              person={p}
              state={entryState(p)}
              listLabel={listLabel}
              onToggle={renderOpen ? () => request({ type: "toggle-entry", id: p.id }) : undefined}
              onRemove={() => setRemoving(p)}
              onUndo={() => undo(p)}
            >
              {renderOpen?.(p)}
            </StackEntry>
          ))}
        </ul>
      )}
      <StackAdd
        state={addState}
        pickMode={mode}
        candidates={candidates}
        quick={quickNow}
        quickAtRest={quickAtRest}
        label={addLabel}
        onOpen={() => request({ type: "open-add", pickMode: mode })}
        onClose={() => request({ type: "close" })}
        onPick={pick}
        pendingPickId={pendingPickId}
        pickError={pickError}
        onQuickAdd={(kinship) => request({ type: "quick-add", kinship })}
        onSomeoneNew={() => request({ type: "someone-new" })}
        renderForm={(kinship) => (
          <PersonAddForm
            key={kinship ?? "none"}
            kinship={kinship}
            kinships={kinshipsNow}
            role={context.role ?? undefined}
            onSave={add}
            onCancel={() => {
              dirty.current = false
              dispatch({ type: "close" })
            }}
            onDirtyChange={(d) => {
              dirty.current = d
            }}
          />
        )}
      />
      <RemoveDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        name={removing?.name ?? ""}
        listLabel={listLabel}
        allowDelete={allowDelete}
        onChoose={(kind) => removing && strike(removing, kind)}
      />
      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(o) => !o && setAsking(null)}
        title="Discard changes?"
        description="What you typed for someone new will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          if (asking) {
            dirty.current = false
            dispatch(asking)
          }
          setAsking(null)
        }}
      />
    </div>
  )
}

export { PeopleStack }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PeopleStackProps = ComponentProps<typeof PeopleStack>
export type { StackOpen }
