/* @level 0 — sketch (LEVELS.md). Brands for opaque ids only (TS-BAR §4): a GUID carries no mark
   of its own, so the type keeps a contact's id from passing as a pet's. Created only where raw
   ids enter (a store, a fixture builder). */

/** T, marked B at compile time. Erased at runtime: proves nothing there. */
export type Brand<T, B extends string> = T & { readonly __brand: B }

/** Marks a raw value as B. The one place a brand is created: call it only at a boundary. */
export const brand = <B extends string>(raw: string): Brand<string, B> => raw as Brand<string, B>
