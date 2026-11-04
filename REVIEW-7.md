# Review 7 — organization (opened 2026-10-19)

The recommendations in `packages/ui/ORGANIZATION.md`. George delegated the decision ("make a best decision and start; this shouldn't be my opinion until we reach a certain point"), so these are decided by Claude and built; George reviews at the walk. Same rules as earlier rounds (held list, IDs `R7-nn`, statuses → built → verified, plus deferred).

**Decision:** adopt all five. They reinforce each other, and doing the moves in one pass changes story ids and imports once instead of five times. One adjustment to the review: Vault composites stay in the package (under `vault/`), not in the app, because Product's prototypes consume them.

**Order:** the layer-order check first (safety net for the moves), then explicit exports, then the moves (R7-01, R7-03, R7-04) in one coordinated pass, then docs and checks.

| ID | Recommendation | Decision | Status |
|---|---|---|---|
| R7-01 | Split Layouts: arrangers (Stack, Inline, Grid, Split, Flex) → `primitives/`; page layouts → `templates/`; RailPanels → `vault/`; Breakpoints → Foundations; Placeholder out of the exports (stories only) | Adopt | built (Claude, delegated by George, 2026-10-19). Built: `src/primitives/` (Flex, Stack, Inline, Grid, Split), `src/templates/` (Page, PageHeader, HomePage, AreaPage, SetupBeat), RailPanels → `src/vault/`, Breakpoints → Foundations (`foundations/breakpoints.stories.tsx`), Placeholder → `src/stories/placeholder.tsx` (story-only, not exported; its own 4 stories are removed, listed below). Also bundled (ORGANIZATION rank 7, so ids change once): Components in purpose subfolders: `actions/`, `inputs/`, `display/`, `feedback/`, `navigation/`, `overlays/`. All with `git mv` |
| R7-02 | `check:layers` enforces the full layer order, so an upward import or a cycle between layers fails | Adopt, first | built (Claude, delegated by George, 2026-10-19). Built: `scripts/check-layers.mjs` declares the order once (`TIERS`: lib → icons\|schemas → base → primitives → components → forms → patterns → shell\|vault → templates; `FREE`: stories, foundations, docs) and fails on an upward import (TIER), an import between peers (Shell ↔ Vault), a runtime import cycle (Tarjan over package files; `import type` is not an edge, a lazy `import()` is), a folder in neither list (FOLDER), an app import by path into the package (PATH), plus the kept base, alias and `"use client"`/cva rules. Run first against today's tree with each file mapped to its destination: **0 findings** (the one loop it saw, `rich-textarea` ↔ `rich-text-editor`, is a type import plus a lazy import, not a runtime cycle). After the moves it found **two real violations**, both fixed: the rich Textarea imported Field's context from the new `forms/field` (upward), fixed by moving the context under the controls (`components/internal/field-context.tsx`); and Field, DateField's Calendar and Popover import bases from `src/forms`, so the base rule now names the Paige layer as `src/components` **and** `src/forms` (the folders that wrap upstream), a deliberate widening |
| R7-03 | Forms section: `src/forms` above Components; bare inputs stay in Components (Inputs); typed fields and FieldAction → Forms › Fields; Field, FieldGroup, FieldSet, InlineEdit, ChoiceCard, FlowFooter → Forms › Patterns; new Form, FormSection, FormFooter, ErrorSummary; Field passes ids and error state to its control automatically; domain forms live in `apps/web/features/<feature>/forms/` | Adopt | built (Claude, delegated by George, 2026-10-19). Built: `src/forms/` (Field, FlowFooter, InlineEdit, ChoiceCard, `messages.ts` ← `field-messages.ts`, `values.ts`) and `src/forms/fields/` (the 7 typed fields + FieldAction), internals in `forms/internal/`. New: **Form** (`forms/form.tsx`; typed `values` handed to `onSubmit(values)` and `validate(values)`; pending disables the submit and labels it "Saving…", a second submit does nothing; errors by Field `name` from the field itself, `validate` and the server (`errors` or the `{ errors, error }` onSubmit returns); onSubmit throwing shows the generic failure, never the exception text; `useForm()` returns a handle for a footer outside the `<form>`), **ErrorSummary** (an attention Message, so announced; Form focuses it on every failed submit; a link per invalid field that scrolls to and focuses it; a form-level error leads), **FormSection** (eyebrow heading + rule, description, fields; GAPS #50), **FormFooter** (cancel + the submit, reading pending/disabled from Form). **FlowFooter kept, not replaced**: a setup step also has Back, a note and Skip, and SetupBeat puts the footer outside the form; it reads Form's state inside a Form or takes `useForm().submitProps` outside, and shares FormFooter's submit button. **Field wires its control**: context (`components/internal/field-context.tsx`) gives Input, Textarea, Select, the rich Textarea and every typed field the id, `aria-describedby` (only the description/error on screen) and `aria-invalid`; FieldLabel's `htmlFor` follows; a typed field reports its own error to its Field; `<Field id>` for an id something outside links to. **About You** moved to `apps/web/features/setup/forms/about-you-form.tsx` (fields only, no hand-written ids, aria or error state, FormSection instead of the eyebrow + Separator row); `about-you-beat.tsx` composes SetupBeat + the form and owns navigation; it submits through Form and still saves nothing (no endpoint, R2-38), the CTA still waits for a legal name. Stories: Forms/Form (5, plays), Forms/FormSection (2), Forms/FormFooter (4, a play), Forms/ErrorSummary (3, a play) |
| R7-04 | Split Composites into Patterns (generic), Shell (app chrome: AppHeader, HeaderSearch, NotificationBell, AccountMenu, StepRail) and Vault (domain: AreaTile, AreaIcon, FactField, FactItem, ItemRow, StatusDot, RailPanels, LinkOut, CaptureCard, UploadRow, PersonPicker …) | Adopt, with Vault kept in the package | built (Claude, delegated by George, 2026-10-19). Built: Composites split by the rule: **Patterns** Panel, PageIntro; **Shell** AppHeader, AccountMenu, NotificationBell, HeaderSearch, StepRail (+ `internal/header-target.ts`); **Vault** AreaIcon, AreaTile, FactField, FactItem, ItemRow, LinkOut, StatusDot, RailPanels, CaptureCard, UploadRow, PersonPicker. ChoiceCard, InlineEdit, FlowFooter went to Forms (R7-03). `AreaId` stays in `icons/area-glyphs` (moving it to `vault/` would make Badge import upward; GAPS #104) |
| R7-05 | Explicit export surface: named entry points per folder; internal helpers (`field-support`, `masked-input`, …) not exported | Adopt | built (Claude, delegated by George, 2026-10-19). Built: `package.json` `exports` lists 77 named entry points, no wildcards (key = the file's path under `src/` without the extension; `.ts` and `.tsx` alike; lib tests no longer importable). Internal helpers moved into `internal/` folders and are not exported: `components/internal/` (control, pointer, popover-surface, rich-textarea, rich-text-editor, field-context), `forms/internal/` (field-support, masked-input, date-input, form-context, submit-button), `shell/internal/header-target`. `tabs-pill-list.tsx` → `tabs-pill.tsx`, `tabs-pill.ts` → `tabs-pill-styles.ts` (the catalog override now only maps TabsPill → `TabsPillList`). New `scripts/check-exports.mjs` (`npm run check:exports`, in `npm run check`): MISSING, PRIVATE, KEY, UNLISTED (a public file with no entry) and APP (an app import that isn't an entry); `--write` regenerates the map. No barrels; package-internal imports stay relative to the file. The app's tsc resolves through the map, so a non-entry import fails typecheck too (seen: it failed until `forms/form` was listed) |

## Verification (2026-10-19, round 7 build)

- `npm run typecheck` (both workspaces), `npm test` (136 pass), `npm run build` (package typecheck + Next build), `npm run build-storybook -w packages/ui`, `npm run check:tokens` (0 in Paige code), `npm run check:layers` (0), `npm run check:exports` (77 entries, 0), `npm run catalog -w packages/ui -- --static` (65 components).
- Story index (static build, compared with the running server's index taken before the moves): 572 → 586 entries: every old story is present under its new id (464 ids changed, 63 titles), the 4 Placeholder ids are removed on purpose, 18 new Forms ids added. Base ids unchanged.
- Plays: 155 stories (every Forms story, the Vault capture pieces, PageIntro, Tooltip: every file with a play) run one by one in the static build through the Storybook channel: all pass (two failed on the first run and were fixed: a description id read before it mounted, now a layout effect; and a story that put `id` on the control instead of the Field).
- App (http://localhost:3105, George's dev server): `/`, `/area/family`, `/setup/roles`, `/setup/about-you` all 200. On About you: every control's `aria-describedby` resolves to its description (and the phone's format hint), labels point at the controls; a partial phone number then Save: ErrorSummary appears and takes focus, the phone is `aria-invalid` and described by its error; the summary link focuses the phone; completing it clears the summary and Save moves to `/setup/roles`. No console errors.
- Running Storybook (6106): `.storybook/main.ts` changed (new sections, PascalCase for every segment), so it needs a restart; until then its index misses the moved sections.

## Story ids that changed

Story names (the part after `--`) are unchanged; only the title part moved. Use the prefix table to fix a bookmark; the full list is below it. REVIEW and GAPS links are history and stay as written.

| Removed (R7-01, Placeholder is story-only now) |
|---|
| `layouts-placeholder--docs`, `layouts-placeholder--default`, `layouts-placeholder--sizes`, `layouts-placeholder--card-parts` |

Added: `forms-form--{docs, default, error-summary-focus, pending, server-errors, failure}`, `forms-formsection--{docs, default, with-description}`, `forms-formfooter--{docs, default, with-cancel, disabled, pending}`, `forms-errorsummary--{docs, default, form-level, unlinked}`.

| Old id prefix | New id prefix | Ids |
|---|---|---|
| `overview-which-layer-do-i-use--…` | `overview-which-section-do-i-use--…` | 1 |
| `layouts-areapage--…` | `templates-areapage--…` | 6 |
| `layouts-breakpoints--…` | `foundations-breakpoints--…` | 1 |
| `layouts-flex--…` | `primitives-flex--…` | 6 |
| `layouts-grid--…` | `primitives-grid--…` | 5 |
| `layouts-homepage--…` | `templates-homepage--…` | 5 |
| `layouts-inline--…` | `primitives-inline--…` | 4 |
| `layouts-pageheader--…` | `templates-pageheader--…` | 4 |
| `layouts-page--…` | `templates-page--…` | 12 |
| `layouts-railpanels--…` | `vault-railpanels--…` | 2 |
| `layouts-setupbeat--…` | `templates-setupbeat--…` | 7 |
| `layouts-split--…` | `primitives-split--…` | 5 |
| `layouts-stack--…` | `primitives-stack--…` | 4 |
| `components-avatar--…` | `components-display-avatar--…` | 10 |
| `components-badge--…` | `components-display-badge--…` | 6 |
| `components-button--…` | `components-actions-button--…` | 18 |
| `components-card--…` | `components-display-card--…` | 7 |
| `components-collapsible--…` | `components-display-collapsible--…` | 3 |
| `components-currencyfield--…` | `forms-fields-currencyfield--…` | 10 |
| `components-datefield--…` | `forms-fields-datefield--…` | 14 |
| `components-dateofbirthfield--…` | `forms-fields-dateofbirthfield--…` | 9 |
| `components-disclosuretrigger--…` | `components-actions-disclosuretrigger--…` | 4 |
| `components-dot--…` | `components-display-dot--…` | 5 |
| `components-dropdownmenu--…` | `components-actions-dropdownmenu--…` | 9 |
| `components-eyebrow--…` | `components-display-eyebrow--…` | 6 |
| `components-field--…` | `forms-field--…` | 8 |
| `components-input--…` | `components-inputs-input--…` | 8 |
| `components-item--…` | `components-display-item--…` | 5 |
| `components-menu--…` | `components-actions-menu--…` | 5 |
| `components-message--…` | `components-feedback-message--…` | 10 |
| `components-phonefield--…` | `forms-fields-phonefield--…` | 8 |
| `components-postalcodefield--…` | `forms-fields-postalcodefield--…` | 9 |
| `components-progress--…` | `components-feedback-progress--…` | 6 |
| `components-radiogroup--…` | `components-inputs-radiogroup--…` | 5 |
| `components-select--…` | `components-inputs-select--…` | 17 |
| `components-separator--…` | `components-display-separator--…` | 4 |
| `components-spinner--…` | `components-feedback-spinner--…` | 3 |
| `components-ssnfield--…` | `forms-fields-ssnfield--…` | 13 |
| `components-tabspill--…` | `components-navigation-tabspill--…` | 6 |
| `components-textarea--…` | `components-inputs-textarea--…` | 14 |
| `components-tooltip--…` | `components-overlays-tooltip--…` | 5 |
| `components-fieldaction--…` | `forms-fields-fieldaction--…` | 7 |
| `components-passwordfield--…` | `forms-fields-passwordfield--…` | 10 |
| `composites-accountmenu--…` | `shell-accountmenu--…` | 3 |
| `composites-appheader--…` | `shell-appheader--…` | 6 |
| `composites-areaicon--…` | `vault-areaicon--…` | 4 |
| `composites-areatile--…` | `vault-areatile--…` | 8 |
| `composites-choicecard--…` | `forms-choicecard--…` | 10 |
| `composites-factfield--…` | `vault-factfield--…` | 11 |
| `composites-factitem--…` | `vault-factitem--…` | 12 |
| `composites-flowfooter--…` | `forms-flowfooter--…` | 9 |
| `composites-headersearch--…` | `shell-headersearch--…` | 4 |
| `composites-inlineedit--…` | `forms-inlineedit--…` | 7 |
| `composites-itemrow--…` | `vault-itemrow--…` | 10 |
| `composites-linkout--…` | `vault-linkout--…` | 4 |
| `composites-notificationbell--…` | `shell-notificationbell--…` | 6 |
| `composites-pageintro--…` | `patterns-pageintro--…` | 6 |
| `composites-panel--…` | `patterns-panel--…` | 8 |
| `composites-statusdot--…` | `vault-statusdot--…` | 11 |
| `composites-steprail--…` | `shell-steprail--…` | 6 |
| `composites-personpicker--…` | `vault-personpicker--…` | 11 |
| `composites-uploadrow--…` | `vault-uploadrow--…` | 13 |
| `composites-capturecard--…` | `vault-capturecard--…` | 9 |

<details><summary>Every changed id, old → new (464)</summary>

| Old | New |
|---|---|
| `overview-which-layer-do-i-use--docs` | `overview-which-section-do-i-use--docs` |
| `layouts-areapage--docs` | `templates-areapage--docs` |
| `layouts-areapage--slots` | `templates-areapage--slots` |
| `layouts-areapage--no-rail` | `templates-areapage--no-rail` |
| `layouts-areapage--with-band` | `templates-areapage--with-band` |
| `layouts-areapage--rail-below-lg` | `templates-areapage--rail-below-lg` |
| `layouts-areapage--rail-from-lg` | `templates-areapage--rail-from-lg` |
| `layouts-breakpoints--tokens` | `foundations-breakpoints--tokens` |
| `layouts-flex--docs` | `primitives-flex--docs` |
| `layouts-flex--row` | `primitives-flex--row` |
| `layouts-flex--column` | `primitives-flex--column` |
| `layouts-flex--between` | `primitives-flex--between` |
| `layouts-flex--centred-column` | `primitives-flex--centred-column` |
| `layouts-flex--presets` | `primitives-flex--presets` |
| `layouts-grid--docs` | `primitives-grid--docs` |
| `layouts-grid--columns-per-breakpoint` | `primitives-grid--columns-per-breakpoint` |
| `layouts-grid--fixed-columns` | `primitives-grid--fixed-columns` |
| `layouts-grid--auto-fit` | `primitives-grid--auto-fit` |
| `layouts-grid--narrow-container` | `primitives-grid--narrow-container` |
| `layouts-homepage--docs` | `templates-homepage--docs` |
| `layouts-homepage--grid` | `templates-homepage--grid` |
| `layouts-homepage--one-column` | `templates-homepage--one-column` |
| `layouts-homepage--two-columns` | `templates-homepage--two-columns` |
| `layouts-homepage--three-columns` | `templates-homepage--three-columns` |
| `layouts-inline--docs` | `primitives-inline--docs` |
| `layouts-inline--wrapping-row` | `primitives-inline--wrapping-row` |
| `layouts-inline--wrap-at-narrow-widths` | `primitives-inline--wrap-at-narrow-widths` |
| `layouts-inline--baseline` | `primitives-inline--baseline` |
| `layouts-pageheader--docs` | `templates-pageheader--docs` |
| `layouts-pageheader--slots` | `templates-pageheader--slots` |
| `layouts-pageheader--example` | `templates-pageheader--example` |
| `layouts-pageheader--narrow` | `templates-pageheader--narrow` |
| `layouts-page--docs` | `templates-page--docs` |
| `layouts-page--default` | `templates-page--default` |
| `layouts-page--focused` | `templates-page--focused` |
| `layouts-page--wide` | `templates-page--wide` |
| `layouts-page--roomy-top` | `templates-page--roomy-top` |
| `layouts-page--with-band` | `templates-page--with-band` |
| `layouts-page--sections-banner` | `templates-page--sections-banner` |
| `layouts-page--gutter-375` | `templates-page--gutter-375` |
| `layouts-page--gutter-640` | `templates-page--gutter-640` |
| `layouts-page--gutter-1024` | `templates-page--gutter-1024` |
| `layouts-page--gutter-1280` | `templates-page--gutter-1280` |
| `layouts-page--gutter-1440` | `templates-page--gutter-1440` |
| `layouts-railpanels--docs` | `vault-railpanels--docs` |
| `layouts-railpanels--rail` | `vault-railpanels--rail` |
| `layouts-setupbeat--docs` | `templates-setupbeat--docs` |
| `layouts-setupbeat--focused` | `templates-setupbeat--focused` |
| `layouts-setupbeat--wide` | `templates-setupbeat--wide` |
| `layouts-setupbeat--first-step` | `templates-setupbeat--first-step` |
| `layouts-setupbeat--last-step` | `templates-setupbeat--last-step` |
| `layouts-setupbeat--custom-top-bar` | `templates-setupbeat--custom-top-bar` |
| `layouts-setupbeat--phone` | `templates-setupbeat--phone` |
| `layouts-split--docs` | `primitives-split--docs` |
| `layouts-split--wide-and-narrow` | `primitives-split--wide-and-narrow` |
| `layouts-split--aside-max-half` | `primitives-split--aside-max-half` |
| `layouts-split--content-min` | `primitives-split--content-min` |
| `layouts-split--no-aside` | `primitives-split--no-aside` |
| `layouts-stack--docs` | `primitives-stack--docs` |
| `layouts-stack--default` | `primitives-stack--default` |
| `layouts-stack--gap-scale` | `primitives-stack--gap-scale` |
| `layouts-stack--align` | `primitives-stack--align` |
| `components-avatar--docs` | `components-display-avatar--docs` |
| `components-avatar--person` | `components-display-avatar--person` |
| `components-avatar--photo` | `components-display-avatar--photo` |
| `components-avatar--pet` | `components-display-avatar--pet` |
| `components-avatar--sizes` | `components-display-avatar--sizes` |
| `components-avatar--rings` | `components-display-avatar--rings` |
| `components-avatar--subtle-ring` | `components-display-avatar--subtle-ring` |
| `components-avatar--selected` | `components-display-avatar--selected` |
| `components-avatar--badges` | `components-display-avatar--badges` |
| `components-avatar--group` | `components-display-avatar--group` |
| `components-badge--docs` | `components-display-badge--docs` |
| `components-badge--playground` | `components-display-badge--playground` |
| `components-badge--matrix` | `components-display-badge--matrix` |
| `components-badge--sizes` | `components-display-badge--sizes` |
| `components-badge--mapping` | `components-display-badge--mapping` |
| `components-badge--area-tone` | `components-display-badge--area-tone` |
| `components-button--docs` | `components-actions-button--docs` |
| `components-button--primary` | `components-actions-button--primary` |
| `components-button--secondary` | `components-actions-button--secondary` |
| `components-button--ghost` | `components-actions-button--ghost` |
| `components-button--link` | `components-actions-button--link` |
| `components-button--quiet` | `components-actions-button--quiet` |
| `components-button--quiet-underline` | `components-actions-button--quiet-underline` |
| `components-button--destructive` | `components-actions-button--destructive` |
| `components-button--sizes` | `components-actions-button--sizes` |
| `components-button--inline-inherits` | `components-actions-button--inline-inherits` |
| `components-button--all-variants` | `components-actions-button--all-variants` |
| `components-button--tinted` | `components-actions-button--tinted` |
| `components-button--tinted-on-area-wash` | `components-actions-button--tinted-on-area-wash` |
| `components-button--icon-prop` | `components-actions-button--icon-prop` |
| `components-button--hover` | `components-actions-button--hover` |
| `components-button--disabled` | `components-actions-button--disabled` |
| `components-button--pending` | `components-actions-button--pending` |
| `components-button--relative-hover` | `components-actions-button--relative-hover` |
| `components-card--docs` | `components-display-card--docs` |
| `components-card--default` | `components-display-card--default` |
| `components-card--muted` | `components-display-card--muted` |
| `components-card--highlight` | `components-display-card--highlight` |
| `components-card--placeholder` | `components-display-card--placeholder` |
| `components-card--interactive` | `components-display-card--interactive` |
| `components-card--interactive-hover` | `components-display-card--interactive-hover` |
| `components-collapsible--docs` | `components-display-collapsible--docs` |
| `components-collapsible--closed` | `components-display-collapsible--closed` |
| `components-collapsible--open` | `components-display-collapsible--open` |
| `components-currencyfield--docs` | `forms-fields-currencyfield--docs` |
| `components-currencyfield--empty` | `forms-fields-currencyfield--empty` |
| `components-currencyfield--filled` | `forms-fields-currencyfield--filled` |
| `components-currencyfield--negative` | `forms-fields-currencyfield--negative` |
| `components-currencyfield--euro` | `forms-fields-currencyfield--euro` |
| `components-currencyfield--error` | `forms-fields-currencyfield--error` |
| `components-currencyfield--disabled` | `forms-fields-currencyfield--disabled` |
| `components-currencyfield--in-field` | `forms-fields-currencyfield--in-field` |
| `components-currencyfield--in-inline-edit` | `forms-fields-currencyfield--in-inline-edit` |
| `components-currencyfield--typing-and-pasting` | `forms-fields-currencyfield--typing-and-pasting` |
| `components-datefield--docs` | `forms-fields-datefield--docs` |
| `components-datefield--empty` | `forms-fields-datefield--empty` |
| `components-datefield--filled` | `forms-fields-datefield--filled` |
| `components-datefield--error` | `forms-fields-datefield--error` |
| `components-datefield--disabled` | `forms-fields-datefield--disabled` |
| `components-datefield--calendar-action-hover` | `forms-fields-datefield--calendar-action-hover` |
| `components-datefield--native` | `forms-fields-datefield--native` |
| `components-datefield--day-first-locale` | `forms-fields-datefield--day-first-locale` |
| `components-datefield--in-field` | `forms-fields-datefield--in-field` |
| `components-datefield--min-max` | `forms-fields-datefield--min-max` |
| `components-datefield--calendar-open` | `forms-fields-datefield--calendar-open` |
| `components-datefield--in-inline-edit` | `forms-fields-datefield--in-inline-edit` |
| `components-datefield--typing-and-pasting` | `forms-fields-datefield--typing-and-pasting` |
| `components-datefield--calendar-keyboard` | `forms-fields-datefield--calendar-keyboard` |
| `components-dateofbirthfield--docs` | `forms-fields-dateofbirthfield--docs` |
| `components-dateofbirthfield--empty` | `forms-fields-dateofbirthfield--empty` |
| `components-dateofbirthfield--filled` | `forms-fields-dateofbirthfield--filled` |
| `components-dateofbirthfield--error` | `forms-fields-dateofbirthfield--error` |
| `components-dateofbirthfield--disabled` | `forms-fields-dateofbirthfield--disabled` |
| `components-dateofbirthfield--in-field` | `forms-fields-dateofbirthfield--in-field` |
| `components-dateofbirthfield--age-range` | `forms-fields-dateofbirthfield--age-range` |
| `components-dateofbirthfield--in-inline-edit` | `forms-fields-dateofbirthfield--in-inline-edit` |
| `components-dateofbirthfield--typing-and-pasting` | `forms-fields-dateofbirthfield--typing-and-pasting` |
| `components-disclosuretrigger--docs` | `components-actions-disclosuretrigger--docs` |
| `components-disclosuretrigger--tones` | `components-actions-disclosuretrigger--tones` |
| `components-disclosuretrigger--with-collapsible` | `components-actions-disclosuretrigger--with-collapsible` |
| `components-disclosuretrigger--with-dropdown-menu` | `components-actions-disclosuretrigger--with-dropdown-menu` |
| `components-dot--docs` | `components-display-dot--docs` |
| `components-dot--default` | `components-display-dot--default` |
| `components-dot--tones` | `components-display-dot--tones` |
| `components-dot--sizes` | `components-display-dot--sizes` |
| `components-dot--built-on-it` | `components-display-dot--built-on-it` |
| `components-dropdownmenu--docs` | `components-actions-dropdownmenu--docs` |
| `components-dropdownmenu--closed` | `components-actions-dropdownmenu--closed` |
| `components-dropdownmenu--every-kind` | `components-actions-dropdownmenu--every-kind` |
| `components-dropdownmenu--checkbox-and-radio` | `components-actions-dropdownmenu--checkbox-and-radio` |
| `components-dropdownmenu--disclosure-trigger-menu` | `components-actions-dropdownmenu--disclosure-trigger-menu` |
| `components-dropdownmenu--side-top` | `components-actions-dropdownmenu--side-top` |
| `components-dropdownmenu--side-right` | `components-actions-dropdownmenu--side-right` |
| `components-dropdownmenu--align-center` | `components-actions-dropdownmenu--align-center` |
| `components-dropdownmenu--long-list` | `components-actions-dropdownmenu--long-list` |
| `components-eyebrow--docs` | `components-display-eyebrow--docs` |
| `components-eyebrow--muted` | `components-display-eyebrow--muted` |
| `components-eyebrow--area` | `components-display-eyebrow--area` |
| `components-eyebrow--area-fallback` | `components-display-eyebrow--area-fallback` |
| `components-eyebrow--area-nested` | `components-display-eyebrow--area-nested` |
| `components-eyebrow--primary` | `components-display-eyebrow--primary` |
| `components-field--docs` | `forms-field--docs` |
| `components-field--default` | `forms-field--default` |
| `components-field--optional` | `forms-field--optional` |
| `components-field--error` | `forms-field--error` |
| `components-field--error-list` | `forms-field--error-list` |
| `components-field--disabled` | `forms-field--disabled` |
| `components-field--two-columns` | `forms-field--two-columns` |
| `components-field--choice-group` | `forms-field--choice-group` |
| `components-input--docs` | `components-inputs-input--docs` |
| `components-input--empty` | `components-inputs-input--empty` |
| `components-input--filled` | `components-inputs-input--filled` |
| `components-input--hover` | `components-inputs-input--hover` |
| `components-input--error` | `components-inputs-input--error` |
| `components-input--error-hover` | `components-inputs-input--error-hover` |
| `components-input--disabled` | `components-inputs-input--disabled` |
| `components-input--compact` | `components-inputs-input--compact` |
| `components-item--docs` | `components-display-item--docs` |
| `components-item--row` | `components-display-item--row` |
| `components-item--compact` | `components-display-item--compact` |
| `components-item--media` | `components-display-item--media` |
| `components-item--long-content` | `components-display-item--long-content` |
| `components-menu--docs` | `components-actions-menu--docs` |
| `components-menu--standalone` | `components-actions-menu--standalone` |
| `components-menu--on-muted` | `components-actions-menu--on-muted` |
| `components-menu--toggles` | `components-actions-menu--toggles` |
| `components-menu--same-entries-in-a-popover` | `components-actions-menu--same-entries-in-a-popover` |
| `components-message--docs` | `components-feedback-message--docs` |
| `components-message--neutral` | `components-feedback-message--neutral` |
| `components-message--info` | `components-feedback-message--info` |
| `components-message--success` | `components-feedback-message--success` |
| `components-message--attention` | `components-feedback-message--attention` |
| `components-message--actions-on-each-tone` | `components-feedback-message--actions-on-each-tone` |
| `components-message--title-only` | `components-feedback-message--title-only` |
| `components-message--long-content` | `components-feedback-message--long-content` |
| `components-message--dismiss` | `components-feedback-message--dismiss` |
| `components-message--unframed` | `components-feedback-message--unframed` |
| `components-phonefield--docs` | `forms-fields-phonefield--docs` |
| `components-phonefield--empty` | `forms-fields-phonefield--empty` |
| `components-phonefield--filled` | `forms-fields-phonefield--filled` |
| `components-phonefield--error` | `forms-fields-phonefield--error` |
| `components-phonefield--disabled` | `forms-fields-phonefield--disabled` |
| `components-phonefield--in-field` | `forms-fields-phonefield--in-field` |
| `components-phonefield--in-inline-edit` | `forms-fields-phonefield--in-inline-edit` |
| `components-phonefield--typing-and-pasting` | `forms-fields-phonefield--typing-and-pasting` |
| `components-postalcodefield--docs` | `forms-fields-postalcodefield--docs` |
| `components-postalcodefield--empty` | `forms-fields-postalcodefield--empty` |
| `components-postalcodefield--filled` | `forms-fields-postalcodefield--filled` |
| `components-postalcodefield--filled-plus-4` | `forms-fields-postalcodefield--filled-plus-4` |
| `components-postalcodefield--error` | `forms-fields-postalcodefield--error` |
| `components-postalcodefield--disabled` | `forms-fields-postalcodefield--disabled` |
| `components-postalcodefield--in-field` | `forms-fields-postalcodefield--in-field` |
| `components-postalcodefield--in-inline-edit` | `forms-fields-postalcodefield--in-inline-edit` |
| `components-postalcodefield--typing-and-pasting` | `forms-fields-postalcodefield--typing-and-pasting` |
| `components-progress--docs` | `components-feedback-progress--docs` |
| `components-progress--empty` | `components-feedback-progress--empty` |
| `components-progress--partial` | `components-feedback-progress--partial` |
| `components-progress--complete` | `components-feedback-progress--complete` |
| `components-progress--indeterminate` | `components-feedback-progress--indeterminate` |
| `components-progress--area-tones` | `components-feedback-progress--area-tones` |
| `components-radiogroup--docs` | `components-inputs-radiogroup--docs` |
| `components-radiogroup--unselected` | `components-inputs-radiogroup--unselected` |
| `components-radiogroup--selected` | `components-inputs-radiogroup--selected` |
| `components-radiogroup--disabled` | `components-inputs-radiogroup--disabled` |
| `components-radiogroup--invalid` | `components-inputs-radiogroup--invalid` |
| `components-select--docs` | `components-inputs-select--docs` |
| `components-select--placeholder` | `components-inputs-select--placeholder` |
| `components-select--selected` | `components-inputs-select--selected` |
| `components-select--groups-open` | `components-inputs-select--groups-open` |
| `components-select--flat-options` | `components-inputs-select--flat-options` |
| `components-select--with-icons` | `components-inputs-select--with-icons` |
| `components-select--error` | `components-inputs-select--error` |
| `components-select--disabled` | `components-inputs-select--disabled` |
| `components-select--long-list` | `components-inputs-select--long-list` |
| `components-select--side-top` | `components-inputs-select--side-top` |
| `components-select--side-right` | `components-inputs-select--side-right` |
| `components-select--matches-dropdown-menu` | `components-inputs-select--matches-dropdown-menu` |
| `components-select--native` | `components-inputs-select--native` |
| `components-select--native-selected` | `components-inputs-select--native-selected` |
| `components-select--native-error` | `components-inputs-select--native-error` |
| `components-select--native-long-list` | `components-inputs-select--native-long-list` |
| `components-select--side-by-side` | `components-inputs-select--side-by-side` |
| `components-separator--docs` | `components-display-separator--docs` |
| `components-separator--horizontal` | `components-display-separator--horizontal` |
| `components-separator--vertical` | `components-display-separator--vertical` |
| `components-separator--section-label` | `components-display-separator--section-label` |
| `components-spinner--docs` | `components-feedback-spinner--docs` |
| `components-spinner--default` | `components-feedback-spinner--default` |
| `components-spinner--in-context` | `components-feedback-spinner--in-context` |
| `components-ssnfield--docs` | `forms-fields-ssnfield--docs` |
| `components-ssnfield--empty` | `forms-fields-ssnfield--empty` |
| `components-ssnfield--filled` | `forms-fields-ssnfield--filled` |
| `components-ssnfield--hidden` | `forms-fields-ssnfield--hidden` |
| `components-ssnfield--revealed` | `forms-fields-ssnfield--revealed` |
| `components-ssnfield--no-toggle` | `forms-fields-ssnfield--no-toggle` |
| `components-ssnfield--reveal-on-focus` | `forms-fields-ssnfield--reveal-on-focus` |
| `components-ssnfield--error` | `forms-fields-ssnfield--error` |
| `components-ssnfield--disabled` | `forms-fields-ssnfield--disabled` |
| `components-ssnfield--in-field` | `forms-fields-ssnfield--in-field` |
| `components-ssnfield--in-inline-edit` | `forms-fields-ssnfield--in-inline-edit` |
| `components-ssnfield--typing-and-pasting` | `forms-fields-ssnfield--typing-and-pasting` |
| `components-ssnfield--reveal-and-leave` | `forms-fields-ssnfield--reveal-and-leave` |
| `components-tabspill--docs` | `components-navigation-tabspill--docs` |
| `components-tabspill--vault-current` | `components-navigation-tabspill--vault-current` |
| `components-tabspill--messages-current` | `components-navigation-tabspill--messages-current` |
| `components-tabspill--hover` | `components-navigation-tabspill--hover` |
| `components-tabspill--label-changes-width` | `components-navigation-tabspill--label-changes-width` |
| `components-tabspill--keyboard-arrows` | `components-navigation-tabspill--keyboard-arrows` |
| `components-textarea--docs` | `components-inputs-textarea--docs` |
| `components-textarea--empty` | `components-inputs-textarea--empty` |
| `components-textarea--filled` | `components-inputs-textarea--filled` |
| `components-textarea--long-content` | `components-inputs-textarea--long-content` |
| `components-textarea--error` | `components-inputs-textarea--error` |
| `components-textarea--disabled` | `components-inputs-textarea--disabled` |
| `components-textarea--plain-vs-rich` | `components-inputs-textarea--plain-vs-rich` |
| `components-textarea--rich-in-field` | `components-inputs-textarea--rich-in-field` |
| `components-textarea--rich-empty` | `components-inputs-textarea--rich-empty` |
| `components-textarea--rich-filled` | `components-inputs-textarea--rich-filled` |
| `components-textarea--rich-error` | `components-inputs-textarea--rich-error` |
| `components-textarea--rich-disabled` | `components-inputs-textarea--rich-disabled` |
| `components-textarea--read-only-renderer` | `components-inputs-textarea--read-only-renderer` |
| `components-textarea--renderer-drops-unknown` | `components-inputs-textarea--renderer-drops-unknown` |
| `components-tooltip--docs` | `components-overlays-tooltip--docs` |
| `components-tooltip--icon-button` | `components-overlays-tooltip--icon-button` |
| `components-tooltip--header-icons` | `components-overlays-tooltip--header-icons` |
| `components-tooltip--expands` | `components-overlays-tooltip--expands` |
| `components-tooltip--open` | `components-overlays-tooltip--open` |
| `components-fieldaction--docs` | `forms-fields-fieldaction--docs` |
| `components-fieldaction--rest` | `forms-fields-fieldaction--rest` |
| `components-fieldaction--hover` | `forms-fields-fieldaction--hover` |
| `components-fieldaction--pressed` | `forms-fields-fieldaction--pressed` |
| `components-fieldaction--disabled` | `forms-fields-fieldaction--disabled` |
| `components-fieldaction--calendar` | `forms-fields-fieldaction--calendar` |
| `components-fieldaction--clicks` | `forms-fields-fieldaction--clicks` |
| `components-passwordfield--docs` | `forms-fields-passwordfield--docs` |
| `components-passwordfield--empty` | `forms-fields-passwordfield--empty` |
| `components-passwordfield--filled` | `forms-fields-passwordfield--filled` |
| `components-passwordfield--revealed` | `forms-fields-passwordfield--revealed` |
| `components-passwordfield--new-password` | `forms-fields-passwordfield--new-password` |
| `components-passwordfield--error` | `forms-fields-passwordfield--error` |
| `components-passwordfield--disabled` | `forms-fields-passwordfield--disabled` |
| `components-passwordfield--in-field` | `forms-fields-passwordfield--in-field` |
| `components-passwordfield--in-inline-edit` | `forms-fields-passwordfield--in-inline-edit` |
| `components-passwordfield--toggle-keeps-caret` | `forms-fields-passwordfield--toggle-keeps-caret` |
| `composites-accountmenu--docs` | `shell-accountmenu--docs` |
| `composites-accountmenu--closed` | `shell-accountmenu--closed` |
| `composites-accountmenu--no-photo` | `shell-accountmenu--no-photo` |
| `composites-appheader--docs` | `shell-appheader--docs` |
| `composites-appheader--vault` | `shell-appheader--vault` |
| `composites-appheader--vault-phone` | `shell-appheader--vault-phone` |
| `composites-appheader--setup` | `shell-appheader--setup` |
| `composites-appheader--setup-phone` | `shell-appheader--setup-phone` |
| `composites-appheader--logo-only` | `shell-appheader--logo-only` |
| `composites-areaicon--docs` | `vault-areaicon--docs` |
| `composites-areaicon--playground` | `vault-areaicon--playground` |
| `composites-areaicon--all-areas` | `vault-areaicon--all-areas` |
| `composites-areaicon--sizes` | `vault-areaicon--sizes` |
| `composites-areatile--docs` | `vault-areatile--docs` |
| `composites-areatile--not-started` | `vault-areatile--not-started` |
| `composites-areatile--in-progress` | `vault-areatile--in-progress` |
| `composites-areatile--set-up` | `vault-areatile--set-up` |
| `composites-areatile--hover` | `vault-areatile--hover` |
| `composites-areatile--all-areas-not-started` | `vault-areatile--all-areas-not-started` |
| `composites-areatile--all-areas-in-progress` | `vault-areatile--all-areas-in-progress` |
| `composites-areatile--all-areas-set-up` | `vault-areatile--all-areas-set-up` |
| `composites-choicecard--docs` | `forms-choicecard--docs` |
| `composites-choicecard--multi-tile` | `forms-choicecard--multi-tile` |
| `composites-choicecard--multi-tile-selected` | `forms-choicecard--multi-tile-selected` |
| `composites-choicecard--multi-row` | `forms-choicecard--multi-row` |
| `composites-choicecard--multi-row-selected` | `forms-choicecard--multi-row-selected` |
| `composites-choicecard--hover` | `forms-choicecard--hover` |
| `composites-choicecard--multi-interactive` | `forms-choicecard--multi-interactive` |
| `composites-choicecard--single-row` | `forms-choicecard--single-row` |
| `composites-choicecard--single-row-selected` | `forms-choicecard--single-row-selected` |
| `composites-choicecard--single-tile-selected` | `forms-choicecard--single-tile-selected` |
| `composites-factfield--docs` | `vault-factfield--docs` |
| `composites-factfield--ordinary` | `vault-factfield--ordinary` |
| `composites-factfield--ordinary-source-badge` | `vault-factfield--ordinary-source-badge` |
| `composites-factfield--autofilled` | `vault-factfield--autofilled` |
| `composites-factfield--not-found-expected` | `vault-factfield--not-found-expected` |
| `composites-factfield--not-found-optional` | `vault-factfield--not-found-optional` |
| `composites-factfield--conflict` | `vault-factfield--conflict` |
| `composites-factfield--answered` | `vault-factfield--answered` |
| `composites-factfield--select` | `vault-factfield--select` |
| `composites-factfield--textarea` | `vault-factfield--textarea` |
| `composites-factfield--grid` | `vault-factfield--grid` |
| `composites-factitem--docs` | `vault-factitem--docs` |
| `composites-factitem--person` | `vault-factitem--person` |
| `composites-factitem--pet` | `vault-factitem--pet` |
| `composites-factitem--entity` | `vault-factitem--entity` |
| `composites-factitem--document` | `vault-factitem--document` |
| `composites-factitem--with-actions` | `vault-factitem--with-actions` |
| `composites-factitem--compact` | `vault-factitem--compact` |
| `composites-factitem--two-line-detail` | `vault-factitem--two-line-detail` |
| `composites-factitem--secondary-link` | `vault-factitem--secondary-link` |
| `composites-factitem--long-name` | `vault-factitem--long-name` |
| `composites-factitem--all-kinds` | `vault-factitem--all-kinds` |
| `composites-factitem--entity-every-area` | `vault-factitem--entity-every-area` |
| `composites-flowfooter--docs` | `forms-flowfooter--docs` |
| `composites-flowfooter--cta-only` | `forms-flowfooter--cta-only` |
| `composites-flowfooter--back-and-cta` | `forms-flowfooter--back-and-cta` |
| `composites-flowfooter--full` | `forms-flowfooter--full` |
| `composites-flowfooter--disabled` | `forms-flowfooter--disabled` |
| `composites-flowfooter--custom-label` | `forms-flowfooter--custom-label` |
| `composites-flowfooter--submit-mode` | `forms-flowfooter--submit-mode` |
| `composites-flowfooter--submit-pending` | `forms-flowfooter--submit-pending` |
| `composites-flowfooter--submit-failed` | `forms-flowfooter--submit-failed` |
| `composites-headersearch--docs` | `shell-headersearch--docs` |
| `composites-headersearch--button` | `shell-headersearch--button` |
| `composites-headersearch--link` | `shell-headersearch--link` |
| `composites-headersearch--hover` | `shell-headersearch--hover` |
| `composites-inlineedit--docs` | `forms-inlineedit--docs` |
| `composites-inlineedit--input-empty` | `forms-inlineedit--input-empty` |
| `composites-inlineedit--input-filled` | `forms-inlineedit--input-filled` |
| `composites-inlineedit--select` | `forms-inlineedit--select` |
| `composites-inlineedit--textarea` | `forms-inlineedit--textarea` |
| `composites-inlineedit--select-keys` | `forms-inlineedit--select-keys` |
| `composites-inlineedit--field` | `forms-inlineedit--field` |
| `composites-itemrow--docs` | `vault-itemrow--docs` |
| `composites-itemrow--anatomy` | `vault-itemrow--anatomy` |
| `composites-itemrow--open` | `vault-itemrow--open` |
| `composites-itemrow--rows-in-panel` | `vault-itemrow--rows-in-panel` |
| `composites-itemrow--first` | `vault-itemrow--first` |
| `composites-itemrow--partial` | `vault-itemrow--partial` |
| `composites-itemrow--present` | `vault-itemrow--present` |
| `composites-itemrow--declined` | `vault-itemrow--declined` |
| `composites-itemrow--long-actions` | `vault-itemrow--long-actions` |
| `composites-itemrow--in-quiet-panel` | `vault-itemrow--in-quiet-panel` |
| `composites-linkout--docs` | `vault-linkout--docs` |
| `composites-linkout--wide` | `vault-linkout--wide` |
| `composites-linkout--narrow` | `vault-linkout--narrow` |
| `composites-linkout--one-link` | `vault-linkout--one-link` |
| `composites-notificationbell--docs` | `shell-notificationbell--docs` |
| `composites-notificationbell--nothing-unread` | `shell-notificationbell--nothing-unread` |
| `composites-notificationbell--unread` | `shell-notificationbell--unread` |
| `composites-notificationbell--link` | `shell-notificationbell--link` |
| `composites-notificationbell--panel-open` | `shell-notificationbell--panel-open` |
| `composites-notificationbell--states` | `shell-notificationbell--states` |
| `composites-pageintro--docs` | `patterns-pageintro--docs` |
| `composites-pageintro--page` | `patterns-pageintro--page` |
| `composites-pageintro--display` | `patterns-pageintro--display` |
| `composites-pageintro--with-actions` | `patterns-pageintro--with-actions` |
| `composites-pageintro--title-only` | `patterns-pageintro--title-only` |
| `composites-pageintro--question` | `patterns-pageintro--question` |
| `composites-panel--docs` | `patterns-panel--docs` |
| `composites-panel--default` | `patterns-panel--default` |
| `composites-panel--muted` | `patterns-panel--muted` |
| `composites-panel--quiet` | `patterns-panel--quiet` |
| `composites-panel--with-more` | `patterns-panel--with-more` |
| `composites-panel--description-only` | `patterns-panel--description-only` |
| `composites-panel--description-and-content` | `patterns-panel--description-and-content` |
| `composites-panel--empty` | `patterns-panel--empty` |
| `composites-statusdot--docs` | `vault-statusdot--docs` |
| `composites-statusdot--open` | `vault-statusdot--open` |
| `composites-statusdot--partial` | `vault-statusdot--partial` |
| `composites-statusdot--present` | `vault-statusdot--present` |
| `composites-statusdot--declined` | `vault-statusdot--declined` |
| `composites-statusdot--waiting` | `vault-statusdot--waiting` |
| `composites-statusdot--working` | `vault-statusdot--working` |
| `composites-statusdot--done` | `vault-statusdot--done` |
| `composites-statusdot--attention` | `vault-statusdot--attention` |
| `composites-statusdot--all-statuses` | `vault-statusdot--all-statuses` |
| `composites-statusdot--present-every-area` | `vault-statusdot--present-every-area` |
| `composites-steprail--docs` | `shell-steprail--docs` |
| `composites-steprail--first` | `shell-steprail--first` |
| `composites-steprail--middle` | `shell-steprail--middle` |
| `composites-steprail--last` | `shell-steprail--last` |
| `composites-steprail--beat-label` | `shell-steprail--beat-label` |
| `composites-steprail--all-positions` | `shell-steprail--all-positions` |
| `composites-personpicker--docs` | `vault-personpicker--docs` |
| `composites-personpicker--default` | `vault-personpicker--default` |
| `composites-personpicker--with-pet` | `vault-personpicker--with-pet` |
| `composites-personpicker--pending` | `vault-personpicker--pending` |
| `composites-personpicker--disabled` | `vault-personpicker--disabled` |
| `composites-personpicker--no-candidates` | `vault-personpicker--no-candidates` |
| `composites-personpicker--no-add` | `vault-personpicker--no-add` |
| `composites-personpicker--custom-label` | `vault-personpicker--custom-label` |
| `composites-personpicker--narrow` | `vault-personpicker--narrow` |
| `composites-personpicker--interactive` | `vault-personpicker--interactive` |
| `composites-personpicker--picks` | `vault-personpicker--picks` |
| `composites-uploadrow--docs` | `vault-uploadrow--docs` |
| `composites-uploadrow--open` | `vault-uploadrow--open` |
| `composites-uploadrow--not-ready` | `vault-uploadrow--not-ready` |
| `composites-uploadrow--readable-card` | `vault-uploadrow--readable-card` |
| `composites-uploadrow--partial` | `vault-uploadrow--partial` |
| `composites-uploadrow--reading` | `vault-uploadrow--reading` |
| `composites-uploadrow--read` | `vault-uploadrow--read` |
| `composites-uploadrow--read-failed` | `vault-uploadrow--read-failed` |
| `composites-uploadrow--filed` | `vault-uploadrow--filed` |
| `composites-uploadrow--long-name` | `vault-uploadrow--long-name` |
| `composites-uploadrow--narrow` | `vault-uploadrow--narrow` |
| `composites-uploadrow--interactive` | `vault-uploadrow--interactive` |
| `composites-uploadrow--picks-a-file` | `vault-uploadrow--picks-a-file` |
| `composites-capturecard--docs` | `vault-capturecard--docs` |
| `composites-capturecard--anatomy` | `vault-capturecard--anatomy` |
| `composites-capturecard--with-person-picker` | `vault-capturecard--with-person-picker` |
| `composites-capturecard--with-upload-row` | `vault-capturecard--with-upload-row` |
| `composites-capturecard--with-form` | `vault-capturecard--with-form` |
| `composites-capturecard--inline` | `vault-capturecard--inline` |
| `composites-capturecard--no-close` | `vault-capturecard--no-close` |
| `composites-capturecard--narrow` | `vault-capturecard--narrow` |
| `composites-capturecard--closes` | `vault-capturecard--closes` |

</details>

## Held list

5 items, all built. R7-02 and R7-05 found and fixed the two layer violations the moves introduced (above). New gaps from the build: GAPS #102–#106 (round 8).
