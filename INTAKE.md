# Intake: bringing UI in from elsewhere (draft, 2026-10-30)

Draft for George. It applies to the spike now; it lands as `docs/ui-intake.md`, with a line in `agents/product-engineering.md` § 6 (Reuse, then compose), when approved. Companion to [`LEVELS.md`](LEVELS.md): the checkpoints here are where a part earns its levels.

> **George, 2026-10-30: "that looks right, and we can adjust if needed."** The process below is the one to work by; the recommendations in § Decisions stand until he changes one. On the first application, the auth pages: they exist in the Vue webapp, and **none of that code, structure or copy crosses**; the legacy pages give the general look and feel and the intent, and the pages are then built properly here. The spike is becoming vNext.

## The problem

Three kinds of thing arrive from outside, and none of them is ours as it stands:

- **Code**: a shadcn/ui block, a component from another registry, a snippet from another codebase. It wants to come in as a file.
- **A screen**: a page of the legacy webapp (Vue). It wants to be translated.
- **A spec**: a screen in the prototype tag, a design, a reference site. It wants to be copied.

Without gates each one does a known kind of damage: a second Button beside ours (REUSE.md § 1), a Base UI primitive beside Radix, `tailwind-variants` beside `cva`, legacy copy treated as spec, a layout nobody approved holding content nobody asked for, a registry token in a commit. The checks (`npm run check`) catch some of it after the fact. Intake puts a checkpoint before each kind of damage, and says who passes it.

## What arrives, and what it is to us

| Source | Brings | Treated as | Fetch with |
|---|---|---|---|
| **shadcn/ui** (ui.shadcn.com): a component or a block (`login-01`, `sidebar-07`…) | code on our stack (Radix, cva, new-york) | a component is a **base**; a block is a **composition to take apart**, never a file to keep | `npm run ui:add -w packages/ui -- <name>` (servers stopped, then `npm ci`; `CLAUDE.md` § How to add) |
| **Another shadcn-compatible registry** (shadcn.io, Origin UI, Kibo UI…) | code on a neighbouring stack: Base UI by default, `tailwind-variants`, its own preset's `data-*` variants, its own `cn`, sometimes its own Button | a **sketch at level 0**, never a base | `npm run ui:intake -w packages/ui -- <url>` → `src/labs/intake/<name>/`; not the CLI, nothing installed, nothing in `src/base`. The "npm dependencies wanted" line it prints is read against `packages/ui/STACK.md`: a tool the stack already has a peer for is replaced at Conform, never installed (`check:deps` fails on the excluded ones) |
| **The legacy webapp** (`src/web/Paige.Webapp/src/pages/*`) | the general look and feel, the intent, which states exist, the API calls a route makes | **intent, not spec** (product-engineering rule 5); its code, structure and copy stay behind (George 2026-10-30) | read it; `/paige-analyst-inventory` for the route's API facades; the API slice is the contract |
| **The prototype tag** (`core/vX.Y.Z` in `paige-prototypes`) | the experience: layout, look, copy | **the spec** for anything a person sees; a difference goes to Product | read the tag; cite screen + tag in the review file |
| **A design or a reference** (Figma, a screenshot, a site) | a look | **a proposal** to Product, not a source | a screenshot in the review file |
| **Our own earlier code** (another worktree, the archived repo) | code | as any registry item: through the same gates | copy, then the gates |

A block from any registry is a worked example of a composition, not a part: it is taken apart into the parts it is made of (each mapped in the survey), and the composition itself becomes a template or a page in the app, built from ours.

## The steps and the checkpoints

Six steps; each ends at a checkpoint with evidence and an owner. A step may be a sentence long when the source is small. Nothing skips a checkpoint; a part may be declined at any of them ("absent beats broken", product-engineering § Program sequencing).

### 1. Brief

The product-engineering brief: outcome in user terms, the journey step (`agents/docs/journeys/`), the sources ranked (which wins where: experience from the prototype, technical from Engineering, legacy as intent), scope in and out, done-when.

**Checkpoint 0 · Briefed.** The brief exists and names the sources. For a new screen, George writes or signs it; for a part below a screen, whoever assigns the work.

### 2. Survey (read only)

Read the source and write the **intake table** in the round's review file (`REVIEW-nn.md`). One row per incoming piece (a screen's parts, a block's components, a registry item's files), with a verdict:

| Verdict | Means | Goes to |
|---|---|---|
| **Reuse** | `CATALOG.md` already has it | nothing to build; the row names the part |
| **Wrap** | `src/base` has the base, the Paige layer doesn't | `src/components/<group>` |
| **Add base** | ui.shadcn.com has it and we don't | `src/base` through `ui:add`, then Wrap |
| **New part** | nothing of ours does the job | its layer and archetype named (`ARCHETYPES.md` § 2, `CLAUDE.md` § Layers) |
| **Story helper** | it only helps explain or stage a story | `src/stories/` (George 2026-10-28: scaffolding stays out of components) |
| **Out** | not ours: decoration the prototype doesn't show, a product decision, a Pro item, an incompatible licence | the row says why |

For code, the survey also lists: npm dependencies and registry dependencies (what else it pulls in), the primitive library it assumes, the CSS variables and variants it expects, the files it writes, the licence, the version or commit, and anything it overwrites. For a legacy screen: its states, its copy, the API calls (`/paige-analyst-inventory`) and the API slice that answers them (for auth, `Paige.Application/Accounts/*`); what the API can't express goes to `API-NEEDS.md`. For the prototype: the screen's slots and how they stack at phone width.

**Checkpoint 1 · Named.** Every piece has one row and one verdict; no "we'll see". George approves the map for a screen (this is the *direction* approval that LEVELS.md's level 1 asks for); the integrator may pass it for a single part below a screen.

### 3. Frame (before any content)

A screen or a layout part is framed first, the way Setup › Welcome is: a `<Name>Slots` type naming every slot, a `<Name>Frame` that places them (built from our templates and primitives), and two fillings of the same frame: `wireframe` (measured `Placeholder`s, `src/stories/placeholder.tsx`) and `content`. Stories: **Wireframe** at 1280, **Desktop**, **Phone** (375, `!autodocs`). The header says how the columns stack and what is never reordered. The docs page then reads top down: the anatomy with its names and sizes, then the real thing. ORGANIZATION.md § 11 has the reasoning ("one frame, two fillings"; the wireframe can't drift from the page because it *is* the page).

A new page template or a new folder is a foundation change (`CLAUDE.md` § How to add, product-engineering order step 3): the Frame step stops and asks before building one.

**Checkpoint 2 · Framed.** George approves the layout from the Wireframe at 1280 and 375. Nothing is styled yet; nothing is wired.

### 4. Land

Code arrives raw, where its level allows:

- a ui.shadcn.com **base** into `src/base` through `ui:add` (and only there; it is never edited afterwards beyond import paths);
- anything else into **`labs/`** at level 0, under its own folder, as the registry wrote it;
- a **legacy or prototype screen** is not translated line by line: it is rebuilt from our parts inside the approved Frame, in `labs/` if the parts are still being found, in its layer folder if they exist.

Every landed file gets its header: `@archetype` first (the vocabulary check needs it), then **`@from`** (the provenance line, below), then what it is.

**Checkpoint 3 · Landed.** It typechecks; it carries `@from`; nothing outside `labs/` (or outside stories) imports it yet. `check:layers` FOLDER and TIER hold.

### 5. Conform

Make it Paige. The list, in the order the checks run:

1. **Imports.** `@/…` and the registry's `cn` → relative paths and `src/lib/utils` (`check:layers` ALIAS). Base UI or a bare primitive → the same part through our base (`check:layers` PRIMITIVE; U-12); a Radix variant of the source where one exists.
2. **Variants.** `tailwind-variants` or hand-rolled class maps → `cva`, with the archetype's axes and words (`check:vocab`, `src/lib/vocabulary.ts`); no retired words (`variant`, `ghost`, `appearance`).
3. **Tokens.** Its CSS variables → `theme.css` roles; geometry onto the scales; no hex, no arbitrary values (`check:tokens`). The `ui:add` would-overwrite report lists the variables a registry item wanted.
4. **Bases, not copies.** A Button, Card, Dialog or Input inside the source becomes ours (`check:reuse`, REUSE.md § 2 "same job" list).
5. **Copy.** Every word into a messages map (`forms/messages.ts` or the slice's own); legacy or registry copy is marked as the spike's until Product's lands (the GAPS #94 pattern). A legacy screen's copy is intent, not text (George 2026-10-30, REVIEW-18 R18-26): write ours to the frame's measure — a title that says what the page is for, a lede of one line, errors as what happened plus one sentence — rather than carry a sentence that throws the card out of balance.
6. **Forms.** Controls inside a `Field`, errors by `name`, the four action states, unsaved-changes guard (`src/forms/README.md`).
7. **States.** Loading, empty, error, success, long or partial content, no permission (product-engineering order step 5), each a story.
8. **Stories and scaffolding.** A story per state; any staging the UI doesn't need is a story helper, never a prop.
9. **Surface.** `node scripts/check-exports.mjs --write`; the app imports only entry points.
10. **Tools.** A library the item brings is either one the stack already uses (`packages/ui/STACK.md` § 1) or replaced by that one (`motion` → CSS, `tailwind-variants` → `cva`, `date-fns` → `Intl`, Base UI → Radix); a genuinely new job gets a STACK.md row before `npm install` (`check:deps`).

Every change from the source is one line under `@from` (`changed:`), so the next upstream version can be re-applied by reading the header, not by diffing memory. For a ui.shadcn.com base there is nothing to list: `ui:diff-base` is the record.

**Checkpoint 4 · Conformed.** `npm run typecheck` and `npm run check` clean; stories per state exist; the `changed:` lines are complete. The part moves to its layer folder at **level 1** (LEVELS.md) with George's direction approval already recorded at Checkpoint 1 (or renewed here if the survey's map changed).

### 6. Prove

Plays on every behaviour story, `run-plays --a11y`; phone width and keyboard only; for a screen, the walking skeleton in the app on real data behind auth, at desktop and phone width, screenshots in the review file; `npm run catalog`, the `CLAUDE.md` row, the audit regenerated.

**Checkpoint 5 · Approved.** George approves behaviour and look; the review row goes *built* → *verified*; the part is **level 2**. Hardening to level 3 is its own scheduled pass, never part of intake.

### At a glance

| # | Checkpoint | Pass when | Who | Level after |
|---|---|---|---|---|
| 0 | Briefed | outcome, journey step, ranked sources, scope | George (a screen) · the assigner (a part) | — |
| 1 | Named | every piece has a row and a verdict; dependencies, licence, states, API calls listed | George (a screen) · the integrator (a part) | eligible for 1 |
| 2 | Framed | Wireframe approved at 1280 and 375; no new template without a yes | George | — |
| 3 | Landed | typechecks; `@from` header; nothing outside `labs/`/stories imports it | the integrator | 0 |
| 4 | Conformed | typecheck and `npm run check` clean; stories per state; `changed:` complete | the integrator; George if the map changed | 1 |
| 5 | Approved | plays and `--a11y` pass; walked in the app; screenshots; catalog and guide row | George | 2 |

## Provenance: the `@from` line

Second line of the header, after `@archetype`:

```
/* @archetype Frame (ARCHETYPES.md).
   @from shadcn.io/ui/radix/guides · 2026-10-30 · MIT.
   changed: tailwind-variants → cva; --border → border-border; `cn` from lib/utils; data-* variants → our tokens.
   … what it is, which decisions shape it … */
```

`@from` names the source well enough to fetch it again (site and path, a registry URL, a repo and commit, a prototype tag and screen, a legacy route), the date or version taken, and the licence. `changed:` lists what we did to it, one clause per change. A legacy or prototype rebuild says `@from Paige.Webapp pages/auth/signin.vue (intent) · prototype core/v0.9.2 auth/sign-in (spec)`. Nothing enforces it yet (I-03 below proposes `check:intake`, small: a file whose header names a registry or a legacy path without `@from` fails).

## Per-source notes

**A ui.shadcn.com item.** The procedure in `CLAUDE.md` § How to add (servers stopped, `ui:add`, `npm ci`, a Base story, never edit the file). A block is taken apart: its components are Reuse/Wrap/Add base rows; its layout is a Frame; its copy is placeholder. `ui:diff-base` is the provenance.

**A third-party registry item** (shadcn.io and the like):
- The install command carries the account's **token in the URL**. It never lands in a commit, a script or a doc; if we adopt a registry, it goes in `components.json` `registries` with the token from an environment variable, like any credential. **Unmanned runs** never handle the token at all: an agent working alone stops at the item and asks. In a **manned session** George may paste the install URL into chat and the agent runs `ui:intake` with it (George 2026-10-30: "the rule is only for unmanned"); the script never prints the URL back. Better still, the **secret entry**: George puts the install URL (or the bare token) in a file outside the repo (`%USERPROFILE%\.paige\shadcn-io.url`) and the agent runs `ui:intake … --from-file <path>`; the secret never passes through chat or a shell line, and the script refuses a file inside the repo.
- It lands with **`npm run ui:intake -w packages/ui -- <url>`** (`scripts/ui-intake.mjs`), not the shadcn CLI: the script fetches the item's registry JSON and writes its files into `src/labs/intake/<name>/` under an `@from` stub, imports made relative, and prints the npm dependencies, registry dependencies and CSS variables the item wanted. Nothing is installed (the CLI would npm-install its stack while servers hold `node_modules`, GAPS #111) and nothing touches `src/base` or `components.json`. `check:tokens` counts `labs/intake` as upstream code — shown, not failing — until Conform.
- Its stack is not ours: Base UI (the Radix build is at `/r/radix/<name>.json` where one exists), `tailwind-variants`, a preset with its own CSS variables and `data-*` variants, its own `cn` package and its own Button. It lands in `labs/`, never over `src/base`, and Conform replaces each of these.
- Licence per item; **Pro items are Out.** MIT or equivalent is recorded in `@from`.
- There is no `diff-base` for it; `@from` + `changed:` is the record, and a re-sync is a fresh land in `labs/` compared by hand.
- A decoration-only item with no behaviour and no accessibility surface may become a **story helper** without reaching a layer.

**The legacy webapp.** The route's API calls from `/paige-analyst-inventory`; the API slice is the contract (`Paige.Application/<slice>/*`), and `API-NEEDS.md` takes what it can't say. Legacy copy and legacy states are intent: the spec's states still have to exist even when the old page had none, and a legacy behaviour the prototype doesn't show is a difference for Product, not a requirement.

**The prototype.** The tag is the spec. Its CSS reaches us only as token values through `theme.css`, never as classes copied into a part. Thinner than the prototype is unfinished, not decided.

**A design or a reference.** It enters the review file as a screenshot with a sentence on what it shows better; Product accepts or rejects it before anything is built from it.

## How a part explains itself

Setup › Welcome is the bar for a layout's docs page: the Wireframe (names, sizes, stacking) and then the content, the same frame twice, so the anatomy can't drift. Two things from shadcn.io's catalogue bear on this:

- **Guides** (`shadcn.io/ui/guides`, "layout guides drawn like a technical plan": lines in the border colour that run past corners, bleed to the edges, hatched or dotted gutters, a mark at each crossing; decoration only, hidden from assistive technology). Drawn around a Wireframe's slots it would make the anatomy read as a plan rather than a stack of grey boxes. It is a **story helper** candidate (`src/stories/guides.tsx`), not product UI unless the prototype shows it: the first run of the third-party path above, and small enough to prove the gates. shadcn.io's own blocks use it as page structure ("one column that runs through every section"); that would be an experience change for Product.
- **Anatomy** (`shadcn.io/ui/anatomy`): a hand-positioned part diagram on a fixed 1200 × 630 canvas with callouts. It can drift from the part it describes, which is what the live frame avoids; a drawn anatomy is for the case where structure can't be shown live (a primitive's internal parts). Not for now.

## Applied next

1. **Guides as a story helper**, the pilot of the third-party path. Survey: one file, decoration only, no primitives; licence and Radix build to confirm; its lines onto `border-border`, its variants onto `cva`. Frame: not a layout, skipped. Land in `labs/`, Conform, then `src/stories/guides.tsx`; Welcome's Wireframe adopts it as the first user. A day, and the gates are exercised once before the auth work needs them. **Done 2026-10-30 through Checkpoint 4** (REVIEW-18 § Guides): landed with `ui:intake --from-file`, conformed to `src/stories/guides.tsx` + `guides.css` (no `cva`: it has no variants in the archetype sense, only class maps on its own words), Welcome's Wireframe wears it via Placeholder's `plan`; Checkpoint 5 is George's.
2. **The auth pages** (journey 01, `agents/docs/journeys/01-register-and-onboard.md`). Sources, ranked: the prototype tag's auth screens (spec; to confirm which exist); `Paige.Application/Accounts/*` (Login, Register, ForgotPassword, ResetPassword, ChangePassword…) as the contract; the legacy `pages/auth/*` (signin, register, verify-email, confirm-email, confirm-password, reset-password, mfa, accept-invite, confirm-delegate / document / memory, cancel) as intent; shadcn/ui's `login-0n` / `signup-0n` / `otp-0n` blocks as compositions to take apart for their parts. Checkpoint 0 is the brief; Checkpoint 1 is the intake table; the Frame step is where an auth page template is proposed, which is a foundation change and so stops at Checkpoint 2 for George. **Through Checkpoint 2 and built at level 1, 2026-10-30** (REVIEW-18 § Step 4–5): the frame landed in `labs/` first, George settled the intro and the fixed top in conversation, then "let's finish that up by adding the rest of the auth views"; `templates/auth-page.tsx`, nine views as stories in the new `src/auth/` layer, two tokens, two forms refinements. George's rule for the copy, now a Conform step: the legacy strings are not the bar — *"the copy throws them out of balance, so we don't need these to be exactly the same"*; write ours from the journey and keep the card in balance. Level 2 is his call.
3. **Files: Attachment, Toast, and the document in flight** (REVIEW-19, 2026-10-30). Sources, ranked: George's words in conversation as spec (the Setup card is a facade for a service, its pill goes to "reading…" then the result; the wait lives in a toast that is *"persistent until navigated away or dismissed"*, the error too; *"this can be our files/attachment components"*); the legacy `uploadProgress.ts` and Vault document entries as intent (`uploading` until the server says stored, `reading` until complete; "We couldn't read this one"); ui.shadcn.com `attachment` and `sonner` as bases (Checkpoint 1 passed in conversation; shadcn's Base UI `toast` out by I-02). Frame: no new layout, skipped. **Built at level 1 the same day** (REVIEW-19 § Step 4–5): two bases through `ui:add`, three theme utilities the `attachment` base expects (`shimmer`, `scroll-fade-x`, `scrollbar-none`), `lib/file-kind.ts`, `FileIcon`, `Attachment` (+ `AttachmentAction`), `Toast` (`Toaster`, `toast`, `attachmentToast`), one story per state, 21 plays, checks clean. The part is **Toast**, not Sonner (R19-05). Level 2 and the Setup card's own round are George's.
4. **The list** (REVIEW-20, 2026-10-31): George's ~30 items in one message — fixes (the circle checkbox, menus without icons, monotone fixture series, InlineEdit's inline actions, EmptyState's sizes), groups (shadcn `button-group`, an icon ToggleGroup, the DagFrame header), small parts (shadcn `breadcrumb`/`hover-card`; ReUI `file-type`, `timeline`, `sortable`; a password strength part), the data grid (extend DataTable on TanStack v8 with ReUI's grid as a reference, recommended), and Rocket's observability set. **Surveyed, nothing fetched** — ReUI is MIT and registry-public; its demos (`c-…-n`) are compositions of shadcn's own bases; its `data-grid` is TanStack **v9** + Base UI scroll area; Rocket is public but **has no licence anywhere we could find** (D-01). Rounds A–E ordered; Checkpoint 1 is George's. **Rounds A–C built at level 1 the same day** (REVIEW-20 § Round A/B/C — built) by delegated agents on disjoint files with the chat verifying and reconciling: the fixes; `button-group`, `breadcrumb`, `hover-card` through `ui:add`; ReUI `file-type`, `timeline`, `sortable` through `ui:intake` and *moved* out of `labs/intake/` at Conform (FileIcon, Timeline, Sortable); PasswordStrength and Formatted written from the descriptions. Rounds D–E and level 2 are next; D-01 still gates Rocket's code.

## Decisions for George

| # | Decision | Recommendation |
|---|---|---|
| I-01 | The six checkpoints as written, or Frame folded into Survey | As written: the Frame approval is the one George said he values on Welcome, and folding it loses the "nothing styled yet" moment |
| I-02 | Third-party registry items always land in `labs/` first, never `src/base` | Yes; `src/base` stays ui.shadcn.com only, so `ui:diff-base` stays truthful |
| I-03 | `@from` required on every file that came from elsewhere, with a small `check:intake` later | Yes; convention now, check when the second intake lands |
| I-04 | Guides: a story helper only, not product decoration | Yes, unless the prototype shows plan lines |
| I-05 | Who passes Checkpoint 1 for a part below a screen | The integrator; George for screens and for anything that adds a base |
| I-06 | The record: one `REVIEW-nn.md` round per intake, or a running `INTAKE-LOG.md` | A round per intake (the rounds are the deliverable, README) |

## For agents

1. **Find the source's kind first** (the table above) and treat it as that: intent, spec, base, or sketch. Never as a file to keep.
2. **Survey before fetching.** The intake table comes before `ui:add` or `ui:intake`; a fetch with no table is a finding.
3. **Frame before content.** For a screen, the Wireframe story is the first thing George sees.
4. **Land in `labs/` unless it is a ui.shadcn.com base.** Conform there; move on the level's terms (LEVELS.md).
5. **Write `@from` and `changed:` as you go**, not at the end.
6. **Stop at the foundation gates**: a new template, a new folder, a new base while servers run, a registry token in a commit, script or doc. Unmanned: a token-gated item is a stop; manned: George pastes the URL, `ui:intake` runs with it and never echoes it.
7. **Report the checkpoint you reached**, the evidence, and what the next one needs.
