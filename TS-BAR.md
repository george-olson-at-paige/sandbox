# The TypeScript bar (draft, 2026-10-29)

Draft for STACK-REVIEW S-15. It applies to the spike now. The main session lands it as `docs/typescript.md` when George approves it. The bar is what a part must meet at **level 3** ([LEVELS.md](LEVELS.md)); lower levels meet the parts LEVELS.md names.

Reference: George's `C:\temp\typescript-foundations` (Kuno): the `time`, `clone` and `list` modules, and `docs/modules` (aspects, touch points, variants, kinds, plugins). We take its extension model and its documentation habit. We leave its heavy type-level code to one place (the registry type), because type cleverness is itself a maintainability cost.

## Why now

The spike started as a component test pass and has become the pattern other work copies. The fact catalog (people, pets, records, documents, and the rules for each) will keep growing. The spike is `strict` and otherwise loose:

- kinship is a bare `string`;
- caps, the book and contacts travel as props;
- unions are local to each file;
- `ActionResult` is `void | { error: string }`, so "succeeded" and "forgot to return" look the same.

None of this is careless. What's missing is a model you extend without editing the code that uses it.

## 1. The model lives outside the UI framework

The fact model is a package with no React and no DOM: `packages/facts`. It holds:

- ids;
- the kind registry;
- each kind's value and states;
- the rules (caps, pick mode, fields);
- the list's behaviour as a pure state machine: the one open thing, struck entries with Undo, what to commit on leave.

React holds that state in context and draws it; it decides nothing.

- **Why.** Rules are then proved with node tests at memory speed, the same model can back any future screen technology, and a rule can't be re-derived inside a component.
- **Vocabulary** matches the C# people model (`src/model/Paige.Model`: kinship, role, group). Where the two disagree, that is a finding to raise, not a local rename.
- **Dependency direction:** `@paige/ui` imports `@paige/facts`, never the reverse. A check enforces it.

## 2. Kinds: discriminated unions, inferred, extended in place

Every value that comes in variants carries a `kind` (the discriminant, a short lowercase key) and is a union. There are no boolean flag pairs, no optional fields that mean "if this is set, it's the other variant", and no `type: string`.

Kinds are **never listed by hand**. One registry interface is the source; each kind's module extends it:

```ts
// facts/src/kinds.ts — the core: empty, extended by each kind's module.
/** Every fact kind, keyed by kind, valued by that kind's value. */
export interface FactKinds {}

/** A fact kind's key. */
export type FactKind = keyof FactKinds & string

/** A fact of kind K: its id, its kind, its value. Narrow on `kind`. */
export type Fact<K extends FactKind = FactKind> = {
  [P in K]: { readonly id: FactId; readonly kind: P; readonly value: FactKinds[P] }
}[K]
```

```ts
// facts/src/person/kind.ts — one kind, in its own module.
declare module "../kinds" {
  interface FactKinds {
    person: PersonValue
  }
}

export const person = defineFactKind("person", {
  caps: personCaps,
  fields: personFields,
})
```

The runtime catalog is **an explicit value, not a side-effect registry**. Kuno's plugins register by import side effect; we don't, because import order becomes hidden state and tests can't build a catalog of their own. Typing it as a mapped type makes adding a kind without defining it a **compile error**:

```ts
/** One definition per kind. Missing one fails the type check. */
export type FactCatalog = { readonly [K in FactKind]: FactKindDefinition<K> }

export const catalog = { person, pet } satisfies FactCatalog
```

UI parts follow the same shape: `FactList` looks up `catalog[fact.kind]` and never names a kind.

## 3. Exhaustive by construction

Every `switch` on a `kind` handles every case and ends in `assertNever`:

```ts
/** Unreachable: the switch above handled every kind. A new kind fails the build here. */
export function assertNever(value: never): never {
  throw new FactError({ kind: "unreachable", value })
}
```

Lint enforces it: `@typescript-eslint/switch-exhaustiveness-check` (needs type-aware lint, §8).

## 4. Prefer marks that exist at runtime; brand only what has none

A brand is erased at build: it proves nothing about a value at runtime. Prefer a mark that is real data (S-20, George 2026-10-29):

- **Kinds are string literals on a `kind` field.** They exist at runtime, cost no allocation (literals are interned, and same-shaped object literals share the engine's hidden class), and serialise across JSON, server → client props, `structuredClone` and storage. Not symbols: symbols don't serialise (`structuredClone` throws on them, JSON drops them), and the uniqueness they'd add is already the compiler's (a misspelled kind doesn't compile). Not classes: an instance per value is an allocation and a prototype for nothing.
- **A value that can carry its kind does.** The catalog's paths already do (`contact/{id}/kinship`):

  ```ts
  export type ContactPath = `contact/${string}`
  /** No allocation: a prefix test. */
  export const isContactPath = (p: string): p is ContactPath => p.startsWith("contact/")
  ```

- **Brand only an opaque value with no mark of its own** (a GUID that could be a contact's or a fact's), and the units that share a primitive: `ContactId`, `FactId`, `VaultId`, `IsoDate` (it exists already, R17-02) and `Cents`.

```ts
export type Brand<T, B extends string> = T & { readonly __brand: B }
export type ContactId = Brand<string, "ContactId">
```

A brand is created in exactly one place, the boundary that receives the raw value (the API adapter, the fixture builder). That is where its `as` lives (§6).

## 5. Readonly, immutable values

- Exported types are `readonly` (fields and arrays: `readonly T[]`).
- State changes return a new value; the list's state machine is a pure `(state, event) → state`.
- Nothing a rule receives is mutated.

## 6. No escapes outside a named boundary

These are not used except in a file or function whose header names it as a boundary and says why:

- `any`;
- `as` (except `as const` and `satisfies`, which aren't escapes);
- non-null `!`;
- `@ts-expect-error`.

A boundary is where untyped data enters: an API response, storage, a third-party callback. It validates and brands there, and everything inside is typed. Lint enforces: `no-explicit-any`, `no-non-null-assertion`, `consistent-type-assertions` (`assertionStyle: "never"`, relaxed for boundary files).

## 7. Results and failures are kinds too

An operation that can fail returns a discriminated result, never `void | { error }` and never a bare boolean:

```ts
export type Result<T, E extends { readonly kind: string }> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export type AddPersonError =
  | { readonly kind: "network" }
  | { readonly kind: "rejected"; readonly field: ContactFieldKey; readonly reason: string }
  | { readonly kind: "full" } // a cap reached between open and save
```

The words a person reads come from the error's kind in the UI layer, not from the model. A thrown error is for a broken invariant (a bug), carries a `kind`, and is never caught just to keep going (catch, log and return false hides the bug).

## 8. Compiler and lint

`packages/facts` uses the spike's `strict`, plus:

| Option | Why |
|---|---|
| `noUncheckedIndexedAccess` | `caps[kind]` is `number \| undefined`; a missing entry can't pass as a number |
| `exactOptionalPropertyTypes` | `{ role?: Role }` means absent, not `undefined` written in |
| `verbatimModuleSyntax` | type-only imports stay type-only; nothing is dragged into the runtime |
| `noImplicitOverride`, `noFallthroughCasesInSwitch` | cheap, and they catch real mistakes |

Lint is type-aware (`tseslint.configs.strictTypeChecked`) for `packages/facts`. `@paige/ui` moves to it per part as parts reach level 3 (a whole-package switch would stall on GAPS #149-class rework).

## 9. React parts over the model

- **Props that change shape by state are a union on `kind`.** `StackEntryState` already is; `ActionResult` and `quickAtRest`-style booleans are not.
- **One provider per scope** (Vault → Area → Section → FactList → Fact, S-10), each with one hook that throws a typed error outside its provider (`useFactList()`), and a typed, memoised value.
- **A component never switches on a fact kind.** It asks the catalog.
- **Copy stays in components** (they own the words); keys stay the API's.

## 10. Documentation

Every export has a one-line summary. Anything with behaviour also says:

- **Guarantees**: what always holds (as Kuno's `list` states: deterministic, lazy, doesn't change its input, can be re-run).
- **Non-goals**: what it deliberately doesn't do (as `clone` does).
- **Failure**: which error kinds it returns or throws, and when.

The depth follows the C# doc levels (`docs/code-comments.md`): level 3 is "hardened baseline", every failure mode named.

## 11. Tests

- **Rules and the state machine:** node tests in `packages/facts`, one file per kind and one per concern (as Kuno's `time` has one per clock), deterministic and hermetic.
- **The test stand-in is a real implementation.** An in-memory contacts store implements the same contract as the API adapter (Kuno's `ManualClock`), not a mock.
- **Types are tested too.** Assertions that must fail to compile (`// @ts-expect-error` inside a type-test file only) prove that adding a kind without its definition breaks, and that a `ContactId` can't be passed as a `FactId`.

What each level requires of these is in [LEVELS.md](LEVELS.md).
