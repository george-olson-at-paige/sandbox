import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

import { Placeholder } from "../../stories/placeholder"
import { ItemRow } from "../../vault/item-row"
import { brand } from "../facts/ids"
import { pathOf, type FactRef } from "../facts/kinds"
import type { Contact, Pet } from "../facts/people/kinds"
import { inMemoryStore, type FactStores } from "../facts/stores"
import { FactCatalogProvider, type FactCatalog } from "./fact-catalog"
import { FactList, FactListFrame, useFact } from "./fact-list"
import { peopleCatalog } from "./people/people-facts"
import { AreaScope, SectionScope, useArea, useSection, VaultProvider } from "./scopes"

/* The skeleton (level 0): Vault → Area → Section → FactList → Fact. The Wireframe is FactList's
   layout with its two slots (the facts, the Add); Filled is FactList on the People catalog; Scopes
   is FactList on a catalog of probes, each reading the scopes above it. No add yet (step 4). */

const ELENA = brand<"ContactId">("elena")
const TOMAS = brand<"ContactId">("tomas")
const BISCUIT = brand<"PetId">("biscuit")

const contacts: readonly Contact[] = [
  { id: brand<"ContactId">("david"), name: "David Reyes", kinship: "spouse_partner", relationship: "Spouse" },
  { id: ELENA, name: "Elena Reyes", kinship: "child", relationship: "Child" },
  { id: TOMAS, name: "Tomás Reyes", kinship: "child", relationship: "Child" },
]
const pets: readonly Pet[] = [{ id: BISCUIT, name: "Biscuit", description: "Dog" }]

/** The Vault: everyone in the book, not just who is on this list. */
const stores: FactStores = {
  contact: inMemoryStore<"contact">(contacts, (c) => c.id),
  pet: inMemoryStore<"pet">(pets, (p) => p.id),
}

/** Who is on the list: two children and a pet, two kinds on one list. */
const dependents: readonly FactRef[] = [
  { kind: "contact", id: ELENA },
  { kind: "contact", id: TOMAS },
  { kind: "pet", id: BISCUIT },
]

const SECTION = { title: "The people who depend on you", listLabel: "the people who depend on you" }

/** The page around the list: every scope in order, with the item's layout (ItemRow) at the Section. */
function Frame({ catalog, children }: { catalog: FactCatalog; children: ReactNode }) {
  return (
    <VaultProvider stores={stores}>
      <FactCatalogProvider catalog={catalog}>
        <AreaScope area="family">
          <SectionScope {...SECTION}>
            <ItemRow status="partial" title={SECTION.title}>
              {children}
            </ItemRow>
          </SectionScope>
        </AreaScope>
      </FactCatalogProvider>
    </VaultProvider>
  )
}

/** A probe Item: a placeholder that reads every scope above it and says where it is. */
function ScopeProbe() {
  const { area } = useArea()
  const { title } = useSection()
  const { ref } = useFact()
  return <Placeholder size="sm" label={`${area} › ${title} › ${pathOf(ref)}`} />
}

/** A catalog where every kind shows the probe. */
const probeCatalog: FactCatalog = { contact: { Item: ScopeProbe }, pet: { Item: ScopeProbe } }

const meta = {
  tags: ["level-0", "!autodocs"],
  parameters: {
    docs: { description: { component: "Level 0 sketch (LEVELS.md): FactList and the scopes above it (STACK-REVIEW S-09…S-13)." } },
  },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta

export default meta
type Story = StoryObj

/** FactList's layout, two slots: the facts (each row by its kind's Item) and the Add. */
export const Wireframe: Story = {
  render: () => (
    <Frame catalog={peopleCatalog}>
      <FactListFrame
        facts={<Placeholder size="lg" label="Facts" detail="One row per fact, each by its kind’s Item" />}
        add={<Placeholder size="sm" label="Add · the kind’s Add" />}
      />
    </Frame>
  ),
}

/** FactList on the People catalog: each entry's Item by its kind, its value from the Vault; one open at a time. */
export const Filled: Story = {
  render: () => (
    <Frame catalog={peopleCatalog}>
      <FactList refs={dependents} label={SECTION.title} />
    </Frame>
  ),
}

/** FactList on a catalog of probes: each entry reads its Area, Section and Fact scopes and names them. */
export const Scopes: Story = {
  render: () => (
    <Frame catalog={probeCatalog}>
      <FactList refs={dependents} label={SECTION.title} />
    </Frame>
  ),
}
