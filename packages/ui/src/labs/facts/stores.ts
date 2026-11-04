/* @level 0 — sketch (LEVELS.md). Where values live (S-12): one store per kind, behind one
   contract. The in-memory store is a real implementation of that contract (TS-BAR §11, as
   Kuno's ManualClock), used by stories and tests; the API adapter will be another. */
import type { FactId, FactKind, FactValue } from "./kinds"

/** Read access to one kind's values. Writes (add, delete) come with the Add (skeleton step 4). */
export type FactStore<K extends FactKind> = {
  /** The value with this id, or undefined when the store has none. */
  readonly get: (id: FactId<K>) => FactValue<K> | undefined
  /** Every value, in the store's order. */
  readonly list: () => readonly FactValue<K>[]
}

/** One store per kind. A kind without a store fails the type check. */
export type FactStores = { readonly [K in FactKind]: FactStore<K> }

/** A store over a fixed list: no writes, no allocation per read beyond the lookup. */
export function inMemoryStore<K extends FactKind>(values: readonly FactValue<K>[], idOf: (value: FactValue<K>) => FactId<K>): FactStore<K> {
  const byId = new Map<FactId<K>, FactValue<K>>(values.map((v) => [idOf(v), v]))
  return { get: (id) => byId.get(id), list: () => values }
}
