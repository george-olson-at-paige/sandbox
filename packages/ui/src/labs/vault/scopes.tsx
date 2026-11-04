"use client"

/* @level 0 — sketch (LEVELS.md). The scopes above a fact list (S-10), each a provider its
   children read instead of props passed down: Vault → Area → Section. FactList and Fact are
   the two below (fact-list.tsx). Each hook throws outside its provider, so a part used in the
   wrong place fails at once instead of rendering with a guess.
   - Vault: the stores, one per kind (S-12); high in the tree and shared by every list on it.
   - Area: the page's Area; also sets `data-area` for the area colours, as AreaPage does.
   - Section: the item a list sits in — its title, how the list is named, the role it states. */
import { createContext, use, type Context, type ReactNode } from "react"

import type { AreaId } from "../../icons/area-glyphs"
import type { FactStores } from "../facts/stores"

/** Reads a scope's context, or throws naming the provider the caller is missing. */
function useScope<T>(context: Context<T | null>, provider: string): T {
  const value = use(context)
  if (value === null) throw new Error(`${provider} is missing above this part.`)
  return value
}

// ── Vault ───────────────────────────────────────────────────────────────────────────────────────

export type VaultScope = { readonly stores: FactStores }
const VaultContext = createContext<VaultScope | null>(null)

/** The Vault: where every fact's value lives. Put it high (the app root); every list reads it. */
export function VaultProvider({ stores, children }: { stores: FactStores; children: ReactNode }) {
  return <VaultContext value={{ stores }}>{children}</VaultContext>
}

export const useVault = (): VaultScope => useScope(VaultContext, "VaultProvider")

// ── Area ────────────────────────────────────────────────────────────────────────────────────────

export type AreaScopeValue = { readonly area: AreaId }
const AreaContext = createContext<AreaScopeValue | null>(null)

/** One Area page's scope; also sets its colours (`data-area`). */
export function AreaScope({ area, children }: { area: AreaId; children: ReactNode }) {
  return (
    <AreaContext value={{ area }}>
      <div data-area={area} className="contents">
        {children}
      </div>
    </AreaContext>
  )
}

export const useArea = (): AreaScopeValue => useScope(AreaContext, "AreaScope")

// ── Section ─────────────────────────────────────────────────────────────────────────────────────

export type SectionScopeValue = {
  /** The item's title, in the owner's words. */
  readonly title: string
  /** How the list is named in a sentence ("the people who depend on you"): Take {name} off {this}. */
  readonly listLabel: string
  /** The role the item states, as the API's key (`emergency`), when it states one. */
  readonly role?: string
}
const SectionContext = createContext<SectionScopeValue | null>(null)

/** One item's scope on an Area page: what its list is for. */
export function SectionScope({ children, ...section }: SectionScopeValue & { children: ReactNode }) {
  return <SectionContext value={section}>{children}</SectionContext>
}

export const useSection = (): SectionScopeValue => useScope(SectionContext, "SectionScope")
