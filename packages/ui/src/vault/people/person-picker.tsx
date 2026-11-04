import type { ComponentProps } from "react"
import { useId, useState, type KeyboardEvent, type ReactNode } from "react"
import { PlusIcon, SearchIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Avatar } from "../../components/display/avatar"
import { Eyebrow } from "../../components/display/eyebrow"
import { Spinner } from "../../components/feedback/spinner"
import { Combobox, ComboboxInput, ComboboxItem, ComboboxList } from "../../components/inputs/combobox"
import { InputGroup, InputGroupAddon } from "../../components/inputs/input-group"
import { pressable } from "../../components/internal/control"
import { Inline } from "../../primitives/inline"
import { PICK_PILLS_MAX } from "../stack-rules"

export type PersonPickerPerson = {
  /** Stable id, passed back to `onPick`. */
  id: string
  name: string
  /** The role the owner stated ("Spouse", "Child", "Friend"), never an inferred kinship term (CLAUDE.md display rule). */
  detail?: string
  /** Photo URL. */
  src?: string
  variant?: "person" | "pet"
}

/* @archetype Composite (ARCHETYPES.md).
   PersonPicker (R2-49, R6-05; prototype components/capture/PersonCapture.tsx, styles/capture.css
   .vt-pick): "Someone you’ve named": the people already in the vault as pills, one tap to pick,
   plus "Add someone new". Used inside a CaptureCard when a role or slot needs a person (a
   guardian, a beneficiary, someone to call), and as the pick step of a stack's Add region
   (StackAdd), which leaves `onAddNew` off: there "Someone new" comes after quick add (ADR 0076
   amendment rule 3).
   - A pick is an action, not a selection: `onPick(id)` and the caller saves (assigns the role,
     names them in the will). So the pills are plain buttons, not a toggle group (GAPS #62's
     ToggleGroup `chip` isn't needed for it). While a pick saves, pass `pendingId`: that pill
     shows a spinner and every pill is disabled, so a double pick can't happen.
   - Who is offered is the caller's (someone without the role yet, no children for an adult
     role, no pets unless asked): pass only the candidates.
   - Each pill: the avatar (sm, initials or photo; a pet's paw), the name, and the stated role
     muted after it. Hover is relative (R4-01).
   - "Add someone new" (dashed pill, a plus) calls `onAddNew`, which opens the caller's new
     contact form. With no candidates, the picker shows only that pill; the prototype goes
     straight to the form, which the caller can do by not rendering the picker.
   - A group named by its label (aria-labelledby).
   - Search for 6+ (ADR 0076 amendment rule 3, `pickMode`): `mode` defaults to pills up to five
     candidates and search from six. Search is a Combobox (U-01) inline, not in a popover
     (R14-04: no popover inside the open Add region): the field keeps focus, matches list under it
     as options (name, stated role) with the first highlighted, Down/Up move and wrap, Enter picks
     the highlighted one, Escape clears the text (a second Escape reaches whatever holds the
     picker). Nothing lists until something is typed; no match says so. */
/** Pick someone already named as a pill (or by search, from six), or add someone new: the person step of a capture or a stack's Add. */
function PersonPicker({
  people,
  onPick,
  onAddNew,
  label = "Someone you’ve named",
  addLabel = "Add someone new",
  pendingId,
  disabled = false,
  mode,
  searchPlaceholder = "Type a name",
  className,
}: {
  /** The candidates, in the order to show them. */
  people: PersonPickerPerson[]
  /** Called with the picked person's id. The caller saves, then closes or moves on. */
  onPick: (id: string) => void
  /** Shows the "Add someone new" pill; opens the caller's new contact form. */
  onAddNew?: () => void
  /** The eyebrow above the pills, and the group's name. Default "Someone you’ve named". */
  label?: ReactNode
  /** The add pill's label. Default "Add someone new". */
  addLabel?: string
  /** The person whose pick is saving: their pill shows a spinner and every pill is disabled. */
  pendingId?: string
  /** Disable every pill (the capture is saving something else). */
  disabled?: boolean
  /** pills (the default up to five candidates) · search (the default from six): a field that lists matches. */
  mode?: "pills" | "search"
  /** The search field's placeholder. Default "Type a name". */
  searchPlaceholder?: string
  /** Placement (margins), not restyling. */
  className?: string
}) {
  const labelId = useId()
  const off = disabled || pendingId !== undefined
  const shown = mode ?? (people.length > PICK_PILLS_MAX ? "search" : "pills")
  const addPill = onAddNew && (
    <button
      type="button"
      disabled={off}
      onClick={onAddNew}
      className={cn(PILL, PILL_ICON, "border-dashed text-muted-foreground hover:text-card-foreground")}
    >
      <PlusIcon aria-hidden strokeWidth={2.6} />
      {addLabel}
    </button>
  )
  return (
    <div role="group" aria-labelledby={labelId} data-slot="person-picker" data-mode={shown} className={cn("flex flex-col gap-2", className)}>
      <Eyebrow id={labelId}>{label}</Eyebrow>
      {shown === "search" ? (
        <>
          <PersonSearch people={people} onPick={onPick} pendingId={pendingId} disabled={off} labelId={labelId} placeholder={searchPlaceholder} />
          {addPill && <Inline gap={2}>{addPill}</Inline>}
        </>
      ) : (
        <Inline gap={2}>
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={off}
              aria-busy={pendingId === p.id || undefined}
              onClick={() => onPick(p.id)}
              className={cn(PILL, PILL_MEDIA)}
            >
              <PersonMark person={p} pending={pendingId === p.id} />
              {p.name}
              <StatedRole detail={p.detail} />
            </button>
          ))}
          {addPill}
        </Inline>
      )}
    </div>
  )
}

/** The pill look the picker and QuickAdd share: a pressable (cursor, focus ring, disabled) in a small-control-tall (36) pill. */
const PILL = `${pressable} inline-flex min-h-control-sm items-center gap-2 rounded-full border bg-card text-sm font-semibold text-card-foreground hover:layer-hover active:layer-press`
/* A pill's leading inset equals its vertical inset (George 2026-10-29), so what leads sits
   concentric with the rounded end. A 24px avatar in the 36px pill has 6px above and below it
   (the 1px border counted), so it gets 6px of padding before it too (7 from the edge; pl-1 had
   it at 5, nearer the edge than the top, and 14px of text padding after it made that read as
   crowded left). A 12px icon in 36 has 12px above and below, so 12px before. The pill stays
   36 (min-h-control-sm, Button sm's height); text keeps 14px after it, a text pill's side padding. */
/** The avatar-led pill's padding (24px avatar in a 36px pill). */
const PILL_MEDIA = "py-1 pr-3.5 pl-1.5"
/** The icon-led pill's padding (an icon-xs glyph in a 36px pill): the add pill, QuickAdd's kinship pills. */
const PILL_ICON = "py-1 pr-3.5 pl-3 [&>svg]:size-icon-xs"

/** The avatar (or the spinner while that pick saves). The name follows as text, so the avatar's initials stay out of the accessible name. */
function PersonMark({ person: p, pending }: { person: PersonPickerPerson; pending: boolean }) {
  if (pending)
    return (
      <span className="flex size-6 items-center justify-center">
        <Spinner label={`Adding ${p.name}`} />
      </span>
    )
  return (
    <span aria-hidden className="flex">
      {p.variant === "pet" ? <Avatar name={p.name} src={p.src} size="sm" variant="pet" /> : <Avatar name={p.name} src={p.src} size="sm" />}
    </span>
  )
}

function StatedRole({ detail }: { detail?: string }) {
  if (!detail) return null
  return (
    <span className="text-xs font-medium text-muted-foreground">
      <span className="sr-only">, </span>
      {detail}
    </span>
  )
}

/** The search form of the picker: a combobox field over an inline list of matches. */
function PersonSearch({
  people,
  onPick,
  pendingId,
  disabled,
  labelId,
  placeholder,
}: {
  people: PersonPickerPerson[]
  onPick: (id: string) => void
  pendingId?: string
  disabled: boolean
  labelId: string
  placeholder: string
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLocaleLowerCase()
  const matches = q ? people.filter((p) => p.name.toLocaleLowerCase().includes(q) || Boolean(p.detail?.toLocaleLowerCase().includes(q))) : []
  // Arrows, Enter and the highlight are the Combobox's; Escape clears the text and goes no further.
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && query) {
      e.preventDefault()
      e.stopPropagation()
      setQuery("")
    }
  }
  return (
    <Combobox inline open={q !== ""} className="flex flex-col gap-1">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        <ComboboxInput aria-labelledby={labelId} placeholder={placeholder} value={query} disabled={disabled} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} />
      </InputGroup>
      <ComboboxList aria-labelledby={labelId} empty={<span role="status">Nobody you’ve named matches “{query.trim()}”.</span>}>
        {matches.map((p) => (
          <ComboboxItem
            key={p.id}
            value={p.id}
            disabled={disabled}
            aria-busy={pendingId === p.id || undefined}
            onSelect={() => onPick(p.id)}
            className="min-h-control gap-2 px-2 py-0 font-semibold"
          >
            <PersonMark person={p} pending={pendingId === p.id} />
            {p.name}
            <StatedRole detail={p.detail} />
          </ComboboxItem>
        ))}
      </ComboboxList>
    </Combobox>
  )
}

export { PersonPicker, PILL as personPill, PILL_ICON as personPillIcon }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PersonPickerProps = ComponentProps<typeof PersonPicker>
