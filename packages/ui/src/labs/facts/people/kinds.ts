/* @level 0 — sketch (LEVELS.md). The People group's kinds (ORGANIZATION.md §11): contact and pet,
   two subject kinds (docs/fact-catalog.md §1: a pet is its own kind, not a Contact). Each adds
   itself to the registry by module augmentation; nothing else lists them. Kinship keys are the
   API's. */
import type { Brand } from "../ids"

export type ContactId = Brand<string, "ContactId">
export type PetId = Brand<string, "PetId">

/** Someone in the owner's book. */
export type Contact = {
  readonly id: ContactId
  readonly name: string
  /** The API's kinship key (`spouse_partner`, `child`, `parent`, `friend`). */
  readonly kinship: string
  /** Who they are to the owner, as the owner stated it (R3-19): shown, never inferred. */
  readonly relationship: string
}

/** A pet the owner named. */
export type Pet = {
  readonly id: PetId
  readonly name: string
  /** What the owner said about them ("Dog"). */
  readonly description: string
}

declare module "../kinds" {
  interface FactKinds {
    contact: Contact
    pet: Pet
  }
}
