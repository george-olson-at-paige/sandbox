# Paige UI test pass (spike)

This spike builds `@paige/ui` (a Tailwind v4 theme, upstream shadcn bases, a Paige layer over them, forms, patterns, the app shell, the Vault's and the admin site's pieces, and the page templates) and renders prototype screens in a Next.js 16 app from fixtures: the customer screens (persona Maya Reyes) and the admin site. **`GAPS.md` and the REVIEW-*.md rounds are the deliverable.** The package's front door is `packages/ui/CLAUDE.md` (layers, rules, how to add things, traps, checks); the catalog is `packages/ui/CATALOG.md` (R17-14).

Run: `npm install`, then `npm run dev -w apps/web` (http://localhost:3105). Checks, from here: `npm run typecheck`, `npm run lint` (both workspaces), `npm test -w packages/ui`, and `npm run check`, which runs six: `check:tokens` (the token and spacing rules), `check:layers` (the layer order), `check:exports` (the public surface), `check:reuse` (raw buttons say how they focus; arrow keys live in Combobox), `check:vocab` (every component declares its `@archetype` and speaks `lib/vocabulary.ts`; warn mode until the words are decided, `--strict` to fail) and `check:scripts` (every tooling script parses, R17-04). `npm run plays -w packages/ui` runs every story's play against a running Storybook. `npm run audit` regenerates the measured parts of `AUDIT.md` (components: axes, docs shape, stories), `TOKENS.md` (variables, the geometry census, token candidates) and `REUSE.md` (shadcn bases and who inherits them, raw elements and out-of-area signals).

**Quality pass (2026-10-29):** `AUDIT.md` (what the package measures as, findings A-01…A-11) · `ARCHETYPES.md` (the archetypes, the one axis vocabulary, the component mapping, the renames, decisions D-nn) · `TOKENS.md` (the token inventory, the variables to add, the surface model, findings T-nn) · `REUSE.md` (where we inherit shadcn's maintenance and where we built our own; which components draw outside their area; findings U-nn). Proposals, nothing built; the decisions in them are George's. **Process drafts (2026-10-29/30):** `LEVELS.md` (maturity levels 0–3 for parts) · `INTAKE.md` (bringing UI in from elsewhere: six steps, a checkpoint each, provenance `@from`; decisions I-nn).

## Layers

The folders are the layers, lowest first: `lib` · `icons`/`schemas` · `base` (upstream shadcn, not exported) · `primitives` · `components` · `charts` · `forms` · `patterns` · `shell` · `vault`/`admin`/`setup`/`auth` (the four product areas) · `templates`; `fixtures` holds the invented data the stories and the app share (R17-03). Each imports only its own layer or a lower one, and `npm run check:layers` fails otherwise. The table, what goes where and why: `packages/ui/CLAUDE.md` § Layers and `packages/ui/ORGANIZATION.md`.

Routes: `/` (Vault Home; `?as=established` for the Sections banner) · `/area/family` (`?as=grace` for declined rows) · `/area/personal` (FactField states) · `/area/insurance` (partial row) · `/area/household` (first row) · `/setup/roles` (choice-grid beat) · `/setup/about-you` (form beat) · the admin site: `/admin` (Pulse), `/admin/people`, `/admin/partners`, `/admin/billing/plans`, `/admin/billing/subscriptions`, `/admin/billing/promotion-codes`, `/admin/settings`.

## Storybook

`npm run storybook -w packages/ui` serves the component browser on http://localhost:6106 (`npm run build-storybook -w packages/ui` writes a static copy to `packages/ui/storybook-static`, git-ignored). Storybook 10 (React + Vite, Tailwind v4 via `@tailwindcss/vite`) loads `theme.css` and the app's fonts: Montserrat self-hosted from `@fontsource-variable/montserrat`, and the app's own Roboto Slab file. The logo and avatar come from `apps/web/public`.

The sections are the folders (`.storybook/main.ts`; no `title:` in story files), in layer order: Overview, Foundations, Primitives, Components (six groups, plus Charts from `src/charts`, the one folder titled under another section), Forms, Patterns, Shell, Vault, Admin (the lists' page setups under Admin › Pages), Setup, Auth (the door's pages, stories on AuthPage), Templates, Base. Stories sit next to their components as `*.stories.tsx`; Overview › Which section do I use? is the guide. Hover states are forced with the pseudo-states addon. The a11y panel runs axe on every story and reports without failing (`test: "todo"`).

## Which fixture shows which state (R2-46)

No single persona shows every state (GAPS #56). Stories and screen tests pick the fixture from this table, not by habit; a state with no fixture is shown by its story only. Fixtures: `apps/web/fixtures/` (Maya `maya.ts`, Grace `grace.ts`, established `established.ts`). This table belongs in the inventory (`web-component-inventory-2026-10.md`, on the docs branch); it lives here until the branches meet.

| Surface | State | Fixture · route | Story |
|---|---|---|---|
| AreaTile | not started · in progress · set up | Maya · `/` (Household, Family, Personal) | Composites/AreaTile |
| PageIntro (Hero) | with a next step | Maya · `/` | Composites/PageIntro |
| Sections banner | shown, dismissible | established · `/?as=established` | Layouts/Page › Band: the Sections banner |
| ItemRow | open · present | Maya · `/area/family` | Composites/ItemRow |
| ItemRow | first step (highlight) | Maya · `/area/household` | Composites/ItemRow › First step |
| ItemRow | partial (chip) | Maya · `/area/insurance` | Composites/ItemRow › Partial |
| ItemRow | declined | Grace · `/area/family?as=grace` | Composites/ItemRow › Declined |
| ItemRow | open in the quiet panel | Maya · `/area/family` (More that belongs here) | Composites/ItemRow › In a quiet panel |
| FactField | ordinary · auto-filled · not found · conflict | Maya · `/area/personal` | Composites/FactField |
| FactField | answered | none (reached by declining a not-found field) | Composites/FactField |
| FactField | editing | any FactField, after Edit | Composites/FactField |
| Review banner (Callout success) | shown | Maya · `/area/personal`, `/area/insurance` | Components/Feedback/Callout |
| RailPanels | status rows · people (link and note) · documents · cross-link | Maya · `/area/family` | Layouts/RailPanels |
| Depth "Show more" | more than 3 open rows | none (no fixture has 4+) | none |
| ChoiceCard grid | multi-select, one exclusive | `/setup/roles` | Composites/ChoiceCard |
| Form beat | required field empty (CTA off) | `/setup/about-you` (clear the legal name) | Composites/FlowFooter › CTA disabled |
| FlowFooter submit mode | pending · failure · retry | none (beats are in link mode until the API saves, R2-38) | Composites/FlowFooter › Submit mode |

## By-hand checks (no play can see these)

Run these in the field walk; a play function can't reproduce them.

| Check | How | Why by hand |
|---|---|---|
| Reveal keeps the caret (PasswordField, SsnField) | Chrome: type, select a few characters (SSN: put the caret mid-number), click the eye **with the mouse**, then again. The selection or caret stays put both ways. | Chrome resets the caret to 0 on the first layout after an input's `type` changes, but only after a trusted click (GAPS #99); `useKeptSelection` forces that layout before restoring. The plays (`Play · reveal keeps the caret…`) cover the restore on a scripted click only. Safari and Firefox not checked yet. |
| Rich field chunk on a phone | A mid-range phone on 4G: open a page with a rich Textarea and time the first editable frame. | Needs a real device (R2-45, GAPS #80). |
| Plays that need system focus | Run these stories' plays in a foreground browser window (not a background tab or the embedded preview pane): DateField's `Play · calendar by keyboard` (the calendar's focus trap), AppHeader's one-popover play (HeaderSearch expands and focuses its field), DropdownMenu and AccountMenu keyboard plays (Radix returns focus to the trigger on close). | Without system focus the browser moves `document.activeElement` but fires no `focus`/`blur` events (GAPS #122). Plays assert on state (an `aria-expanded`, a role present, `toHaveFocus`) and focus through `enter()`/`leave()` (`src/stories/typing.ts`), which send the events by hand when the page has no focus (R12-03); what a component's own focus management does on those events (Radix FocusScope's trap and return) can't be sent for it. |
| Icons at 125% / 150% | Windows display scaling at 125% and 150%: Callout icon, AreaIcon glyphs, avatar badges, StatusDot tick. | The Browser pane renders at 1x; sizes are chosen by geometry (R4-15, R5-06, R5-07) but not seen on a real fractional-DPR screen (GAPS #89). |
