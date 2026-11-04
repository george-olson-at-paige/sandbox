"use client"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). The People group's Items (S-09): FactItem for a contact and for
   a pet, given their value by the list. Open, new and struck join when FactItem takes its states
   (step 2, built: the Items read the Fact scope for open and toggle); PersonFact's person rules
   (reach line, fields) at step 3, so the open body is a placeholder for now. */
import type { ReactNode } from "react"

import "../../facts/people/kinds"
import { Placeholder } from "../../../stories/placeholder"
import { FactItem, type FactItemState } from "../../../vault/fact-item"
import type { FactCatalogPart, FactItemProps } from "../fact-catalog"
import { useFact, type FactScope } from "../fact-list"

/** The Fact scope as FactItem's state and expand: the list decides what is open. */
function onList(fact: FactScope, body: string): { state: FactItemState; expand: { onToggle: () => void; body: ReactNode } } {
  return {
    state: fact.open ? { kind: "open" } : { kind: "rest" },
    expand: { onToggle: fact.toggle, body: <Placeholder size="md" label={body} /> },
  }
}

/** A contact on a list: their name and who they are to the owner, as stated. */
export function ContactFact({ value }: FactItemProps<"contact">) {
  const fact = useFact()
  return <FactItem kind="person" name={value.name} detail={value.relationship} {...onList(fact, "Contact details (step 3)")} />
}

/** A pet on a list: their name and what the owner said about them. */
export function PetFact({ value }: FactItemProps<"pet">) {
  const fact = useFact()
  return <FactItem kind="pet" name={value.name} detail={value.description} {...onList(fact, "Pet details (step 3)")} />
}

/** The People group's part of the catalog. */
export const peopleCatalog = {
  contact: { Item: ContactFact },
  pet: { Item: PetFact },
} satisfies FactCatalogPart<"contact" | "pet">
