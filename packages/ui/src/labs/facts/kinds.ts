/* @level 0 — sketch (LEVELS.md). Becomes packages/facts when the skeleton is approved (S-15).
   The fact model's kind registry (TS-BAR §2): no React, no DOM.
   - `FactKinds` is empty here; each kind's module adds itself by module augmentation
     (people/kinds.ts), so this file never lists a kind and never changes when one is added.
   - A kind's entry is its value type, and every value carries its own `id`.
   - A list holds `FactRef`s (kind + id), not values: values live in the Vault's stores (S-12). */

/** Every fact kind, keyed by kind, valued by that kind's value. Extended by each kind's module. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- filled by module augmentation
export interface FactKinds {}

/** A fact kind's key: a string literal, present at runtime on every ref (TS-BAR §4). */
export type FactKind = keyof FactKinds & string

/** The value of kind K. */
export type FactValue<K extends FactKind> = FactKinds[K]

/** The id type of kind K, read from its value's `id`. */
export type FactId<K extends FactKind> = FactKinds[K] extends { readonly id: infer I } ? I : never

/** A reference to one fact of kind K: what a list holds. Narrow on `kind`. */
export type FactRef<K extends FactKind = FactKind> = {
  [P in K]: { readonly kind: P; readonly id: FactId<P> }
}[K]

/** A fact's address as a string, kind first (`contact/c1`): a key that carries its kind at runtime. */
export type FactPath = `${FactKind}/${string}`

/** The ref's path: a stable key for React lists and for comparing refs. */
export const pathOf = (ref: FactRef): FactPath => `${ref.kind}/${String(ref.id)}` as FactPath

/** Unreachable: a switch handled every case. A new case fails the type check where this is called. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}
