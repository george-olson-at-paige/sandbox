/* Stack rules (ADR 0076, amendment 2026-10-28: how a stack behaves). Pure data and functions, no
   React, so the rules are proved with `node --test` (stack-rules.test.ts) and every screen that
   uses a stack gets them instead of re-deciding them. The words a person reads are not here: the
   components own their copy; kinship and role keys are the API's (`spouse_partner`, `emergency`).
   - Rule 1, one open thing: `StackOpen` is the stack's one open thing (an entry's expand or the
     Add region), so two adds, two expands, or an add beside an expand can't be written.
     `stackOpenReducer` moves it; `sameOpenThing` says when a move closes what was open (the
     component asks "Discard changes?" then, if it had unsaved input).
   - Rule 3, add starts with the book: `pickMode` (new · pills ≤5 · search 6+ · full).
   - Rule 4, caps per kinship or role: `KINSHIP_CAPS`, `ROLE_CAPS`, `stackHasRoom`, `quickAddFor`.
   - Rule 5, fields by kinship and role as data: `CONTACT_FIELD_RULES`, `contactFieldsFor`.
   Mirrors the Vue app's stackOpen.ts, remainingContacts.ts `remainingPickMode`, stackCaps.ts and
   contactFields.ts (same keys and outcomes) so the two can't drift in meaning. */

// ── Rule 1: one open thing ──────────────────────────────────────────────────────────────────────

/** The stack's one open thing: nothing (at rest), one entry's expand, or the Add region at a step. */
export type StackOpen =
  | { kind: "rest" }
  | { kind: "entry"; id: string }
  /** The Add region, choosing: pick → quick add → someone new. */
  | { kind: "add"; step: "choose" }
  /** The Add region, on the form; `kinship` set by a quick add. */
  | { kind: "add"; step: "form"; kinship?: string }

export type StackOpenAction =
  /** Toggle an entry's expand: open it, or close it when it is the open thing. */
  | { type: "toggle-entry"; id: string }
  /** Open the Add region. Nobody to pick → straight to the form; `full` → nothing opens. */
  | { type: "open-add"; pickMode: PickMode }
  /** A quick-add pill: the form, with that kinship set. */
  | { type: "quick-add"; kinship: string }
  /** "Someone new": the form, nothing set. */
  | { type: "someone-new" }
  /** Close whatever is open. */
  | { type: "close" }

export const STACK_REST: StackOpen = { kind: "rest" }

/** The next open thing. Pure: asking about unsaved input is the caller's, before it dispatches. */
export function stackOpenReducer(state: StackOpen, action: StackOpenAction): StackOpen {
  switch (action.type) {
    case "toggle-entry":
      return state.kind === "entry" && state.id === action.id ? STACK_REST : { kind: "entry", id: action.id }
    case "open-add":
      if (action.pickMode === "full") return state
      return action.pickMode === "new" ? { kind: "add", step: "form" } : { kind: "add", step: "choose" }
    case "quick-add":
      return { kind: "add", step: "form", kinship: action.kinship }
    case "someone-new":
      return { kind: "add", step: "form" }
    case "close":
      return STACK_REST
  }
}

/** Whether `a` and `b` are the same open thing, so moving between them closes nothing (the Add
    region moving from choose to its form stays the Add region). */
export function sameOpenThing(a: StackOpen, b: StackOpen): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === "entry" && b.kind === "entry") return a.id === b.id
  return true
}

// ── Rule 3: add starts with the book ────────────────────────────────────────────────────────────

/** How the Add region offers people already in the book: `new` nobody to offer (straight to the
    form) · `pills` 1–5 · `search` 6 or more · `full` the stack can take no more (no Add). */
export type PickMode = "new" | "pills" | "search" | "full"

/** Pills up to this many candidates; search above it. */
export const PICK_PILLS_MAX = 5

/** The pick mode for `candidates` people in the book and not on this stack. */
export function pickMode(candidates: number, hasRoom = true): PickMode {
  if (!hasRoom) return "full"
  if (candidates <= 0) return "new"
  return candidates <= PICK_PILLS_MAX ? "pills" : "search"
}

/** The book less who is already on the stack, in the book's order. */
export function pickCandidates<P extends { id: string }>(book: readonly P[], onStack: readonly { id: string }[]): P[] {
  const on = new Set(onStack.map((p) => p.id))
  return book.filter((p) => !on.has(p.id))
}

// ── Rule 4: caps per kinship or role ────────────────────────────────────────────────────────────

export const KINSHIP_SPOUSE_PARTNER = "spouse_partner"
export const KINSHIP_PET = "pet"
export const ROLE_EMERGENCY = "emergency"
export const ROLE_GUARDIAN = "guardian"
export const ROLE_EMPLOYER = "employer"

/** How many of a kinship one stack holds. A kinship not listed has no cap of its own. */
export const KINSHIP_CAPS: Readonly<Record<string, number>> = { [KINSHIP_SPOUSE_PARTNER]: 1 }

/** How many of a role one stack holds. A role not listed holds what the item says (`multi`). */
export const ROLE_CAPS: Readonly<Record<string, number>> = { [ROLE_EMERGENCY]: 1 }

/** Who is on the stack, as far as caps read it. */
export type StackOccupant = { kinship?: string | null }

/** Why the stack is here: the role it names (or none) and whether the item takes many. */
export type StackContext = { role?: string | null; multi: boolean }

/** The cap on a kinship in one stack, or null when it has none. */
export function kinshipCap(kinship: string | null | undefined): number | null {
  return kinship ? (KINSHIP_CAPS[kinship] ?? null) : null
}

/** The cap on the whole stack: the role's own, else one unless the item takes many. */
export function stackCap({ role, multi }: StackContext): number | null {
  const own = role ? ROLE_CAPS[role] : undefined
  if (own !== undefined) return own
  return multi ? null : 1
}

/** The stack can take one more (struck entries still count until the person leaves the page). */
export function stackHasRoom(occupants: readonly StackOccupant[], context: StackContext): boolean {
  const cap = stackCap(context)
  return cap === null || occupants.length < cap
}

/** One more of `kinship` fits on the stack. */
export function kinshipHasRoom(kinship: string, occupants: readonly StackOccupant[]): boolean {
  const cap = kinshipCap(kinship)
  return cap === null || occupants.filter((o) => o.kinship === kinship).length < cap
}

/** A quick-add choice: a kinship and how the pill says it. */
export type QuickAddOption = { kinship: string; label: string }

/** The quick-add pills to offer: none when the stack is full; a capped kinship disappears once
    used and comes back when that person comes off. */
export function quickAddFor(options: readonly QuickAddOption[], occupants: readonly StackOccupant[], context: StackContext): QuickAddOption[] {
  if (!stackHasRoom(occupants, context)) return []
  return options.filter((o) => kinshipHasRoom(o.kinship, occupants))
}

// ── Rule 5: what we ask comes from who they are and why they are here ───────────────────────────

/** Fields a contact form can show. */
export type ContactFieldKey = "name" | "relationship" | "dateOfBirth" | "phone" | "email" | "note"

/** `create` the add form · `edit` the fuller expand · `reach` the progressive "add a number" expand. */
export type ContactFieldMode = "create" | "edit" | "reach"

/** Who they are: a pet, or a person (anyone not a pet). */
export type Kin = "person" | "pet"

/** A rule: where it applies (each left out applies everywhere) and what it does. `fields`
    replaces the list; `include` / `exclude` patch it. Rules apply in order. */
export type ContactFieldRule = {
  kin?: Kin
  role?: string
  mode?: ContactFieldMode
  fields?: readonly ContactFieldKey[]
  include?: readonly ContactFieldKey[]
  exclude?: readonly ContactFieldKey[]
}

/** The rule set, as data: base lists by kin and mode, then role rules. Grow the questions here,
    never in a screen's map (Setup's follow-ups land here when they are built). */
export const CONTACT_FIELD_RULES: readonly ContactFieldRule[] = [
  { kin: "person", mode: "create", fields: ["name", "relationship", "dateOfBirth", "phone", "email"] },
  { kin: "person", mode: "edit", fields: ["name", "dateOfBirth", "phone", "email"] },
  { kin: "person", mode: "reach", fields: ["phone", "email"] },
  { kin: "pet", mode: "create", fields: ["name", "relationship", "note"] },
  { kin: "pet", mode: "edit", fields: ["name", "note"] },
  { kin: "pet", mode: "reach", fields: ["note"] },
  // A guardian is an adult; who they are to the person is enough: no date of birth on the add.
  { role: ROLE_GUARDIAN, mode: "create", exclude: ["dateOfBirth"] },
  // An employer is a company or a manager: no date of birth on the add.
  { role: ROLE_EMPLOYER, mode: "create", exclude: ["dateOfBirth"] },
]

/** A pet, by kinship. */
export function kinOf(kinship: string | null | undefined): Kin {
  return kinship === KINSHIP_PET ? "pet" : "person"
}

/** The fields a form asks for this kinship, mode and role, in the rule set's order. */
export function contactFieldsFor(kinship: string | null | undefined, mode: ContactFieldMode, context: { role?: string | null } = {}, rules: readonly ContactFieldRule[] = CONTACT_FIELD_RULES): ContactFieldKey[] {
  const kin = kinOf(kinship)
  let fields: ContactFieldKey[] = []
  for (const rule of rules) {
    if (rule.kin && rule.kin !== kin) continue
    if (rule.mode && rule.mode !== mode) continue
    if (rule.role && rule.role !== context.role) continue
    if (rule.fields) fields = [...rule.fields]
    if (rule.include) for (const f of rule.include) if (!fields.includes(f)) fields.push(f)
    if (rule.exclude) fields = fields.filter((f) => !rule.exclude!.includes(f))
  }
  return fields
}

// ── Rule 6: × asks, then lets you take it back ──────────────────────────────────────────────────

/** `take-off` the role or placement goes, the contact stays in People · `delete` the contact goes everywhere. */
export type RemovalKind = "take-off" | "delete"
