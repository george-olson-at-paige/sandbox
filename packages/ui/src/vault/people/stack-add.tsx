"use client"

import type { ComponentProps } from "react"
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react"
import { PlusIcon, XIcon } from "lucide-react"

import { Button } from "../../components/actions/button"
import { Inline } from "../../primitives/inline"
import { PersonPicker, type PersonPickerPerson } from "./person-picker"
import { QuickAdd } from "./quick-add"
import type { PickMode, QuickAddOption } from "../stack-rules"

/** Where the Add region is: at rest, choosing (pick → quick add → someone new), or on the form. */
export type StackAddState = { step: "rest" } | { step: "choose" } | { step: "form"; kinship?: string }

/* @archetype Composite (ARCHETYPES.md).
   StackAdd (ADR 0076 amendment rules 1-3): a stack's Add region, one more thing the stack keeps
   open (rule 1). Controlled: the stack holds the state (PeopleStack, through stackOpenReducer).
   - **At rest** it reads as one quiet, neutral control: "+ Add someone" (Button ghost, body ink,
     never the active colour). Quick add is inside the open region (George, 2026-10-28);
     `quickAtRest` (default false) can put neutral pills beside it as shortcuts. This is the fix for the "triple"
     (Setup's Where you stand showed quick add + "Someone you’ve named" + "Add someone" at rest,
     two of them on a muted fill with blue text, so they read as active).
   - **Open** it is the stack's one blue thing (rule 2: `bg-accent`, the CaptureCard wash), a
     region named by its heading, with Close (X), and offers in order (rule 3): **pick** (the
     PersonPicker: pills up to five, search from six), **quick add** (QuickAdd), **someone new**.
     Nobody to pick (`pickMode` new) → the stack opens straight to the form, so this shows the
     form. `full` → no Add at all (the stack can take no more, rule 4).
   - **Form**: the heading says "Someone new" and `renderForm(kinship)` draws the form (the
     stack's PersonAddForm); the form owns Enter/Escape.
   - Focus: opening moves focus to the first choice (a pill or the search field); Escape (or
     Close) closes and focus returns to "+ Add someone". After a save the stack moves focus to
     the new entry (its effect runs after this one).
   - `pickError` shows a failed pick in the region (announced), the pills ready again. */
/** A stack's Add region: one quiet "+ Add someone" at rest; open, the one blue thing: pick → quick add → someone new. */
function StackAdd({
  state,
  pickMode,
  candidates,
  quick,
  quickAtRest = false,
  label = "Add someone",
  onOpen,
  onClose,
  onPick,
  pendingPickId,
  pickError,
  onQuickAdd,
  onSomeoneNew,
  renderForm,
}: {
  /** rest · choose · form (with the kinship a quick add set). */
  state: StackAddState
  /** From `pickMode(candidates, hasRoom)`: `full` renders nothing. */
  pickMode: PickMode
  /** People in the book and not on this stack. */
  candidates: PersonPickerPerson[]
  /** Quick-add kinships (already filtered for caps). */
  quick: readonly QuickAddOption[]
  /** Show the quick-add pills at rest as shortcuts. Default true (pending George). */
  quickAtRest?: boolean
  /** The rest control's label and the open region's heading. Default "Add someone". */
  label?: string
  /** "+ Add someone" was pressed. */
  onOpen: () => void
  /** Close or Escape. */
  onClose: () => void
  /** Someone already named was picked. */
  onPick: (id: string) => void
  /** The pick that is saving. */
  pendingPickId?: string
  /** A failed pick's message. */
  pickError?: string
  /** A quick-add pill was pressed (at rest or open). */
  onQuickAdd: (kinship: string) => void
  /** "Someone new" was pressed. */
  onSomeoneNew: () => void
  /** The add form, for the form step. */
  renderForm: (kinship?: string) => ReactNode
}) {
  const headingId = useId()
  const restRef = useRef<HTMLButtonElement>(null)
  const regionRef = useRef<HTMLElement>(null)
  const was = useRef<StackAddState["step"]>("rest")

  useEffect(() => {
    const before = was.current
    was.current = state.step
    if (state.step === "choose" && before !== "choose") {
      regionRef.current?.querySelector<HTMLElement>("[data-slot=person-picker] :is(button, input), [data-slot=quick-add] button, [data-slot=someone-new]")?.focus()
    } else if (state.step === "rest" && before !== "rest") {
      restRef.current?.focus()
    }
  }, [state.step])

  if (pickMode === "full") return null

  if (state.step === "rest") {
    return (
      <div data-slot="stack-add" data-state="rest" className="border-t border-divider px-4 py-3 first:border-t-0">
        <Inline gap={2}>
          <Button ref={restRef} variant="ghost" size="sm" icon={<PlusIcon aria-hidden />} aria-expanded={false} onClick={onOpen} className="-ml-2">
            {label}
          </Button>
          {quickAtRest && <QuickAdd options={quick} onSelect={onQuickAdd} showLabel={false} />}
        </Inline>
      </div>
    )
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "Escape" || e.defaultPrevented || state.step !== "choose") return
    e.preventDefault()
    onClose()
  }

  return (
    <section
      ref={regionRef}
      aria-labelledby={headingId}
      data-slot="stack-add"
      data-state={state.step}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-4 border-t border-primary-subtle bg-accent px-4 py-4 first:border-t-0"
    >
      <div className="flex items-center gap-2">
        <h3 id={headingId} className="flex-1 text-sm font-semibold text-foreground-strong">
          {state.step === "form" ? "Someone new" : label}
        </h3>
        {state.step === "choose" && <Button variant="ghost" size="icon" icon={<XIcon />} aria-label="Close" onClick={onClose} className="-my-2 -mr-2" />}
      </div>
      {state.step === "form" ? (
        renderForm(state.kinship)
      ) : (
        <>
          {candidates.length > 0 && (
            <PersonPicker people={candidates} onPick={onPick} pendingId={pendingPickId} mode={pickMode === "search" ? "search" : "pills"} />
          )}
          {pickError && (
            <p role="alert" className="text-sm font-medium text-error">
              {pickError}
            </p>
          )}
          <QuickAdd options={quick} onSelect={onQuickAdd} disabled={pendingPickId !== undefined} />
          <div>
            <Button data-slot="someone-new" variant="secondary" size="sm" icon={<PlusIcon aria-hidden />} disabled={pendingPickId !== undefined} onClick={onSomeoneNew}>
              Someone new
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

export { StackAdd }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StackAddProps = ComponentProps<typeof StackAdd>

