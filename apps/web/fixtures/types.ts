// View shapes the screens render. Hand-written from the prototype's derived view
// (persona 3, "docs": Maya Elena Reyes). No domain logic is ported.
import type { FactFieldState } from "@paige/ui/vault/fact-field"
import type { AreaId } from "@paige/ui/icons/area-glyphs"
import type { RailPanel } from "@paige/ui/vault/areas/rail-panels"
import type { TileState } from "@paige/ui/vault/areas/area-tile"

export type { AreaId, FactFieldState, RailPanel, TileState }

export interface TileView {
  area: AreaId
  name: string
  line: string
  state: TileState
  firstStep: string
  meta?: { strong: string; rest: string }
  ratio: number
}

export interface HomeView {
  owner: { name: string; email?: string; avatar: string }
  /** Used Paige before Areas: sees the Sections banner until dismissed (R2-35). */
  established?: boolean
  hero: { eyebrow: string; title: string; body: string; cta?: { label: string; href: string } }
  tiles: TileView[]
  browseNote: string
}

export type RowStatus = "open" | "partial" | "present" | "declined"

export interface RowAction {
  label: string
  kind: "first" | "add" | "decline" | "change"
}

export interface PersonRecord {
  name: string
  detail: string
  pet?: boolean
  tags?: string[]
  fromContacts?: boolean
  /** inline add actions under the detail, e.g. "Name a guardian" */
  inline?: string[]
}

export interface DocRecord {
  name: string
  detail: string
  tag: { label: string; tone: "success" | "warning" | "info" }
  fromDocuments?: boolean
}

export interface FieldRecord {
  key: string
  label: string
  state: FactFieldState
  wide?: boolean
}

export interface ItemRowView {
  key: string
  label: string
  why: string
  status: RowStatus
  first?: boolean
  declinedLabel?: string
  partialLabel?: string
  actions: RowAction[]
  people?: PersonRecord[]
  docs?: DocRecord[]
  fields?: FieldRecord[]
}

export interface AreaView {
  area: AreaId
  name: string
  line: string
  count: string
  lead: string
  setUp: boolean
  review?: { title: string; body: string }
  essentials: ItemRowView[]
  depth: ItemRowView[]
  rail: RailPanel[]
}

export interface SetupView {
  totalSteps: number
  roles: Array<{ key: string; label: string; sub: string; opens: AreaId[] }>
  selectedRoles: string[]
  /** `mobile` is E.164 ("+12065550192"), PhoneField's value shape (R4-12). */
  about: { legalName: string; preferredName: string; mobile: string; address: string; ownOrRent: string }
}
