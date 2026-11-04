# Archetypes and the axis vocabulary (proposal, 2026-10-29)

Answers [AUDIT.md](AUDIT.md) A-01, A-04, A-05, A-06, A-07 and A-08. Status: **proposed**, nothing built. The words are George's call (one sitting, §2 and §3); the mapping, the checks and the order of work are Engineering's. Decisions to make are marked `D-nn`.

## 1. The problem in one line

116 component files, 16 shared axis names, and no two components agree on what `size`, `tone` or `variant` means (AUDIT.md § Axes). Every component picked its words alone, so a reader can't predict a prop from the kind of thing it is, an agent can't copy the nearest sibling without also copying its accidents, and a change request ("make quiet things quieter") has no single place to land. The fix is not a style guide; it is an **archetype** for every part, fixing which axes it has and what their values are, written once as types, and checked.

## 2. The archetypes

A part is exactly one archetype. The archetype fixes the axes the part may expose and the values each axis may take (§3). A part may expose fewer axes than its archetype allows, never other ones. Composites expose none of their own.

| Archetype | What it is | Members today | Axes it may have |
|---|---|---|---|
| **Action** | Something you press that does something or goes somewhere | Button, IconButton (R20-14), ButtonGroup (R20-10: actions side by side, nothing in it holds a state), CopyButton, DisclosureTrigger, FieldAction, LinkOut, the Item's link chevron, SubmitButton | `emphasis`, `tone` (default · brand · destructive; a quiet Action may also take the text tones muted · strong), `size` (control scale), `underline` |
| **Control** | Something you type into or choose with; it has a value | Input, Textarea, Select, MultiSelect, Checkbox, RadioGroup, Switch, ToggleGroup (`variant` card · icon, R20-11: it holds a state, where a ButtonGroup does not), Sortable (R20-19: it holds the order of a set of ids; `orientation` as ToggleGroup), RichText (editor), every `forms/fields/*`, InlineEdit's control | `size` (control scale: md · sm), `presentation`; `invalid`, `disabled`, `readOnly` are states, not axes |
| **Surface** | A bounded region content sits on | Card, Panel, KpiCard, MetricCard, CaptureCard, ChoiceCard, FilterCardRow, AreaTile, Callout, Sheet's and Dialog's panel | `emphasis` (flat · raised · recessed), `tone`, `fill`, `interactive` |
| **Mark** | A small sign whose meaning is its tone and shape | Dot, StatusMark (StatusDot folds in), Badge, Spinner, Progress, Avatar's badge | `tone`, `fill`, `size` (mark scale) |
| **Media** | The leading picture of a thing | Avatar, AreaIcon, ItemMedia, PartnerLogo, FileIcon (the file glyph, R19-03; R20-17: sized by its holder, a format band from 32px, no fill or ring), PlaceholderImage (story-only) | `size` (media scale), `fill`, `kind` (what it shows), `ring` |
| **Text** | A typographic role | Eyebrow, the titles in PageHeader and PageIntro, Stat's label and value, FieldLabel, FieldDescription, FieldError, ItemTitle, ItemDescription, Formatted (R20-21: a value written the Paige way, inline; `tone` strong · muted) | `tone` (default · strong · muted · brand · area), `level` (h1 · h2 · …) |
| **Overlay** | Floats above the page and closes | Dialog, ConfirmDialog, Popover, Tooltip, DropdownMenu, ContextMenu, Sheet, FiltersPopover, HeaderSearch's results, NotificationBell's panel, Toast (R19-05: arrives and leaves, or stays until dismissed), HoverCard (R20-16: read-only, opened by hover or focus, supplementary) | `size` (overlay scale), `tone` (default · destructive), `side`, `align` |
| **Frame** | Places named slots; a layout at any level (`packages/ui/ORGANIZATION.md` §11, layouts that nest) | Page, PageHeader, PageIntro, HomePage, AreaPage, SetupBeat, SetupBar, AdminPage, ListPage, Form, FormSection, FieldGroup, Field, ItemFrame, Collapsible, TabsPill, Sidebar, Breadcrumb (R20-15: the trail to the current page; there is no Navigation archetype, GAPS #155), Flex, Stack, Inline, Grid, Split, Separator | `density`, `width`, `direction`, `align`, `justify`, `orientation`, `level` (Separator's boundary level), `gap` and the layout tokens |
| **Item** | One thing: media, title, description, details, actions, footer (S-31, S-33) | Item (Labs; replaces Components › Item), FactItem, ItemRow (to be renamed, S-28), UploadRow, Attachment (one file as a row, R19-01; its `status` is the stream's stage, not an Item `state`), Timeline (R20-18: a rail of events; `rail` start · end is a placement, not yet an axis, GAPS #156), StackEntry (retiring), FactEntry, a DataTable row, a menu entry | `density`, `state` (rest · expanded · new · struck), the regions |
| **Chart** | Data drawn | Chart, Sparkline, Stat, DagFrame, PipelineGraph, DagLegend | `kind` (line · bar), `height` (chart scale), `trend` (better · worse · neutral; Sparkline's today's `tone`), `status` (the work statuses) |
| **Composite** | A domain assembly or page part made of the above | PeopleStack, FactList, RailPanels, PersonPicker, QuickAdd, PersonAddForm, RemoveDialog, the admin lists and sections, AppHeader, AccountMenu, NotificationBell, HeaderSearch, StepRail, KpiRow, ListToolbar, BulkActionBar, FilterChips, ErrorSummary, FlowFooter, FormFooter, DataTable, PasswordStrength (R20-20: the rules list and strength bar under a password Field) | none of its own: it passes archetype axes through to its parts, or takes a `kind` |

Why these and not Polaris's or Atlassian's categories: the Storybook sections (Actions, Inputs, Display, Feedback, Navigation, Overlays) say *where to find* a part; an archetype says *what shape its API has*. Display holds Surfaces (Card), Marks (Badge, Dot), Media (Avatar), Text (Eyebrow) and Items; those four need different axes, so the section can't be the unit of consistency. The folder stays the layer (`packages/ui/CLAUDE.md` § Layers and the import rule, `check:layers`); the archetype is the second axis, declared on the part.

## 3. The vocabulary

One list of axis names, each with one meaning and one value set. A component narrows (`Extract<Emphasis, "primary" | "secondary">`), never widens or renames. Written as types in `src/lib/vocabulary.ts` (§7) so the sets can't drift.

| Axis | Means | Values | Used by |
|---|---|---|---|
| `emphasis` | How loud, relative to what it sits on | `primary` (filled) · `secondary` (outlined) · `tertiary` (bare; shows its surface on hover: today's Button `ghost`) · `quiet` (text-like, muted ink: today's `quiet`) — Actions. `flat` · `raised` · `recessed` — Surfaces | Action, Surface |
| `tone` | Meaning, as a colour | `neutral` · `muted` · `strong` · `brand` · `info` · `success` · `warning` · `attention` · `destructive` · `area`. One meaning each; each archetype takes a subset. `default` is the absent value everywhere. | Action, Surface, Mark, Text, Overlay |
| `fill` | How a tone is applied | `solid` (tone fills, ink on it) · `soft` (the tone's subtle fill, tone ink) · `outline` (border only) · `plain` (ink only, no box) · `wash` (the gradient wash: AreaTile, Card `highlight`) | Surface, Mark, Media |
| `size` | A step on **the archetype's own named scale** (TOKENS.md §2). Within one archetype `md` is one pixel value. Across archetypes the scales differ and are named. | control: `sm` 36 · `md` 44 · `lg` 48 · `inline`; icon: `xs` 12 · `sm` 14 · `md` 16 · `lg` 20 · `xl` 24; mark: `xs` 8 · `sm` 12 · `md` 16 · `lg` 20 · `xl` 24; media: `sm` 24 · `md` 32 · `lg` 40 · `xl` 48 · `2xl` 72; overlay: `xs` 192 · `sm` 224 · `md` 320 · `lg` 448 · `xl` 672 · `2xl` 896 | Action, Control, Mark, Media, Overlay |
| `density` | Vertical rhythm | `compact` · `default` · `roomy` | Frame, Item |
| `width` | A content width | `focused` 768 · `wide` 960 · `page` 1400 | Frame |
| `height` | A chart's height | `sm` · `md` · `lg` · `auto` (chart scale) | Chart |
| `state` | Where an Item is in its life | `rest` · `expanded` · `new` · `struck` (S-22, S-24) | Item |
| `kind` | A discriminant: which of several things | per union, by design (TS-BAR §2); never a look | any |
| `presentation` | How a Control shows its choices | `auto` · `panel` · `native` · `typed` | Control |
| `direction` / `orientation` | A layout's axis | `row` · `column` / `horizontal` · `vertical` | Frame |
| `align` / `justify` | Cross-axis / main-axis placement | `start` · `center` · `end` · `stretch` · `baseline` / `start` · `center` · `end` · `between` | Frame |
| `side` / `align` (overlays) | Where an overlay opens | `top` · `right` · `bottom` · `left` / `start` · `center` · `end` | Overlay |
| `level` | A rank | boundary: `region` · `group` · `row` (Separator); heading: `h1` … `h4` | Frame, Text |
| `trend` | Which way a number moved, and whether that is good | `better` · `worse` · `neutral` | Chart |
| `ring` | A ring around Media | `none` · `default` · `brand` | Media |
| `interactive`, `underline`, `framed`, `dividers` | Booleans with one job each | `true` · `false` | as today |

**Retired words** (fail `check:vocab` once it is on):

- `variant` as a prop name. It says nothing; every use becomes `emphasis`, `kind`, `fill` or `tone` (§4).
- `ghost` → `emphasis: tertiary`. `primary` as a *tone* → `brand` (`primary` stays an emphasis). `appearance` → `fill`. `muted` as a *surface* → `emphasis: recessed` (`muted` stays a text tone). `row` as a density → `default`; `compact` keeps its name. `highlight` → `tone: area` + `fill: wash`. `placeholder` as a Card variant → a story helper (`src/stories/placeholder.tsx`; "Story scaffolding stays out of components", George 2026-10-28, which this variant already breaks) or an empty state, not a surface look.
- `me` as an Avatar ring → `brand`; the Vault decides when the owner wears it.
- `subtle` stays a **token suffix** (`--info-subtle`, the soft fill) and is never an API word. `tint`/`wash` stay token words for the area fills.

## 4. Mapping: every component with an axis today → its archetype → after

From AUDIT.md § Scorecard. "After" uses §3; a cell with `D-nn` is a decision. Composites and parts with no axes today are not listed: they declare an archetype and change nothing.

| Component | Archetype | Today | After |
|---|---|---|---|
| Button | Action | `variant` primary · secondary · ghost · link · quiet · destructive · tinted; `size` sm · md · lg · icon · inline; `underline` | `emphasis` primary · secondary · tertiary · quiet; `tone` default · brand (quiet + brand = today's `link`) · destructive (primary + destructive = today's `destructive`); `size` sm · md · lg · inline; `underline`. `tinted` is not a variant: a secondary or tertiary Action on a `data-surface="toned"` ancestor renders the overlay look (TOKENS.md §3) — **D-01** (or keep `emphasis: tinted` as a fifth step). `size="icon"` is inferred from `icon` with no children — **D-02** (or keep `icon` as a size) |
| CopyButton | Action | `variant` secondary · quiet; `size` sm · md · inline | `emphasis` secondary · quiet; `size` as Button |
| DisclosureTrigger | Action (quiet) | `tone` primary · muted · strong | `tone` brand · muted · strong |
| FieldAction | Action | — | `emphasis: quiet` fixed; declares the archetype |
| Input, Textarea, Select, MultiSelect, Checkbox, RadioGroup, Switch, fields | Control | one height (R2-10); Select `presentation` auto · popover · native; DateField `presentation` auto · typed · native | `size` md · sm (sm only where the plan's compact Input is decided); `presentation` auto · panel · native · typed, one set — **D-03** the word for popover/calendar (`panel`) |
| Card | Surface | `variant` default · muted · highlight · placeholder; `interactive` | `emphasis` flat · raised · recessed (flat is today's default, raised the interactive rest look); `tone: area` + `fill: wash` for highlight; `placeholder` leaves (§3); `interactive` |
| Panel | Surface | `variant` default · muted · quiet | `emphasis` flat · recessed; `quiet` = recessed + title `tone: muted` + `data-panel="quiet"` for ItemRow, as a named preset (`Panel preset="aside"`?) — **D-04** whether "More that belongs here" is a Panel emphasis or a Vault composite (`AsidePanel`) |
| RailPanels | Composite | `variant` default · muted | passes Panel's `emphasis` through; no `variant` |
| Callout (was Callout + Message) | Surface | `tone` neutral · info · success · attention, `framed` | **D-05 decided 2026-10-30**: one Surface, `Callout`, `tone` as the one axis, the live region by tone (`note` for neutral, `status` for info and success, `alert` for attention); `framed` stays a boolean. Merged under the Callout name, not Message: "Message" is a Paige product noun, the copy map and shadcn.io's chat bubble |
| Badge | Mark | `tone` neutral · info · success · warning · attention · area; `appearance` soft · outline; `size` sm · xs | `tone` as today; `fill` soft · outline; `size` sm · xs on the mark scale (12 · 16 tall) |
| Dot | Mark | `tone` none · neutral · primary · info · success · warning · attention · area; `size` xs · sm · md · lg · xl; `ring` | `tone` neutral · brand · info · success · warning · attention · area; `fill` solid · plain (`none` → plain); `size` on the mark scale (xs 8 · sm 12 · md 16 · lg 20 · xl 24: the 14 step goes — **D-06**); `ring` |
| StatusMark (+ StatusDot) | Mark | `status`; `size` sm 16 · md 20 (Dot lg · xl) | `status`; `size` md · lg **in Dot's words**: no translation table. StatusDot is deleted: the Vault imports StatusMark |
| Spinner | Mark | `size` sm · md · lg | `size` on the icon scale (md 16 · lg 20 · xl 24) |
| Avatar | Media | `size` sm 24 · md 34 · lg 40 · xl 48 · 2xl 74; `variant` person · pet (a discriminated union, so the scorecard doesn't list it); `ring` none · default · me; `badge`; `fallback` | `size` on the media scale (md 32 or keep 34 for the header — **D-07**); `kind` person · pet; `ring` none · default · brand; `badge`; `fallback` |
| AreaIcon | Media | `size` sm 20 · md 32 · lg 44 · xl 56; `tone` solid · soft · plain | `size` on the media scale (sm 24 · md 32 · lg 40 · xl 48; 44 and 56 reconcile — **D-08**); `fill` solid · soft · plain |
| ItemMedia | Media | `variant` area-icon · avatar · file · icon | `kind` area-icon · avatar · file · icon (or derived from the child — **D-09**) |
| PersonPicker | Composite | `variant` person · pet | `kind` person · pet |
| Eyebrow | Text | `tone` muted · area · primary | `tone` muted · area · brand |
| Separator | Frame | `orientation`; `level` region · group · row | unchanged (already the grammar) |
| Field, FormSection, SetupBeat | Frame | `density` default · roomy; Field `appearance` eyebrow · title, `orientation` | `density`; Field's `appearance` → `labelStyle` eyebrow · title (it isn't a fill) — **D-10** the name |
| Page, SetupBeat | Frame | Page `width` default · focused · wide, `top` roomy; SetupBeat `width` focused · wide | `width` page · focused · wide (one set; `default` → `page`); `density` default · roomy instead of `top` |
| Flex, Stack, Inline, Grid, Split | Frame | `align`/`justify` with four different subsets; Grid `minItemWidth` xs · sm · md · lg; Split `contentMin` sm · md · lg, `asideMax` none · half | `align`/`justify` from one set, each primitive narrowing; `minItemWidth` and `contentMin` on one named scale (TOKENS.md §2, fit-xs…lg) |
| Item (Components, being replaced), FactItem | Item | `density` row · compact | `density` default · compact |
| Item (Labs) | Item | `size` default · sm (S-33 took shadcn's word) | `density` default · compact — **D-11**: S-33 chose `size` to match shadcn's part names; `density` is the archetype word and shadcn's `size` is a density. Recommend `density` |
| Skeleton | Mark | `shape` text · number · block · circle; `width` full · 3/4 | unchanged; `width` values from the fit scale |
| Dialog | Overlay | `size` md · lg · xl (448 · 672 · 896) | `size` lg · xl · 2xl on the overlay scale (menus take xs · sm, Popover md) — **D-12** whether one scale across menus and dialogs is wanted, or two named scales (menu, dialog) |
| ConfirmDialog | Overlay | `tone` default · destructive; `reason` required · optional | unchanged |
| Chart, Sparkline, Stat, DagFrame, PipelineGraph | Chart | Chart `kind` line · bar, Sparkline and Stat `variant` line · bar; Sparkline `tone` brand · neutral · better · worse; `height`/`size` mixed | `kind` line · bar everywhere; Sparkline `trend` better · worse · neutral (not a tone); `height` on the chart scale for Chart and DagFrame; Stat and MetricCard `size` md · lg · compact → `density` compact · default + `size` md · lg — **D-13** |
| InlineEdit, FactField | Composite | `control` input · select · textarea (· field); `actions` inline · below | `control` is a `kind`; one set. `actions` is a layout, not an axis: inline (at the control's right) for input and select, below for a textarea and a typed field (R20-06) |
| Callout `framed`, ItemGroup `dividers`, Dot `ring` | booleans | — | unchanged |

## 5. Names

**The grammar.** `[Domain][Qualifier] + Archetype word`, archetype word last where one exists: Button, Card, Dialog, Menu, Item, Field, Mark, Page, Panel, Icon. One word per job across the package. `FactItem`, `FactField`, `FactList`, `AreaIcon`, `AreaTile`, `AreaPage`, `ConfirmDialog`, `DateField`, `KpiCard` already follow it; that is the grammar working, and the collisions below are where it wasn't applied.

| ID | Today | Problem | Proposed | Who |
|---|---|---|---|---|
| D-14 | `ItemRow` (Vault) | Collides with Item (S-28: "will be renamed") | `AreaItem` (an item on an Area page) or `SectionItem`; "Row" retired as a word for a list entry | George |
| D-15 | `UploadRow` | same | `UploadItem` | George |
| D-16 | `KpiRow`, `FilterCardRow` | "Row" here means a horizontal strip of Surfaces, a different job | `KpiStrip`, `FilterCards` (or `SegmentCards`: they choose a segment) | George |
| D-17 | `RowActions` | Since S-41 it is the shared ⋯ for Items and table rows, not row-specific | `ActionMenu` (the component) beside `useActionMenu` (the hook) | Eng |
| D-18 | `StatusDot` | A pure alias of StatusMark ("the Vault's name for StatusMark") | delete; aliases are entropy | Eng |
| D-19 | `Message` / `Callout` | Two Surfaces with tones, split by ARIA role | **Decided** (George 2026-10-30): one component, `Callout` in Feedback; `CalloutAction`; the role follows the tone (see D-05) | done |
| D-20 | `Item` ×3 (Base, Components, Labs) | Transitional, but the middle one must go when Labs promotes | LEVELS.md promotion rule: the replaced part is deleted in the promoting change, never left as a second name | Eng |
| D-21 | `PageHeader` (template) / `PageIntro` (pattern) | Neighbouring jobs, neighbouring names | keep both; PageIntro is the Hero (title, lede, next step) and its page says so. No rename | — |
| D-22 | `Menu` / `DropdownMenu` / `ContextMenu` | Three names, one entry type | keep: Menu is the list in the page, the other two are Radix's overlay names (base words, R4-13's reasoning for Badge). `menu-entry.tsx` stays the one entry type | — |
| D-23 | `Dot` / `StatusMark` / Badge `xs` | Three small marks | keep Dot (the primitive mark) and StatusMark (a Dot with a status); Badge is a Mark with text. All three on one mark scale (§3) | — |
| D-24 | `--body-muted` | A "muted" ink darker than `--muted-foreground` (AUDIT A-09) | `--lede` (it is the lede's grey, R2-17), or fold into `--muted-foreground` if Design accepts slate | Design |
| D-25 | `VaultProvider`, `AreaScope`, `SectionScope`, `FactCatalogProvider` (labs) | Context providers export a component but are no archetype in §2; `check:vocab` reports them as undeclared | A `Provider` archetype (axes: none; "sets context for what it wraps"), or providers declared `@archetype none` and skipped. Recommend the former: a reader still asks "what shape is this" | George |

## 6. One documentation shape per archetype

A part's page says what it is, then its layout (S-26). Generalised: every page has the same six parts in the same order, and the **level** (LEVELS.md) says how many are required.

| Part | Content | Required from level |
|---|---|---|
| 1. What it is | The purpose line, then the archetype and the sentence that places it among its neighbours ("a Mark; Badge when there is text, Dot when there isn't") | 0 |
| 2. Anatomy | Frame, Item, Surface, Composite: the wireframe, regions numbered (Labs › Item's drawing); Action, Mark, Media, Text, Control: the axes matrix (every `emphasis` × `tone`, every `size`) | 1 |
| 3. Axes | The props table, generated from the vocabulary types: axis, meaning, this part's subset, default | 1 |
| 4. States | One story per state, named "State · qualifier" (R17-21); the matrix story for Surfaces on every surface (TOKENS.md §3) | 1 |
| 5. Example | One real composition from a fixture | 2 |
| 6. Decisions and related | The R/S/D ids that shaped it, what to use instead when it doesn't fit, guarantees and failures at level 3 | 2 (3 for guarantees) |

Mechanics: parts 1, 3 and 4 are generated (the purpose line, the vocabulary types, the story index), so a component's `.mdx` only writes 2, 5 and 6; `scripts/docs-scaffold.mjs` emits the skeleton. `check:docs` fails when a part required by the declared level is missing. The `CLAUDE.md` rule that exempts `components/` and `admin/` from prop comments goes: prop comments are a level-1 requirement for every archetype; the generated axes table makes most of them one line.

## 7. Enforcement

1. **The vocabulary as types** — `src/lib/vocabulary.ts` (lib tier, importable by every layer): `Emphasis`, `Tone`, `Fill`, `Density`, `ControlSize`, `IconSize`, `MarkSize`, `MediaSize`, `OverlaySize`, `Width`, `Align`, `Justify`, `Side`, `ItemState`, `Trend`. A component writes `emphasis?: Extract<Emphasis, "primary" | "secondary">`, never an inline union. The value sets then cannot drift: a new word is a change to one file, reviewed as such. **Built 2026-10-29**: the file holds §3 as `as const` arrays with the types derived (`ActionEmphasis` and `SurfaceEmphasis` separately, `Emphasis` their union; `OverlayAlign` beside `Align`; `BoundaryLevel`/`HeadingLevel`; `Presentation`, `Ring`, `ChartHeight`), `ARCHETYPE_AXES` (§2's last column as data), `AXIS_VALUES`, `RETIRED_PROPS` and `RETIRED_VALUES`. No component imports it yet (step 4 does, one archetype at a time); the words are this document's proposal until step 1, and change in that one file.
2. **Declared archetype** — `@archetype Action` in the file header (next to `@level`, LEVELS.md), and `archetype-action` in the story meta tags so Storybook can filter by it. **Built 2026-10-29**: 118 of 120 component files carry it as the header's first line, from §2's member lists; the story tag is not hand-written but derived, `.storybook/main.ts`'s indexer reads the component file beside each story and adds `archetype-<name>` to its entries (877 index entries tagged; a page-setup story with no same-named component, Admin › People and the like, gets none). Two files were tagged against §2 and say so in the tag line: FilterCardRow is a **Composite** (each card is a Surface; the row is a single-choice control made of them) and LinkOut is a **Composite** (a Card of text with Buttons in it), not an Action. Two labs files have no archetype because the table has none for them: `labs/vault/scopes.tsx` and `labs/vault/fact-catalog.tsx` are context providers, not parts — **D-25** whether a Provider archetype exists (axes: none) or providers are simply outside the table.
3. **`check:vocab`** (`scripts/check-vocab.mjs`, the parsing is `audit.mjs`'s, now shared as `scripts/source-axes.mjs`) fails on: a component file with no `@archetype`; an axis not allowed for its archetype; an inline string union on an axis name (must import the type); a retired word (§3) as a prop name or value; a `cva` `variants` key outside the archetype's axes. Warnings below level 2, errors at 2 and above (the level is the file's `@level`, LEVELS.md, or the story's `level-n` tag). **Built 2026-10-29, in warn mode** (§8 step 3): it imports `vocabulary.ts` directly (Node strips the types) so there is one list; `npm run check` runs it and it exits 0 until `--strict`. First run: 74 findings in 36 files (AXIS 11, INLINE 23, VALUE 28, RETIRED 10, ARCHETYPE 2), which is §4's "After" column read back from the code: Button's `variant`/`ghost`/`size: icon` (D-01, D-02), Card's and Panel's `variant: muted`, Dot's `tone: primary`/`none`, Sparkline's `tone: better`/`worse` (a trend), Stat's and MetricCard's `size: compact`, AreaIcon's `tone: solid`/`soft`/`plain` (a fill), Avatar's `ring: me`, Badge's and Field's `appearance`, Select's `presentation: popover` (D-03). Two the table didn't list: AreaTile's `state` (not-started · in-progress · set-up) uses the Item axis name for an Area's setup status, and Skeleton's `width` (full · 3/4) uses the Frame axis name for a fit — both are word collisions to resolve in step 1.
4. **`check:tokens` grows** (TOKENS.md §5): once the geometry tier exists, a bare `h-11`, `size-4`, `w-48`, `opacity-50`, `text-white` in component code is a finding, as `bg-blue-500` is today.
5. **`CLAUDE.md` § Rules** is reorganised under the archetypes (an Action rule under Action), so a rule is found by the thing it governs and a new rule has one place to go. The ids stay.

## 8. Order of work

1. **Words** (George, one sitting): §2 archetypes, §3 vocabulary, the D-01…D-13 cells. Nothing else depends on the renames in §5; they can wait.
2. **Tokens first** (TOKENS.md §2, §4): the geometry tier and the hygiene fixes. No API change, no story id change; the renames ride on these.
3. **`vocabulary.ts` + `check:vocab` in warn mode**, and `@archetype` on every file (one mechanical pass). **Done 2026-10-29** (§7 items 1–3); it does not depend on step 1 because warn mode changes nothing a reader sees, and the words live in one file.
4. **One archetype per change**, in this order: Action (Button and its three followers), Mark (Dot, StatusMark, Badge, Spinner), Surface (Card, Panel, Callout, with the surface model, A-03), Media (Avatar, AreaIcon, ItemMedia), Frame (Page, Field family, primitives), Item (FactItem, Labs Item), Overlay (Dialog sizes), Chart. Each change renames axes, updates stories and `argTypes`, regenerates the catalog and the docs scaffold; story ids don't change (axes aren't in the id).
5. **Component renames** (§5) as decided, each with the LEVELS.md retirement rule applied to what it replaces.
6. **`check:vocab` to error**; `check:docs` on; `CLAUDE.md` reorganised.

What this does not do: change a single look. Every rename above is a name for what is already drawn, except where AUDIT.md says the drawing itself is inconsistent (A-03, A-08), and those are called out as decisions.
