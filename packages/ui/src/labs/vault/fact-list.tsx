"use client"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). FactList (S-13): the repeater with an Add slot, and the two
   lowest scopes (S-10).
   - It is given refs (kind + id) and knows nothing else about them: each one's value comes from
     the Vault's store for its kind, and its Item from the catalog for its kind. A list may mix
     kinds (children and pets on one list of dependents).
   - FactList scope: the list's one open thing, from the pure machine in facts/list.ts.
   - Fact scope: one entry's ref, whether it is the open thing, and toggle. Items read it.
   - A ref whose value the store doesn't have renders nothing (sketch: to decide with the API's
     shape). */
import { createContext, use, useMemo, useReducer, type ReactNode } from "react"

import { ItemGroup } from "../../components/display/item"
import { pathOf, type FactId, type FactKind, type FactRef } from "../facts/kinds"
import { isOpen, LIST_REST, listReducer, type ListOpen } from "../facts/list"
import type { FactStores } from "../facts/stores"
import { useFactCatalog, type FactCatalog } from "./fact-catalog"
import { useVault } from "./scopes"

// ── FactList scope ──────────────────────────────────────────────────────────────────────────────

export type FactListScope = {
  readonly open: ListOpen
  readonly toggle: (ref: FactRef) => void
  readonly close: () => void
}
const FactListContext = createContext<FactListScope | null>(null)

export function useFactList(): FactListScope {
  const list = use(FactListContext)
  if (list === null) throw new Error("FactList is missing above this part.")
  return list
}

// ── Fact scope ──────────────────────────────────────────────────────────────────────────────────

export type FactScope = {
  readonly ref: FactRef
  /** This fact is the list's one open thing. */
  readonly open: boolean
  readonly toggle: () => void
}
const FactContext = createContext<FactScope | null>(null)

export function useFact(): FactScope {
  const fact = use(FactContext)
  if (fact === null) throw new Error("A Fact scope is missing: render facts inside FactList.")
  return fact
}

function FactScopeProvider({ factRef, children }: { factRef: FactRef; children: ReactNode }) {
  const list = useFactList()
  const open = isOpen(list.open, factRef)
  const value = useMemo<FactScope>(() => ({ ref: factRef, open, toggle: () => list.toggle(factRef) }), [factRef, open, list])
  return <FactContext value={value}>{children}</FactContext>
}

// ── FactList ────────────────────────────────────────────────────────────────────────────────────

/** One fact's Item, from the catalog, on its value from the store: generic in K so the two match. */
function FactEntry<K extends FactKind>({ factRef, catalog, stores }: { factRef: { readonly kind: K; readonly id: FactId<K> }; catalog: FactCatalog; stores: FactStores }) {
  const value = stores[factRef.kind].get(factRef.id)
  if (value === undefined) return null
  const { Item } = catalog[factRef.kind]
  return <Item value={value} />
}

/** The facts an item holds, each shown by its kind's Item, with a slot for the Add. */
export function FactList({ refs, label, add }: {
  /** The facts on the list, in order. */
  refs: readonly FactRef[]
  /** The list's accessible name, when nothing on the page labels it. */
  label?: string
  /** The Add region (the kind's Add, at skeleton step 4). */
  add?: ReactNode
}) {
  const catalog = useFactCatalog()
  const { stores } = useVault()
  const [open, dispatch] = useReducer(listReducer, LIST_REST)
  const scope = useMemo<FactListScope>(
    () => ({ open, toggle: (ref) => dispatch({ kind: "toggle", ref }), close: () => dispatch({ kind: "close" }) }),
    [open],
  )
  return (
    <FactListContext value={scope}>
      <FactListFrame
        facts={
          <ItemGroup label={label}>
            {refs.map((ref) => (
              <FactScopeProvider key={pathOf(ref)} factRef={ref}>
                <FactEntry factRef={ref} catalog={catalog} stores={stores} />
              </FactScopeProvider>
            ))}
          </ItemGroup>
        }
        add={add}
      />
    </FactListContext>
  )
}

/** FactList's layout (ORGANIZATION.md §11): two slots, the facts and then the Add. FactList fills
    it with its entries; a Wireframe fills it with two placeholders. */
export function FactListFrame({ facts, add }: {
  /** The facts on the list. */
  facts: ReactNode
  /** The Add region. */
  add?: ReactNode
}) {
  return (
    <div data-slot="fact-list">
      {facts}
      {add}
    </div>
  )
}
