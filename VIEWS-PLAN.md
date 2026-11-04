# People and Documents Views in `@paige/ui`: inventory and plan

Proposal, nothing built (2026-11-04). The decisions marked **D-Vn** are George's.

**Outcome.** The owner opens People or Documents, sees everyone (everything) in one list, picks one, and reads or fixes their record in place. The reference is the Vue webapp after the 2026-11-02 passes (branch `claude/people-documents-views-2e4bdc`, commit `2fff6d707`) plus George's v0 mocks. The screenshots are in the side-session notes, `lane-6-shots/pass3/` and `lane-6-shots/v0/`. Copy comes word for word from the webapp's `src/features/vault/docs/views.md`, the vault docs.

## 1. What the pages are made of

| Region | Pieces (states) |
|---|---|
| **Frame** | **Full-bleed workspace:** a compact header band (icon tile, title, lead, count, primary Add), then list \| stage. Each column scrolls on its own. **Phone:** two screens (the list, or the record with Back). |
| **List** | Search + filter button. Inline Area chips (dot, label, count, pressed). The filter popover holds the rest (needs, shared, made by Paige). Removable tokens for popover picks. Group headings with counts: Documents "Needs you" / "Ready", People ungrouped. **Rows:** a mark (avatar, or a doc tile tinted by Area), title, sub ("Parent · 2 roles", "Passport.png"), one status line (alert + need, or check + "Ready"), and Area dots. **States:** empty book, no matches + Clear, selected, scroll cue. **Keyboard:** ↑/↓. |
| **Stage, shared** | **Grey stage, white stage bar:** title, chip, a sub line that always holds its height, Share (tool), ⋯ menu (Edit details, Assign to roles, Remove) or Done in Edit. A centred record card (max 720). **Nothing open:** "Pick someone" / "Pick a document", plus "Start with these" (up to 5 rows that need something). **Nothing at all:** one line. |
| **Person record** | **Letterhead (contact card):** avatar, name, kinship, a phone · email line, or an inline "+ Add a phone or email" that opens the reach form in View. **Résumé sections:** "Who they are to you" (an Area label column, line, "Open in {Area}") and "Also named in". **Muted dashed callout** "Only visible to you" › "What they can see" (Delegate, shares; invite flag + send in Edit). **Edit:** fields by kinship (spouse, minor child, adult child, pet), Save/Cancel, Remove + Assign to roles, a remove confirm that lists the losses. |
| **Document record** | **Text left:** facts (Original, Made by), note, "Open the will builder", "Check the N values it read". **Preview right:** a 150px strip (image whole, PDF top), Expand / Open full size / Download; none / opening / didn't-open states. **"What it's for"** (Area groups). **"What we read from it":** values waiting (Use this / Keep mine) in View, read lines by Area item, "Still to add" (Edit). **"Who it names".** **Owner callout** "Who can see it": shares, plus the Share it form (email, when, picks from your people). **Remove** + confirm. |
| **Dialogs / forms** | Someone new (name, kinship, dob, note). Reach (mobile + email, one save). Document entry (name, type, where the original is, note). Add a document (file first, then name and type, max size). Where {first} fits (placement switches, saving per row). |

Data is `PersonRow` / `PersonDetail` and `DocumentRow` / `DocumentDetail` (webapp `features/vault/people.ts`, `documents.ts`). The full field list is in the inventory notes.

## 1a. The workspace: what each region is for

The WorkspacePage template (D-V1, decided by George 2026-11-04) names its regions. Each region has one job; whatever doesn't do that job goes elsewhere. The template's header and its Wireframe story carry these words, so whoever works on a region reads its purpose first.

| Region (slot) | Its job | Holds | Never holds |
|---|---|---|---|
| **App header** (shell, not the template's) | Get around the app | Logo, modes, search, bell, account | Anything about this page |
| **Band** (`band`) | Name the View and its one way in | Icon tile, title, lead, count, the View's primary action (Add someone / Add a document) | Filters, record actions, notices about one record |
| **List** (`list`) | Find and choose | Search, the filter button and its popover, Area chips, active tokens, group headings, rows, list notices ("Added Ada.") | Editing. A row is a link to its record and never a form. |
| **Stage** (`stage`) | Show the one chosen record, or what to choose | The stage bar and the record card, or the Pick panel | List controls, page actions |
| **Stage bar** (`stageBar`, inside the stage) | Say which record is open and what can be done to all of it | Title, chip, quiet sub line, Share, ⋯ (Edit details, Assign, Remove) or Done | Actions on one part of the record; those sit on the part |
| **Record card** (vault, in the stage) | The record itself: the artifact the owner shares, a contact card or a résumé | The letterhead, the sections, to-dos where the value would show ("Add a phone or email", values to check) | Navigation, page chrome |
| **Owner callout** (in the record) | What only the owner sees about this record | "Only visible to you": what they can see, who can see it | What the people the owner shares with would read |
| **Pick panel** (the stage with nothing open) | Get the owner to a first record | Pick someone / a document, Start with these | A second list. It is a summary, not a filter. |

### Breakpoints

These are the library's standard breakpoints (`theme.css`: sm 640 · md 768 · lg 1024 · xl 1280). The template uses no others.

| Width | Workspace |
|---|---|
| < md (768) | One column, two screens. The band and list, or the stage with Back (no band). `open` decides which. |
| md – < lg | List | stage; the list 300. |
| ≥ lg | List | stage; the list 360; the record card centred, max 720. |
| ≥ xl | The same. The stage widens; a side rail in the record (What it's for, Who can see it) is a later option, not this pass. |

These are container widths, not the window's, so the template behaves the same inside a Storybook frame. The Vue page switches at 760; md (768) replaces it.

## 2. What `@paige/ui` already has

| Need | Exists | Use as |
|---|---|---|
| Avatar (person/pet, initials, photo) | `components/display/avatar` | as is |
| Area dot, Area icon, Area tone | `display/dot`, `vault/areas/area-icon`, `[data-area]` tokens | as is |
| Chip in the stage bar | `display/badge` (soft) | as is |
| Search + filters button + count | `patterns/list-toolbar`, `patterns/filters-popover` | as is for the toolbar and popover |
| ⋯ menu (icons, destructive last, confirmed) | `components/actions/row-actions`, `dropdown-menu` | as is |
| Confirm (pending / failure in place) | `overlays/confirm-dialog`, `vault/remove-dialog` | remove confirm |
| Phone, date of birth, address fields | `forms/fields/*` | reach and person forms |
| Form shell, sections | `forms/form`, `field-group`, `form-section` | entry forms |
| Person add form (by kinship, four save states) | `vault/people/person-add-form` | "Someone new" |
| Value states incl. conflict / auto-filled | `vault/fact-field` | base for "values to check" |
| Row base | `vault/fact-item`; labs `components/item` | base for the list rows |
| Empty states | `feedback/empty-state` | base for the Pick panel |
| FieldSet (legend over a rule) | `forms/field-set` | base for a record section, shared or owner (D-V3) |
| File glyph, file row | `display/file-icon`, `display/attachment`, `vault/documents/upload-row` | doc tile, add-document file row |
| Dialog, popover, tooltip | `overlays/*` | as is |
| Page header slots | `templates/page-header` | header band (needs density) |

## 3. Decisions first

- **D-V1 · A workspace template. Decided (George 2026-11-04): yes.** `templates/workspace-page.tsx`, full bleed under the app header. Slots: `band`, `list`, `stage`, `stageBar`. Each column scrolls on its own; below md it becomes two screens, driven by `open`. The regions and breakpoints are in §1a.
- **D-V2 · A tool button. Decided (George 2026-11-04): a `shape` axis.** Button and IconButton get `shape` (`pill`, the default, · `rect`, an 8px radius), in `lib/vocabulary.ts`. A pill is the page's call to action (Add someone); a rect is a tool (Share, ⋯, the filter button, Expand, Assign, Remove). It is an axis, not a variant (`variant` is a retired word), so any emphasis can be rect.
- **D-V3 · "Only visible to you" is a section, not a callout (George 2026-11-04).** It was the webapp fieldset's intent: a group under one legend, closer to a form section than a short note. It reads in View and holds fields and actions in Edit. **Proposed meaning, for George to confirm:** a record is made of sections, and each section has an **audience**:
  - `shared`: what the people the owner shares with would read. "Who they are to you", "What it's for".
  - `owner`: only the owner sees it. "What they can see", "Who can see it".

  The audience is the axis, and the look follows from it: an owner section is set back, dashed and muted, with a lock and "Only visible to you" in its legend. One frame (`record-section`, built from FieldSet's legend-and-rule) serves both, so what the owner sees and what they share stay visibly different without a second component.
- **D-V4 · Chips: define the archetype first, then specialize (George 2026-11-04).** No Area-only piece up front. First a general **Chip**:
  - **Archetype:** a Control (it holds a state, as ToggleGroup does).
  - **Parts:** a label, an optional leading mark (a Dot, an icon or an Avatar) and an optional count, with pressed and disabled states.
  - **ChipGroup:** single or multi choice, arrow keys, `aria-pressed`.

  The stories show it in several jobs (a status filter, needs, Areas) to see how it holds up across them. Area chips are the first specialization once it does. This reopens GAPS #62 on the archetype, not as a fourth ToggleGroup look.
- **D-V6 · Open: what `shape` means in the vocabulary.** Button's `shape` (`pill` · `rect`, D-V2) is built as the component's own prop for now. The word is already a prop on Legend (`block` · `line` · `dot`, a swatch) and Skeleton (`text` · `number` · `block` · `circle`), each with its own set. Registering it in `lib/vocabulary.ts` for Button alone would give one word three meanings: 10 new `check:vocab` warnings. Proposal: one meaning, "the outline a part draws", with the union of the values, allowed on Action, Mark and Chart. The alternative is a different word for Button. George's call; until then the vocabulary is unchanged.
- **D-V5 · Everything starts in `labs/` (George 2026-11-04).** Every new piece lands at level 0 in `src/labs/` (`INTAKE.md`'s route) with an `@from` / purpose header, and moves to its layer when George approves it. §4's "Layer" column is where each piece is expected to end up, not where it starts. Changes to existing components (Button `shape`) are the exception: they land in place, as a change to that component.

## 4. Pieces to add, by layer

Every new piece starts in `src/labs/` at level 0 (D-V5). The first column is where it is expected to land once approved. Level 1 (shaped: one story per state, a Wireframe where required) comes with the move. Plays come in the approve pass.

| Layer · file | Piece | Built from | States in stories |
|---|---|---|---|
| `fixtures/vault-people.ts` | A people book with phones/emails, Areas, roles, needs (reach, invite, unnamed), a pet, a minor | `PersonRow` / `PersonDetail` shapes | — |
| `fixtures/vault-documents.ts` | ID, insurance card, will (generated), untyped scan, no-file record; read values, waiting values, shares | `DocumentRow` / `DocumentDetail` shapes | — |
| `icons` (action icons) | `download`, `lock` | — | Foundations › Icons |
| `components/actions/button` | `shape="rect"` (D-V2) | Button, IconButton | sizes × shape |
| `components/inputs/chip.tsx` + `chip-group` | Chip (D-V4): label, leading mark, count, pressed; group single · multi | ToggleGroup's item model, Dot, Avatar | a status filter · needs · Areas · with and without counts · disabled · wraps · keyboard |
| `forms/fields/email-field.tsx` | Email field | Input type email + Field | empty, invalid, filled |
| `patterns/area-chips.tsx` | Area chips: the first Chip specialization (D-V4), once Chip holds up | Chip, ChipGroup, Dot | none · some picked · zero counts hidden · wraps |
| `patterns/list-group.tsx` | Group heading with count, flat rows under it | Separator, Eyebrow | grouped · flat · one empty group dropped |
| `patterns/stage-bar.tsx` | Title, chip, steady sub line, actions slot | Badge, Button rect, RowActions | View · Edit (Done) · long title · no sub · phone |
| `patterns/pick-panel.tsx` | Ring icon, title, lead, "Start with these" links | EmptyState, Item | with items · none needing · nothing at all |
| `templates/page-header` | `density="compact"` (the band) | PageHeader | desktop · phone (Add under) |
| `templates/workspace-page.tsx` | Band · list \| stage (D-V1) | Split, scroll regions | Wireframe · nothing open · open · phone list · phone record · long list |
| `vault/record-card.tsx` | The centred card on the stage | Card | View · Edit |
| `vault/record-section.tsx` | A record's section with an `audience` (D-V3): `shared` (résumé: legend over rule, Area label column, line, "Open in") · `owner` (set back: dashed, muted, lock, "Only visible to you") | FieldSet's legend, Separator, Dot | shared · owner · groups · sided lines · empty (View / Edit flag) · with fields (Edit) · phone stack |
| `vault/people/person-row.tsx` | List row: avatar, title, sub, status line, Area dots | FactItem / labs Item, Avatar, Dot | need · none · selected · pet · long name |
| `vault/people/person-letterhead.tsx` | Contact card + inline "Add a phone or email" | Avatar | spouse · minor · adult child · pet · no reach · photo |
| `vault/people/reach-form.tsx` | Mobile + email, one save | PhoneField, EmailField, Form | empty · saving · error · field error |
| `vault/people/person-record.tsx` | Letterhead + sections (shared and owner) + Edit fields + remove | the above | View · Edit by kinship · removing · notices |
| `vault/people/placement-dialog.tsx` | Where {first} fits | Dialog, Switch | suggested · saving row · row error |
| `vault/documents/document-row.tsx` | List row: doc tile, title, sub, status (alert or Ready), dots | FactItem / Item, FileIcon | needs · ready · generated · untyped · no Area |
| `vault/documents/document-preview.tsx` | 150px strip, Expand, Open full size, Download | — | image · PDF · text · other · no file · opening · didn't open · expanded |
| `vault/documents/values-to-check.tsx` | Waiting value with Use this / Keep mine | FactField (conflict) | differs · not in Vault · busy |
| `vault/documents/share-form.tsx` | Who can see it + Share it form, in an owner section | record-section (owner), Input, Select | none · shared · form · sharing · error |
| `vault/documents/document-record.tsx` | Text \| preview, the sections, remove | the above | View · Edit · will · no file · values waiting |
| `vault/documents/add-document-dialog.tsx` | File first, then name and type | Dialog, Attachment | picked · too big · adding · failed |
| `apps/web/app/people/page.tsx` + `features/people/people-screen.tsx` | The page on fixtures, `?id=` / `?mode=` | WorkspacePage + the above | — |
| `apps/web/app/documents/page.tsx` + `features/documents/documents-screen.tsx` | The same for documents | — | — |

## 5. Order

1. **D-V1–D-V5 answered** (2026-11-04; D-V3's audience meaning to confirm).
2. **Walking skeleton.**
   - Fixtures.
   - `WorkspacePage` with a Wireframe story.
   - `/people` in `apps/web` with placeholder rows and stage.
   - This proves the frame, the phone two screens, and the scrolling.
3. **List.** Chip and ChipGroup first (the archetype, several jobs), then `area-chips`, `list-group`, `person-row`, `document-row`. The toolbar is reused.
4. **Stage shell.** `stage-bar` (with Button `rect`), `pick-panel`, `record-card`.
5. **Person.** `record-section` (shared · owner), `person-letterhead`, `reach-form` (with EmailField), `person-record`, `placement-dialog`.
6. **Document.** `document-preview`, `values-to-check`, `share-form`, `document-record`, `add-document-dialog`.
7. **Screens.** Both routes end to end on fixtures, with every state from the table reachable by `?as=` / `?id=`.
8. **Approve pass.**
   - Plays on behaviour stories: ↑/↓, the ⋯ menu, Esc, inline reach, Expand, the confirms.
   - Run `--a11y` and `npm run check`.
   - Walk desktop and phone against the Vue screenshots.

Steps 3–6 can run two at a time (list | stage) once 2 is in.

## 6. Out of scope here

- Wiring to the real API; the screens run on fixtures, like the rest of the spike.
- Telemetry (`place.viewed` / `left`, `person.added`, `document.provided`); the webapp's events are listed in the inventory for when the React app goes live.
- The Will Builder, Passwords, Business.
