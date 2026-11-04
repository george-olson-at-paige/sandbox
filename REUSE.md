# Reuse — where `@paige/ui` inherits shadcn's maintenance, and where it built its own (opened 2026-10-29)

The last piece of the quality pass ([AUDIT.md](AUDIT.md), [ARCHETYPES.md](ARCHETYPES.md), [TOKENS.md](TOKENS.md)). Two questions, asked of every component file: *is there an upstream shadcn part that does this job, and are we on it?* and *does this component stay in its own area, or does it draw elements that belong to another component?* The answer is only a finding **where it makes sense**: a divergence with a written reason (Sparkline draws its own SVG so a Stat never loads Recharts, R8-08) is kept and recorded as such, not re-litigated. The measured sections below the line are generated (`npm run audit:reuse`, `scripts/audit-reuse.mjs`); the judgments here are written. `U-nn` ids are new and never reused.

## 1. What the measurement says

- **The components layer is on the bases.** 34 shadcn files in `src/base`; every Paige component with a same-named base imports it (Button, Badge, Avatar, Card, Checkbox, Dialog, Input, Item, Popover, Progress, Select, Separator, Skeleton, Spinner, Switch, Table, Textarea, Tooltip…), and the layers above reach them through those wrappers (Panel → Card → `base/card`), which is what the layer rule asks for. The inheritance story is sound where a base exists.
- **Five bases nobody uses**: `label`, `sheet`, `tabs`, `toggle`, `toggle-group`. Upstream code with no consumer is diff noise on every `ui:diff-base` and a Base story each, for nothing.
- **Three hand-rolled comboboxes** (as found; U-01 built). AddressField, HeaderSearch and PersonPicker each wrote their own suggestion list: arrow-key handling (3 + 3 + 3 occurrences), a listbox, an `absolute top-full` panel in AddressField's case. shadcn's `command` (cmdk) and the Popover + Command combobox recipe are exactly this, and the package hadn't added them. FilterCardRow hand-rolled arrow keys too (2), for a single-choice row that `toggle-group` or RadioGroup gives for free (U-04 built).
- **Five input adornments by hand** (as found; U-02 built) (`pl-9`/`pr-9` beside a control): ListToolbar's search (2), HeaderSearch (2), AddressField, PersonPicker, and FieldAction, which is a trailing button inside a field: shadcn's `input-group`, not added then.
- **Eight empty states by hand**: DataTable, ListPage, the five admin lists and DagFrame each compose their own "nothing here"; shadcn's `empty`, not added.
- **Raw `<button>` in 17 files** outside Button. Most are legitimate: a menu item, a choice card, a pill, a row's title (S-31: "the title is the row's control"), a sort header are Actions with a shape Button doesn't have. The cost shows elsewhere: **three files' raw buttons say nothing about focus** (FieldAction, PersonPicker ×2, QuickAdd, which also lacks `cursor-pointer`), so they get the browser's default ring instead of R15-17's, because there is no shared reset for "a thing you press that isn't a Button".
- **Local variant systems**: two `cva` definitions outside the components layer (AreaIcon, ChoiceCard). ChoiceCard's is private by rule (R2-33); the question is whether the card look it defines should be Card's.
- **Two surfaces not on Card**: CaptureCard and ChoiceCard draw their own border, radius, padding and shadow. FilterCardRow shows the right pattern: it imports `cardVariants` and inherits.

## 2. Findings

| ID | Evidence | Verdict | Who | Proposal | Status |
|---|---|---|---|---|---|
| U-01 | **Combobox ×3.** `forms/fields/address-field.tsx` (arrow keys ×3, own `absolute top-full` panel ×2, adornment), `shell/header-search.tsx` (arrow keys ×3, listbox, `<input>` raw), `vault/people/person-picker.tsx` (arrow keys ×3, raw buttons with no focus style). Three implementations of typeahead + list + keyboard, none shared | **adopt** | Eng | `ui:add command`; one `Combobox` in `components/inputs/` over `base/popover` + `base/command` (filtering, `aria-activedescendant`, arrow/Home/End/Escape, typeahead for free); AddressField, HeaderSearch and PersonPicker's search sit on it. MultiSelect stays on its checkbox list (R13-06, decided) | **built** 2026-10-29. `components/inputs/combobox.tsx` over `base/command` (cmdk) and Popover: `Combobox` (the root, `open`/`onOpenChange` the caller's, `inline` for a list in the flow, R14-04), `ComboboxInput` (a Paige `InputGroupInput`, so it sits in an `InputGroup` with any addon), `ComboboxList` (a popover the width of the field, or the inline panel; `empty` renders outside the listbox), `ComboboxGroup`, `ComboboxItem` (`asChild` for a Link). The caller filters; the first option is highlighted so Enter picks something; Enter on a link option follows it, Enter with nothing open submits the form; Home/End move the caret. On it: HeaderSearch (grouped results as Links; the pill is an InputGroup now, so the focus halo shows), AddressField (the `absolute top-full` panel is a Popover), PersonSearch (inline). 9 arrow-key handlers gone; the Paige files left handling arrows are Combobox, DateField (Alt+Down opens the calendar) and DagFrame (pans), each named in `check:reuse`'s `ARROW_OK` with its reason. **cmdk cost four workarounds**, each in the header comment: its `Command.Input` forces `aria-expanded="true"` and its own ids, so the input is Paige's and reads the list's id back; its `Enter` fires `onSelect` with no click, so Combobox clicks the highlighted element; its layout-effect scheduler keys by priority, so several options leaving in one commit lose the highlight (Combobox holds `value` and re-derives it from the DOM); its `selectedItemId` lags a controlled value (the `aria-activedescendant` is read from the DOM too). Axe: a listbox with nothing but the empty line fails `aria-required-children`, hence `empty` outside and the list `hidden`; upstream's own demo (Base › Command) fails the same rule through `CommandSeparator` (a separator inside a listbox), so Combobox has no separator part and groups carry the structure |
| U-02 | **Input adornments ×5.** `pl-9`/`pr-9` insets beside a control in ListToolbar (2), HeaderSearch (2), AddressField, PersonPicker; `forms/fields/field-action.tsx` is a trailing button inside a field drawn by hand (raw `<button>`, no focus style) | **adopt** | Eng | `ui:add input-group`; FieldAction = `InputGroupAddon align="inline-end"` + `InputGroupButton`; the search boxes = `InputGroup` with a leading icon addon. The `pl-9` literal (TOKENS T-01's `pl-control`) disappears with it | **built** 2026-10-29, in part. `components/inputs/input-group.tsx` over the base: the Paige control box (border, card shadow, radius, 44 or `size="sm"` 36) moves from the input onto the group, with focus, invalid and disabled read from the control inside (`has-[]`); `InputGroupInput` is the Paige Input with its box off (a Field's ids still reach it); `InputGroupAddon` has Paige's insets (12 before a glyph, 10 after an action). FieldAction stays its own button (`pressable`, 24px, no chrome: R5-03) but no longer positions itself; `fieldActionPad` is gone. On it: PasswordField, DateField (the Popover trigger inside the addon), MaskedInput (so SsnField's reveal, and Phone/Postal/Currency with no addon), ListToolbar's search (glyph before, clear after; its raw clear button is a FieldAction now). **Not moved**: HeaderSearch (its field is the animating root; U-01 rebuilds it), AddressField and PersonPicker's search (U-01's Combobox sites). Found: the base transitions box-shadow, so a focus play has to wait for the halo; the pseudo-states addon does rewrite `has-[…:focus-visible]`, but a real Tab is the honest test |
| U-03 | **Empty states ×8.** DataTable (`emptyMessage`/`emptyState`), ListPage (`emptyMessage`, `noResults`), the five admin lists, DagFrame each compose "nothing here" | **adopt** | Eng | `ui:add empty`; one `EmptyState` (components/feedback) over it with `kind: nothing-yet · no-results · error`; DataTable and ListPage take an `EmptyStateProps`, not a string | **built** 2026-10-29. `base/empty` added (with a Base story); `components/feedback/empty-state.tsx` over it: `title`, `description`, `icon` (a 40px round muted disc, DagFrame's), `actions`, `kind` (`data-kind`; error is `role="alert"` with the title in the attention ink), `size` sm (a table's or pane's line: 14px at 500 muted, 40px above and below, the reading measure wide) · md (a page's, the base's sizes). DataTable's empty **and** error rows are one EmptyState (`emptyMessage` → title; `emptyState?: EmptyStateProps` replaces the ReactNode; `error` → kind error with Try again); ListPage's no-results is `EmptyStateProps` with Clear all; DagFrame's empty pane reads it with its glyph. The five admin lists were already strings into ListPage/DataTable and didn't change. Found: the base holds its header to 384px, which wrapped a table's one-liner; sm widens it to `max-w-measure` |
| U-04 | **Single-choice rows with hand-rolled roving focus.** `patterns/filter-card-row.tsx` (arrow keys ×2, raw `<button>`); `vault/choice-card.tsx` multi mode is toggle buttons (raw `<button>`, local `cva`) | **adopt** | Eng | `base/toggle-group` is already added and unused: FilterCardRow = `ToggleGroup type="single"` (roving tabindex, `aria-pressed`/`data-state` for free); ChoiceCard multi = `ToggleGroup type="multiple"`, single stays RadioGroup. `base/toggle` goes with it or is deleted (U-06) | **built** 2026-10-29, half as proposed. `components/inputs/toggle-group.tsx` over the base: the root a block (the caller's Grid or Inline lays the items out; `spacing` held non-zero so the base's joined-bar corners don't apply), `ToggleGroupItem variant="card"` carrying R15-13's segment-card states. FilterCardRow sits on it: 20 lines of hand-rolled roving focus gone; it keeps two lines a radio group has over a toggle group (choose as focus arrives; never clear the value). **ChoiceCard multi stays a raw button**: each card is an independent choice and its own tab stop, like a checkbox; a ToggleGroup would hide them behind one tab stop, and the lone Toggle adds nothing the button doesn't already say. Found: (1) the base enters the group through its root (`tabindex=0` on the group until an item has been focused) and forwards focus to the pressed item, so "one tab stop" is still true but the plays had to Tab in rather than count `tabIndex === 0`; (2) a Tooltip trigger around an item overwrites Radix's `data-state` (open/closed over on/off), so the chosen look reads ARIA instead: `toggled:` is a new theme variant (`aria-checked`/`aria-pressed` true) |
| U-05 | **Surfaces not on Card.** `vault/capture-card.tsx` and `vault/choice-card.tsx` draw their own border, radius, padding and shadow; `patterns/filter-card-row.tsx` imports `cardVariants` and inherits | **wrap** | Eng | Both compose `cardVariants` (or Card) and keep only what differs (CaptureCard's brand border; ChoiceCard's selected state). With ARCHETYPES' Surface `emphasis`, "selected" and "capture" become states on one Surface, not two drawings | open |
| U-06 | **Bases with no importer**: `label`, `sheet`, `tabs`, `toggle`, `toggle-group` | **decide** | Eng | `toggle-group` is used by U-04. `label`: either the home for the six raw `<label>`s in the components layer (MultiSelect, ConfirmDialog's reason, RichTextEditor; forms can't be imported there) or deleted. `tabs`: TabsPillList accepts Radix Tabs triggers (R1-26) but nobody renders panels; delete until a consumer exists. `sheet`, `toggle`: delete; `ui:add` is one command when needed. A base earns its place by an importer | **built** 2026-10-29. The list was wrong by three: `sheet` is imported by base `sidebar` (its mobile drawer), `toggle` by base `toggle-group`, `label` by base `field` — upstream internals, kept with their importer; the script now says so ("upstream internal: imported by base …") instead of "no Paige importer". Deleted: `base/tabs.tsx` and its story (nobody imported it; TabsPill is route links, not Radix panels). `toggle-group` stays for U-04. `label` stays as `field`'s internal; whether the six raw `<label>`s move onto it is U-16's call, not this one |
| U-07 | **No shared pressable.** 17 files write a raw `<button>` that isn't a Button; each restates (or forgets) focus, cursor and disabled. FieldAction, PersonPicker ×2 and QuickAdd have no focus-visible style; QuickAdd has no `cursor-pointer` | **wrap** | Eng | `components/internal/pressable.ts`: one class string (`cursor-pointer focus-ring disabled:… motion-reduce:…`) every non-Button press target composes, next to `controlFocus`/`cardFocus` in `control.ts` which already does this for two cases. `check:reuse` then flags a raw `<button>` whose className lacks it | **built** 2026-10-29. `pressable` lives in `components/internal/control.ts` beside `controlFocus`/`cardFocus` (one home for focus by kind of control, not a fourth file): `cursor-pointer focus-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-none`. FieldAction composes it (its header no longer says focus is the browser's); PersonPicker's `PILL` composes it, so QuickAdd inherits through `personPill`. New `scripts/check-reuse.mjs` (`npm run check:reuse`, in `npm run check`): a file that writes `<button>` passes if its source uses a focus helper or a named import whose declaration composes one (`personPill` → `PILL` → `pressable`); importing Input or PersonPicker alone does not count (verified with a probe file). The other 13 raw-button files already carried a helper |
| U-08 | **Menu is not a menu** (R4-08, decided). `components/actions/menu.tsx` renders the in-page list with plain buttons and no ARIA menu roles on purpose: a page list doesn't promise arrow keys | **keep** | — | Record the reason on Menu's docs page (it is in the header comment). DropdownMenu stays "a Menu in a popover" on `base/dropdown-menu` | keep |
| U-09 | **Sparkline draws its own SVG** (R8-08, decided): no Recharts in a Stat | **keep** | — | Nothing. It is the right trade; `base/chart` stays Chart's | keep |
| U-10 | **RemoveDialog on Dialog, not ConfirmDialog.** Two ways off plus Cancel (ADR 0076 rule 6) where ConfirmDialog has one action | **keep, note** | George | Keep. If a third dialog needs two actions, ConfirmDialog grows `actions` and RemoveDialog moves onto it; until then one special case is cheaper than a generic prop | keep |
| U-11 | **ItemRow is not on Item.** `vault/item-row.tsx` is the one same-job file for `base/item` that inherits nothing (FactItem and Labs Item do) | **wrap, with the rename** | Eng | S-28's rename (ARCHETYPES D-14) rebuilds it on Item: media, title, description, actions is Item's shape. Not before: two changes to one file | open |
| U-12 | **Radix primitives imported beside their base.** `dialog.tsx`, `confirm-dialog.tsx`, `dropdown-menu.tsx` import `Dialog`/`AlertDialog`/`DropdownMenu` from `radix-ui` for Root/Trigger/Portal while taking styled parts from the base; `button.tsx` imports `Slot` | **wrap** | Eng | Take Root/Trigger/Portal from the base's re-exports (`base/dialog` exports them all) so an upstream change to Root (a `data-slot`, a prop) is inherited; `Slot` in Button is fine (the base uses it the same way). Then `direct-primitive` outside `src/base` is a `check:layers` error | **built** 2026-10-29. On reading, the premise was half wrong: all three already take Root, Trigger, Portal, Overlay, Title, Description and Close from the base. What they take from `radix-ui` is only what the base can't give: `Dialog.Content` and `AlertDialog.Content` (the base's Content carries its own `bg-black/50` overlay and a centred box that can't cap at the viewport), `AlertDialog.Cancel` (the base's applies `buttonVariants`, which fights the Paige Button under `asChild`), `DropdownMenu.ItemIndicator` (not re-exported upstream). Each is now named in `PRIMITIVE_OK` in `scripts/check-layers.mjs` with its reason; any other part, or any other file, is a `PRIMITIVE` finding (verified: `DialogPrimitive.Trigger` fails the check) |
| U-13 | **Scroll-area not adopted** (R10-08, decided): native thin scrollbars (`scrollbar-thin`) everywhere | **keep** | — | Nothing. The heuristic hit (6 files) is the rule working | keep |
| U-14 | **Separator by hand.** `border-t border-divider` dividers in 10 files where `Separator level="row"` says the same (CLAUDE.md "A line's weight follows what it separates") | **partly** | Eng | Where the line is an element between siblings (RailPanels, RevShare ×2, FiltersPopover, StackAdd), use Separator so the level is in code. Where it is the row's own top border in a list (Item, ItemRow, FactField, StackEntry), it stays a border: Separator would add an element per row. `check:reuse` distinguishes by whether the class sits on a sibling-less `<div>` | open |
| U-15 | **Badge-shaped spans.** `rounded-full` + `text-xs` in DagFrame, Stat, MultiSelect's count, DateRangeField, FiltersPopover | **look** | Eng | MultiSelect's count ("Direct, Sponsored… 3") and FiltersPopover's are Badge `xs neutral`; Stat's and DagFrame's are to check: a trend chip is a Badge with a `trend` tone (ARCHETYPES Chart), or it isn't a badge at all | open |
| U-16 | **In-content anchors.** `<a href>` in `components/inputs/rich-text.tsx` (links inside authored content) and `forms/error-summary.tsx` (`#field-id` jumps) | **keep** | — | Both are correct: rendered HTML and same-page anchors never route through Next. Added to the homes list so they stop appearing | keep |
| U-17 | **The rest of the raw elements are right.** `<input type="file">` in UploadRow and PartnerLogoDialog; `<table>` as Chart's accessible data fallback; `<form>` in FiltersPopover (not a Form: no submit flow); `<img>` in OfferPreview | **keep** | — | Nothing; listed so the next reader doesn't re-ask. Chart's table could sit on `base/table` for the look, at no cost | keep |
| U-18 | **Attachment's `<img>` and Toast's drawn buttons** (R19, 2026-10-30). `components/display/attachment.tsx` writes `<img>` for a file's thumbnail; `components/feedback/toast.tsx` hands sonner class strings for the action and cancel buttons it draws itself | **keep** | — | The thumbnail is a picture of a file, not a person (Avatar) or a partner (PartnerLogo); `attachment.tsx` is in the `img` homes. The buttons are sonner's elements, so they get `buttonClassName("primary" \| "secondary", "sm")` from Button, the exact classes a `<Button>` renders, not a pill of their own (a badge signal until they did) | keep |

## 3. The rule that keeps it this way

Adding a component starts with `ui:diff-base`'s neighbour, the registry: **if shadcn has it, `ui:add` it and wrap it; if a Paige component has it, import that; only then draw it.** Concretely, for `packages/ui/CLAUDE.md` § Rules:

- **Inherit before you draw.** A new part checks the shadcn registry (the list in `scripts/audit-reuse.mjs`) and `CATALOG.md` first. A base is wrapped in `components/` and reached through the wrapper above that layer (`check:layers`). A part that deliberately doesn't use the obvious base says why in its header comment, in one sentence, with the review id, so `audit:reuse` can list it as decided.
- **Stay in your area.** A component draws only what no component below it draws: a press target that isn't a Button composes `pressable`; a divider between siblings is Separator; an empty state is EmptyState; a tiny status is Dot or Badge; a typeahead is Combobox. The `SIGNALS` table in the script is the list, and grows when a new home exists.
- **A base earns its place by an importer** (U-06). `ui:add` when the first consumer lands; delete when the last one leaves.
- **`check:reuse`** (same shape as `check:layers`; the parsing is this script's): errors on a raw `<button>` without `pressable`/Button (U-07, on); `"ArrowDown"`/`"ArrowUp"` handling outside the homes (U-01, on: `ARROW_OK` names Combobox, DateField and DagFrame with the reason each is not a list); a Radix/cmdk primitive outside `src/base` is `check:layers`' `PRIMITIVE` rule (U-12, on). Still to come: `animate-spin`/`animate-pulse` outside Spinner/Skeleton; a base with no importer; warnings for the softer signals (badge-shaped spans, hand dividers). Decided divergences are exempt by a `@reuse-decided R8-08` line in the header, which the script reads.

## 4. Order of work

1. U-06 deletions and U-12 re-exports (an hour; no look changes).
2. U-07 `pressable` and the three unfocused buttons (small, fixes an accessibility gap).
3. U-02 `input-group` → FieldAction and the four search boxes.
4. U-01 `command` → Combobox → AddressField, HeaderSearch, PersonPicker.
5. U-03 `empty` → EmptyState → DataTable, ListPage, admin lists, DagFrame.
6. U-04 ToggleGroup → FilterCardRow, ChoiceCard multi; U-05 Card under CaptureCard and ChoiceCard (with ARCHETYPES' Surface emphasis if that lands first).
7. U-14/U-15 sweeps; U-11 with the rename; `check:reuse` on.

Each step removes hand-written keyboard or focus code and replaces it with upstream's; the plays that cover those components (AddressField 9, PersonPicker 3, HeaderSearch 5, FilterCardRow 3, DataTable 8) are the regression net, and should pass unchanged.

---

<!-- reuse:start (generated by `npm run audit:reuse`; do not edit by hand) -->

169 Paige component files (internal helpers included; base, stories and the story-only folders excluded). 41 shadcn bases in `src/base`: 0 with no Paige importer; 9 Paige file(s) that do a base's job without importing it. 14 registry components not added, 4 of them with Paige markup that looks like a hand-rolled copy. Raw elements outside their home: 28 in 22 files. Files with at least one out-of-area signal: 25.

### Bases: who inherits them

Every upstream file in `src/base`, the Paige files that import it directly, the files that reach it through one of those (a Panel over Card over `base/card`: the right path above the components layer), and the Paige files that do the same job through neither (`SAME_JOB` in the script names the pairs). A base with no importer is maintenance paid for nothing; a same-job file that doesn't inherit is a copy that pays its own.

| Base | Imported by | Reached through a wrapper by | Same job, inheriting nothing | Note |
|---|---|---|---|---|
| `alert` | `components/feedback/callout.tsx` | `admin/partner-offers.tsx`, `charts/dag-frame.tsx`, `forms/error-summary.tsx` | — |  |
| `alert-dialog` | `components/overlays/confirm-dialog.tsx` | `admin/pages/partners.tsx`, `admin/pages/people.tsx`, `admin/pages/plans.tsx`, `admin/pages/promotion-codes.tsx`, `admin/pages/subscriptions.tsx` (+4) | `vault/remove-dialog.tsx` | **copy beside the base** |
| `attachment` | `components/display/attachment.tsx` | `components/feedback/toast.tsx` | — |  |
| `avatar` | `components/display/avatar.tsx` | `shell/account-menu.tsx`, `vault/fact-item.tsx`, `vault/people/person-picker.tsx`, `vault/people/stack-entry.tsx` | — |  |
| `badge` | `components/display/badge.tsx` | `admin/pages/partners.tsx`, `admin/pages/people.tsx`, `admin/pages/plans.tsx`, `admin/pages/promotion-codes.tsx`, `admin/pages/subscriptions.tsx` (+7) | — |  |
| `breadcrumb` | `components/navigation/breadcrumb.tsx` | — | — |  |
| `button` | `components/actions/button.tsx` | `admin/pages/partners.tsx`, `admin/partner-offers.tsx`, `admin/rev-share.tsx`, `charts/dag-frame.tsx`, `components/actions/action-menu.tsx` (+30) | — |  |
| `button-group` | `components/actions/button-group.tsx` | `charts/dag-frame.tsx` | — |  |
| `calendar` | `forms/fields/date-field.tsx` | `forms/fields/date-range-field.tsx` | — |  |
| `card` | `components/display/card.tsx` | `admin/pages/subscriptions.tsx`, `admin/rev-share.tsx`, `components/inputs/toggle-group.tsx`, `patterns/kpi-card.tsx`, `patterns/panel.tsx` (+4) | `vault/capture-card.tsx`, `vault/choice-card.tsx` | **copy beside the base** |
| `chart` | `charts/chart.tsx` | `charts/lazy-chart.tsx` | `components/display/sparkline.tsx` | **copy beside the base** |
| `checkbox` | `components/inputs/checkbox.tsx` | `admin/partner-offers.tsx`, `admin/rev-share.tsx`, `components/display/data-table.tsx`, `components/inputs/multi-select.tsx` | — |  |
| `collapsible` | `components/display/collapsible.tsx` | `components/display/timeline.tsx` | — |  |
| `command` | `components/inputs/combobox.tsx` | `forms/fields/address-field.tsx`, `shell/header-search.tsx`, `vault/people/person-picker.tsx` | — |  |
| `context-menu` | `components/actions/context-menu.tsx` | `components/actions/action-menu.tsx`, `components/internal/list-action.tsx` | — |  |
| `dialog` | `components/overlays/dialog.tsx` | `admin/partner-offers.tsx`, `vault/remove-dialog.tsx` | — |  |
| `dropdown-menu` | `components/actions/dropdown-menu.tsx`, `components/internal/popover-group.tsx` | `components/actions/action-menu.tsx`, `components/display/data-table.tsx`, `components/navigation/breadcrumb.tsx`, `shell/account-menu.tsx`, `shell/app-header.tsx` (+3) | `components/actions/menu.tsx` | **copy beside the base** |
| `empty` | `components/feedback/empty-state.tsx` | `charts/dag-frame.tsx`, `components/display/data-table.tsx`, `templates/list-page.tsx` | — |  |
| `field` | `forms/field.tsx` | `admin/pages/people.tsx`, `admin/partner-offers.tsx`, `admin/rev-share.tsx`, `forms/fields/address-field.tsx`, `patterns/filters-popover.tsx` (+1) | — |  |
| `hover-card` | `components/overlays/hover-card.tsx` | `patterns/kpi-card.tsx` | — |  |
| `input` | `components/inputs/input.tsx` | `admin/partner-offers.tsx`, `admin/rev-share.tsx`, `components/inputs/input-group.tsx`, `components/internal/rich-text-editor.tsx`, `forms/fields/address-field.tsx` (+5) | — |  |
| `input-group` | `components/inputs/input-group.tsx` | `components/inputs/combobox.tsx`, `forms/fields/address-field.tsx`, `forms/fields/date-field.tsx`, `forms/fields/password-field.tsx`, `forms/internal/masked-input.tsx` (+3) | — |  |
| `item` | `components/display/item.tsx` | `labs/components/item.tsx`, `labs/vault/fact-list.tsx`, `vault/fact-item.tsx` | `vault/item-row.tsx` | **copy beside the base** |
| `label` | — | — | `forms/field.tsx` | upstream internal: imported by base `field` |
| `native-select` | `components/inputs/select.tsx` | `admin/pages/people.tsx`, `admin/partner-offers.tsx`, `forms/fields/address-field.tsx`, `forms/inline-edit.tsx`, `patterns/filters-popover.tsx` (+1) | — |  |
| `popover` | `components/inputs/multi-select.tsx`, `components/overlays/popover.tsx`, `forms/fields/date-field.tsx` | `components/inputs/combobox.tsx`, `forms/fields/date-range-field.tsx`, `patterns/filters-popover.tsx`, `shell/notification-bell.tsx` | — |  |
| `progress` | `components/feedback/progress.tsx` | `vault/areas/area-tile.tsx` | — |  |
| `radio-group` | `components/inputs/radio-group.tsx` | `vault/choice-card.tsx` | — |  |
| `select` | `components/inputs/select.tsx` | `admin/pages/people.tsx`, `admin/partner-offers.tsx`, `forms/fields/address-field.tsx`, `forms/inline-edit.tsx`, `patterns/filters-popover.tsx` (+1) | — |  |
| `separator` | `components/display/separator.tsx` | `forms/form-section.tsx`, `templates/admin-page.tsx` | — |  |
| `sheet` | — | — | — | upstream internal: imported by base `sidebar` |
| `sidebar` | `components/navigation/sidebar.tsx` | `admin/admin-nav.ts`, `admin/admin-sidebar.tsx`, `templates/admin-page.tsx` | — |  |
| `skeleton` | `components/feedback/skeleton.tsx` | `charts/dag-frame.tsx`, `components/display/data-table.tsx`, `components/display/stat.tsx`, `patterns/filter-card-row.tsx` | — |  |
| `sonner` | `components/feedback/toast.tsx` | — | — |  |
| `spinner` | `components/feedback/spinner.tsx` | `forms/fields/address-field.tsx`, `forms/inline-edit.tsx`, `forms/internal/submit-button.tsx`, `shell/header-search.tsx`, `vault/documents/upload-row.tsx` (+1) | — |  |
| `switch` | `components/inputs/switch.tsx` | `forms/inline-edit.tsx` | — |  |
| `table` | `components/display/data-table.tsx` | `admin/pages/partners.tsx`, `admin/pages/people.tsx`, `admin/pages/plans.tsx`, `admin/pages/promotion-codes.tsx`, `admin/pages/subscriptions.tsx` (+2) | — |  |
| `textarea` | `components/inputs/textarea.tsx` | `admin/partner-offers.tsx`, `components/overlays/confirm-dialog.tsx`, `forms/inline-edit.tsx`, `vault/people/person-add-form.tsx` | `components/internal/rich-textarea.tsx` | **copy beside the base** |
| `toggle` | — | — | — | upstream internal: imported by base `toggle-group` |
| `toggle-group` | `components/inputs/toggle-group.tsx` | `charts/dag-frame.tsx`, `patterns/filter-card-row.tsx` | `vault/choice-card.tsx` | **copy beside the base** |
| `tooltip` | `components/overlays/tooltip.tsx` | `admin/pages/partners.tsx`, `charts/dag-frame.tsx`, `components/display/stat.tsx`, `patterns/bulk-action-bar.tsx`, `patterns/filter-card-row.tsx` | — |  |

### Registry components not added

shadcn components the package hasn't run `ui:add` for. *Looks like a copy* lists Paige files whose markup matches a heuristic for that component (arrow keys over an input for combobox, `pl-9` beside an input for input-group…); an empty cell with a heuristic means nothing matched, a dash means no heuristic.

| Component | Looks like a copy in | Heuristic |
|---|---|---|
| `accordion` | `components/display/timeline.tsx` | yes |
| `aspect-ratio` | — | yes |
| `carousel` | — | none |
| `combobox` | `forms/fields/date-field.tsx` | yes |
| `drawer` | — | yes |
| `input-otp` | — | none |
| `kbd` | — | yes |
| `menubar` | — | none |
| `navigation-menu` | — | none |
| `pagination` | `components/display/data-table.tsx` | yes |
| `resizable` | — | none |
| `scroll-area` | `charts/dag-frame.tsx`, `components/display/data-table.tsx`, `components/internal/popover-surface.ts`, `components/navigation/sidebar.tsx`, `components/overlays/dialog.tsx`, `patterns/filters-popover.tsx` | yes |
| `slider` | — | yes |
| `tabs` | — | none |

### Raw elements outside their home

A `<button>`, `<input>`, `<a>`… written in a file that isn't the element's home component (`RAW` in the script lists the homes). Each is either a reason to reach for the component, or a reason the home should grow a prop.

| Element | Home | Files (count) |
|---|---|---|
| `<button>` | Button (components/actions/button) | `charts/dag-frame.tsx` (1), `components/actions/disclosure-trigger.tsx` (1), `components/actions/menu.tsx` (3), `components/display/data-table.tsx` (1), `components/inputs/multi-select.tsx` (2), `components/navigation/breadcrumb.tsx` (1), `forms/fields/date-range-field.tsx` (1), `forms/fields/field-action.tsx` (1), `forms/inline-edit.tsx` (1), `labs/components/item.tsx` (1), `patterns/kpi-card.tsx` (1), `shell/account-menu.tsx` (1), `vault/choice-card.tsx` (1), `vault/fact-item.tsx` (1), `vault/people/person-picker.tsx` (2), `vault/people/quick-add.tsx` (1), `vault/people/stack-entry.tsx` (1) |
| `<label>` | FieldLabel (forms/field) | `admin/partner-offers.tsx` (1), `admin/rev-share.tsx` (1), `components/inputs/multi-select.tsx` (1), `components/internal/rich-text-editor.tsx` (1), `components/overlays/confirm-dialog.tsx` (1), `vault/choice-card.tsx` (1) |
| `<img>` | Avatar / PartnerLogo / Attachment's thumbnail | `templates/auth-page.tsx` (1) |

### Out-of-area signals

Patterns that belong to one component, found in another (`SIGNALS` in the script). A file in a signal's home list is not counted.

| Signal | Belongs to | Files (count) |
|---|---|---|
| skeleton | Skeleton | `charts/chart.tsx` (1), `charts/lazy-chart.tsx` (1), `charts/lazy-dag-frame.tsx` (1) |
| separator | Separator level | `admin/rev-share.tsx` (2), `components/actions/menu.tsx` (1), `components/display/item.tsx` (2), `components/inputs/multi-select.tsx` (1), `patterns/filters-popover.tsx` (1), `templates/auth-page.tsx` (1), `vault/areas/rail-panels.tsx` (1), `vault/fact-field.tsx` (1), `vault/item-row.tsx` (1), `vault/people/stack-add.tsx` (1), `vault/people/stack-entry.tsx` (1) |
| badge | Badge | `charts/dag-frame.tsx` (1), `components/display/stat.tsx` (1), `components/inputs/multi-select.tsx` (1), `forms/fields/date-range-field.tsx` (1), `patterns/filters-popover.tsx` (1) |
| arrow-keys | Combobox (U-01) / Menu / Select; `check:reuse` holds the list of files that are not a list | `charts/dag-frame.tsx` (2), `forms/fields/date-field.tsx` (1) |
| local-cva | a components-layer part with the variants | `vault/areas/area-icon.tsx` (1), `vault/choice-card.tsx` (1) |
| direct-primitive | the src/base wrapper of the same primitive | `components/actions/button.tsx` (1), `components/actions/dropdown-menu.tsx` (1), `components/inputs/sortable.tsx` (1), `components/overlays/confirm-dialog.tsx` (1), `components/overlays/dialog.tsx` (1) |

### By file

Every file with a base import, a raw element or a signal. Files with none are the quiet majority and aren't listed.

| Layer | File | Bases imported | Raw elements | Signals |
|---|---|---|---|---|
| admin | `admin/partner-offers.tsx` | — | label ×1 | — |
| admin | `admin/rev-share.tsx` | — | label ×1 | separator ×2 |
| charts | `charts/chart.tsx` | `chart` | — | skeleton ×1 |
| charts | `charts/dag-frame.tsx` | — | button ×1 | badge ×1, arrow-keys ×2 |
| charts | `charts/lazy-chart.tsx` | — | — | skeleton ×1 |
| charts | `charts/lazy-dag-frame.tsx` | — | — | skeleton ×1 |
| components | `components/actions/button-group.tsx` | `button-group` | — | — |
| components | `components/actions/button.tsx` | `button` | — | direct-primitive ×1 |
| components | `components/actions/context-menu.tsx` | `context-menu` | — | — |
| components | `components/actions/disclosure-trigger.tsx` | — | button ×1 | — |
| components | `components/actions/dropdown-menu.tsx` | `dropdown-menu` | — | direct-primitive ×1 |
| components | `components/actions/menu.tsx` | — | button ×3 | separator ×1 |
| components | `components/display/attachment.tsx` | `attachment` | — | — |
| components | `components/display/avatar.tsx` | `avatar` | — | — |
| components | `components/display/badge.tsx` | `badge` | — | — |
| components | `components/display/card.tsx` | `card` | — | — |
| components | `components/display/collapsible.tsx` | `collapsible` | — | — |
| components | `components/display/data-table.tsx` | `table` | button ×1 | — |
| components | `components/display/item.tsx` | `item` | — | separator ×2 |
| components | `components/display/separator.tsx` | `separator` | — | — |
| components | `components/display/stat.tsx` | — | — | badge ×1 |
| components | `components/feedback/callout.tsx` | `alert` | — | — |
| components | `components/feedback/empty-state.tsx` | `empty` | — | — |
| components | `components/feedback/progress.tsx` | `progress` | — | — |
| components | `components/feedback/skeleton.tsx` | `skeleton` | — | — |
| components | `components/feedback/spinner.tsx` | `spinner` | — | — |
| components | `components/feedback/toast.tsx` | `sonner` | — | — |
| components | `components/inputs/checkbox.tsx` | `checkbox` | — | — |
| components | `components/inputs/combobox.tsx` | `command` | — | — |
| components | `components/inputs/input-group.tsx` | `input-group` | — | — |
| components | `components/inputs/input.tsx` | `input` | — | — |
| components | `components/inputs/multi-select.tsx` | `popover` | button ×2, label ×1 | separator ×1, badge ×1 |
| components | `components/inputs/radio-group.tsx` | `radio-group` | — | — |
| components | `components/inputs/select.tsx` | `native-select`, `select` | — | — |
| components | `components/inputs/sortable.tsx` | — | — | direct-primitive ×1 |
| components | `components/inputs/switch.tsx` | `switch` | — | — |
| components | `components/inputs/textarea.tsx` | `textarea` | — | — |
| components | `components/inputs/toggle-group.tsx` | `toggle-group` | — | — |
| components | `components/internal/popover-group.tsx` | `dropdown-menu` | — | — |
| components | `components/internal/rich-text-editor.tsx` | — | label ×1 | — |
| components | `components/navigation/breadcrumb.tsx` | `breadcrumb` | button ×1 | — |
| components | `components/navigation/sidebar.tsx` | `sidebar` | — | — |
| components | `components/overlays/confirm-dialog.tsx` | `alert-dialog` | label ×1 | direct-primitive ×1 |
| components | `components/overlays/dialog.tsx` | `dialog` | — | direct-primitive ×1 |
| components | `components/overlays/hover-card.tsx` | `hover-card` | — | — |
| components | `components/overlays/popover.tsx` | `popover` | — | — |
| components | `components/overlays/tooltip.tsx` | `tooltip` | — | — |
| forms | `forms/field.tsx` | `field` | — | — |
| forms | `forms/fields/date-field.tsx` | `calendar`, `popover` | — | arrow-keys ×1 |
| forms | `forms/fields/date-range-field.tsx` | — | button ×1 | badge ×1 |
| forms | `forms/fields/field-action.tsx` | — | button ×1 | — |
| forms | `forms/inline-edit.tsx` | — | button ×1 | — |
| labs | `labs/components/item.tsx` | — | button ×1 | — |
| patterns | `patterns/filters-popover.tsx` | — | — | separator ×1, badge ×1 |
| patterns | `patterns/kpi-card.tsx` | — | button ×1 | — |
| shell | `shell/account-menu.tsx` | — | button ×1 | — |
| templates | `templates/auth-page.tsx` | — | img ×1 | separator ×1 |
| vault | `vault/areas/area-icon.tsx` | — | — | local-cva ×1 |
| vault | `vault/areas/rail-panels.tsx` | — | — | separator ×1 |
| vault | `vault/choice-card.tsx` | — | button ×1, label ×1 | local-cva ×1 |
| vault | `vault/fact-field.tsx` | — | — | separator ×1 |
| vault | `vault/fact-item.tsx` | — | button ×1 | — |
| vault | `vault/item-row.tsx` | — | — | separator ×1 |
| vault | `vault/people/person-picker.tsx` | — | button ×2 | — |
| vault | `vault/people/quick-add.tsx` | — | button ×1 | — |
| vault | `vault/people/stack-add.tsx` | — | — | separator ×1 |
| vault | `vault/people/stack-entry.tsx` | — | button ×1 | separator ×1 |

<!-- reuse:end -->
