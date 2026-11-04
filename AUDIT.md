# UI audit — quality, consistency and coherence of `@paige/ui` (opened 2026-10-29)

George's brief: the spike "keeps veering away from quality, consistency and coherence": a mute treatment that isn't mute on white, docs on some components and not others, names that look random, no archetypes, and too few variables to make a change request a one-line change. This file is the audit: what is true of the tree today, measured, and the findings that fall out of it. The proposals that answer the findings are their own files: **[ARCHETYPES.md](ARCHETYPES.md)** (the archetypes, the shared axis vocabulary, the mapping and the renames) and **[TOKENS.md](TOKENS.md)** (the token inventory, the geometry census and the variables to add). Same rules as the REVIEW-* passes: IDs `A-nn`, never reused; each row says who decides.

**How it is measured.** `npm run audit` regenerates the sections between the markers below (`scripts/audit.mjs`) and in TOKENS.md (`scripts/audit-tokens.mjs`) from the source, the way `catalog.mjs` reads purpose lines: no Storybook server, no TypeScript program, so it runs anywhere and stays true. Where a count is approximate the column says so. Baseline on `spike/ui-audit` at `013af3f33`: typecheck clean, `npm run check` clean, 245/245 node tests.

## What the measurements say

- **The intent is written and the structure holds.** Every one of the 116 component files has a header comment; 109 have a purpose line on every export; the layer order, the export surface and the token bans all pass. The drift is not structural. It is in the two things no check covers: the words a component's API uses, and the shape of its documentation.
- **There is no axis vocabulary.** 16 axis names are shared by more than one component. `size` is used by 14 components with 11 different value sets; `tone` by 8 with 8 (no two agree); `variant` by 8 with 7. The word `md` means 18 different things. `density` means vertical rhythm in Field, FormSection and SetupBeat (`default · roomy`) and row height in Item and FactItem (`row · compact`). `appearance` is `soft · outline` on Badge and `eyebrow · title` on Field. StatusMark's `md` is Dot's `xl`. Each choice is locally defensible; together they are why names look random: there is nothing to be consistent with.
- **"Muted" and "quiet" are names, not treatments.** `muted` appears on five component axes in two jobs (a surface in Card, Panel, RailPanels; a text tone in Eyebrow, DisclosureTrigger). Panel's `muted` and `quiet` render the same fill and differ by title colour. Button's `ghost` and `quiet` differ by hover colour only (S-35 had to rule between them). And the fill itself, `--muted` = `#f3f6fc`, is absolute: the admin sits on `--surface-page` (`#f7f9fd`) where it recedes, the customer pages sit on white where it is a tinted box. The system already named this failure class for hover (R4-01: "never a fixed hover colour such as `hover:bg-muted`") and fixed it with relative overlays; emphasis surfaces never got the same treatment.
- **Geometry is written by hand.** theme.css defines 234 variables, and colour is well covered (one palette raw leaks, A-09). But the Paige layer writes 1,029 numeric geometry utilities by hand, and 30 semantic values recur in three or more files with no name: the 44px control height in 7 files, the 36px height in 10, the 16px icon in 23 and the 20px icon in 10, the 40px media column in 3 (plus `pl-13`, its arithmetic), menu widths 192/224/320 in 6/4/3, `opacity-50` for disabled in 11, `text-white`/`ring-white` for ink on a tone in 4. A change request to any of these is a multi-file edit today. TOKENS.md names them.
- **Three documentation bars coexist.** 112 of 116 files have a story file; 26 of those carry a component description; 1 has the S-26 anatomy page (Labs › Item); prop lines are documented 589 of 924 (approximate), and `CLAUDE.md`'s prop-comment rule exempts `components/` and `admin/` by its own text. S-26 raised the bar with one exemplar and no plan for the other 112, which from a reader's seat is "some have docs and some don't".
- **Levels exist on paper.** LEVELS.md (drafted today) is the first consolidating move; 2 story files carry a `level-n` tag. The scorecard's Level column is where adoption will show.

## Findings

| ID | Finding | Evidence | Who | Proposal | Status |
|---|---|---|---|---|---|
| A-01 | **No shared axis vocabulary.** Axis names (`size`, `tone`, `variant`, `density`, `appearance`) mean different things on different components; value words (`md`, `muted`, `compact`, `primary`) are reused across unrelated scales. | § Axes and § Words below: `size` 14/11, `tone` 8/8, `variant` 8/7; `md` ×18; `density` two meanings; StatusMark md = Dot xl. | George (the vocabulary), Eng (the mapping) | ARCHETYPES.md §2–§3: nine archetypes, each with fixed axes and allowed values; every component mapped (§4). | open |
| A-02 | **Semantic geometry has no variables.** Control heights, icon sizes, the media column, menu widths, chart heights, disabled opacity, on-tone ink are bare Tailwind steps repeated across files. | TOKENS.md § Token candidates: 30 values in 3+ files; `h-11` ×7, `size-4` ×23, `w-48` ×6, `opacity-50` ×11, `text-white` ×4. | Eng (names), George (the scales' steps) | TOKENS.md §2: a geometry tier in theme.css (control, icon, media, mark, overlay, chart, row, state, motion), exposed as utilities; `check:tokens` then flags the bare steps. | **mostly built** 2026-10-29: control, icon, overlay, chart, row/bar, state, ink/alpha, motion and stacking are tokens with merge entries, and `check:tokens` (`geometry`, `state-ink-alpha`, `motion-stack`) fails the bare steps (TOKENS.md T-01, T-02, T-04 … T-09, T-12). Open: media and mark (T-03, waits on D-06 … D-08) and the surface model (T-13, §4). Candidates in 3+ files went 30 → 18 before 3c's regeneration |
| A-03 | **Emphasis surfaces are absolute colours.** `muted` reads as recessed on the admin's off-white page and as a tinted box on the customer's white page. | `panel.tsx:40-46` → Card `muted` → `bg-muted` (`#f3f6fc`); `theme.css` "Customer pages stay on white"; R4-01 precedent. | George / Design (the look), Eng (the mechanism) | TOKENS.md §3: a surface model: either a `data-surface` context (as `data-area`) or a relative `layer-recess` overlay (as `layer-hover`); plus a surface-matrix story per Surface archetype. | open |
| A-04 | **Near-duplicate variants.** Button `ghost`/`quiet`; Panel `muted`/`quiet`; CopyButton's `variant` is a subset of Button's; RailPanels `variant` is a subset of Panel's; ~~Message `framed` is Callout's job~~ (resolved 2026-10-30: one Callout, D-05). | `button.tsx:51,53`; `panel.tsx:41`; scorecard rows. | George | ARCHETYPES.md §4 (Action, Surface rows): one `emphasis` scale; Panel's `quiet` becomes a Surface `emphasis: recessed` plus a title tone, not a third variant. | open |
| A-05 | **Three documentation shapes.** One-liner only (86 files), one-liner plus a story description (26), the S-26 anatomy page (1). Prop comments are required by layer, not by level, and `components/`/`admin/` are exempt. | Scorecard columns *Story desc*, *MDX*, *Prop docs*; `CLAUDE.md` § Rules "Doc comments". | George (the shape), Eng (the scaffold) | ARCHETYPES.md §6: one docs shape per archetype (what it is → anatomy → axes → states → example → related), scaffolded from the same source the catalog reads; `check:docs` fails on a missing part for the declared level; the layer exemption becomes a level rule. | open |
| A-06 | **Names collide across layers.** Three `Item`s (base, Components, Labs), `ItemRow` (S-28), `Row` meaning a list entry (ItemRow, UploadRow), a row of cards (KpiRow, FilterCardRow) and a table row (RowActions); `Dot`/`StatusMark`/`StatusDot`; ~~`Message`/`Callout`~~ (one Callout since 2026-10-30, D-19); `Menu`/`DropdownMenu`/`ContextMenu`/`useActionMenu`/`RowActions`; `PageHeader`/`PageIntro`/`SetupBar`/`AppHeader`. | Tree and catalog; S-28, S-33, R11-03 are earlier rulings on single cases. | George | ARCHETYPES.md §5: a naming grammar (archetype word last; one word per job) and the rename list, each a decision row. | open |
| A-07 | **Governance is reactive.** Rules accrete one per finding (`CLAUDE.md` § Rules is ~30 paragraph bullets); checks cover structure (layers, exports, tokens, spacing) and nothing covers vocabulary or docs shape. Agents follow failing checks and not prose (ORGANIZATION.md §2 says so). | REVIEW-1…17, STACK-REVIEW, GAPS: ~1,800 lines; R1-22, R1-25, R1-29, R1-30, R3-14, R3-16, R4-08, R4-10, S-13, S-28, S-33 were all "which name / which layer". | Eng | ARCHETYPES.md §7: `check:vocab` from one declared registry (the same shape as `check:layers`); `CLAUDE.md` § Rules reorganised under the archetypes so a rule is found by the thing it governs. | open |
| A-08 | **Size scales don't line up across kinds of thing.** Avatar sm 24 · md 34 · lg 40 · xl 48 · 2xl 74; AreaIcon sm 20 · md 32 · lg 44 · xl 56; Dot xs 8 … xl 20; Button sm 36 · md 44 · lg 48; Dialog md 448 · lg 672 · xl 896. A `size="md"` is a different pixel on every archetype and the mapping between them (StatusMark → Dot) is hand-written. | `avatar.tsx:43`, `area-icon.tsx:22`, `dot.tsx:29`, `button.tsx:57`, `status-mark.tsx:59`. | George (steps), Eng | TOKENS.md §2: one named scale per archetype (icon, media, mark, control, overlay), with steps in px, so `size` means the same thing within an archetype and the scale is named where it differs. | open |
| A-09 | **Small token hygiene.** `--surface-muted` (a layer-1 raw) is used directly in `dag-frame.tsx`; `--shadow-focus`, `--color-sidebar-primary(-foreground)` are defined and never referenced; `--body-muted` (`#595959`, 7:1) is higher-contrast than `--muted-foreground` (`#5a657e`, 5.8:1), a "muted" that isn't; destructive's hover is `bg-destructive/90` while primary has `--primary-hover`; chart and graph heights are written twice by construction (the component and its lazy skeleton must match). | TOKENS.md § Never referenced, § Palette raws; `theme.css:141`; `button.tsx:54`; `chart.tsx`/`lazy-chart.tsx`. | Eng | TOKENS.md §4: fix list. | **built except one** 2026-10-29: the raw leak, the dead variables (T-10), `--destructive-hover` (T-08; the old hover failed AA at 4.45:1) and the twice-written chart heights (T-05: one map per pair, Sparkline's were written three times) are done. Open: `--body-muted` vs `--muted-foreground` (T-11, a Design naming call) |
| A-10 | **Pairs a tool can't see.** `dag-status.tsx` exports `DagLegend` whose story is `dag-legend.stories.tsx`; `catalog.mjs` carries four `OVERRIDES` for the same reason. `components/actions/action-menu.tsx` (a hook, S-41) has no story. | Scorecard: *Stories* "none"; `catalog.mjs:14-21`. | Eng | File = component = story (one name); the hook gets a docs mention on ContextMenu's page, not a story. | open |
| A-11 | **Hand-rolled where upstream exists, and components drawing outside their area.** Three comboboxes written by hand (AddressField, HeaderSearch, PersonPicker), five input adornments, eight empty states, two surfaces not on Card, five shadcn bases with no importer, three raw buttons with no focus style. | [REUSE.md](REUSE.md), generated by `npm run audit:reuse`. | Eng (George on U-10) | REUSE.md U-01…U-17: adopt `command`, `input-group`, `empty`; use the added `toggle-group`; a shared `pressable`; delete unused bases; `check:reuse`. Decided divergences (Menu, Sparkline, scroll-area) are recorded as kept. | **in progress** 2026-10-29: U-01 Combobox, U-02 InputGroup, U-03 EmptyState, U-04 ToggleGroup, U-06, U-07 `pressable`, U-12 built; `check:reuse` fails a raw `<button>` with no focus style and arrow keys outside their homes. Open: U-05 (Card under CaptureCard/ChoiceCard), U-11 (with the rename), U-14/U-15 sweeps |

## Reading the scorecard

- **Axes (name: values)** is what the component's API says today, parsed from `cva` variants, inline and named string unions, `keyof typeof MAP` props and `kind` discriminants. It is the input to ARCHETYPES.md §4.
- **Prop docs (≈)** counts `name?: Type` lines preceded by a `/** … */` line over all such lines in the file. A `VariantProps & Pick<…>` type has no lines to count (Card shows 0/0), so read it with the *Story desc* and *MDX* columns.
- **Level** is the `level-n` meta tag from LEVELS.md. Empty means the part has not declared one.

<!-- audit:start (generated by `npm run audit`; do not edit by hand) -->

121 component files, 167 exported components. Purpose line on every export: 114; on none: 0. Header comment: 121; `@archetype` declared: 119. Story file: 117. Story with a component description: 27. MDX page: 1. Level tag: 2. Stories: 763; plays: 226. Prop lines documented (≈): 609/952. Axes used by more than one component: 16; value words used by more than one component.axis: 44.

### Scorecard

Archetype is the header's `@archetype` (ARCHETYPES.md §7.2; `check:vocab` reads the same line). Prop docs counts `name?: Type` lines preceded by a `/** … */` line, over all such lines in the file (approximate: it reads the file, not the type). Stories and plays are counted from the story file. Level is the `level-n` meta tag (LEVELS.md); none carries one yet.

| Section | File | Components | Archetype | Axes (name: values) | Purpose line | Prop docs (≈) | Stories | Plays | Story desc | MDX | Level |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Primitives | `primitives/flex.tsx` | Flex | Frame | direction: row · column<br>align: stretch · start · center · end · baseline<br>justify: start · center · end · between | all | 5/9 | 5 | 0 | yes | — | — |
| Primitives | `primitives/grid.tsx` | Grid | Frame | gap: grid · column<br>minItemWidth: xs · sm · md · lg | all | 4/9 | 4 | 0 | — | — | — |
| Primitives | `primitives/inline.tsx` | Inline | Frame | align: start · center · baseline · end<br>justify: start · between · end | all | 2/5 | 3 | 0 | — | — | — |
| Primitives | `primitives/split.tsx` | Split | Frame | align: start · center · end<br>contentMin: sm · md · lg<br>asideMax: none · half | all | 7/8 | 4 | 0 | — | — | — |
| Primitives | `primitives/stack.tsx` | Stack | Frame | align: stretch · start · center | all | 1/4 | 3 | 0 | — | — | — |
| Components › Actions | `components/actions/button.tsx` | Button | Action | iconPosition: start · end<br>variant: primary · secondary · ghost · link · quiet · destructive · tinted<br>size: sm · md · lg · icon · inline<br>underline: true · false | all | 3/6 | 17 | 0 | — | — | — |
| Components › Actions | `components/actions/context-menu.tsx` | ContextMenu | Overlay | kind: item · sub | all | 2/3 | 2 | 1 | — | — | — |
| Components › Actions | `components/actions/copy-button.tsx` | CopyButton | Action | size: sm · md · inline<br>variant: secondary · quiet | all | 2/3 | 2 | 1 | — | — | — |
| Components › Actions | `components/actions/disclosure-trigger.tsx` | DisclosureTrigger | Action | tone: primary · muted · strong | all | 1/1 | 3 | 0 | yes | — | — |
| Components › Actions | `components/actions/dropdown-menu.tsx` | DropdownMenu | Overlay | — | all | 4/9 | 8 | 0 | — | — | — |
| Components › Actions | `components/actions/menu.tsx` | Menu | Composite | kind: item · link · checkbox · radio-group · separator · label | all | 3/6 | 4 | 0 | — | — | — |
| Components › Actions | `components/actions/row-actions.tsx` | RowActions | Composite | — | all | 3/3 | 4 | 3 | — | — | — |
| Components › Display | `components/display/avatar.tsx` | Avatar, AvatarGroup | Media | badge: check · edit<br>fallback: icon · letter<br>size: sm · md · lg · xl · 2xl<br>ring: default · me · none | all | 8/11 | 9 | 2 | — | — | — |
| Components › Display | `components/display/badge.tsx` | Badge | Mark | tone: neutral · info · success · warning · attention · area<br>appearance: soft · outline<br>size: sm · xs | all | 2/5 | 5 | 0 | yes | — | — |
| Components › Display | ~~`components/display/callout.tsx`~~ | ~~Callout~~ merged into Feedback › Callout 2026-10-30 (D-05) | Surface | — | — | — | — | — | — | — | — |
| Components › Display | `components/display/card.tsx` | Card | Surface | variant: default · muted · highlight · placeholder<br>interactive: true · false | all | 0/0 | 6 | 0 | — | — | — |
| Components › Display | `components/display/collapsible.tsx` | Collapsible, CollapsibleContent, CollapsibleTrigger | Frame | — | 1/3 | 0/1 | 2 | 0 | — | — | — |
| Components › Display | `components/display/data-table.tsx` | DataTable | Composite | maxHeight: md · lg · none · fill<br>kind: label · checkbox | all | 17/35 | 10 | 8 | — | — | — |
| Components › Display | `components/display/dot.tsx` | Dot | Mark | tone: none · neutral · primary · info · success · warning · attention · area<br>size: xs · sm · md · lg · xl<br>ring: true · false | all | 6/6 | 4 | 0 | — | — | — |
| Components › Display | `components/display/eyebrow.tsx` | Eyebrow | Text | tone: muted · area · primary | all | 1/6 | 5 | 0 | yes | — | — |
| Components › Display | `components/display/item.tsx` | Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle | Item | density: row · compact | 4/7 | 3/4 | 5 | 0 | yes | — | — |
| Components › Display | `components/display/separator.tsx` | Separator | Frame | orientation: horizontal · vertical<br>level: region · group · row | all | 1/2 | 3 | 0 | — | — | — |
| Components › Display | `components/display/sparkline.tsx` | Sparkline | Chart | variant: line · bar<br>tone: brand · neutral · better · worse<br>size: sm · md · lg | all | 6/7 | 8 | 2 | — | — | — |
| Components › Display | `components/display/stat.tsx` | Stat | Chart | variant: line · bar<br>size: md · lg · compact | all | 19/21 | 12 | 8 | — | — | — |
| Components › Display | `components/display/status-mark.tsx` | StatusMark | Mark | size: sm · md<br>status: open · partial · present · declined · waiting · working · done · attention · skipped · canceled | all | 2/3 | 2 | 1 | — | — | — |
| Components › Feedback | `components/feedback/empty-state.tsx` | EmptyState | Composite | kind: nothing-yet · no-results · error<br>size: sm · md · lg | all | 4/5 | 5 | 4 | — | — | — |
| Components › Feedback | `components/feedback/callout.tsx` (was `message.tsx`, renamed 2026-10-30) | Callout, CalloutAction | Surface | tone: neutral · info · success · attention<br>framed: true · false | all | 4/6 | 9 | 0 | yes | — | — |
| Components › Feedback | `components/feedback/progress.tsx` | Progress | Mark | — | all | 2/3 | 5 | 0 | — | — | — |
| Components › Feedback | `components/feedback/skeleton.tsx` | Skeleton | Mark | shape: text · number · block · circle<br>width: full · 3/4 | all | 0/3 | 3 | 0 | — | — | — |
| Components › Feedback | `components/feedback/spinner.tsx` | Spinner | Mark | size: sm · md · lg | all | 0/3 | 2 | 0 | — | — | — |
| Components › Inputs | `components/inputs/checkbox.tsx` | Checkbox | Control | — | all | 2/4 | 2 | 2 | — | — | — |
| Components › Inputs | `components/inputs/combobox.tsx` | Combobox, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList | Control | — | all | 12/18 | 7 | 7 | yes | — | — |
| Components › Inputs | `components/inputs/input-group.tsx` | InputGroup, InputGroupAddon, InputGroupInput | Control | size: sm · md | all | 1/2 | 5 | 5 | — | — | — |
| Components › Inputs | `components/inputs/input.tsx` | Input | Control | — | all | 0/0 | 7 | 0 | — | — | — |
| Components › Inputs | `components/inputs/multi-select.tsx` | MultiSelect | Control | — | all | 3/6 | 3 | 1 | — | — | — |
| Components › Inputs | `components/inputs/radio-group.tsx` | RadioGroup, RadioGroupItem | Control | — | 1/2 | 0/0 | 4 | 0 | — | — | — |
| Components › Inputs | `components/inputs/rich-text.tsx` | RichText | Control | — | all | 0/0 | 3 | 2 | — | — | — |
| Components › Inputs | `components/inputs/select.tsx` | Select | Control | presentation: auto · popover · native | all | 7/19 | 16 | 0 | yes | — | — |
| Components › Inputs | `components/inputs/switch.tsx` | Switch | Control | — | all | 0/0 | 5 | 1 | — | — | — |
| Components › Inputs | `components/inputs/textarea.tsx` | Textarea | Control | — | all | 0/0 | 13 | 0 | — | — | — |
| Components › Inputs | `components/inputs/toggle-group.tsx` | ToggleGroup, ToggleGroupItem | Control | — | all | 1/1 | 2 | 2 | — | — | — |
| Components › Navigation | `components/navigation/sidebar.tsx` | Sidebar, SidebarLayout, SidebarToggle | Frame | — | all | 13/20 | 5 | 3 | — | — | — |
| Components › Navigation | `components/navigation/tabs-pill.tsx` | TabsPillList | Frame | as: nav · div<br>size: md · sm | all | 0/7 | 7 | 2 | — | — | — |
| Components › Overlays | `components/overlays/confirm-dialog.tsx` | ConfirmDialog | Overlay | tone: default · destructive<br>reason: required · optional | all | 6/8 | 4 | 3 | — | — | — |
| Components › Overlays | `components/overlays/dialog.tsx` | Dialog | Overlay | size: md · lg · xl | all | 4/6 | 5 | 3 | — | — | — |
| Components › Overlays | `components/overlays/popover.tsx` | Popover, PopoverAnchor, PopoverContent, PopoverTrigger | Overlay | — | all | 3/4 | 2 | 1 | — | — | — |
| Components › Overlays | `components/overlays/tooltip.tsx` | Tooltip | Overlay | — | all | 4/4 | 4 | 1 | yes | — | — |
| Charts | `charts/chart.tsx` | Chart, ChartSkeleton | Chart | kind: line · bar | all | 9/12 | 5 | 2 | — | — | — |
| Charts | `charts/dag-frame.tsx` | DagFrame | Chart | height: auto · md · lg<br>defaultView: graph · list<br>tooltipSide: top · right · left | all | 10/47 | 22 | 16 | yes | — | — |
| Charts | `charts/dag-status.tsx` | DagLegend | Chart | — | all | 0/0 | none | — | — | — | — |
| Charts | `charts/lazy-chart.tsx` | LazyChart | Chart | — | all | 0/0 | 2 | 1 | — | — | — |
| Charts | `charts/lazy-dag-frame.tsx` | LazyDagFrame | Chart | — | all | 0/1 | 1 | 1 | — | — | — |
| Forms | `forms/error-summary.tsx` | ErrorSummary | Composite | — | all | 5/7 | 3 | 1 | — | — | — |
| Forms | `forms/field.tsx` | Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet | Frame | orientation: vertical · horizontal<br>appearance: eyebrow · title<br>density: default · roomy | 6/7 | 8/22 | 9 | 2 | — | — | — |
| Forms › Fields | `forms/fields/address-field.tsx` | AddressField | Control | — | all | 6/10 | 17 | 9 | yes | — | — |
| Forms › Fields | `forms/fields/currency-field.tsx` | CurrencyField | Control | — | all | 5/6 | 9 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/date-field.tsx` | DateField | Control | presentation: auto · typed · native | all | 6/9 | 13 | 2 | yes | — | — |
| Forms › Fields | `forms/fields/date-of-birth-field.tsx` | DateOfBirthField | Control | — | all | 5/7 | 8 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/date-range-field.tsx` | DateRangeField | Control | — | all | 5/8 | 4 | 2 | — | — | — |
| Forms › Fields | `forms/fields/field-action.tsx` | FieldAction | Action | — | all | 2/2 | 7 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/password-field.tsx` | PasswordField | Control | autoComplete: current-password · new-password | all | 2/4 | 9 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/phone-field.tsx` | PhoneField | Control | — | all | 3/4 | 7 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/postal-code-field.tsx` | PostalCodeField | Control | — | all | 3/4 | 8 | 1 | yes | — | — |
| Forms › Fields | `forms/fields/ssn-field.tsx` | SsnField | Control | — | all | 4/5 | 12 | 3 | yes | — | — |
| Forms | `forms/form-footer.tsx` | FormFooter | Composite | — | all | 2/4 | 4 | 1 | — | — | — |
| Forms | `forms/form-section.tsx` | FormSection | Frame | density: default · roomy | all | 5/6 | 3 | 0 | — | — | — |
| Forms | `forms/form.tsx` | Form | Frame | — | all | 9/13 | 11 | 11 | — | — | — |
| Forms | `forms/inline-edit.tsx` | InlineEdit | Composite | control: input · select · textarea · field | all | 10/19 | 20 | 10 | yes | — | — |
| Patterns | `patterns/bulk-action-bar.tsx` | BulkActionBar | Composite | kind: count | all | 6/7 | 4 | 4 | — | — | — |
| Patterns | `patterns/filter-card-row.tsx` | FilterCardRow | Composite | — | all | 7/9 | 9 | 3 | — | — | — |
| Patterns | `patterns/filter-chips.tsx` | FilterChips | Composite | — | all | 3/3 | 3 | 1 | — | — | — |
| Patterns | `patterns/filters-popover.tsx` | FiltersPopover | Overlay | — | all | 4/4 | 2 | 1 | — | — | — |
| Patterns | `patterns/kpi-card.tsx` | KpiCard | Surface | — | all | 1/1 | 5 | 2 | — | — | — |
| Patterns | `patterns/kpi-row.tsx` | KpiRow | Composite | — | all | 4/4 | 7 | 3 | — | — | — |
| Patterns | `patterns/list-toolbar.tsx` | ListToolbar | Composite | — | all | 6/6 | 2 | 1 | — | — | — |
| Patterns | `patterns/page-intro.tsx` | PageIntro | Frame | as: h1 · h2 | all | 5/7 | 5 | 0 | — | — | — |
| Patterns | `patterns/panel.tsx` | Panel | Surface | variant: default · muted · quiet | all | 7/7 | 7 | 0 | — | — | — |
| Shell | `shell/account-menu.tsx` | AccountMenu | Composite | kind: label · separator · link | all | 5/5 | 3 | 1 | — | — | — |
| Shell | `shell/app-header.tsx` | AppHeader | Composite | — | all | 4/4 | 6 | 1 | — | — | — |
| Shell | `shell/header-search.tsx` | HeaderSearch | Composite | — | all | 10/14 | 7 | 5 | — | — | — |
| Shell | `shell/notification-bell.tsx` | NotificationBell | Composite | — | all | 5/15 | 6 | 1 | — | — | — |
| Vault › Areas | `vault/areas/area-icon.tsx` | AreaIcon | Media | size: sm · md · lg · xl<br>tone: solid · soft · plain | all | 4/5 | 3 | 0 | — | — | — |
| Vault › Areas | `vault/areas/area-tile.tsx` | AreaTile | Surface | state: not-started · in-progress · set-up | all | 8/10 | 7 | 0 | — | — | — |
| Vault › Areas | `vault/areas/link-out.tsx` | LinkOut | Composite | — | all | 4/5 | 3 | 0 | — | — | — |
| Vault › Areas | `vault/areas/rail-panels.tsx` | RailPanels | Composite | variant: default · muted<br>kind: status · person · document · link · note | all | 2/9 | 1 | 0 | — | — | — |
| Vault | `vault/capture-card.tsx` | CaptureCard | Surface | placement: top · inline | all | 7/7 | 8 | 1 | yes | — | — |
| Vault | `vault/choice-card.tsx` | ChoiceCard, ChoiceCardGroup, ChoiceCardOption | Surface | layout: row · tile | 2/3 | 7/8 | 9 | 0 | — | — | — |
| Vault › Documents | `vault/documents/upload-row.tsx` | UploadRow | Item | kind: document · card | all | 14/14 | 12 | 1 | yes | — | — |
| Vault | `vault/fact-field.tsx` | FactField, FactFieldGrid | Composite | control: input · select · textarea<br>kind: ordinary · autofilled · notFound · conflict · answered | all | 5/6 | 10 | 2 | — | — | — |
| Vault | `vault/fact-item.tsx` | FactItem | Item | density: row · compact<br>kind: person · pet · entity · document · link · note · rest · open · new · struck | all | 16/20 | 16 | 2 | — | — | — |
| Vault | `vault/item-row.tsx` | ItemRow | Item | — | all | 9/9 | 9 | 0 | yes | — | — |
| Vault › People | `vault/people/people-stack.tsx` | PeopleStack | Composite | kind: struck · open · new · rest | all | 9/9 | 14 | 9 | yes | — | — |
| Vault › People | `vault/people/person-add-form.tsx` | PersonAddForm | Composite | — | all | 6/15 | 9 | 5 | — | — | — |
| Vault › People | `vault/people/person-picker.tsx` | PersonPicker | Composite | variant: person · pet<br>mode: pills · search | all | 10/16 | 13 | 3 | yes | — | — |
| Vault › People | `vault/people/quick-add.tsx` | QuickAdd | Composite | — | all | 5/5 | 5 | 1 | — | — | — |
| Vault › People | `vault/people/stack-add.tsx` | StackAdd | Composite | — | all | 8/8 | 10 | 2 | — | — | — |
| Vault › People | `vault/people/stack-entry.tsx` | StackEntry | Item | kind: rest · open · new · struck | all | 10/11 | 9 | 2 | — | — | — |
| Vault | `vault/remove-dialog.tsx` | RemoveDialog | Composite | — | all | 3/4 | 4 | 2 | — | — | — |
| Vault | `vault/status-dot.tsx` | StatusDot | Mark | — | all | 2/3 | 10 | 0 | — | — | — |
| Admin | `admin/admin-sidebar.tsx` | AdminSidebar | Composite | — | all | 4/4 | 3 | 3 | — | — | — |
| Admin | `admin/metric-card.tsx` | MetricCard | Surface | kind: level · flow<br>size: md · lg · compact | all | 11/15 | 5 | 3 | — | — | — |
| Admin › Pages | `admin/pages/partners.tsx` | PartnerLogoDialog, PlanCell | Composite | kind: action · menu · link | all | 2/12 | 11 | 8 | — | — | — |
| Admin › Pages | `admin/pages/subscriptions.tsx` | SubscriptionDetailSections, SubscriptionStatusCell | Composite | kind: action · link | all | 3/7 | 11 | 5 | — | — | — |
| Admin | `admin/partner-logo.tsx` | PartnerLogo | Media | — | all | 2/2 | 4 | 3 | — | — | — |
| Admin | `admin/partner-offers.tsx` | ManageOffersDialog, OfferPreview | Composite | — | all | 3/7 | 7 | 7 | — | — | — |
| Admin | `admin/pipeline-graph.tsx` | PipelineGraph | Chart | height: auto · md · lg<br>defaultView: graph · list<br>status: NotStarted · Queued · Waiting · Running · Succeeded · Failed · Canceled · Skipped | all | 10/36 | 7 | 3 | — | — | — |
| Admin | `admin/rev-share.tsx` | PartnerRevShareSection, RevShareDefaultsSection, RevShareParamsForm, RevShareParamsView | Composite | — | all | 5/9 | 6 | 6 | — | — | — |
| Setup | `setup/flow-footer.tsx` | FlowFooter | Composite | — | all | 14/19 | 8 | 0 | — | — | — |
| Setup | `setup/step-rail.tsx` | StepRail | Composite | — | all | 3/4 | 5 | 0 | — | — | — |
| Templates | `templates/admin-page.tsx` | AdminPage | Frame | — | all | 9/9 | 3 | 3 | — | — | — |
| Templates | `templates/area-page.tsx` | AreaPage | Frame | — | all | 6/6 | 5 | 0 | — | — | — |
| Templates | `templates/home-page.tsx` | HomePage | Frame | — | all | 4/4 | 4 | 0 | — | — | — |
| Templates | `templates/list-page.tsx` | ListPage | Frame | — | all | 12/14 | 5 | 2 | — | — | — |
| Templates | `templates/page-header.tsx` | PageHeader | Frame | — | all | 7/8 | 3 | 0 | — | — | — |
| Templates | `templates/page.tsx` | Page, PageBand | Frame | width: default · focused · wide<br>top: default · roomy | 1/2 | 6/6 | 11 | 0 | yes | — | — |
| Templates | `templates/setup-beat.tsx` | SetupBar, SetupBeat | Frame | width: focused · wide<br>density: default · roomy | all | 17/23 | 6 | 0 | — | — | — |
| Labs › Components | `labs/components/item.tsx` | ItemFrame, Item | Item | emphasis: secondary · text<br>size: default · sm<br>kind: button · link · icons · menu · decline · content | all | 15/24 | 13 | 0 | — | yes | level-0 |
| Labs › Vault | `labs/vault/fact-catalog.tsx` | FactCatalogProvider | — | — | all | 0/0 | none | — | — | — | — |
| Labs › Vault | `labs/vault/fact-list.tsx` | FactList, FactListFrame | Composite | kind: toggle · close | 1/2 | 6/8 | 3 | 0 | yes | — | level-0 |
| Labs › Vault › People | `labs/vault/people/people-facts.tsx` | ContactFact, PetFact | Item | kind: open · rest | all | 0/1 | none | — | — | — | — |
| Labs › Vault | `labs/vault/scopes.tsx` | VaultProvider, AreaScope, SectionScope | — | — | all | 3/3 | none | — | — | — | — |

### Axes

Every axis name used by more than one component, and the value set each one gives it. One axis with several distinct value sets is a word doing several jobs. `kind` is left out: a discriminant differs per union by design (TS-BAR §2).

| Axis | Components | Distinct value sets | Who gives it which values |
|---|---|---|---|
| `size` | 16 | 11 | **Button** sm · md · lg · icon · inline<br>**CopyButton** sm · md · inline<br>**Avatar** sm · md · lg · xl · 2xl<br>**Badge** sm · xs<br>**Dot** xs · sm · md · lg · xl<br>**Sparkline** sm · md · lg<br>**Stat** md · lg · compact<br>**StatusMark** sm · md<br>**EmptyState** sm · md<br>**Spinner** sm · md · lg<br>**InputGroup** sm · md<br>**TabsPillList** md · sm<br>**Dialog** md · lg · xl<br>**AreaIcon** sm · md · lg · xl<br>**MetricCard** md · lg · compact<br>**Item** default · sm |
| `tone` | 8 | 8 | **DisclosureTrigger** primary · muted · strong<br>**Badge** neutral · info · success · warning · attention · area<br>**Dot** none · neutral · primary · info · success · warning · attention · area<br>**Eyebrow** muted · area · primary<br>**Sparkline** brand · neutral · better · worse<br>**Message** neutral · info · success · attention<br>**ConfirmDialog** default · destructive<br>**AreaIcon** solid · soft · plain |
| `variant` | 8 | 7 | **Button** primary · secondary · ghost · link · quiet · destructive · tinted<br>**CopyButton** secondary · quiet<br>**Card** default · muted · highlight · placeholder<br>**Sparkline** line · bar<br>**Stat** line · bar<br>**Panel** default · muted · quiet<br>**RailPanels** default · muted<br>**PersonPicker** person · pet |
| `density` | 5 | 2 | **Item** row · compact<br>**Field** default · roomy<br>**FormSection** default · roomy<br>**FactItem** row · compact<br>**SetupBeat** default · roomy |
| `align` | 4 | 4 | **Flex** stretch · start · center · end · baseline<br>**Inline** start · center · baseline · end<br>**Split** start · center · end<br>**Stack** stretch · start · center |
| `width` | 3 | 3 | **Skeleton** full · 3/4<br>**Page** default · focused · wide<br>**SetupBeat** focused · wide |
| `appearance` | 2 | 2 | **Badge** soft · outline<br>**Field** eyebrow · title |
| `as` | 2 | 2 | **TabsPillList** nav · div<br>**PageIntro** h1 · h2 |
| `control` | 2 | 2 | **InlineEdit** input · select · textarea · field<br>**FactField** input · select · textarea |
| `defaultView` | 2 | 1 | **DagFrame** graph · list<br>**PipelineGraph** graph · list |
| `height` | 2 | 1 | **DagFrame** auto · md · lg<br>**PipelineGraph** auto · md · lg |
| `justify` | 2 | 2 | **Flex** start · center · end · between<br>**Inline** start · between · end |
| `orientation` | 2 | 1 | **Separator** horizontal · vertical<br>**Field** vertical · horizontal |
| `presentation` | 2 | 2 | **Select** auto · popover · native<br>**DateField** auto · typed · native |
| `ring` | 2 | 2 | **Avatar** default · me · none<br>**Dot** true · false |
| `status` | 2 | 2 | **StatusMark** open · partial · present · declined · waiting · working · done · attention · skipped · canceled<br>**PipelineGraph** NotStarted · Queued · Waiting · Running · Succeeded · Failed · Canceled · Skipped |

### Words

Every value word used by more than one `component.axis`. A word under axes with different meanings is the vocabulary problem in one row.

| Word | Uses | As | 
|---|---|---|
| `md` | 19 | Grid.minItemWidth, Split.contentMin, Button.size, CopyButton.size, Avatar.size, DataTable.maxHeight, Dot.size, Sparkline.size, Stat.size, StatusMark.size, EmptyState.size, Spinner.size, InputGroup.size, TabsPillList.size, Dialog.size, DagFrame.height, AreaIcon.size, MetricCard.size, PipelineGraph.height |
| `sm` | 15 | Grid.minItemWidth, Split.contentMin, Button.size, CopyButton.size, Avatar.size, Badge.size, Dot.size, Sparkline.size, StatusMark.size, EmptyState.size, Spinner.size, InputGroup.size, TabsPillList.size, AreaIcon.size, Item.size |
| `lg` | 14 | Grid.minItemWidth, Split.contentMin, Button.size, Avatar.size, DataTable.maxHeight, Dot.size, Sparkline.size, Stat.size, Spinner.size, Dialog.size, DagFrame.height, AreaIcon.size, MetricCard.size, PipelineGraph.height |
| `start` | 7 | Flex.align, Flex.justify, Inline.align, Inline.justify, Split.align, Stack.align, Button.iconPosition |
| `end` | 6 | Flex.align, Flex.justify, Inline.align, Inline.justify, Split.align, Button.iconPosition |
| `center` | 5 | Flex.align, Flex.justify, Inline.align, Split.align, Stack.align |
| `muted` | 5 | DisclosureTrigger.tone, Card.variant, Eyebrow.tone, Panel.variant, RailPanels.variant |
| `row` | 5 | Flex.direction, Item.density, Separator.level, ChoiceCard.layout, FactItem.density |
| `attention` | 4 | Badge.tone, Dot.tone, StatusMark.status, Callout.tone |
| `auto` | 4 | Select.presentation, DagFrame.height, DateField.presentation, PipelineGraph.height |
| `compact` | 4 | Item.density, Stat.size, FactItem.density, MetricCard.size |
| `neutral` | 4 | Badge.tone, Dot.tone, Sparkline.tone, Callout.tone |
| `primary` | 4 | Button.variant, DisclosureTrigger.tone, Dot.tone, Eyebrow.tone |
| `roomy` | 4 | Field.density, FormSection.density, Page.top, SetupBeat.density |
| `xl` | 4 | Avatar.size, Dot.size, Dialog.size, AreaIcon.size |
| `area` | 3 | Badge.tone, Dot.tone, Eyebrow.tone |
| `info` | 3 | Badge.tone, Dot.tone, Callout.tone |
| `inline` | 3 | Button.size, CopyButton.size, CaptureCard.placement |
| `quiet` | 3 | Button.variant, CopyButton.variant, Panel.variant |
| `secondary` | 3 | Button.variant, CopyButton.variant, Item.emphasis |
| `success` | 3 | Badge.tone, Dot.tone, Callout.tone |
| `xs` | 3 | Grid.minItemWidth, Badge.size, Dot.size |
| `bar` | 2 | Sparkline.variant, Stat.variant |
| `baseline` | 2 | Flex.align, Inline.align |
| `between` | 2 | Flex.justify, Inline.justify |
| `column` | 2 | Flex.direction, Grid.gap |
| `destructive` | 2 | Button.variant, ConfirmDialog.tone |
| `focused` | 2 | Page.width, SetupBeat.width |
| `graph` | 2 | DagFrame.defaultView, PipelineGraph.defaultView |
| `horizontal` | 2 | Separator.orientation, Field.orientation |
| `icon` | 2 | Button.size, Avatar.fallback |
| `input` | 2 | InlineEdit.control, FactField.control |
| `line` | 2 | Sparkline.variant, Stat.variant |
| `list` | 2 | DagFrame.defaultView, PipelineGraph.defaultView |
| `native` | 2 | Select.presentation, DateField.presentation |
| `select` | 2 | InlineEdit.control, FactField.control |
| `soft` | 2 | Badge.appearance, AreaIcon.tone |
| `stretch` | 2 | Flex.align, Stack.align |
| `text` | 2 | Skeleton.shape, Item.emphasis |
| `textarea` | 2 | InlineEdit.control, FactField.control |
| `top` | 2 | DagFrame.tooltipSide, CaptureCard.placement |
| `vertical` | 2 | Separator.orientation, Field.orientation |
| `warning` | 2 | Badge.tone, Dot.tone |
| `wide` | 2 | Page.width, SetupBeat.width |

<!-- audit:end -->
