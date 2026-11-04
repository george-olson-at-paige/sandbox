/* @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1, D-V5: lands in labs.
   @from the Vue webapp's people.ts / documents.ts (PersonRow, PersonDetail, DocumentRow,
   DocumentDetail; branch claude/people-documents-views-2e4bdc), narrowed to what the People and
   Documents Views draw. The shapes a screen hands the pieces; the pieces never fetch.
   Words arrive as data (an Area's label, a need's text), so no piece holds copy of its own. */
import type { AreaId } from "../../../icons/area-glyphs"

/** An Area as a View shows it: its id (tone, glyph) and its name. */
export type AreaRef = { id: AreaId; label: string }

/** Something a record still needs, in the list's words ("No phone or email"). */
export type Need = { kind: string; text: string }

/** One line of a section: what it says, and where it lives. */
export type RecordLine = {
  key: string
  /** The line itself ("An emergency contact"). */
  label: string
  /** A quieter second part ("Alder Street Family Practice"). */
  detail?: string
  /** Where it lives, and the link's words ("Open in Family"). */
  open?: { href: string; label: string }
}

/** Lines grouped under an Area: "Who they are to you", "What it's for". */
export type AreaGroup = { area: AreaRef; lines: RecordLine[] }

/* —— People —— */

export type Person = {
  id: string
  name: string
  /** The role the owner stated ("Spouse", "Physician"), never a derived kinship ("Wife"). */
  stated: string
  pet?: boolean
  initials: string
  photo?: string
  /** "1 role" / "2 roles", from the View's words. Empty when they are on nothing yet. */
  roles: string
  areas: AreaRef[]
  needs: Need[]
  phone?: string
  email?: string
  /** "9" for a child, a pet's kind; the letterhead's second line after `stated`. */
  aside?: string
  /** Who they are to you: what they are named as, Area by Area. */
  groups: AreaGroup[]
  /** What they can see (owner only): the Delegate grant, the shares. */
  canSee: RecordLine[]
}

/* —— Documents —— */

export type FileKind = "image" | "pdf" | "text" | "other"

/** A value read off a document, waiting for the owner's yes. */
export type WaitingValue = {
  key: string
  label: string
  value: string
  /** What the Vault holds now, when it differs ("You have 1958-01-06"). */
  current?: string
}

export type Share = {
  id: string
  who: string
  when: string
  accepted: boolean
}

export type VaultDocument = {
  id: string
  title: string
  /** The type, shown as a chip when it isn't the title ("ID"). */
  type?: string
  fileName?: string
  /** "Added Oct 30, 2026", from the View's words. */
  added: string
  generated?: boolean
  file?: { kind: FileKind; src: string }
  areas: AreaRef[]
  needs: Need[]
  /** Facts on the card: "Original · Top desk drawer". */
  facts: Array<{ label: string; value: string }>
  note?: string
  forWhat: AreaGroup[]
  waiting: WaitingValue[]
  /** What was read and where it shows up. */
  read: AreaGroup[]
  names: Array<{ id: string; name: string; href: string }>
  shares: Share[]
}
