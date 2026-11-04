"use client"

import type { ComponentProps } from "react"
import type { ReactNode, Ref } from "react"
import { ChevronDownIcon, XIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../../components/actions/button"
import { Avatar } from "../../components/display/avatar"
import { Badge } from "../../components/display/badge"
import type { RemovalKind } from "../stack-rules"

/** A person (or pet) on a stack. */
export type StackPerson = {
  /** Stable id (the contact's). */
  id: string
  name: string
  /** The kinship key (`spouse_partner`, `child`, `pet`), for caps and fields. */
  kinship?: string
  /** The role the owner stated, as shown ("Spouse", "Child"): never an inferred kinship term (R3-19). */
  detail?: string
  /** Photo URL. */
  src?: string
}

/** An entry's state: at rest; open (the stack's one open thing); new (just added, marked, not
    active); struck (× chosen: struck through with Undo until the person leaves the page). */
export type StackEntryState = { kind: "rest" } | { kind: "open" } | { kind: "new" } | { kind: "struck"; removal: RemovalKind }

/* @archetype Item (ARCHETYPES.md).
   StackEntry (ADR 0076 amendment rules 1, 2, 6): one person on a stack.
   - The row is a toggle (a button, `aria-expanded`) that opens the entry's expand, the children.
     The stack keeps one thing open (rule 1); this row only says it's open and asks to toggle.
   - Blue means the open thing (rule 2): only `open` takes the active colour (`bg-accent`). `new`
     is marked with a "New" badge in the success tone, never blue.
   - × ("Remove {name}") asks through RemoveDialog (the stack's); the choice strikes the entry:
     the name struck through and muted, the expand closed, × replaced by Undo ("Undo, keep
     {name}"), and a line for screen readers saying what will happen when they leave. Undo puts
     it back. The stack writes the removal when the person leaves the page.
   - `removable` false drops × (an item whose coming off means something else replaces it).
   - Hover is relative (R4-01); focus by kind (R15-17): the toggle is a row (the wash), × and Undo
     are buttons (the ring). */
/** One person on a stack: a toggle that opens their details, × to remove (asks), struck through with Undo until you leave. */
function StackEntry({ person, state, onToggle, onRemove, onUndo, removable = true, listLabel = "this list", children, ref }: {
  /** Who. */
  person: StackPerson
  /** rest · open · new · struck. */
  state: StackEntryState
  /** The row was pressed: open or close the expand. */
  onToggle?: () => void
  /** × was pressed: the stack asks how (RemoveDialog). */
  onRemove?: () => void
  /** Undo on a struck entry. */
  onUndo?: () => void
  /** Show ×. Default true. */
  removable?: boolean
  /** What they come off, for the struck line ("your emergency contacts"). */
  listLabel?: string
  /** The expand's body, shown while open. */
  children?: ReactNode
  /** The row (the stack focuses it after an add or an Undo). */
  ref?: Ref<HTMLLIElement>
}) {
  const struck = state.kind === "struck"
  const open = state.kind === "open"
  return (
    <li
      ref={ref}
      tabIndex={-1}
      data-slot="stack-entry"
      data-state={state.kind}
      className={cn("border-t border-divider outline-none first:border-t-0", open && "bg-accent")}
    >
      <div className="flex min-h-bar items-center gap-2 pr-2">
        <button
          type="button"
          disabled={struck || !onToggle}
          aria-expanded={struck || !onToggle ? undefined : open}
          onClick={onToggle}
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-3 self-stretch px-4 py-2 text-left outline-none",
            !struck && onToggle && "cursor-pointer hover:layer-hover focus-visible:layer-hover"
          )}
        >
          <span aria-hidden className={cn("flex", struck && "opacity-disabled")}>
            <Avatar name={person.name} src={person.src} size="sm" variant={person.kinship === "pet" ? "pet" : "person"} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className={cn("truncate text-sm font-semibold text-card-foreground", struck && "text-muted-foreground line-through")}>{person.name}</span>
            {person.detail && (
              <span className={cn("truncate text-xs font-medium text-muted-foreground", struck && "line-through")}>
                <span className="sr-only">, </span>
                {person.detail}
              </span>
            )}
          </span>
          {state.kind === "new" && (
            <Badge tone="success" size="xs" className="shrink-0">
              New
            </Badge>
          )}
          {!struck && onToggle && <ChevronDownIcon aria-hidden className={cn("ml-auto size-icon shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-180")} />}
        </button>
        {struck ? (
          <>
            <span role="status" className="sr-only">
              {state.removal === "delete" ? `${person.name} will be deleted from People when you leave this page.` : `${person.name} will come off ${listLabel} when you leave this page.`}
            </span>
            <Button variant="quiet" size="sm" underline onClick={onUndo} aria-label={`Undo, keep ${person.name}`}>
              Undo
            </Button>
          </>
        ) : (
          removable && onRemove && <Button variant="ghost" size="icon" icon={<XIcon />} aria-label={`Remove ${person.name}`} onClick={onRemove} />
        )}
      </div>
      {open && children && (
        <div data-slot="stack-entry-body" className="px-4 pb-4">
          {children}
        </div>
      )}
    </li>
  )
}

export { StackEntry }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StackEntryProps = ComponentProps<typeof StackEntry>
