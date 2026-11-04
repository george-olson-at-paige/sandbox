# Maturity levels for UI and TypeScript parts (draft, 2026-10-29)

Draft for STACK-REVIEW S-16. It applies to the spike now. The main session lands it as `docs/ui-maturity.md`, with a line in `agents/product-engineering.md`, when George approves it.

## The problem

Today every part carries the full bar from its first commit: a story per state, a play for every behaviour story (R17-12), a11y, docs, catalog entries. That is right for finished work and wrong for a prototype.

- A sketch that takes an hour carries a day of tests.
- When the requirement changes (it will: we're still in requirements), the tests are rewritten with it, or they hold the wrong structure in place.
- The stack pass showed it: level-2 plays were written on a structure (`PeopleStack`, `StackEntry`, `StackAdd`) that was then replaced (S-09…S-13). Four of them broke the next day on a rule change (S-05).

The C# side solved the same problem with levels (`docs/code-comments.md`, `docs/module-documentation-guide.md`): a module declares a doc, test and packaging level, and its module level is the lowest of the three. These levels follow that model, cut for parts that are still being found.

## The levels

A **part** is a component, a TS module (a kind, a rule set, the list state machine), or a pattern made of them. Each part declares one level. What it must carry is set by the level, no more and no less.

| | **0 · Sketch** | **1 · Shaped** | **2 · Approved** | **3 · Hardened** |
|---|---|---|---|---|
| **Means** | exploring a question | George approved the direction (parts, composition, rules) | George approved the behaviour and the look | ready to port to the real app |
| **Lives in** | `labs/` | its layer folder | its layer folder | its layer folder |
| **Types** | typechecks | final shape: unions on `kind`, kinds from the registry, no `any` | as 1 | the full [TS bar](TS-BAR.md) |
| **Rule tests** (node) | none | one per approved rule | as 1, plus edge cases | every rule, every failure kind, type tests; hermetic |
| **Stories** | as many as help; any names | one per state (R17-21 names); a layout or `areas/` part also has a Wireframe (its frame filled with placeholders, ORGANIZATION.md §11) | as 1 | as 1 |
| **Plays** | none | none required | every behaviour story (R17-12), `--a11y` | as 2, plus failure paths |
| **Docs** | a header saying what question it answers | header: what it is, which decisions shape it | plus the guide row (`CLAUDE.md`, catalog) | guarantees, non-goals and failures on every export |
| **Who may use it** | nothing outside `labs/` | stories; parts at level ≤ 1 | any part | the real app |

**A part's level is the lowest of its parts' levels.** A level-2 composite over a level-1 rule set is level 1, the same min rule as the C# module level.

**Each level adds to the one below.** Level 2 carries everything level 1 does.

## Declaring and enforcing

- **Components:** a Storybook meta tag, `level-0` … `level-3`, beside the tracking tags already there (R17-13).
- **TS modules:** `@level N` in the file's header comment.
- **The checks** (to build, small):
  - `check:levels` fails when a part imports a lower-level part outside its allowance, when a non-`labs/` file is level 0, or when a file has no level.
  - `run-plays` runs level 2 and up by default (`--level 0` to run everything).
  - Lint keeps the TS-bar rules as errors for level-3 files and warnings below.
  - The catalog shows each part's level.
- **Storybook:** `labs/` is its own sidebar section (**Labs**), so a reviewer always knows when they're looking at a sketch.

## Moving between levels

- **Up is George's call**, recorded as a decision in the pass's review file (STACK-REVIEW, REVIEW-nn). The review statuses line up: *approved* (direction) → level 1; *built* + *verified* → level 2; hardening is its own scheduled pass → level 3.
- **Moving up is when the cost is paid.** Write the tests and plays the new level requires in the same change that raises it, not before.
- **Down is allowed and normal.** When a requirement change replaces a part's structure, it drops to the level the new direction has reached. Its plays stop gating instead of being patched to fit a design that's going away. Say so in the review file.
- **Removing a part is a decision too:** record what replaced it.

## For agents

1. **Work at the level you were asked for.** New exploration starts at level 0 in `labs/` unless the brief says otherwise.
2. **Don't add what the level doesn't require.** Plays on a sketch slow the next change; leave them out.
3. **Don't raise a level yourself.** Propose it with what the new level would add, and build it when George says yes.
4. **Never weaken a higher-level part to make a sketch work.** Sketch beside it in `labs/` instead.
5. **Report the level of what you hand back,** and what the next level would take.

## Applied to the spike today (a proposal, not yet tagged)

| Part | Level now (by what it carries) | Proposed |
|---|---|---|
| Admin, forms, shell, templates, components (REVIEW-1…17) | 2 | 2; hardened per part when the real app needs it |
| `stack-rules.ts` | 1 (node tests on approved rules; loose types) | 1; becomes `packages/facts` at 1, rising with each approved kind |
| `PeopleStack`, `StackEntry`, `StackAdd` | 2 (full plays) | **0**: replaced by S-09…S-13; keep until FactList reaches 1, then remove |
| `PersonPicker`, `QuickAdd`, `PersonAddForm`, `RemoveDialog` | 2 | 1 until `PersonAdd` and the remove scopes are approved |
| `FactItem` | 2 | 2; its state and expand (S-09) are a change to a level-2 part, so they carry plays when approved |
| `packages/facts`, `FactList`, the Vault, Area, Section and Fact providers | — | start at 0 in `labs/`; 1 when George approves the skeleton |
