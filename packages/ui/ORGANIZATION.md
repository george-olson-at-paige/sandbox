# @paige/ui — organization review (2026-10-19)

> **Built (2026-10-19, round 7): ranks 1–7 below, adopted as R7-01…R7-05 in [`REVIEW-7.md`](../../REVIEW-7.md)** (with the Built notes, the verification and the story-id table). Differences from this page: Vault composites stay in the package under `src/vault/`; StepRail went to Shell (REVIEW-7's list) rather than Patterns; FlowFooter is kept beside FormFooter rather than folded into it; the base rule names `src/forms` as well as `src/components`; `AreaId` stays in `icons/` (GAPS #104). Rank 8 (naming) is not built beyond the TabsPill file rename. **Round 8 (admin readiness):** the organization holds for admin, with Shell moved below the products; see §8. The current rules are in `CLAUDE.md`; this page is the reasoning as of 2026-10-19 and the paths in §1–§3 are the old tree.

How the package and its Storybook are organized today, what to keep, what to change, and where forms go. Read with `CLAUDE.md` (the layers and rules) and `REVIEW-1` R1-22 / R1-30 (why the layers and the folder-driven nav exist). Counts are from the tree and `http://localhost:6106/index.json` on 2026-10-19 (commit `e952e50d5`).

## 1. Snapshot

| Folder | Storybook section | What lives there | Titles · stories |
|---|---|---|---|
| `src/docs` | Overview | Introduction, Which layer do I use? (MDX) | 2 · 0 |
| `src/foundations` | Foundations | Theme, layout tokens, icons | 3 · 11 |
| `src/layouts` | Layouts | Layout primitives (Flex, Stack, Inline, Grid, Split, Placeholder) **and** page layouts (Page, PageHeader, HomePage, AreaPage, SetupBeat, RailPanels), plus the Breakpoints story | 13 · 53 |
| `src/components` | Components | Paige wrappers over base (Button, Card, Input, Select…), Paige-only pieces (Eyebrow, Dot, Menu, TabsPill, DisclosureTrigger), the Field frame, 7 typed fields + FieldAction, and 9 unstoried helper files (`control.ts`, `field-support.tsx`, `masked-input.tsx`, `date-input.tsx`, `rich-text*.tsx`, `pointer.ts`, `popover-surface.ts`, `tabs-pill-list.tsx`) | 30 · 214 |
| `src/composites` | Composites | App chrome (AppHeader, AccountMenu, NotificationBell, HeaderSearch), Vault domain (AreaIcon, AreaTile, FactField, FactItem, ItemRow, LinkOut, StatusDot), generic patterns (Panel, PageIntro, StepRail, ChoiceCard, InlineEdit, FlowFooter) | 17 · 107 |
| `src/base` | Base | Upstream shadcn, untouched; reference only | 25 · 66 |
| `src/lib`, `src/icons`, `src/schemas`, `src/stories` | — | `cn`, dates/mask/locale logic; Area and view glyphs (+ the `AreaId` type); rich-text JSON schema; story fixtures and helpers | — |

Catalog: 59 components. App (`apps/web`) imports 32 distinct package entry points from 11 feature files.

## 2. What works (keep)

| Keep | Why |
|---|---|
| Folder = Storybook section, no `title:` lines (`.storybook/main.ts` `SECTIONS`) | A file's place in the tree is its place in the sidebar; renaming a section is one line; nothing lands in the wrong place. Every change below builds on this. |
| Base untouched + Paige layer that narrows (R1-22) and `ui:add` / `ui:diff-base` | Upstream bumps are diffable; our API stays small. All 22 bases matched the registry on 2026-10-18. |
| Import rule checked by a script (`check:layers`), headed for ESLint (R2-42) | Agents follow a failing check; they don't reliably follow prose. |
| Generated catalog ("I need… → use…") from index + one-line `/** purpose */` | The fastest findability tool for agents; stays true because it's generated. |
| Story next to the file; tracking ids in tags, not names | Story ids stay stable across review rounds. |
| Field value shapes in `CLAUDE.md` (ISO strings, E.164, cents; never `Date`) and pure, tested logic in `lib/` | The right contract for forms; keep it as the Forms section's rulebook. |
| "A new page layout is a foundation change: ask first" | Matches `agents/product-engineering.md` step 3. |

## 3. Problems found

| # | Problem | Evidence | Effect |
|---|---|---|---|
| P1 | **Layouts holds the lowest and the highest tier.** Primitives depend on nothing; page layouts import composites. | `layouts/setup-beat.tsx` imports `composites/app-header`, `page-intro`, `step-rail`; `layouts/rail-panels.tsx` imports `area-icon`, `fact-item`, `panel`, `status-dot`. Meanwhile `components/message.tsx` imports `layouts/split`. | The real graph is base → components → composites → page layouts, with primitives *under* components. The sidebar (Layouts before Components) and `which-layer.mdx` imply the opposite. `check:layers` only enforces "nothing but components imports base", so a cycle (a composite importing a page layout) would pass. |
| P2 | **RailPanels is a composite filed as a layout.** | Renders Panels from data, imports four composites. | Findability: "rail" items are split across two sections. |
| P3 | **Forms are scattered across two layers and one name means three things.** | Field frame + 7 typed fields + FieldAction in Components; InlineEdit, ChoiceCard, FlowFooter (submit mode, R2-38), FactField in Composites. "Field" = the frame (`Field`), a bare control (`PhoneField` has no label or error), and a domain row (`FactField`). | The 7 field stories import `composites/inline-edit` (upward, story-only). No single place answers "how do I build a form". |
| P4 | **Every form hand-wires ids, error state and section headings.** | `apps/web/features/setup/about-you-beat.tsx`: manual `aria-describedby="mobile-description mobile-error"` plus `<span id>`s inside FieldDescription/FieldError, `mobileError` state per field, and a hand-built section rule `div.mt-8.mb-3.flex…` + Eyebrow + Separator (GAPS #50) against the "arrange with primitives" rule. Field's context (`components/field.tsx`) carries only `labelId`. | Multiplies with every form; easy to get a11y wrong; agents copy it. |
| P5 | **Composites mixes three kinds.** | Generic (Panel, StepRail, PageIntro), app chrome (AppHeader + 3 header parts + `header-target.ts`), Vault domain (AreaTile, FactItem, ItemRow, StatusDot…). | Will not scale; the domain pieces are the ones most likely to move to the app in the real package (D26), and they're indistinguishable from reusable ones. |
| P6 | **Export surface is a wildcard over everything.** | `"./components/*": "./src/components/*.tsx"` exposes internals (`field-support`, `masked-input`, `date-input`, `rich-text-editor`); `.ts` helpers need hand-added lines (`tabs-pill`, `control`), `header-target.ts`/`popover-surface.ts` aren't exported; `./lib/*` exposes `*.test.ts`. | No public/private line; an app import of `useFieldError` would be legal. |
| P7 | **Names that mislead.** | TabsPill is imported from `tabs-pill-list` (catalog needs an `OVERRIDES` entry); `ItemRow` (composite) vs `Item` (component) vs `AreaRow` in `apps/web/features/area/item-row.tsx`; `PageHeader` (layouts) vs `PageIntro` (composites) for neighbouring jobs; `AreaId` lives in `icons/area-glyphs` and `components/badge.tsx` imports a domain type from icons. | Agents pick by name; each mismatch costs a lookup or a wrong pick. |
| P8 | **Story-only scaffolding ships.** | `layouts/placeholder.tsx` is used only by stories and `stories/fixtures.tsx`, yet is exported and catalogued. Breakpoints is a token display filed in Layouts "to keep its section" (R1-30). | Noise in the catalog and the export list. |
| P9 | **Components is at 30 titles and flat.** | Actions, inputs, display, feedback, navigation and overlays side by side. | Fine today; past ~35 it stops being scannable. Moving the fields out (§4) buys time. |
| P10 | **Recurring theme in the review history.** | R1-22, R1-25, R1-29, R1-30, R3-14, R3-16, R4-08, R4-10 were all "which layer / which name / is this its own component". | The structure, not just the components, is being re-litigated each round; a tier table with a check settles most of these mechanically. |

## 4. Forms

**Recommendation: a top-level `src/forms` folder = a Forms section**, one tier above Components (forms import components and primitives; patterns, Vault and templates import forms). It owns its own rules (value shapes, errors, submit) and will be the fastest-growing section.

### Levels

| Level | What | Examples | Lives in | Section |
|---|---|---|---|---|
| 1. Controls | Bare inputs; no label, no value semantics beyond text/choice. Used outside forms too (a filter Select, a search Input). | Input, Textarea (+ rich), Select, RadioGroup, Checkbox and Toggle when first needed | `src/components/inputs/` | Components/Inputs |
| 2. Fields | Value-shaped controls: parse, format, validate, report their own error. | DateField, DateOfBirthField, PhoneField, PostalCodeField, SsnField, CurrencyField, PasswordField; next EmailField; compound AddressFields when a second screen needs an address | `src/forms/fields/` (internals in `src/forms/internal/`) | Forms/Fields |
| 3. Form patterns | The frame and behaviour every form shares. | Field, FieldGroup, FieldSet/FieldLegend, FieldLabel/Description/Error; **new** FormSection (GAPS #50), Form (submit, pending, server errors), ErrorSummary, FormFooter; FlowFooter (= FormFooter + step nav); InlineEdit (ChoiceCard moved to Vault, R11-05) | `src/forms/` | Forms |
| 4. Domain forms | Capture forms for one feature, bound to its API contract. | AboutYouForm, PersonForm, PolicyForm | `apps/web/features/<feature>/forms/<thing>-form.tsx`; promote to `src/vault/forms/` only when a second feature needs it **and** it carries no API types | (app) / Vault/Forms |

Comparison: Atlassian (`Field` frame + bare `Textfield` + `Form`/`FormFooter`), Primer (`FormControl` frame wires label, caption, validation into any input via context; Forms is a *pattern* page), Carbon and Polaris (form layout and validation as patterns, separate from inputs), shadcn (`Field` frame; `Form` pattern; full forms are *blocks*). All four keep domain forms out of the component library.

### How a form is composed

```tsx
// apps/web/features/setup/forms/about-you-form.tsx (domain form)
<Form onSubmit={save} errors={serverErrors}>            {/* pending, retry, ErrorSummary, no double submit */}
  <FieldGroup>
    <Field name="legalName">
      <FieldLabel>Legal name</FieldLabel>
      <Input />                                          {/* id, aria-describedby, aria-invalid from Field context */}
      <FieldDescription>This is the name on your ID…</FieldDescription>
      <FieldError />                                     {/* shows the field's own or the server's message */}
    </Field>
    <Field name="mobile" span={6}><FieldLabel>Mobile number</FieldLabel><PhoneField /><FieldError /></Field>
  </FieldGroup>
  <FormSection title="Where you live">…</FormSection>
  <FormFooter submitLabel="Save my details" />          {/* or FlowFooter inside SetupBeat */}
</Form>
// the beat (route) stays: SetupBeat + <AboutYouForm/>; the page owns navigation, the form owns data.
```

### Rules (add to `CLAUDE.md` under Forms)

1. **Field context wires the control** (Primer `FormControl` model): Field provides `controlId`, `descriptionId`, `errorId`, `invalid`, `disabled`, `required`; every control and field reads it. No hand-written `id` / `aria-describedby` in the app.
2. **Value shapes stay the contract** (current Fields table): ISO date strings, E.164, integer cents, ZIP strings; never `Date`, never a float. Export them as named types in `src/forms/values.ts` (`IsoDate`, `E164`, `Cents`…).
3. **Complete or empty** (current rule) and **empty is not an error**: required-ness is the form's.
4. **One error-copy map** (R5-04): `src/forms/messages.ts`, keyed by field and failure; fields read defaults from it; product copy lands in one edit.
5. **Server errors** arrive as `{ field: message }` and render in the same FieldError slot; a form-level error renders in ErrorSummary, which takes focus and links to each invalid field.
6. **Submit state** comes from `Form`, not each screen: idle → pending (disabled, label says so) → success (navigate or show in place; no success banner) → failure (message, input kept, retry). Double submit impossible. Unsaved changes warn (`agents/product-engineering.md` step 7).
7. **Sections with FormSection**, never a hand-built eyebrow + separator row.
8. **Domain forms live with their feature**; the route composes template + form.
9. Form-state library: Engineering decides when the first save endpoint lands (R2-38); `Form`'s API above doesn't depend on the choice.

### Target forms tree

```
src/forms/
  field.tsx            Field, FieldLabel, FieldDescription, FieldError
  field-group.tsx      FieldGroup
  field-set.tsx        FieldSet, FieldLegend
  form.tsx             new: Form (submit/pending/server errors)
  error-summary.tsx    new
  form-section.tsx     new (GAPS #50)
  form-footer.tsx      new: submit + cancel
  flow-footer.tsx      from composites
  inline-edit.tsx      from composites
  choice-card.tsx      from composites
  messages.ts          new (R5-04)
  values.ts            new: value-shape types
  fields/              date-field, date-of-birth-field, phone-field, postal-code-field,
                       ssn-field, currency-field, password-field, field-action
  internal/            field-support, masked-input, date-input   (not exported)
```

## 5. Recommendations, ranked

| Rank | Change | Why | Moves | Cost | Impact · effort |
|---|---|---|---|---|---|
| 1 | **Split Layouts into `primitives/` and `templates/`**; RailPanels → `vault/`; Breakpoints → Foundations; Placeholder → `src/stories/` (unexported) | Fixes P1, P2, P8; makes the folder order the dependency order | `flex, stack, inline, grid, split` → `primitives/`; `page, page-header, home-page, area-page, setup-beat` → `templates/` | ~13 story ids, ~10 app import lines, `check-tokens.mjs` page-frame path, docs | High · Low |
| 2 | **Tier table in `check:layers`** (each folder may import only lower tiers; see §6) | Fixes P1/P10 mechanically; settles "which layer" by a failing check | none | one script; later the ESLint rule (R2-42) | High · Low |
| 3 | **Forms section** (§4): move Field, the 7 fields, FieldAction, InlineEdit, ChoiceCard, FlowFooter; internals to `forms/internal/` | Fixes P3; George's question; one home before forms multiply | 12 files + 3 internals | ~12 story ids, `about-you-beat.tsx` and `roles-beat.tsx` imports, catalog | High · Medium |
| 4 | **Field context wiring + FormSection + Form/ErrorSummary + messages map** | Fixes P4; every future form is shorter and accessible by default | new code in `forms/` | About You rewritten as the first consumer; stories per state | High · Medium |
| 5 | **Split Composites into `patterns/`, `shell/`, `vault/`**; `AreaId` → `vault/areas.ts` | Fixes P5, part of P7; marks what is Vault-specific before the real package (D26) | Panel, PageIntro, StepRail → patterns; AppHeader, AccountMenu, NotificationBell, HeaderSearch, header-target → shell; AreaIcon, AreaTile, FactField, FactItem, ItemRow, LinkOut, StatusDot, RailPanels → vault | 16 story ids, ~10 app imports | Medium · Low |
| 6 | **Explicit export surface**: `internal/` folders never exported; one exports map covering `.ts` and `.tsx` the same way; drop `*.test.ts` from `./lib/*`; rename `tabs-pill-list.tsx` → `tabs-pill.tsx` (styles → `tabs-pill-styles.ts`) | Fixes P6, part of P7; removes the catalog OVERRIDE | `control.ts`, `pointer.ts`, `popover-surface.ts` → `components/internal/` | package.json; 2 app imports | Medium · Low |
| 7 | **Purpose subfolders inside Components**: `actions/`, `inputs/`, `display/`, `feedback/`, `navigation/`, `overlays/` (the Polaris/Atlassian categories) | P9; do it in the same move as 1/3/5 so story ids change once | 21 remaining components | ~21 story ids; indexer must PascalCase every segment | Medium · Low (if bundled), else defer to ~35 titles |
| 8 | **Naming pass** (product call where user-facing): document "Field = frame, *Field = value-shaped control" in Forms; consider `FactField` → a name without "Field" (e.g. `FactLine` or `KeyDetail`) and `AreaRow` file to `area-row.tsx` | P3/P7 name collisions | file renames | small; FactField rename is ~5 files | Low · Low |

**Should the four layers stay the top level?** Keep *tiers* as top-level folders (cheap to enforce, and the review history shows the folder rule is what holds), but make each folder one tier *and* one kind. Purpose (actions, inputs, feedback…) becomes the second axis: subfolders inside Components and Forms. A Polaris-style purpose-first top level would lose the folder-based import check, which is the main guardrail for agents. Feedback, Navigation, Overlays and Data display are worth having now as *Components subgroups*, not top-level sections: each has 1–4 members.

## 6. Proposed target structure

Tier order (each may import only lower ones): `lib, icons` → `base` → `primitives` → `components` → `forms` → `patterns` → `shell`, `vault` → `templates`. Foundations, docs and stories import anything.

| Folder | Sidebar |
|---|---|
| `src/` | |
| `  docs/` | **Overview** — Introduction, Which section do I use? |
| `  foundations/   theme, layout, icons, breakpoints` | **Foundations** — Theme, Layout, Icons, Breakpoints |
| `  primitives/    flex, stack, inline, grid, split` | **Primitives** — Flex, Grid, Inline, Split, Stack |
| `  components/` | **Components** |
| `    actions/     button, disclosure-trigger, menu, dropdown-menu` | › Actions — Button, DisclosureTrigger, DropdownMenu, Menu |
| `    inputs/      input, textarea, rich-*, select, radio-group` | › Inputs — Input, RadioGroup, Select, Textarea |
| `    display/     avatar, badge, card, collapsible, dot, eyebrow, item, separator` | › Display — Avatar, Badge, Card, Collapsible, Dot, Eyebrow, Item, Separator |
| `    feedback/    callout, progress, spinner` | › Feedback — Callout, Progress, Spinner |
| `    navigation/  tabs-pill` | › Navigation — TabsPill |
| `    overlays/    tooltip` | › Overlays — Tooltip |
| `    internal/    control, pointer, popover-surface` | (none) |
| `  forms/         field, form, form-section, form-footer, error-summary, flow-footer, inline-edit, messages, values` | **Forms** — Field, Form, FormSection, FormFooter, ErrorSummary, FlowFooter, InlineEdit |
| `    fields/      date, date-of-birth, phone, postal-code, ssn, currency, password, field-action` | › Fields — CurrencyField, DateField, DateOfBirthField, FieldAction, PasswordField, PhoneField, PostalCodeField, SsnField |
| `    internal/    field-support, masked-input, date-input` | (none) |
| `  patterns/      panel, page-intro, step-rail` | **Patterns** — PageIntro, Panel, StepRail |
| `  shell/         app-header, account-menu, notification-bell, header-search, header-target` | **Shell** — AccountMenu, AppHeader, HeaderSearch, NotificationBell |
| `  vault/         area-icon, area-tile, choice-card, fact-field, fact-item, item-row, link-out, status-dot, rail-panels, areas.ts` | **Vault** — AreaIcon, AreaTile, ChoiceCard (R11-05: it carries Vault meaning, area chips and Setup's roles and motivations), FactField, FactItem, ItemRow, LinkOut, RailPanels, StatusDot |
| `  templates/     page, page-header, home-page, area-page, setup-beat` | **Templates** — AreaPage, HomePage, Page, PageHeader, SetupBeat |
| `  base/` | **Base (upstream)** — last, collapsed |
| `  lib/  icons/  schemas/  stories/ (fixtures, field-frame, placeholder)` | (none) |

Sidebar order = reading order for a screen builder: Overview, Foundations, Primitives, Components, Forms, Patterns, Shell, Vault, Templates, Base. ("Shell" and "Templates" are the words `agents/product-engineering.md` already uses for step 3.)

## 7. Migration notes (if approved)

1. Agree the tier table and names (§6) and whether rank 7 rides along; one id churn is cheaper than three.
2. Update `scripts/check-layers.mjs` to the tier table first, and see it fail on today's tree (it should report nothing new: today's edges are already downward once Layouts is split).
3. Move files with `git mv` (+ `git add -f`, the `packages/` trap); fix relative imports; leave every `internal/` folder out of the exports.
4. `package.json` exports: `./primitives/*`, `./forms/*`, `./patterns/*`, `./shell/*`, `./vault/*`, `./templates/*`, subfolder-aware `./components/*`; one rule for `.ts` and `.tsx`; drop `./layouts/*` and `./composites/*`.
5. `.storybook/main.ts`: new `SECTIONS`; change `pascalLast` to PascalCase every segment after the prefix (subfolders would otherwise show as `Components/inputs/Input`); `preview.tsx` `storySort` to the new order. Restart Storybook (CLAUDE.md trap).
6. `scripts/check-tokens.mjs`: the page-frame / whole-step allowance moves from `src/layouts` to `src/templates` and `src/primitives`.
7. `scripts/catalog.mjs`: Layer column from the folder; drop the TabsPill override after the rename; regenerate.
8. Docs: `CLAUDE.md` layers table, import rule, "How to add…", Forms rules (§4); `docs/which-layer.mdx` → "Which section do I use?"; `docs/introduction.mdx`.
9. App: update imports in `apps/web/features/**` and `app/**`; then rebuild About You as the first `Form` consumer (rank 4) and walk it in the browser.
10. Story ids change for every moved file (e.g. `components-datefield--docs` → `forms-fields-datefield--docs`); REVIEW/GAPS links are history and stay as written.
11. Run `npm run typecheck`, `npm test -w packages/ui`, `npm run check`, `npm run build`, `npm run build-storybook -w packages/ui`, `npm run catalog -w packages/ui`.

## 8. Admin readiness (R8-06…R8-11, 2026-10-19)

**Verdict: holds, with one change to the order.** The R7 organization took the admin's pieces (side nav, KPI cards, sparklines, a chart, a data table, a page template) without moving any existing file and without one upward or sideways import. The one change: **Shell moved from a peer of Vault to its own step below the products** (`… → patterns → shell → vault|admin → templates`), because shared chrome (AccountMenu in the admin's top bar, AppHeader for the customer) has to be usable by both products, and peers can't import each other. Shell never imported Vault, so nothing broke. Charts as a peer of Components with a lazy entry was planned (R8-06) and needed nothing else.

| Piece | Where it landed | Why there |
|---|---|---|
| Sidebar | Components › Navigation | Generic, data-driven, wraps the shadcn base |
| Stat, Sparkline, DataTable | Components › Display | Generic data display; Sparkline is inline SVG, so Stat never pulls in a chart library |
| Skeleton | Components › Feedback | Loading placeholder for any data with a known shape |
| `lib/metrics.ts` | lib | Pure number and delta formatting, tested with `node --test` |
| Chart, LazyChart | Charts (peer of Components) | Recharts behind a dynamic import; its own entry points |
| KpiCard | Patterns | Card + Stat; generic |
| AdminSidebar, MetricCard | Admin (peer of Vault) | The admin's nav and its same-window metric rule: admin meaning |
| AdminPage | Templates | Slots only (sidebar, title, actions, global actions); imports nothing from `admin/` |

**Evidence.**

- `npm run check:layers`: 0 findings with `admin/` and `charts/` in `TIERS`; the template takes the admin nav as a slot, so Templates → Admin is never an edge.
- The proof (`src/admin/pulse.stories.tsx`, Admin › Pulse; AdminProof until R17-22) composes AdminPage, AdminSidebar, four MetricCards, a LazyChart and a DataTable from `@paige/ui/…` entry points only; `check:exports` (PROOF) fails on any relative or non-entry import in it (tried: a relative `../primitives/grid` is reported). The same page is the app route `/admin` (`apps/web/features/admin/pulse-screen.tsx`).
- Bundle rule, on `next build`: Recharts is in exactly one client chunk (366 KB minified). The only chunk that loads it is a dynamic-import loader that appears in `/admin`'s client reference manifest alone; the manifests of `/`, `/area/[id]`, `/setup/roles` and `/setup/about-you` reference neither the Recharts chunk nor its loader, and the prerendered HTML of the static routes doesn't either. Checked by grepping `.next/static/chunks/*.js` for Recharts and `.next/server/app/**/page_client-reference-manifest.js` for the chunk ids.
- Plays: all 124 stories in the touched sections pass in the static build; axe reports nothing new on the admin pieces except AccountMenu's trigger (GAPS #109, existing component).

**Smaller changes the proof needed** (tooling, not structure): `BASE_IMPORTERS` includes `charts`; the shadcn `hooks` alias points at `src/base` (the sidebar's `use-mobile`); `ui:add` answers no to overwrite prompts (it stopped after the first one); the token check no longer reads a three-digit GAPS number as a hex colour; theme roles for the sidebar and chart series were mapped onto Paige tokens instead of the CLI's hsl and `.dark` values.

**What would make it not hold.** Admin pieces that want Vault's (a person row on an admin person page): the answer is to move the shared piece down to Patterns or Components, not to let the products import each other. If `admin/` grows past a handful of files it should get subfolders like Components did (rank 7).

**Future members of `charts/`** (out of scope this round, REVIEW-8 R8-12): a Sankey (signup paths in Pulse's Activity) and a DAG (journeys and job pipelines). Both go in `src/charts`, loaded through the lazy entry like Chart, with their own hidden-table or list fallback for screen readers.

**Future consumers of `charts/`** (R10-05, deferred, George 2026-10-19; R11-03, 2026-10-20). User journeys get their own component when they come, and the Sankey its own; neither shares a name with **DagFrame** (GraphFrame until R11-03), which is the DAG: steps and their dependencies (fit, zoom, keyboard, list view, details panel). The names `Graph`/`GraphFrame` stay free for other kinds of graph. What a journey may share is the shared pieces below `charts/`: `StatusMark` (components/display) and, if it fits, the pure layout model; nothing by name.

**Blankslate** (R10-04, deferred, George 2026-10-19). Primer's name for a large-area empty or error state: an icon or illustration, a heading, a line of explanation and one action, used when a whole region (a graph, a table, a page section) has nothing to show. When it's built it goes in Components › Feedback, and GraphFrame's and DataTable's whole-region empty and error states move onto it; the small empty pieces elsewhere (a component's `emptyMessage`, a row's "Nothing yet") stay as they are.

## 9. Admin site structure: navigation (R13-09, 2026-10-20)

Checked whether moving between admin pages reloads the document: it doesn't. On `/admin/people` (and `/admin`, `/admin/people/[id]`), a marker set on `window` survived every move (sidebar Pulse → People, the name link to a person, "Back to People", the row click through `router.push`), and the page kept one navigation entry. What makes it so, and what keeps it so:

- **Every package link takes the app's router link.** Components that render a destination accept `linkAs` (Sidebar, AdminSidebar through AdminPage, DropdownMenu/RowActions link entries, AccountMenu, PipelineGraph's logs link, People's name column); the app passes `next/link`'s `Link`. Without it they fall back to a plain `<a>`, which is right in Storybook and wrong in the app: an admin screen that forgets `linkAs` reloads the page on every click. AdminPage takes `linkAs` once and hands it to its sidebar; a screen gives it to each list or menu it renders.
- **Code that navigates uses the router**, never `location`: a row click is `router.push(href)`, URL state is `router.replace` (useListUrlState, the selected DAG step).
- **One root layout.** `/admin` has no layout of its own; Next reloads the document when a link crosses root layouts, so an admin root layout (if it comes) must be the only one the admin's pages share.
- **Destinations without a page.** `adminNav` lists Partners, Subscriptions, Offers (Plans since R15-09), Reporting, Journeys, Usage and Jobs, which have no route yet: their links prefetch to a 404 (two console 404s on `/admin`) and land on Next's not-found page. Each gets a stand-in route as its list page lands (Partners next, R13-22), or the entry is switched off until then (absent beats broken).

## 10. The partner page's sections (R15-05, deferred, George 2026-10-20)

The partner page (`/admin/partners/[slug]`, a stand-in) is where a partner is configured; the Partners list only shows and links. Its sections, in order, when it's designed:

- **Plans:** each plan (Customer, VIP, Employee, any other segment) with its signup slug, the member's price and the Stripe price behind it, its launch date (A39), and who keeps an old price when it changes (carried from R13-22).
- **Offers:** the ad strip offers, as the list's Manage offers dialog edits them today (R15-15).
- **Preferred organizations for gifting.**
- **Branding:** the banner logo (the list's Update logo today) and how Paige co-brands for the partner.
- **Rev share:** built in round 15 (R15-11): a switch per plan, the parameter set (Global defaults or Override), the results and the statement link.
- **Deactivate partner:** last, destructive, confirmed with a reason (REVIEW-15 Decided (c)).

The stand-in lists the first four as placeholders and builds Rev share and Deactivate.

## 11. The Vault by fact group, and layouts that nest (S-17…S-20, George 2026-10-29)

**Folders follow what a fact is, not where it shows.** A contact appears on Family, Personal and the Will; which Area shows a fact is placement, and placement is stored data (a registry of type → Area), not structure. So `src/vault` is grouped by the catalog's subject kinds (`docs/fact-catalog.md` §1), and each folder is its Storybook section:

| Folder | Holds | Subject kinds |
|---|---|---|
| root | the bases every group shares: FactItem, FactField, ItemRow, StatusDot, CaptureCard, ChoiceCard, RemoveDialog, the general stack rules; FactList and its scopes when they land | — |
| `areas/` | Area summaries and chrome: AreaIcon, AreaTile, RailPanels, LinkOut | — |
| `people/` | people and pets on a list: picking, quick add, the add form | contact, pet |
| `documents/` | filing and showing documents | document |
| `organizations/` (to come) | | business; trust when it is scoped (§29 #34) |
| `accounts/` (to come) | | account, loan, recurringPayment, externalAccount, policy |
| `property/` (to come) | | asset, vehicle |
| `memories/` (to come) | | memory, message |

As in a build tree, the bases sit at the root and the specialisations in folders. A group imports the root and never another group; the root never imports a group (`check:layers` GROUP). Groups meet only through the catalog, so FactList never knows about People, and adding a group touches nothing else. `packages/facts` (TS-BAR.md §1) uses the same groups. A folder is made when its first part lands.

**Layouts and templates nest; there is never one at a time.** A layout is any part whose job is to place named slots. Setup › AboutYou is five at once: Page → SetupBeat → FormSection → FieldGroup → Field. A screen is a tree of layouts, and a template is a layout that fills some of its slots with other layouts (AboutYou's frame is a template of templates). Three consequences:

- **Each layout exports its slot type and a frame, filled twice:** a Wireframe of measured placeholders (`src/stories/placeholder.tsx`) and the content. AboutYou's "one frame, two fillings" is the pattern. The Wireframe orients the reader before the detail; it is required from level 1 (LEVELS.md) for every layout and every `areas/` part.
- **A Wireframe is drawn as a plan** (George 2026-10-30, REVIEW-18 § Guides): every Placeholder is a plan cell — hairlines that run 8px past its corners with a mark on each crossing (`src/stories/guides.tsx`, from shadcn.io's Guides, conformed) — not a dashed grey box. It is Placeholder's default, so a Wireframe gets it by using Placeholder; `plan={false}` is for the odd story where lines would collide, and the xs size draws lines without marks. The lines are story-only CSS (`stories/guides.css`, imported by `.storybook/preview.css`), never part of the theme.
- **Each layout level is also a scope** (S-10): Area page → section (ItemRow) → FactList → Fact are layouts and contexts at once, which is why the context tree and the layout tree come out the same shape.
- **Placement names a slot in a layout** ("this item goes in the Family Area's people section"), stored as data. A part never decides its own placement.

## 12. Product areas; a folder's section is what it is for (George 2026-10-30)

A review of the sidebar found three roots that weren't a kind, and one part filed by what it imports rather than what it is for. The rule the fixes share: **a folder answers "what is this for?"; its dependencies decide only how low it may sit.**

| Finding | Was | Now |
|---|---|---|
| Essential Setup was spread across four roots: StepRail in Shell, FlowFooter in Forms, the composed steps in Setup (stories only, not a layer), SetupBeat in Templates. FlowFooter was in Forms because it reads `useForm`'s state and uses the shared submit button, but only the two setup beats use it. | `shell/step-rail.tsx`, `forms/flow-footer.tsx`, `src/setup` FREE | **`src/setup` is a layer**, the third product area, a peer of `vault` and `admin` in `check-layers`' TIERS (`vault|admin|setup`), exported (`@paige/ui/setup/*`). StepRail and FlowFooter moved there; the composed steps stay as its stories. SetupBeat stays in Templates like AreaPage and AdminPage: the frame is a template, the parts are the area's. |
| Charts was a root section for two components. The folder earns its place in the tree (a bundle split: Recharts and React Flow load lazily, and the tier sits above Components), but a root section says "a kind of thing", and charts are components. | `Charts` | **Components › Charts** (`titlePrefix` in `.storybook/main.ts`). The folder stays `src/charts`; this is the one folder whose section isn't its name. |
| Admin mixed the site's parts (AdminSidebar, MetricCard, PipelineGraph, PartnerOffers, RevShare) with six page setups (People, Partners, Plans, Subscriptions, Promotion codes, Pulse), eleven entries at one level. | `admin/people.tsx`… | **`admin/pages/`**, one module per admin page, section Admin › Pages. A page imports the root; the root never imports a page: `check:layers` GROUP, the vault's rule, now covers `admin/` (its `GROUPED` list). Made visible by the move and fixed the same day: `partner-offers.tsx` took `PartnerLogo` from `pages/partners.tsx`; the logo is a part and moved to the root (`partner-logo.tsx`, Media, its own story), and the two root stories that took `PartnerRow` from the page now take it from `partner-rules.ts`. |

Considered and set aside: nesting everything under three roots (Foundations · Building blocks · Product), which reads well but changes every story id and buys only a shorter top level; the roots are tiers, and a reader who knows the import rule knows the sidebar. Story ids changed only for the moved files (`shell-steprail-*` → `setup-steprail-*`, `forms-flowfooter-*` → `setup-flowfooter-*`, `charts-*` → `components-charts-*`, `admin-people-*` → `admin-pages-people-*` and the other four lists and Pulse).

**A fourth area, the door (REVIEW-18, 2026-10-30).** `src/auth` joined the product tier (`vault|admin|setup|auth`): sign in, create an account, the phone and its code, forgot and set a password, the email links, the invite gate. It holds **stories only** so far — each page is a story on the `AuthPage` template with the forms parts inside — because no two auth pages share a part the rest of the package lacks; the first shared part lands as `auth/*.tsx` and the layer is already there for it. The frame is `templates/auth-page.tsx` (with `LegalFooter`), same split as SetupBeat and the setup parts: the frame is a template, the parts are the area's.
