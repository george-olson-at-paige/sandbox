"use client"

/* @level 0 — sketch (LEVELS.md). The UI catalog (S-11): per kind, the parts that show it. A list
   looks its facts up here and never names a kind, so adding a kind never edits FactList.
   - Typed as a mapped type over the registry: a kind with no definition fails the type check.
   - Each group exports its part (people/catalog.ts); the app (here, the story) composes them and
     provides the whole. The vault root never imports a group (check:layers GROUP).
   - Provided, not imported, so a page can swap it: the Wireframe provides a catalog of
     placeholders, the content the real one. One frame, two fillings (ORGANIZATION.md §11). */
import { createContext, use, type ComponentType, type ReactNode } from "react"

import type { FactKind, FactValue } from "../facts/kinds"

/** What a kind's Item receives: its value. Behaviour (open, remove) comes from the Fact scope. */
export type FactItemProps<K extends FactKind> = { readonly value: FactValue<K> }

/** One kind's parts. The Add joins at skeleton step 4. */
export type FactKindParts<K extends FactKind> = { readonly Item: ComponentType<FactItemProps<K>> }

/** The parts for some kinds: what one group exports. */
export type FactCatalogPart<Ks extends FactKind> = { readonly [K in Ks]: FactKindParts<K> }

/** The parts for every kind. */
export type FactCatalog = FactCatalogPart<FactKind>

const CatalogContext = createContext<FactCatalog | null>(null)

/** The catalog every list below reads. */
export function FactCatalogProvider({ catalog, children }: { catalog: FactCatalog; children: ReactNode }) {
  return <CatalogContext value={catalog}>{children}</CatalogContext>
}

export function useFactCatalog(): FactCatalog {
  const catalog = use(CatalogContext)
  if (catalog === null) throw new Error("FactCatalogProvider is missing above this part.")
  return catalog
}
