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

/* What a document says goes through a sequence (George 2026-11-04): the document is scanned and
   read; the owner approves the read (is that what it says?); what was read is proposed as Vault
   facts; the owner uses each or keeps their own. The record draws all of it on each value's line
   in "What it says" (SaidList); Essential Setup skips the read check (VIEWS-PLAN.md).
   - read      read, not checked: Looks right / Fix. Checked, it becomes proposed, used (the
               Vault already holds it) or unused (no Vault fact for it).
   - proposed  waits for the owner: Use this / Keep mine.
   - used      in the Vault, in an Area (`area`, `open`).
   - kept      the owner kept what the Vault had (`current`).
   - unused    read, but there's no Vault fact for it (a licence number). */
export type SaidState = "read" | "proposed" | "used" | "kept" | "unused"

/** One value a document says, and what became of it. */
export type SaidValue = WaitingValue & {
  state: SaidState
  /** The Area it goes to (proposed) or went to (used), and the way there ("Open in Personal"). None: there's no Vault fact for it. */
  area?: AreaRef
  open?: { href: string; label: string }
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
  /** What it says, once it has been read: when ("Read Oct 2, 2026", the View's words) and each value. Absent until read. */
  said?: { readOn: string; values: SaidValue[] }
  names: Array<{ id: string; name: string; href: string }>
  shares: Share[]
}
