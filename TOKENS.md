# Tokens — what `@paige/ui` has, what it is missing, and the variables to add (opened 2026-10-29)

Answers [AUDIT.md](AUDIT.md) A-02, A-03 and A-09, and George's ask: *more variables, so a change request is a one-line change*. The inventory and the census below the line are generated (`npm run audit:tokens`, `scripts/audit-tokens.mjs`) and re-run any time; the findings and the proposal above the line are written. Status: findings **open**, proposal **proposed**; nothing built. `T-nn` ids are new and never reused (the REVIEW convention).

## 1. What the inventory says

- **Colour is tokenised; geometry is not.** 234 variables, every one of them a colour, a radius, a type step, a shadow, a container width or a page-rhythm spacing. 126 are used by Paige code, 99 only through another variable (the palette feeding the roles: by design), 3 are dead, 1 palette raw leaks. `check:tokens` has kept hex out of components since REVIEW-2; that part works.
- **1,029 hand-written geometry utilities** in Paige component code (stories and `src/base` excluded). Most are the 4px rhythm the rules allow (R2-40: `gap-2`, `p-4`). **30 values carry a meaning** and recur in three or more component files with no name: control heights, icon sizes, the media column, menu and dialog widths, chart heights, the disabled opacity, white-on-tone ink. Each is a change request that today edits 3 to 23 files.
- **The same number is spelled several ways.** 44px is `h-11` in `control.ts`, `button.tsx`, `select.tsx`, `inline-edit.tsx`, `lazy-dag-frame.tsx` (+2); 40px is `size-10` (Avatar lg, the Item's media column, DagFrame) and `w-10` (Item, Switch, Labs Item) and `h-10` (DataTable's header row, Item) and the literal `40px` inside `scrollbar-below-header`. Nothing says they are the same thing; some of them are not.
- **Scales don't line up** (AUDIT A-08): Avatar 24 · 34 · 40 · 48 · 74 (`size-8.5`, `size-18.5`), AreaIcon 20 · 32 · 44 · 56, Dot 8 · 12 · 14 · 16 · 20 · 24, icons 12 · 14 · 16 · 20 · 24, controls 36 · 44 · 48. A Mark `md` and a Media `md` are different pixels by necessity; two Media components at different pixels for the same word are not.
- **State is written as a number, not a name.** `opacity-50` (disabled) in 11 files, `opacity-75` (S-35's quiet floor) in one, `opacity-40` (a dimmed series) in two, `ring-ring/50` (the focus halo) three times in `control.ts`, `bg-overlay/8` in Button where `--overlay-hover` already *is* 8% (`theme.css:185` says so in a comment), `bg-destructive/90` where `--primary-hover` is the pattern for brand.

## 2. Findings

| ID | Evidence | Who | Proposal | Status |
|---|---|---|---|---|
| T-01 | **Control heights by hand.** 44 (`h-11`) in 7 files, 36 (`h-9`) in 10, 48 (`h-12`) in 3, the 36px icon button (`size-9`) in 3, the textarea floor 72 (`h-18`) in 4. `components/internal/control.ts` names `controlHeight`, and Button, Select, InlineEdit, LazyDagFrame, DagFrame, DataTable and Skeleton restate the number anyway | Eng | Control scale (§3): `h-control`, `h-control-sm`, `h-control-lg`, `size-control-sm`, `min-h-textarea`; `control.ts` uses them; "make controls 40px" is one line | **built** 2026-10-29. `--spacing-control-sm/control/control-lg/textarea` (36 · 44 · 48 · 72) in `@theme inline`, merge entries in `theme.spacing` with `cn()` cases. `controlHeight` is `h-control`; Button's sm/md/lg/icon, Select (Radix and native), InlineEdit's row and multiline floor, Textarea and the rich text area/toolbar, RemoveDialog's wrapping button, the PersonPicker pill and result row, HeaderSearch, ListToolbar's field, the rich text link field, SidebarTrigger, Labs Item's text action read the scale. The toolbars' floors (ListToolbar, BulkActionBar, DataTable's, DagFrame's header) are `min-h-control-sm`: a toolbar is as tall as the small control it holds. The field insets are `pl-control-sm` / `pr-control-sm` (36: room for a small control; §3 said `pl-control`, but 36 is the small step), in PersonPicker, HeaderSearch, ListToolbar, Select's trigger and `popoverItemWithIndicator`. **Found on the way**: LazyDagFrame's skeleton header was 44 + padding against DagFrame's real 36 + padding, an 8px jump when the graph loaded (T-05's case exactly); both read `control-sm` now (measured 53 = 53). `check:tokens` (`geometry`) fails `h-11`, `min-h-11`, `min-h-18`, `size-9`, `pl-9`, `pr-9`, `min-h-9` in component code; `h-9` and `h-12` join when the row and chart scales (T-05, T-06) own the other 36s and 48s. Two 36s stay literal and allowed by name: Avatar's paw at 2xl and ChoiceCard's icon well, both off every scale until T-03/D-07 |
| T-02 | **Icon sizes by hand.** `size-4` (16) in 23 files, `size-5` (20) in 10, `size-6` (24) in 6, `size-3` (12) in 5, `size-3.5` (14) in 4 | Eng | Icon scale: `size-icon-xs … size-icon-xl`; Button's and Menu's `[&_svg]:size-*` read it | **built** 2026-10-29. `--spacing-icon-xs/-sm/icon/-lg/-xl` (12 · 14 · 16 · 20 · 24) in `@theme inline`, merge entries with `cn()` cases (through an svg variant too). 34 glyph sites in 28 files read it: the menu item and popover indicator (`popover-surface.ts`), Button (`[&_svg:not([class*='size-'])]:size-icon` on the Paige Button, since upstream's base writes `size-4` and would not follow the token), Select's indicator, FieldAction, Spinner's three sizes, Message, StatusMark md, Avatar's badge glyph and paw (2xl's 36 stays, D-07), AreaIcon's four glyphs and done check, ChoiceCard, UploadRow, ItemMedia's three, DataTable's sort glyph and FormSection's heading glyph (`icon-sm`), the chevrons and checks in DisclosureTrigger, DropdownMenu, Menu, MultiSelect, InlineEdit, FactItem, StackEntry, Labs Item, AreaTile, Stat, ListToolbar, BulkActionBar, RevShare, HeaderSearch, PersonPicker, the app's BrowseRow. Glyphs below 12 (StatusMark sm's 10, Avatar lg's badge 8) and Dot's marks stay literal: not on this scale (T-03 names marks). `check:tokens` (`geometry`) fails `size-3/3.5/4/5/6` through an svg variant or on a capitalised JSX element (a lucide icon) in component code |
| T-03 | **Media and mark scales are literal and disagree** (A-08). Avatar `size-6/8.5/10/12/18.5`; AreaIcon `size-5/8/11/14`; Dot `size-2/3/3.5/4/5/6`; the Item's media column `size-10`/`w-10` in 3 files with its indent `pl-13` (52 = 40 + 12) in Labs Item | George (the steps), Eng (the tokens) | Media scale and Mark scale (§3), one px per word within each; `--spacing-media-column` and `--spacing-media-indent` so the column and its indent are one fact. D-07/D-08 in ARCHETYPES.md decide 34/74 and 44/56 | open |
| T-04 | **Overlay widths by hand.** Menus 192 (`w-48`, 6 files), 224 (`w-56`, 4: AccountMenu, MultiSelect, `popover-surface.ts`, admin), Popover and HeaderSearch 320 (`w-80`, 3), FiltersPopover 448 (`w-112`), Dialog `max-w-md/2xl/4xl` (448 · 672 · 896) | Eng | Overlay scale: `w-menu`, `w-menu-wide`, `w-popover`, `max-w-dialog-sm/dialog/dialog-lg` (§3) | **built** 2026-10-29. `--container-menu/menu-wide/popover/popover-wide/dialog-sm/dialog/dialog-lg` (192 · 224 · 320 · 384 · 448 · 672 · 896) in `@theme inline`, merge entries in `theme.container` with `cn()` cases. `popoverContent`'s floor, AccountMenu's heading and MultiSelect's list are `min-w-menu-wide`; the submenus (DropdownMenu, ContextMenu) `min-w-menu`; Popover `w-popover`; HeaderSearch's results and DagFrame's details panel `w-popover` stepping to `w-popover-wide` (the two 320/384 pairs were the same pair, now one); Dialog md/lg/xl `max-w-dialog-sm/dialog/dialog-lg`, ConfirmDialog `max-w-dialog-sm`; FiltersPopover `w-dialog-sm` (a form panel a small dialog wide: the one 448 that isn't a dialog, named for what it matches rather than given a fourth popover step). `popover-wide` (384) is new since the audit: HeaderSearch and DagFrame both stepped 320 → 384 by hand. Not named: the admin tables' `max-w-48/56` cell widths (columns, not overlays), ListToolbar's `min-w-48` field floor, and the floating lists' max heights (MultiSelect 320, HeaderSearch 384: two values, no agreement yet; the next site decides). `check:tokens` (`geometry`) fails `w-80/96/112`, `min-w-56`, `max-w-md/2xl/4xl` in component code |
| T-05 | **Chart heights duplicated between a component and its lazy skeleton.** Chart `h-40/64/80` in `chart.tsx` *and* `lazy-chart.tsx`; DagFrame `h-112/160` in `dag-frame.tsx`, `lazy-dag-frame.tsx`, `internal/dag-shape.ts` and its test; DataTable `max-h-96/160`. A height change that misses the skeleton makes the page jump when the chart loads | Eng | Chart scale (`h-chart-sm/chart/chart-lg`, `h-dag/dag-lg`, `max-h-table/table-lg`); the skeleton and the component import one constant that names the token | **built** 2026-10-29. `--spacing-chart-sm/chart/chart-lg` (160 · 256 · 320), `--spacing-dag/dag-lg` (448 · 640), `--spacing-table/table-lg` (384 · 640) and, found on the way, `--spacing-spark-sm/spark/spark-lg` (24 · 32 · 48) in `@theme inline`; merge entries with `cn()` cases. `charts/internal/heights.ts` holds `chartHeight` and `dagHeight`; Chart and LazyChart, DagFrame and LazyDagFrame import the one map (the lazy files still never import the heavy module). DataTable's `MAX_HEIGHT` reads the table steps. **Sparkline's heights were written three times**: its own map, Stat's `SPARK_HEIGHT` and Stat's loading skeleton's inline ternary; and Stat's no-data ghost pre-added them by hand (`h-15` = 20 + 8 + 32, six such sums). Sparkline exports `sparklineHeight`; Stat reads it in both places, and the ghost is now laid out like the real rows (a delta line, then the sparkline with its gap) so no sum exists to go stale. Measured on `stat--empty-keeps-height`: ready and empty cards still 170 / 200 / 140 at md / lg / compact, ghosts 60 / 80 / 50. Sparkline's numeric `HEIGHT` (the viewBox) still has to move with the token; the comment says so. `height="auto"` on DagFrame stays its own 32px ladder in `dag-shape.ts` (384 … 560), not a scale. `check:tokens` (`geometry`) fails `h-40/64/80/112/160`, `max-h-96/160` in component code (HeaderSearch's results list, a list's cap and not a table's, is allowed by name until a second list agrees) |
| T-06 | **Row and bar heights.** 40 is DataTable's header row (`h-10`), the Item's row (`h-10`) *and* the literal `40px` inside `scrollbar-below-header` (theme.css:484, R13-12); 36 (`h-9`) is a table row in DataTable and a toolbar in DagFrame and the rich-text editor; 56 (`h-14`) is Sidebar, AdminPage's header, StackEntry and DagFrame's bar; 64 (`h-16`) is AppHeader | Eng | `--spacing-row`, `--spacing-row-header`, `--spacing-bar`, `--spacing-app-header`; `scrollbar-below-header` reads `var(--spacing-row-header)` instead of `40px` | **built** 2026-10-29. `--spacing-row-header` (40), `--spacing-bar` (56), `--spacing-app-header` (64) in `@theme inline`; merge entries with `cn()` cases. DataTable's three header cells are `h-row-header` and `scrollbar-below-header`'s track margin is `var(--spacing-row-header)` (the 40 was `calc(var(--spacing) * 10)` there), so the header row and where its scrollbar starts are one fact. Sidebar's header and AdminPage's top bar `h-bar`, StackEntry's row `min-h-bar`; AppHeader's two rows `h-app-header`. **No `--spacing-row`**: the 36 rows the evidence counted were toolbars (ListToolbar, BulkActionBar, DataTable's, DagFrame's header) and the rich text toolbar, which T-01 made `min-h-control-sm`: a toolbar is as tall as the control it holds, not a row. The one `h-9` left (Skeleton's number line) is a 30px numeral's line height. DagFrame's loading blocks keep `h-14`: a node at the auto zoom (72 × .75), not a bar, allowed by name. `check:tokens` (`geometry`) fails `h-10`, `h-14`, `min-h-14`, `h-16` in component code (ItemMedia's file thumb is the 40px media column, T-03, allowed by name) |
| T-07 | **State opacities are numbers.** `opacity-50` = disabled in 11 files; `opacity-75` = quiet floor (S-35, chosen for WCAG 1.4.11) in Labs Item; `opacity-40` = dimmed series in Sparkline and DagFrame. "Disabled is too faint" is an 11-file change; S-35's floor has its reasoning in one comment and its number in one class | Eng | `--opacity-disabled: .5`, `--opacity-quiet: .75`, `--opacity-dim: .4` with `@utility opacity-disabled / opacity-quiet / opacity-dim` (Tailwind has no opacity namespace); the S-35 reasoning moves next to the variable | **built** 2026-10-29. The three variables sit in layer 3 with their reasons (S-35's next to `--opacity-quiet`), the utilities in layer 6, merge entries in the `opacity` group with `cn()` tests. 11 disabled sites say `opacity-disabled` (FactItem's and StackEntry's struck media too: a struck fact is off); Sparkline's and DagFrame's pushed-back series say `opacity-dim`; Labs Item's floor says `opacity-quiet`. **One look change**: DataTable's unsorted sort glyph was `opacity-50`, under S-35's floor for a quiet icon at rest, and now `opacity-quiet` (.75). Sparkline's area fill was `opacity-10` on `fill="currentColor"`: not a state, now `fill-current/10`. `check:tokens` (`state-ink-alpha`) fails the next `opacity-n` outside 0 and 100 |
| T-08 | **Alphas re-derived by hand.** Button `tinted`: `bg-overlay/8` (= `--overlay-hover`, 8%); Button `destructive`: `hover:bg-destructive/90` (brand has `--primary-hover`, red has nothing); `control.ts`: `ring-ring/50` ×3 (the focus halo); `--shadow-focus` is defined for the same halo and used nowhere | Eng | `--color-overlay-hover`/`--color-overlay-press` as colours too (so `bg-overlay-hover` exists beside `layer-hover`); `--destructive-hover`; `--focus-halo: color-mix(in oklab, var(--ring) 50%, transparent)` → `ring-focus-halo`; delete `--shadow-focus` or make `focus-ring` use it: one halo, one definition | **built** 2026-10-29. `--color-overlay-hover/-press/-scrim` (Dialog's and ConfirmDialog's `bg-overlay/40` backdrop was a third hand-derived alpha, now `--overlay-scrim`); `--focus-halo` → `ring-focus-halo` in `controlFocus`, `cardFocus` and `richTextShell`; `--shadow-focus` deleted under T-10. **One look change**: `--destructive-hover` is not `destructive/90`. The contrast test showed white on destructive-at-90%-over-white is 4.45:1 (below AA, which the old hover had been shipping), so it is the pressed red `--red-700 #ab3441` (6.4:1). Design to confirm the hover red; the token makes that a one-line change. `check:tokens` (`state-ink-alpha`) fails the next `bg-overlay/n`, `ring-ring/n` and friends outside theme.css |
| T-09 | **On-tone ink is `text-white`.** Dot ×6 tones, AreaIcon `solid` and its done badge. `--primary-foreground` exists for brand only. Avatar's `ring-white` halo and AreaIcon's `border-background` cutout assume the surface under them is white, which on the admin page and any recessed Surface it is not | Eng (token), Design (whether on-tone ink is ever not white) | `--on-tone: #fff` → `text-on-tone`, `ring-on-tone`; cutouts and halos read `--surface` (§4), never `white` or `background` | **built** 2026-10-29 for the ink: `--on-tone` in layer 3 with the contrast test asserting it ≥ 3:1 on every tone fill (`--primary`, `--destructive`, `--info`, `--success`, `--warning`, `--attention`); Dot's six tones and AreaIcon's solid and done badge say `text-on-tone`; `check:tokens` fails the next `text-white`. The cutout/halo half (Avatar's `ring-white`, AreaIcon's `border-background`) waits for §4's `--surface` and stays listed there |
| T-10 | **Hygiene.** Dead: `--shadow-focus`, `--color-sidebar-primary`, `--color-sidebar-primary-foreground`. Base-only (shadcn Sidebar and Chart need them): `--sidebar-accent`, `--sidebar-border`, `--chart-1`, `--color-sidebar`, `--color-sidebar-ring`. Raw palette leak: `--surface-muted` in `charts/dag-frame.tsx` | Eng | Delete the three dead ones (T-08 covers the halo). Mark the base-only five "kept for `src/base`" in theme.css so the next audit doesn't re-ask. `dag-frame.tsx` says `bg-muted` | **built** 2026-10-29. Deleted `--shadow-focus`, `--sidebar-primary(-foreground)` and their `--color-*` aliases (and the `cn()` case for `shadow-focus`). The base-only five were two: `--sidebar-accent`, `--sidebar-border` and `--chart-1` are read in Paige code through `border-sidebar-border`, `bg-chart-1`… (the script counted only direct `var()` references; fixed). `--sidebar` and `--sidebar-ring` are marked "base only" in theme.css. `dag-frame.tsx`'s minimap mask is a colour prop, not a class, so it says `var(--muted)`; palette raws outside theme.css: 0 |
| T-11 | **`--body-muted` is darker than `--muted-foreground`.** `--body-muted` = `--neutral-700` #595959 (7:1, warm grey, 13 files via `text-body-muted`); `--muted-foreground` = `--ink-400` #5a657e (5.8:1, slate, 98 files). Two inks both called muted; the one that sounds quieter is the stronger, and a reader picking "the muted text colour" has a coin to flip | Design | Rename to what it is (R2-17's lede grey: `--lede`), or fold it into `--muted-foreground` if Design accepts slate for ledes. ARCHETYPES.md D-24 | open |
| T-12 | **Motion and stacking by hand.** `duration-200` in 4 files while Tailwind's default is 150ms, so every `transition` without it runs at a different speed; `z-10` ×4, `z-20` (AdminPage), `z-50` (AddressField's suggestions; Radix overlays in base also use 50) | Eng | `--default-transition-duration: 200ms` in `@theme` (then the four explicit ones go); `--z-raised: 10`, `--z-sticky: 20`, `--z-overlay: 50` with `@utility z-raised / z-sticky / z-overlay` | **built** 2026-10-29. `--default-transition-duration: 200ms` in `@theme inline`; the five `duration-200` (DagFrame, StatusMark, TabsPill ×2, HeaderSearch) are gone, so every transition in the package runs at one speed, the bases included (they were on 150). `z-raised` (avatar badge, DagFrame's controls and partial-graph notice, TabsPill label, DataTable's sticky header), `z-sticky` (AdminPage top bar), `z-overlay` (Dialog, ConfirmDialog, AddressField suggestions); merge entries in the `z` group with `cn()` tests. No bare `z-n` or `duration-n` left in Paige code, and `check:tokens` (`motion-stack`) fails on the next one; stories and `src/lib` (the merge registry names `z-10` as the class a step replaces) are exempt |
| T-13 | **`--muted` is an absolute fill** (A-03). `--muted` = `--surface-muted` #f3f6fc. On white (every customer page: "Customer pages stay on white", theme.css) a muted Card or Panel reads as a tinted box; on the admin's `--surface-page` #f7f9fd it nearly vanishes. The same token means two different things in the two places it is used. R4-01 fixed exactly this for hover and left surfaces alone | George / Design | §4: emphasis as a relative overlay (`layer-recess`), surface identity as a context variable (`--surface`), and a surface-matrix story per Surface so the look is signed off on every background at once | open; **first context variable built** 2026-10-31 (R21-01, REVIEW-21): `--surface-edge` (`--border`, the hairline tint under `[data-surface="page"]`, which AdminPage declares) — Card, DataTable's box and DagFrame's frame read it. `--surface` (identity) and `layer-recess` are still to come |
| T-14 | **White on `--area-estate` is 2.77:1.** Found by `scripts/theme-contrast.test.mjs` (the matrix the reviews cite by hand, now a test). AreaIcon `solid` and Dot `tone=area` put a white glyph on the area fill; estate orange #f07c00 is the only one of the nine under WCAG 1.4.11's 3:1 (household 3.05 and assets 3.03 are at the line). The test reports all nine under a `todo` rather than asserting, because the fills are a Design call | Design | Darken estate to clear 3:1 (≈ #e07300 does; the nine are listed in the test output), or give AreaIcon `solid` an ink per area. Then the `todo` comes off and the nine become an assertion. R1-30's brand-blue call (white on `--primary` 4.02:1) and the control borders (`--border` 1.41:1, `--border-strong` 2.19:1) sit in the same test the same way | open |

## 3. The geometry tier

New variables in `theme.css`, in a block of their own after layer 3 (`3b · Geometry and state`), named in `@theme inline` so Tailwind derives the utilities, registered in `extendTailwindMerge` (R2-21, with a `cn()` case each), and enforced by `check:tokens` (§5). The pixel values are **what is drawn today**: adding the tier changes no look. Where today's values disagree the row names the decision.

| Scale | Variable | Steps (px) | Derived utilities | Replaces today |
|---|---|---|---|---|
| **Control** | `--spacing-control-sm` · `--spacing-control` · `--spacing-control-lg` · `--spacing-textarea` | 36 · 44 · 48 · 72 | `h-control`, `size-control-sm` (icon button), `min-h-textarea`, `pl-control-sm` / `pr-control-sm` (a field's 36px inset for a leading icon or trailing control: room for a small control) | `h-9`, `h-11`, `h-12`, `size-9`, `h-18`, `pl-9`, `pr-9` (built, T-01) |
| **Icon** | `--spacing-icon-xs … -xl` | 12 · 14 · 16 · 20 · 24 | `size-icon`, `size-icon-lg`, `[&_svg]:size-icon` | `size-3`, `size-3.5`, `size-4`, `size-5`, `size-6` (where the thing is a glyph; built, T-02) |
| **Mark** | `--spacing-mark-xs … -xl` | 8 · 12 · 16 · 20 · 24 | `size-mark`, `h-mark` (Badge heights) | Dot's `size-2/3/4/5/6`, StatusMark's 16/20, Badge `h-4`. **D-06**: Dot's 14 (`size-3.5`) goes or becomes a step |
| **Media** | `--spacing-media-sm … -2xl`; `--spacing-media-column`; `--spacing-media-indent` | 24 · 32 · 40 · 48 · 72; column 40; indent 52 (= column + `gap-3`) | `size-media`, `w-media-column`, `pl-media-indent` | Avatar `size-6/8.5/10/12/18.5`, AreaIcon `size-5/8/11/14`, the Item's `size-10`/`w-10`, Labs Item's `pl-13`. **D-07** (Avatar 34 and 74) and **D-08** (AreaIcon 44 and 56) decide the off-scale steps |
| **Overlay** | `--container-menu` · `--container-menu-wide` · `--container-popover` · `--container-popover-wide` · `--container-dialog-sm` · `--container-dialog` · `--container-dialog-lg` | 192 · 224 · 320 · 384 · 448 · 672 · 896 | `min-w-menu`, `w-popover`, `sm:w-popover-wide`, `max-w-dialog` | `w-48`, `w-56`, `w-80`, `w-96`, `w-112`, `max-w-md/2xl/4xl` (built, T-04) |
| **Chart** | `--spacing-chart-sm` · `--spacing-chart` · `--spacing-chart-lg` · `--spacing-dag` · `--spacing-dag-lg` · `--spacing-table` · `--spacing-table-lg` · `--spacing-spark-sm` · `--spacing-spark` · `--spacing-spark-lg` | 160 · 256 · 320 · 448 · 640 · 384 · 640 · 24 · 32 · 48 | `h-chart`, `h-dag-lg`, `max-h-table`, `h-spark` (through `charts/internal/heights.ts` and `sparklineHeight`) | `h-40/64/80`, `h-112/160`, `max-h-96/160`, `h-6/8/12` on a sparkline (built, T-05); `dag-shape.ts`'s auto ladder stays its own |
| **Row and bar** | `--spacing-row-header` · `--spacing-bar` · `--spacing-app-header` | 40 · 56 · 64 | `h-row-header`, `h-bar`, `h-app-header` | `h-10`, `h-14`, `h-16`, the `40px` in `scrollbar-below-header` (built, T-06; the 36 "row" was a toolbar: `min-h-control-sm`) |
| **Fit** (exists, extend) | `--container-fit-xs … -lg` behind `grid-cols-fit-*`; Split's `contentMin`, Grid's `minItemWidth` | as today | `min-w-fit-sm` | the primitives' inline numbers, so one scale answers "how narrow may a column get" |
| **State** | `--opacity-disabled` · `--opacity-quiet` · `--opacity-dim` | .5 · .75 · .4 | `@utility opacity-disabled` … | `opacity-50` ×11, `opacity-75`, `opacity-40` |
| **Ink and alpha** | `--on-tone`; `--destructive-hover`; `--focus-halo`; `--color-overlay-hover`/`-press` | #fff; red one step pressed; ring at 50%; the existing 8% / 14% | `text-on-tone`, `ring-on-tone`, `hover:bg-destructive-hover`, `ring-focus-halo`, `bg-overlay-hover` | `text-white`, `ring-white`, `bg-destructive/90`, `ring-ring/50`, `bg-overlay/8` |
| **Surface** (§4) | `--surface` (context); `--overlay-recess` | per context; ink at ~4% | `bg-surface`, `ring-surface`, `border-surface`, `layer-recess` | `bg-background`/`border-background` cutouts, `bg-muted` as an emphasis |
| **Motion** | `--default-transition-duration` | 200ms | (none: `transition-*` picks it up) | `duration-200` ×4 |
| **Stacking** | `--z-raised` · `--z-sticky` · `--z-overlay` | 10 · 20 · 50 | `@utility z-raised` … | `z-10` ×4, `z-20`, `z-50` |

Notes on mechanics:

- `--spacing-<name>` in `@theme inline` gives every spacing utility (`h-`, `w-`, `size-`, `min-h-`, `max-w-`, `p-`, `gap-`, `inset-`) the name for free; `--container-<name>` gives `max-w-`/`w-`. Opacity, z-index and duration have no Tailwind namespace, so they are `@utility` rules over a `:root` variable (as `layer-hover` is today), each with a tailwind-merge entry.
- The variables hold `rem`; the table says px for reading. 72 and 52 are not on Tailwind's default scale: that is the point of naming them.
- `check:tokens` is the control: after the tier lands, a literal in component code whose value **has a name in its family** is a finding, the way `bg-blue-500` is today (§5). Stories keep writing literals; a story frame is not a design decision.
- The scales are also the `size` vocabularies in [ARCHETYPES.md](ARCHETYPES.md) §3: Control for Actions and Controls, Icon for glyphs, Mark for Dot/StatusMark/Badge, Media for Avatar/AreaIcon/ItemMedia, Overlay for Dialog and menus, Chart for Chart/DagFrame. A `size` prop maps to one token; no component translates one scale into another (StatusMark `md` → Dot `xl` goes).

## 4. Surfaces: why "muted" isn't mute, and the model that fixes it (T-13, A-03)

**The mechanism.** Every emphasis fill is absolute: `bg-muted` (#f3f6fc), `bg-surface-page` (#f7f9fd), `bg-card` (white), `bg-accent` (the blue wash). A recessed look is a *relationship* (one step down from what you're on), and an absolute fill can only be right on one background. Customer pages are white, so a muted Panel there is a visibly blue-grey box: louder than its flat neighbour, the opposite of recessed. The admin page is #f7f9fd, so the same Panel is a hair lighter than the page: invisible. Hover had the same bug and R4-01 fixed it with a relative overlay (`layer-hover` = ink at 8% over whatever is there); surfaces were left absolute.

Two things are tangled and want two different mechanisms:

| Need | Mechanism | Why this one |
|---|---|---|
| **Emphasis** (flat · raised · recessed): "one step down from here" | **Relative overlay**: `--overlay-recess: color-mix(in oklab, var(--overlay) 4%, transparent)`, `@utility layer-recess` laying it as a background-image, exactly like `layer-hover`. Card/Panel `emphasis="recessed"` = `layer-recess` + no shadow; `raised` = `bg-card shadow-card`; `flat` = nothing | Always one step down on white, on the admin page, inside a recessed parent (nesting darkens one more step, which is correct), in the blue wash. No per-context table to maintain. Same mental model as hover: R4-01 is already approved |
| **Identity** (what colour *is* the surface I'm on): cutouts, halos, rings, a badge's border | **Context variable**: `[data-surface="page"] { --surface: var(--surface-page) }`, `[data-surface="card"] { --surface: var(--card) }`, `[data-surface="wash"]` …; set by Page/AdminPage, Card, Panel, Dialog on themselves (as `data-area` is, R3-15). `--color-surface: var(--surface)` → `ring-surface`, `border-surface`, `bg-surface` | An overlay can't tell you what colour to cut out to. Avatar's `ring-white`, AreaIcon's `border-background`, the Item open-wash's edge all need the actual colour under them. Templates and Surfaces already own their backgrounds; declaring it is one attribute each |

**Built so far (R21-01, 2026-10-31).** The context half's first variable is an edge, not the identity: `--surface-edge` is `--border` by default and `--divider-tint` under `[data-surface="page"]` (theme.css layer 5), which AdminPage's content sets. Card (`border-surface-edge` in `cardVariants`), DataTable's box and DagFrame's frame read it, so on the admin page their white surfaces stand on a hairline instead of a grey outline (George's "less clean" cards). `--surface` itself, `layer-recess` and the surface-matrix stories are still open.

Keep `--muted` for the shadcn bases (they expect it) and stop using `bg-muted` as an emphasis in Paige code; `check:tokens` flags it like a hard colour. The two places `--muted` genuinely means a colour (a disabled control's fill, a skeleton) can keep a role token of their own (`--control-disabled`, `--skeleton`).

**Sign-off tool.** Every Surface archetype gets one "On every surface" story: the component rendered in a 2 × 2 of white · page · recessed · area wash, each cell labelled, so George and Design see all four at once and a regression is a glance (ARCHETYPES.md §6, part 4). That story is what makes this decision stick; the tokens alone would drift again.

**Decisions for George / Design:** the look of recessed (4% ink is a starting value; the current #f3f6fc on white is ~2.5% blue-grey, so recessed would get a touch darker and lose the blue cast), whether `raised` exists as a resting look or only as `interactive` hover, and whether a Panel on the admin page should be recessed at all or just flat with a border.

## 5. Keeping it this way

- **`check:tokens` grows three rules** once §3 lands: (1) a geometry literal whose value has a name in its family (the rule reads the tier from `theme.css`, so adding a token adds the rule); (2) `white`/`black`/`background` as a ring, border or text colour outside `theme.css` (use `on-tone` or `surface`); (3) `bg-muted`, `bg-overlay/n`, `bg-<tone>/n`, `ring-ring/n`, `opacity-n` in component code. Live today: `motion-stack` (`duration-n`, `z-n`; T-12), `state-ink-alpha` (`opacity-n`, `text-white`/`text-black`, and `/n` alphas on the overlay, ring, tone, area and ink colours; T-07/T-08/T-09) and `geometry` for the control, icon, overlay, chart and row families (T-01/T-02/T-04/T-05/T-06: `h-11`, `min-h-11`, `min-h-18`, `size-9`, `pl-9`/`pr-9`, `min-h-9`; `size-3…6` through an svg variant or on a capitalised JSX element; `w-80/96/112`, `min-w-56`, `max-w-md/2xl/4xl`; `h-40/64/80/112/160`, `max-h-96/160`; `h-10`, `h-14`, `h-16`). The rule allows five literals by name, each with its reason in the script (two 36 wells, the 40 media column, DagFrame's node blocks and auto ladder, HeaderSearch's list cap): the mark and media scales (T-03) retire most of them. Still to come: the mark and media families (T-03), `ring-white`/`border-background` and `bg-muted` once §4's `--surface` exists. Stories and `src/base` stay exempt. Same shape as today's hex and arbitrary-value rules; same `--print` output.
- **The contrast matrix is a test.** `packages/ui/scripts/theme-contrast.test.mjs` reads `theme.css` (`theme-colors.mjs` resolves `var()` chains and `color-mix`) and asserts every pair the reviews cite: the eight text inks on the seven surfaces ≥ 4.5:1, tone inks on their subtle fills, `--error-border` at R2-01's 3.61:1, S-35's 75% quiet icon ≥ 3:1 on white/muted/accent, white on the solid tone fills. The open calls (R1-30 brand blue, T-14 area fills, the control borders) print as diagnostics under `todo`; making the call means deleting the `todo` and the number is enforced from then on. A palette change that breaks a pair fails `npm test`, not a review.
- **`npm run audit:tokens` is the backstop**, not a gate: the candidates table should be empty after §3, and anything that reappears there with three files is the next token, not the next exception.
- **A new token comes with four lines**: the `:root` value, the `@theme inline` name (or `@utility`), the tailwind-merge entry with its `cn()` test (R2-21), and the one-line `/* what it is, where it is used */` comment the next audit reads. The rule goes in `packages/ui/CLAUDE.md` § Rules next to "A new utility gets a merge entry".
- **Order**: T-10 and T-12 (deletions and defaults, an hour) → T-08/T-09 (alpha and ink tokens) → T-07 (state) → T-01/T-02/T-04/T-05/T-06 (the scales that need no decision: controls, icons, overlays, charts, rows) → T-03 after D-06…D-08 → §4 after George's call. Each step is a change with the check turned on for its family, so it can't regress while the next one is in flight.

---

<!-- tokens:start (generated by `npm run audit:tokens`; do not edit by hand) -->

theme.css defines 276 variables (layers 1, 2, 3, 4, 5). 159 are used in Paige code (directly or as a utility); 2 only by the shadcn bases; 108 are reached only through another variable; 1 are defined and never referenced anywhere. Palette raws (layer 1) referenced outside theme.css: 0. Hand-written numeric geometry utilities in Paige component code (not stories, not base): 846; in upstream shadcn base files: 800. Semantic values (a height, a size, a width, an opacity, an alpha) that recur in 3 or more component files with no token: 8. Spacing-rhythm values in 8 or more files: 18.

### Token candidates: semantic geometry written by hand in three or more component files

Heights, sizes, widths, opacities, alphas and hard colours that recur across component files. Each is a change request ("make controls 40px", "icons one step smaller", "menus wider") that today touches every file in the row. Stories and the story-only folders are counted apart because a story may size a frame by hand.

| Family | Value | px | Component files | Uses | Forms seen | Where |
|---|---|---|---|---|---|---|
| height | `5` | 20px | 5 | 5 | `h-5` | charts/lazy-dag-frame.tsx, components/display/stat.tsx, forms/inline-edit.tsx, patterns/bulk-action-bar.tsx (+1) |
| width | `48` | 192px | 4 | 5 | `max-w-48 min-w-48 w-48` | admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx, charts/dag-frame.tsx, patterns/list-toolbar.tsx |
| size | `5` | 20px | 4 | 5 | `size-5` | components/display/dot.tsx, components/inputs/switch.tsx, vault/areas/area-icon.tsx, vault/choice-card.tsx |
| size | `6` | 24px | 3 | 4 | `size-6` | components/display/avatar.tsx, forms/fields/field-action.tsx, vault/people/person-picker.tsx |
| ring-width | `2` | 2px | 3 | 4 | `ring-2` | charts/dag-frame.tsx, components/display/avatar.tsx, components/display/dot.tsx |
| height | `96` | 384px | 3 | 3 | `h-96 max-h-96 min-h-96` | charts/internal/dag-model.test.ts, charts/internal/dag-shape.ts, shell/header-search.tsx |
| width | `10` | 40px | 3 | 3 | `w-10` | components/display/item.tsx, components/inputs/switch.tsx, labs/components/item.tsx |
| border-width | `2` | 2px | 3 | 3 | `border-2 border-b-2` | components/display/status-mark.tsx, vault/areas/area-icon.tsx, vault/fact-field.tsx |

### Spacing rhythm written by hand in eight or more component files

Padding, margin and gap on the 4px grid (R2-40). Writing these by hand is the rule, not a finding; the table is here so the few that carry meaning (a row's side padding, a card's inset, the gap between an icon and its label) can be named when the archetypes are.

| Family | Value | px | Component files | Uses | Forms seen | Where |
|---|---|---|---|---|---|---|
| gap | `2` | 8px | 34 | 54 | `gap-2 gap-x-2 gap-y-2` | admin/admin-sidebar.tsx, admin/pages/partners.tsx, admin/pipeline-graph.tsx, admin/rev-share.tsx (+30) |
| padding | `3` | 12px | 25 | 35 | `p-3 pb-3 pl-3 px-3 py-3` | admin/pages/partners.tsx, admin/partner-logo.tsx, admin/pipeline-graph.tsx, charts/dag-frame.tsx (+21) |
| padding | `2` | 8px | 22 | 35 | `p-2 pb-2 pr-2 pt-2 px-2 …` | admin/pipeline-graph.tsx, charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/context-menu.tsx (+18) |
| gap | `3` | 12px | 22 | 31 | `gap-3 gap-x-3 gap-y-3` | admin/pages/partners.tsx, admin/pipeline-graph.tsx, admin/rev-share.tsx, charts/dag-frame.tsx (+18) |
| padding | `4` | 16px | 19 | 35 | `p-4 pb-4 pl-4 pt-4 px-4 …` | charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/button.tsx, components/display/data-table.tsx (+15) |
| gap | `4` | 16px | 18 | 25 | `gap-4 gap-x-4 gap-y-4` | admin/pipeline-graph.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, charts/dag-status.tsx (+14) |
| gap | `1` | 4px | 15 | 18 | `gap-1 gap-y-1` | admin/pages/partners.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, charts/dag-status.tsx (+11) |
| margin | `2` | 8px | 15 | 17 | `-mx-2 mb-2 ml-2 mr-2 mt-2 …` | charts/dag-frame.tsx, components/actions/menu.tsx, components/display/data-table.tsx, components/inputs/multi-select.tsx (+11) |
| padding | `5` | 20px | 14 | 22 | `p-5 pb-5 pl-5 pt-5 px-5 …` | admin/rev-share.tsx, components/internal/popover-surface.ts, components/navigation/tabs-pill-styles.ts, forms/error-summary.tsx (+10) |
| gap | `0.5` | 2px | 14 | 18 | `gap-0.5` | admin/pages/partners.tsx, admin/pages/plans.tsx, admin/pages/subscriptions.tsx, admin/rev-share.tsx (+10) |
| gap | `1.5` | 6px | 13 | 17 | `gap-1.5` | admin/pages/partners.tsx, admin/pages/plans.tsx, admin/rev-share.tsx, charts/dag-frame.tsx (+9) |
| margin | `1` | 4px | 12 | 20 | `-mr-1 -mt-1 -mx-1 mb-1 mr-1 …` | admin/pipeline-graph.tsx, components/display/item.tsx, forms/error-summary.tsx, forms/inline-edit.tsx (+8) |
| padding | `2.5` | 10px | 11 | 16 | `pl-2.5 pr-2.5 px-2.5 py-2.5` | charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/context-menu.tsx, components/actions/dropdown-menu.tsx (+7) |
| padding | `6` | 24px | 10 | 15 | `p-6 pr-6 pt-6 px-6 py-6` | admin/rev-share.tsx, charts/dag-frame.tsx, components/display/card.tsx, components/feedback/empty-state.tsx (+6) |
| padding | `1` | 4px | 9 | 12 | `p-1 pb-1 px-1 py-1` | admin/partner-logo.tsx, components/display/data-table.tsx, components/inputs/input.tsx, components/internal/control.ts (+5) |
| margin | `1.5` | 6px | 9 | 12 | `-mr-1.5 -mx-1.5 -my-1.5 mb-1.5 mt-1.5 …` | components/display/data-table.tsx, components/feedback/message.tsx, forms/inline-edit.tsx, labs/components/item.tsx (+5) |
| gap | `6` | 24px | 9 | 9 | `gap-6 gap-x-6` | admin/rev-share.tsx, components/display/card.tsx, components/feedback/empty-state.tsx, forms/field.tsx (+5) |
| margin | `0.5` | 2px | 8 | 10 | `ml-0.5 mt-0.5 my-0.5` | charts/dag-frame.tsx, components/display/stat.tsx, components/feedback/message.tsx, patterns/filters-popover.tsx (+4) |

### Never referenced

- `--color-overlay-press` (layer 4) = `var(--overlay-press)`

### Used only by the shadcn bases

- `--color-sidebar` (layer 4), 5 use(s) in `src/base`
- `--color-sidebar-ring` (layer 4), 5 use(s) in `src/base`

### Palette raws used outside theme.css

- none (every colour outside theme.css goes through a role)

### Theme inventory

Every variable theme.css defines. *Uses in Paige code* counts `var(--x)` and the utility classes the `@theme inline` block derives from it (`bg-x`, `p-x`, `rounded-x`…), in `packages/ui/src` (base excluded) and `apps/web`; *Uses in base* the same over `src/base`; *Inside theme.css* its references from other variables and `@apply` lines.

| Layer | Variable | Value | Uses in Paige code | Files | Uses in base | Inside theme.css |
|---|---|---|---|---|---|---|
| 1 | `--paige-blue` | `#2b81d7` | 0 | 0 | 0 | 6 |
| 1 | `--paige-blue-pressed` | `#3260c3` | 0 | 0 | 0 | 1 |
| 1 | `--paige-blue-100` | `#bfd7f0` | 0 | 0 | 0 | 2 |
| 1 | `--paige-blue-50` | `#e2effd` | 0 | 0 | 0 | 1 |
| 1 | `--paige-blue-bg` | `#f0f4fc` | 0 | 0 | 0 | 2 |
| 1 | `--ink-800` | `#253456` | 0 | 0 | 0 | 4 |
| 1 | `--ink-600` | `#414e6b` | 0 | 0 | 0 | 4 |
| 1 | `--ink-400` | `#5a657e` | 0 | 0 | 0 | 3 |
| 1 | `--ink-300` | `#9fb1c8` | 0 | 0 | 0 | 2 |
| 1 | `--neutral-700` | `#595959` | 0 | 0 | 0 | 1 |
| 1 | `--neutral-300` | `#d9d9d9` | 0 | 0 | 0 | 3 |
| 1 | `--neutral-100` | `#f7f7f7` | 0 | 0 | 0 | 3 |
| 1 | `--neutral-50` | `#fefcfb` | 0 | 0 | 0 | 1 |
| 1 | `--surface-muted` | `#f3f6fc` | 0 | 0 | 0 | 1 |
| 1 | `--surface-page` | `#f7f9fd` | 0 (+ as a utility) | 0 | 0 | 1 |
| 1 | `--hairline-tint` | `#e4eaf5` | 0 | 0 | 0 | 1 |
| 1 | `--green-600` | `#1f8a5b` | 0 | 0 | 0 | 3 |
| 1 | `--green-800` | `#14603f` | 0 | 0 | 0 | 1 |
| 1 | `--sand-800` | `#8a5a23` | 0 | 0 | 0 | 1 |
| 1 | `--sand-100` | `#f7ede0` | 0 | 0 | 0 | 1 |
| 1 | `--warm-800` | `#8a4510` | 0 | 0 | 0 | 2 |
| 1 | `--warm-100` | `#fff0e2` | 0 | 0 | 0 | 1 |
| 1 | `--warm-500` | `#c6873f` | 0 | 0 | 0 | 3 |
| 1 | `--doc-blue-800` | `#1c60a6` | 0 | 0 | 0 | 2 |
| 1 | `--pet-800` | `#6e5730` | 0 | 0 | 0 | 1 |
| 1 | `--pet-100` | `#f4e8d2` | 0 | 0 | 0 | 1 |
| 1 | `--red-600` | `#c23b4a` | 0 | 0 | 0 | 2 |
| 1 | `--red-700` | `#ab3441` | 0 | 0 | 0 | 1 |
| 1 | `--area-personal` | `#2b81d7` | 0 | 0 | 0 | 1 |
| 1 | `--area-family` | `#e0644e` | 0 | 0 | 0 | 1 |
| 1 | `--area-household` | `#7b9e5a` | 0 | 0 | 0 | 1 |
| 1 | `--area-money` | `#9a4d8f` | 0 | 0 | 0 | 2 |
| 1 | `--area-assets` | `#c6873f` | 0 | 0 | 0 | 1 |
| 1 | `--area-health` | `#3e8e93` | 0 | 0 | 0 | 2 |
| 1 | `--area-insurance` | `#5367e8` | 0 | 0 | 0 | 1 |
| 1 | `--area-estate` | `#f07c00` | 0 | 0 | 0 | 2 |
| 1 | `--area-final` | `#a18452` | 0 | 0 | 0 | 2 |
| 2 | `--radius` | `12px` | 0 (+ as a utility) | 0 | 3 | 4 |
| 2 | `--background` | `#ffffff` | 0 (+ as a utility) | 0 | 0 | 2 |
| 2 | `--foreground` | `var(--ink-600)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--card` | `#ffffff` | 2 (+ as a utility) | 2 | 0 | 1 |
| 2 | `--card-foreground` | `var(--ink-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--popover` | `#ffffff` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--popover-foreground` | `var(--ink-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--primary` | `var(--paige-blue)` | 4 (+ as a utility) | 2 | 0 | 2 |
| 2 | `--primary-foreground` | `#ffffff` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--secondary` | `#ffffff` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--secondary-foreground` | `var(--ink-600)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--muted` | `var(--surface-muted)` | 1 (+ as a utility) | 1 | 0 | 1 |
| 2 | `--muted-foreground` | `var(--ink-400)` | 1 (+ as a utility) | 1 | 0 | 2 |
| 2 | `--accent` | `var(--paige-blue-bg)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--accent-foreground` | `var(--paige-blue)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--destructive` | `var(--red-600)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--border` | `var(--neutral-300)` | 2 (+ as a utility) | 1 | 0 | 1 |
| 2 | `--input` | `var(--neutral-300)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--ring` | `var(--paige-blue)` | 0 (+ as a utility) | 0 | 0 | 3 |
| 2 | `--sidebar` | `var(--background)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--sidebar-foreground` | `var(--ink-600)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--sidebar-accent` | `var(--paige-blue-bg)` | 0 (+ as a utility) | 0 | 1 | 1 |
| 2 | `--sidebar-accent-foreground` | `var(--doc-blue-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 2 | `--sidebar-border` | `var(--neutral-300)` | 0 (+ as a utility) | 0 | 1 | 1 |
| 2 | `--sidebar-ring` | `var(--paige-blue)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--foreground-strong` | `var(--ink-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--body-muted` | `var(--neutral-700)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--placeholder` | `var(--ink-300)` | 2 (+ as a utility) | 1 | 0 | 2 |
| 3 | `--primary-hover` | `var(--paige-blue-pressed)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--primary-subtle` | `var(--paige-blue-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--divider` | `var(--neutral-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--border-strong` | `var(--ink-300)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--divider-tint` | `var(--hairline-tint)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--track` | `var(--neutral-100)` | 1 (+ as a utility) | 1 | 0 | 1 |
| 3 | `--surface-warm` | `var(--neutral-50)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--z-raised` | `10` | 0 | 0 | 0 | 1 |
| 3 | `--z-sticky` | `20` | 0 | 0 | 0 | 1 |
| 3 | `--z-overlay` | `50` | 0 | 0 | 0 | 1 |
| 3 | `--info` | `var(--paige-blue)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--info-foreground` | `var(--doc-blue-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--info-subtle` | `var(--paige-blue-50)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--info-border` | `var(--paige-blue-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--success` | `var(--green-600)` | 1 (+ as a utility) | 1 | 0 | 1 |
| 3 | `--success-foreground` | `var(--green-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--success-subtle` | `color-mix(in oklab, var(--green-600) 13%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--success-border` | `color-mix(in oklab, var(--green-600) 28%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--warning` | `var(--warm-500)` | 1 (+ as a utility) | 1 | 0 | 1 |
| 3 | `--warning-foreground` | `var(--sand-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--warning-subtle` | `var(--sand-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--warning-border` | `color-mix(in oklab, var(--warm-500) 35%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--attention` | `var(--warm-800)` | 2 (+ as a utility) | 1 | 0 | 1 |
| 3 | `--attention-foreground` | `var(--warm-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--attention-subtle` | `var(--warm-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--attention-border` | `var(--warm-500)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-1` | `var(--paige-blue)` | 0 (+ as a utility) | 0 | 1 | 1 |
| 3 | `--chart-2` | `var(--area-health)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-3` | `var(--area-estate)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-4` | `var(--area-money)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-5` | `var(--area-final)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-grid` | `var(--neutral-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--chart-axis` | `var(--ink-400)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--pet` | `var(--pet-800)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--pet-subtle` | `var(--pet-100)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--overlay` | `var(--ink-800)` | 0 (+ as a utility) | 0 | 0 | 5 |
| 3 | `--overlay-hover` | `color-mix(in oklab, var(--overlay) 8%, transparent)` | 0 (+ as a utility) | 0 | 0 | 3 |
| 3 | `--overlay-press` | `color-mix(in oklab, var(--overlay) 14%, transparent)` | 0 (+ as a utility) | 0 | 0 | 3 |
| 3 | `--overlay-scrim` | `color-mix(in oklab, var(--overlay) 40%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--scrollbar-thumb` | `color-mix(in oklab, var(--overlay) 24%, transparent)` | 0 | 0 | 0 | 3 |
| 3 | `--destructive-hover` | `var(--red-700)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--focus-halo` | `color-mix(in oklab, var(--ring) 50%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--on-tone` | `#ffffff` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--opacity-disabled` | `0.5` | 0 | 0 | 0 | 1 |
| 3 | `--opacity-quiet` | `0.75` | 0 | 0 | 0 | 1 |
| 3 | `--opacity-dim` | `0.4` | 0 | 0 | 0 | 1 |
| 3 | `--error` | `var(--red-600)` | 0 (+ as a utility) | 0 | 0 | 2 |
| 3 | `--error-border` | `color-mix(in srgb, var(--error) 78%, white)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--area` | `var(--ink-400)` | 0 (+ as a utility) | 0 | 0 | 5 |
| 3 | `--area-ink` | `var(--ink-600)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--area-tint` | `color-mix(in oklab, var(--area) 12%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 3 | `--area-wash` | `color-mix(in oklab, var(--area) 7%, transparent)` | 0 (+ as a utility) | 0 | 0 | 2 |
| 3 | `--gutter` | `1rem` | 0 (+ as a utility) | 0 | 0 | 2 |
| 4 | `--color-white` | `#ffffff` | 1 | 1 | 2 | 0 |
| 4 | `--color-black` | `#000000` | 2 | 2 | 3 | 0 |
| 4 | `--color-background` | `var(--background)` | 20 | 18 | 17 | 1 |
| 4 | `--color-foreground` | `var(--foreground)` | 18 | 16 | 12 | 1 |
| 4 | `--color-foreground-strong` | `var(--foreground-strong)` | 32 | 23 | 0 | 0 |
| 4 | `--color-body-muted` | `var(--body-muted)` | 13 | 13 | 0 | 0 |
| 4 | `--color-placeholder` | `var(--placeholder)` | 10 | 7 | 0 | 0 |
| 4 | `--color-card` | `var(--card)` | 67 | 37 | 3 | 0 |
| 4 | `--color-card-foreground` | `var(--card-foreground)` | 103 | 62 | 2 | 0 |
| 4 | `--color-popover` | `var(--popover)` | 5 | 5 | 8 | 0 |
| 4 | `--color-popover-foreground` | `var(--popover-foreground)` | 2 | 2 | 7 | 0 |
| 4 | `--color-primary` | `var(--primary)` | 46 | 31 | 26 | 0 |
| 4 | `--color-primary-foreground` | `var(--primary-foreground)` | 12 | 9 | 10 | 0 |
| 4 | `--color-primary-hover` | `var(--primary-hover)` | 3 | 3 | 0 | 0 |
| 4 | `--color-primary-subtle` | `var(--primary-subtle)` | 6 | 6 | 0 | 0 |
| 4 | `--color-secondary` | `var(--secondary)` | 2 | 2 | 5 | 0 |
| 4 | `--color-secondary-foreground` | `var(--secondary-foreground)` | 3 | 2 | 2 | 0 |
| 4 | `--color-muted` | `var(--muted)` | 24 | 20 | 13 | 0 |
| 4 | `--color-muted-foreground` | `var(--muted-foreground)` | 204 | 103 | 47 | 0 |
| 4 | `--color-accent` | `var(--accent)` | 19 | 16 | 26 | 0 |
| 4 | `--color-accent-foreground` | `var(--accent-foreground)` | 3 | 3 | 21 | 0 |
| 4 | `--color-destructive` | `var(--destructive)` | 7 | 4 | 54 | 1 |
| 4 | `--color-border` | `var(--border)` | 21 | 15 | 12 | 2 |
| 4 | `--color-input` | `var(--input)` | 8 | 6 | 23 | 0 |
| 4 | `--color-ring` | `var(--ring)` | 3 | 2 | 30 | 0 |
| 4 | `--color-divider` | `var(--divider)` | 22 | 18 | 0 | 0 |
| 4 | `--color-border-strong` | `var(--border-strong)` | 1 | 1 | 0 | 0 |
| 4 | `--color-divider-tint` | `var(--divider-tint)` | 9 | 9 | 0 | 0 |
| 4 | `--color-track` | `var(--track)` | 9 | 9 | 0 | 0 |
| 4 | `--color-surface-warm` | `var(--surface-warm)` | 3 | 3 | 0 | 0 |
| 4 | `--color-surface-page` | `var(--surface-page)` | 9 | 8 | 0 | 0 |
| 4 | `--color-sidebar` | `var(--sidebar)` | 0 | 0 | 5 | 1 |
| 4 | `--color-sidebar-foreground` | `var(--sidebar-foreground)` | 3 | 1 | 8 | 0 |
| 4 | `--color-sidebar-accent` | `var(--sidebar-accent)` | 2 | 1 | 11 | 0 |
| 4 | `--color-sidebar-accent-foreground` | `var(--sidebar-accent-foreground)` | 2 | 1 | 16 | 0 |
| 4 | `--color-sidebar-border` | `var(--sidebar-border)` | 2 | 1 | 4 | 0 |
| 4 | `--color-sidebar-ring` | `var(--sidebar-ring)` | 0 | 0 | 5 | 1 |
| 4 | `--color-chart-1` | `var(--chart-1)` | 2 | 2 | 0 | 0 |
| 4 | `--color-chart-2` | `var(--chart-2)` | 1 | 1 | 0 | 0 |
| 4 | `--color-chart-3` | `var(--chart-3)` | 1 | 1 | 0 | 0 |
| 4 | `--color-chart-4` | `var(--chart-4)` | 1 | 1 | 0 | 0 |
| 4 | `--color-chart-5` | `var(--chart-5)` | 1 | 1 | 0 | 0 |
| 4 | `--color-chart-grid` | `var(--chart-grid)` | 1 | 1 | 0 | 0 |
| 4 | `--color-chart-axis` | `var(--chart-axis)` | 1 | 1 | 0 | 0 |
| 4 | `--color-info` | `var(--info)` | 3 | 3 | 0 | 0 |
| 4 | `--color-info-foreground` | `var(--info-foreground)` | 7 | 6 | 0 | 0 |
| 4 | `--color-info-subtle` | `var(--info-subtle)` | 4 | 4 | 0 | 0 |
| 4 | `--color-info-border` | `var(--info-border)` | 3 | 3 | 0 | 0 |
| 4 | `--color-success` | `var(--success)` | 7 | 7 | 0 | 0 |
| 4 | `--color-success-foreground` | `var(--success-foreground)` | 20 | 17 | 0 | 0 |
| 4 | `--color-success-subtle` | `var(--success-subtle)` | 6 | 6 | 0 | 0 |
| 4 | `--color-success-border` | `var(--success-border)` | 5 | 5 | 0 | 0 |
| 4 | `--color-warning` | `var(--warning)` | 2 | 2 | 0 | 0 |
| 4 | `--color-warning-foreground` | `var(--warning-foreground)` | 4 | 3 | 0 | 0 |
| 4 | `--color-warning-subtle` | `var(--warning-subtle)` | 3 | 3 | 0 | 0 |
| 4 | `--color-warning-border` | `var(--warning-border)` | 2 | 2 | 0 | 0 |
| 4 | `--color-attention` | `var(--attention)` | 4 | 4 | 0 | 0 |
| 4 | `--color-attention-foreground` | `var(--attention-foreground)` | 11 | 10 | 0 | 0 |
| 4 | `--color-attention-subtle` | `var(--attention-subtle)` | 6 | 6 | 0 | 0 |
| 4 | `--color-attention-border` | `var(--attention-border)` | 4 | 4 | 0 | 0 |
| 4 | `--color-pet` | `var(--pet)` | 2 | 2 | 0 | 0 |
| 4 | `--color-pet-subtle` | `var(--pet-subtle)` | 2 | 2 | 0 | 0 |
| 4 | `--color-overlay` | `var(--overlay)` | 0 | 0 | 0 | 1 |
| 4 | `--color-overlay-hover` | `var(--overlay-hover)` | 2 | 1 | 0 | 1 |
| 4 | `--color-overlay-press` | `var(--overlay-press)` | 0 | 0 | 0 | 0 |
| 4 | `--color-overlay-scrim` | `var(--overlay-scrim)` | 2 | 2 | 0 | 2 |
| 4 | `--color-destructive-hover` | `var(--destructive-hover)` | 1 | 1 | 0 | 0 |
| 4 | `--color-focus-halo` | `var(--focus-halo)` | 5 | 2 | 0 | 1 |
| 4 | `--color-on-tone` | `var(--on-tone)` | 8 | 2 | 0 | 2 |
| 4 | `--color-error` | `var(--error)` | 17 | 8 | 0 | 0 |
| 4 | `--color-error-border` | `var(--error-border)` | 6 | 4 | 0 | 0 |
| 4 | `--color-area` | `var(--area)` | 9 | 6 | 0 | 2 |
| 4 | `--color-area-ink` | `var(--area-ink)` | 15 | 9 | 0 | 1 |
| 4 | `--color-area-tint` | `var(--area-tint)` | 8 | 5 | 0 | 1 |
| 4 | `--color-area-wash` | `var(--area-wash)` | 4 | 2 | 0 | 1 |
| 4 | `--radius-sm` | `calc(var(--radius) - 4px)` | 41 | 29 | 12 | 2 |
| 4 | `--radius-md` | `calc(var(--radius) - 2px)` | 23 | 18 | 50 | 0 |
| 4 | `--radius-lg` | `var(--radius)` | 54 | 33 | 8 | 0 |
| 4 | `--radius-xl` | `calc(var(--radius) + 4px)` | 13 | 12 | 2 | 0 |
| 4 | `--text-2xs` | `0.6875rem` | 3 | 2 | 0 | 1 |
| 4 | `--text-2xs--font-weight` | `600` | 0 | 0 | 0 | 0 |
| 4 | `--text-xs` | `0.75rem` | 106 | 63 | 16 | 1 |
| 4 | `--text-sm` | `0.875rem` | 201 | 106 | 60 | 0 |
| 4 | `--text-base` | `1rem` | 30 | 24 | 3 | 0 |
| 4 | `--text-lg` | `1.125rem` | 8 | 6 | 3 | 0 |
| 4 | `--text-xl` | `1.25rem` | 4 | 2 | 0 | 0 |
| 4 | `--text-2xl` | `1.5rem` | 9 | 5 | 0 | 0 |
| 4 | `--text-3xl` | `1.875rem` | 4 | 3 | 0 | 0 |
| 4 | `--text-4xl` | `2.5rem` | 4 | 3 | 0 | 0 |
| 4 | `--font-weight-normal` | `400` | 8 | 7 | 5 | 1 |
| 4 | `--font-weight-medium` | `500` | 152 | 84 | 26 | 1 |
| 4 | `--font-weight-semibold` | `600` | 111 | 65 | 4 | 0 |
| 4 | `--font-weight-bold` | `700` | 11 | 7 | 0 | 0 |
| 4 | `--font-sans` | `var(--font-brand-sans), "Montserrat", "Inter", system-ui, sans-serif` | 0 | 0 | 0 | 2 |
| 4 | `--font-display` | `var(--font-brand-display), "Roboto Slab", Georgia, serif` | 9 | 7 | 0 | 1 |
| 4 | `--tracking-eyebrow` | `0.05em` | 2 | 1 | 0 | 0 |
| 4 | `--tracking-display` | `-0.015em` | 5 | 4 | 0 | 1 |
| 4 | `--leading-display` | `1.2` | 6 | 5 | 0 | 1 |
| 4 | `--spacing` | `0.25rem` | 4 | 1 | 1 | 6 |
| 4 | `--spacing-gutter` | `var(--gutter)` | 2 | 2 | 0 | 1 |
| 4 | `--spacing-column` | `1.5rem` | 3 | 3 | 0 | 1 |
| 4 | `--spacing-grid` | `1rem` | 4 | 3 | 0 | 1 |
| 4 | `--spacing-section` | `1.5rem` | 4 | 4 | 0 | 1 |
| 4 | `--spacing-page-top` | `1.5rem` | 3 | 3 | 0 | 1 |
| 4 | `--spacing-page-top-roomy` | `3rem` | 2 | 2 | 0 | 0 |
| 4 | `--spacing-page-bottom` | `3rem` | 3 | 3 | 0 | 1 |
| 4 | `--spacing-rail` | `21rem` | 2 | 2 | 0 | 1 |
| 4 | `--spacing-control-sm` | `2.25rem` | 18 | 14 | 0 | 4 |
| 4 | `--spacing-control` | `2.75rem` | 9 | 7 | 0 | 1 |
| 4 | `--spacing-control-lg` | `3rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-textarea` | `4.5rem` | 3 | 3 | 0 | 1 |
| 4 | `--spacing-icon-xs` | `0.75rem` | 7 | 5 | 0 | 0 |
| 4 | `--spacing-icon-sm` | `0.875rem` | 4 | 4 | 0 | 0 |
| 4 | `--spacing-icon` | `1rem` | 28 | 23 | 0 | 1 |
| 4 | `--spacing-icon-lg` | `1.25rem` | 10 | 9 | 0 | 1 |
| 4 | `--spacing-icon-xl` | `1.5rem` | 3 | 3 | 0 | 0 |
| 4 | `--spacing-chart-sm` | `10rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-chart` | `16rem` | 1 | 1 | 0 | 1 |
| 4 | `--spacing-chart-lg` | `20rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-dag` | `28rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-dag-lg` | `40rem` | 1 | 1 | 0 | 1 |
| 4 | `--spacing-table` | `24rem` | 1 | 1 | 0 | 1 |
| 4 | `--spacing-table-lg` | `40rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-spark-sm` | `1.5rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-spark` | `2rem` | 1 | 1 | 0 | 1 |
| 4 | `--spacing-spark-lg` | `3rem` | 1 | 1 | 0 | 0 |
| 4 | `--spacing-row-header` | `2.5rem` | 3 | 1 | 0 | 2 |
| 4 | `--spacing-bar` | `3.5rem` | 3 | 3 | 0 | 1 |
| 4 | `--spacing-app-header` | `4rem` | 2 | 1 | 0 | 1 |
| 4 | `--container-page` | `87.5rem` | 1 | 1 | 0 | 1 |
| 4 | `--container-focused` | `48rem` | 2 | 2 | 0 | 1 |
| 4 | `--container-wide` | `60rem` | 2 | 2 | 0 | 1 |
| 4 | `--container-measure` | `60ch` | 8 | 6 | 0 | 1 |
| 4 | `--container-display` | `20ch` | 2 | 2 | 0 | 1 |
| 4 | `--container-menu` | `12rem` | 2 | 2 | 0 | 1 |
| 4 | `--container-menu-wide` | `14rem` | 3 | 3 | 0 | 0 |
| 4 | `--container-popover` | `20rem` | 3 | 3 | 0 | 1 |
| 4 | `--container-popover-wide` | `24rem` | 3 | 3 | 0 | 0 |
| 4 | `--container-dialog-sm` | `28rem` | 4 | 4 | 0 | 0 |
| 4 | `--container-dialog` | `42rem` | 1 | 1 | 0 | 1 |
| 4 | `--container-dialog-lg` | `56rem` | 1 | 1 | 0 | 0 |
| 4 | `--breakpoint-sm` | `40rem` | 63 | 30 | 20 | 0 |
| 4 | `--breakpoint-md` | `48rem` | 64 | 37 | 14 | 0 |
| 4 | `--breakpoint-lg` | `64rem` | 52 | 25 | 3 | 0 |
| 4 | `--breakpoint-xl` | `80rem` | 24 | 10 | 0 | 0 |
| 4 | `--shadow-card` | `0 1px 2px rgb(37 52 86 / 0.06)` | 19 | 11 | 0 | 0 |
| 4 | `--shadow-lift` | `0 1px 2px rgb(37 52 86 / 0.04), 0 4px 12px rgb(37 52 86 / 0.07)` | 6 | 3 | 0 | 0 |
| 4 | `--shadow-pop` | `0 8px 24px rgb(37 52 86 / 0.12)` | 11 | 6 | 0 | 0 |
| 4 | `--shadow-avatar` | `0 3px 12px rgb(37 52 86 / 0.13)` | 2 | 1 | 0 | 0 |
| 4 | `--shadow-xs` | `0 1px 2px rgb(37 52 86 / 0.06)` | 4 | 2 | 13 | 1 |
| 4 | `--shadow-sm` | `0 1px 2px rgb(37 52 86 / 0.06)` | 4 | 2 | 3 | 0 |
| 4 | `--shadow-md` | `0 8px 24px rgb(37 52 86 / 0.12)` | 3 | 1 | 6 | 1 |
| 4 | `--shadow-lg` | `0 8px 24px rgb(37 52 86 / 0.12)` | 3 | 1 | 5 | 0 |
| 4 | `--default-transition-duration` | `200ms` | 0 | 0 | 0 | 0 |
| 4 | `--animate-progress-slide` | `progress-slide 1.4s ease-in-out infinite` | 1 | 1 | 0 | 0 |
| 4 | `--animate-progress-pulse` | `progress-pulse 2s ease-in-out infinite` | 1 | 1 | 0 | 0 |
| 5 | `--area-tint` | `color-mix(in oklab, var(--area) 12%, transparent)` | 0 (+ as a utility) | 0 | 0 | 1 |
| 5 | `--area-wash` | `color-mix(in oklab, var(--area) 7%, transparent)` | 0 (+ as a utility) | 0 | 0 | 2 |

### Literal geometry census

Every numeric or named step the Paige layer writes by hand, by family and value. *Uses (components)* and *Files* exclude stories and the story-only folders; *Uses (stories)* counts those. *Forms seen* are the utilities as written, variants stripped.

#### height

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `full` |  | 7 | 7 | 1 | `h-full max-h-full` | admin/pages/partners.tsx, admin/partner-logo.tsx, charts/dag-frame.tsx, components/display/data-table.tsx, components/feedback/skeleton.tsx (+2) |
| `5` | 20px | 5 | 5 | 0 | `h-5` | charts/lazy-dag-frame.tsx, components/display/stat.tsx, forms/inline-edit.tsx, patterns/bulk-action-bar.tsx, templates/admin-page.tsx |
| `auto` |  | 5 | 5 | 0 | `h-auto` | components/actions/button.tsx, components/inputs/combobox.tsx, components/inputs/toggle-group.tsx, components/navigation/tabs-pill-styles.ts, vault/remove-dialog.tsx |
| `96` | 384px | 3 | 3 | 7 | `h-96 max-h-96 min-h-96` | charts/internal/dag-model.test.ts, charts/internal/dag-shape.ts, shell/header-search.tsx |
| `0` | 0px | 5 | 2 | 0 | `min-h-0` | charts/dag-frame.tsx, components/display/data-table.tsx |
| `20` | 80px | 4 | 2 | 1 | `h-20` | admin/pages/partners.tsx, admin/partner-logo.tsx |
| `screen` |  | 2 | 2 | 5 | `h-screen min-h-screen` | templates/setup-beat.tsx, app:features/shell/vault-shell.tsx |
| `8` | 32px | 2 | 2 | 2 | `h-8` | admin/partner-logo.tsx, forms/fields/date-range-field.tsx |
| `px` |  | 2 | 2 | 0 | `h-px` | charts/dag-frame.tsx, components/actions/menu.tsx |
| `104` | 416px | 2 | 2 | 0 | `h-104` | charts/internal/dag-model.test.ts, charts/internal/dag-shape.ts |
| `140` | 560px | 2 | 2 | 0 | `h-140` | charts/internal/dag-model.test.ts, charts/internal/dag-shape.ts |
| `120` | 480px | 2 | 2 | 1 | `h-120 max-h-120` | charts/internal/dag-shape.ts, patterns/filters-popover.tsx |
| `4` | 16px | 2 | 2 | 0 | `h-4` | components/display/badge.tsx, components/feedback/skeleton.tsx |
| `6` | 24px | 2 | 2 | 3 | `h-6` | patterns/filter-card-row.tsx, app:features/shell/vault-shell.tsx |
| `1` | 4px | 2 | 2 | 0 | `h-1` | components/feedback/progress.tsx, setup/step-rail.tsx |
| `14` | 56px | 1 | 1 | 0 | `h-14` | charts/dag-frame.tsx |
| `18` | 72px | 1 | 1 | 0 | `h-18` | charts/internal/dag-shape.ts |
| `112` | 448px | 1 | 1 | 0 | `h-112` | charts/internal/dag-shape.ts |
| `128` | 512px | 1 | 1 | 0 | `h-128` | charts/internal/dag-shape.ts |
| `136` | 544px | 1 | 1 | 0 | `h-136` | charts/internal/dag-shape.ts |
| `80` | 320px | 1 | 1 | 3 | `max-h-80 min-h-80` | components/inputs/multi-select.tsx |
| `10` | 40px | 1 | 1 | 2 | `h-10 min-h-10` | components/display/item.tsx |
| `9` | 36px | 1 | 1 | 0 | `h-9` | components/feedback/skeleton.tsx |
| `72` | 288px | 1 | 1 | 2 | `h-72 max-h-72 min-h-72` | components/inputs/combobox.tsx |
| `5.5` | 22px | 1 | 1 | 0 | `h-5.5` | components/inputs/switch.tsx |
| `52` | 208px | 1 | 1 | 0 | `min-h-52` | vault/areas/area-tile.tsx |
| `160` | 640px | 0 | 0 | 1 | `h-160` |  |
| `36` | 144px | 0 | 0 | 1 | `h-36` |  |
| `56` | 224px | 0 | 0 | 2 | `min-h-56` |  |
| `11` | 44px | 0 | 0 | 1 | `min-h-11` |  |
| `48` | 192px | 0 | 0 | 2 | `min-h-48` |  |
| `40` | 160px | 0 | 0 | 3 | `h-40 min-h-40` |  |
| `3` | 12px | 0 | 0 | 1 | `h-3` |  |
| `64` | 256px | 0 | 0 | 2 | `h-64` |  |
| `28` | 112px | 0 | 0 | 1 | `h-28` |  |

#### width

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `0` | 0px | 44 | 28 | 2 | `min-w-0` | admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/subscriptions.tsx, admin/pipeline-graph.tsx, charts/dag-frame.tsx (+23) |
| `full` |  | 39 | 27 | 4 | `max-w-full w-full` | admin/pages/partners.tsx, admin/partner-logo.tsx, charts/chart.tsx, charts/lazy-chart.tsx, components/display/data-table.tsx (+22) |
| `fit` |  | 10 | 9 | 6 | `w-fit` | admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/plans.tsx, admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx (+4) |
| `48` | 192px | 5 | 4 | 1 | `max-w-48 min-w-48 w-48` | admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx, charts/dag-frame.tsx, patterns/list-toolbar.tsx |
| `10` | 40px | 3 | 3 | 1 | `w-10` | components/display/item.tsx, components/inputs/switch.tsx, labs/components/item.tsx |
| `1` | 4px | 4 | 2 | 0 | `max-w-1 w-1` | components/feedback/skeleton.tsx, primitives/split.tsx |
| `sm` |  | 3 | 2 | 18 | `max-w-sm` | patterns/list-toolbar.tsx, setup/flow-footer.tsx |
| `64` | 256px | 2 | 2 | 5 | `max-w-64 w-64` | admin/pages/people.tsx, components/overlays/tooltip.tsx |
| `44` | 176px | 2 | 2 | 0 | `max-w-44` | admin/pages/people.tsx, admin/pages/plans.tsx |
| `5` | 20px | 2 | 2 | 0 | `w-5` | charts/dag-frame.tsx, setup/step-rail.tsx |
| `8` | 32px | 2 | 2 | 0 | `w-8` | components/display/item.tsx, setup/step-rail.tsx |
| `12` | 48px | 6 | 1 | 1 | `w-12` | components/display/data-table.tsx |
| `56` | 224px | 1 | 1 | 4 | `max-w-56 w-56` | admin/pages/partners.tsx |
| `16` | 64px | 1 | 1 | 1 | `w-16` | admin/partner-logo.tsx |
| `60` | 240px | 1 | 1 | 3 | `max-w-60 w-60` | charts/internal/dag-shape.ts |
| `72` | 288px | 1 | 1 | 4 | `w-72` | shell/header-search.tsx |
| `2` | 8px | 1 | 1 | 0 | `w-2` | components/feedback/progress.tsx |
| `3` | 12px | 1 | 1 | 0 | `w-3` | components/feedback/skeleton.tsx |
| `40` | 160px | 1 | 1 | 5 | `w-40` | shell/header-search.tsx |
| `prose` |  | 1 | 1 | 1 | `max-w-prose` | vault/item-row.tsx |
| `px` |  | 1 | 1 | 0 | `w-px` | patterns/bulk-action-bar.tsx |
| `9` | 36px | 1 | 1 | 0 | `w-9` | shell/header-search.tsx |
| `xs` |  | 0 | 0 | 8 | `max-w-xs` |  |
| `xl` |  | 0 | 0 | 25 | `max-w-xl w-xl` |  |
| `4xl` |  | 0 | 0 | 3 | `max-w-4xl` |  |
| `3xl` |  | 0 | 0 | 12 | `max-w-3xl` |  |
| `6xl` |  | 0 | 0 | 1 | `w-6xl` |  |
| `24` | 96px | 0 | 0 | 5 | `w-24` |  |
| `20` | 80px | 0 | 0 | 2 | `w-20` |  |
| `md` |  | 0 | 0 | 12 | `max-w-md` |  |
| `120` | 480px | 0 | 0 | 2 | `w-120` |  |
| `lg` |  | 0 | 0 | 3 | `max-w-lg` |  |
| `14` | 56px | 0 | 0 | 2 | `w-14` |  |
| `180` | 720px | 0 | 0 | 1 | `w-180` |  |
| `96` | 384px | 0 | 0 | 2 | `w-96` |  |
| `80` | 320px | 0 | 0 | 6 | `max-w-80 w-80` |  |
| `160` | 640px | 0 | 0 | 2 | `max-w-160 w-160` |  |
| `240` | 960px | 0 | 0 | 2 | `max-w-240 w-240` |  |
| `28` | 112px | 0 | 0 | 4 | `w-28` |  |
| `36` | 144px | 0 | 0 | 2 | `w-36` |  |
| `52` | 208px | 0 | 0 | 1 | `w-52` |  |
| `32` | 128px | 0 | 0 | 5 | `w-32` |  |
| `2xl` |  | 0 | 0 | 4 | `max-w-2xl` |  |

#### size

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `5` | 20px | 5 | 4 | 0 | `size-5` | components/display/dot.tsx, components/inputs/switch.tsx, vault/areas/area-icon.tsx, vault/choice-card.tsx |
| `6` | 24px | 4 | 3 | 3 | `size-6` | components/display/avatar.tsx, forms/fields/field-action.tsx, vault/people/person-picker.tsx |
| `10` | 40px | 3 | 2 | 0 | `size-10` | components/display/avatar.tsx, components/display/item.tsx |
| `2.5` | 10px | 2 | 2 | 0 | `size-2.5` | charts/chart.tsx, components/display/badge.tsx |
| `9` | 36px | 2 | 2 | 1 | `size-9` | components/display/avatar.tsx, vault/choice-card.tsx |
| `8` | 32px | 2 | 2 | 0 | `size-8` | components/display/item.tsx, vault/areas/area-icon.tsx |
| `11` | 44px | 2 | 2 | 0 | `size-11` | vault/areas/area-icon.tsx, vault/documents/upload-row.tsx |
| `full` |  | 2 | 1 | 0 | `size-full` | charts/dag-frame.tsx |
| `8.5` | 34px | 2 | 1 | 0 | `size-8.5` | components/display/avatar.tsx |
| `12` | 48px | 2 | 1 | 2 | `size-12` | components/display/avatar.tsx |
| `18.5` | 74px | 2 | 1 | 0 | `size-18.5` | components/display/avatar.tsx |
| `7` | 28px | 1 | 1 | 0 | `size-7` | admin/admin-sidebar.tsx |
| `0` | 0px | 1 | 1 | 0 | `size-0` | charts/dag-frame.tsx |
| `4` | 16px | 1 | 1 | 3 | `size-4` | components/display/dot.tsx |
| `2` | 8px | 1 | 1 | 0 | `size-2` | components/display/dot.tsx |
| `3` | 12px | 1 | 1 | 0 | `size-3` | components/display/dot.tsx |
| `3.5` | 14px | 1 | 1 | 0 | `size-3.5` | components/display/dot.tsx |
| `fit` |  | 1 | 1 | 0 | `size-fit` | shell/account-menu.tsx |
| `14` | 56px | 1 | 1 | 1 | `size-14` | vault/areas/area-icon.tsx |
| `auto` |  | 1 | 1 | 0 | `size-auto` | vault/areas/area-icon.tsx |

#### padding

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `3` | 12px | 35 | 25 | 11 | `p-3 pb-3 pl-3 px-3 py-3` | admin/pages/partners.tsx, admin/partner-logo.tsx, admin/pipeline-graph.tsx, charts/dag-frame.tsx, components/display/data-table.tsx (+20) |
| `2` | 8px | 35 | 22 | 18 | `p-2 pb-2 pr-2 pt-2 px-2 py-2` | admin/pipeline-graph.tsx, charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/context-menu.tsx, components/actions/dropdown-menu.tsx (+17) |
| `4` | 16px | 35 | 19 | 25 | `p-4 pb-4 pl-4 pt-4 px-4 py-4` | charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/button.tsx, components/display/data-table.tsx, components/inputs/toggle-group.tsx (+14) |
| `5` | 20px | 22 | 14 | 11 | `p-5 pb-5 pl-5 pt-5 px-5 py-5` | admin/rev-share.tsx, components/internal/popover-surface.ts, components/navigation/tabs-pill-styles.ts, forms/error-summary.tsx, patterns/kpi-card.tsx (+9) |
| `2.5` | 10px | 16 | 11 | 2 | `pl-2.5 pr-2.5 px-2.5 py-2.5` | charts/dag-frame.tsx, charts/lazy-dag-frame.tsx, components/actions/context-menu.tsx, components/actions/dropdown-menu.tsx, components/actions/menu.tsx (+6) |
| `6` | 24px | 15 | 10 | 13 | `p-6 pr-6 pt-6 px-6 py-6` | admin/rev-share.tsx, charts/dag-frame.tsx, components/display/card.tsx, components/feedback/empty-state.tsx, forms/form-footer.tsx (+5) |
| `1` | 4px | 12 | 9 | 1 | `p-1 pb-1 px-1 py-1` | admin/partner-logo.tsx, components/display/data-table.tsx, components/inputs/input.tsx, components/internal/control.ts, components/internal/popover-surface.ts (+4) |
| `0` | 0px | 11 | 9 | 3 | `p-0 pb-0 pt-0 px-0 py-0` | components/actions/button.tsx, components/display/badge.tsx, components/display/data-table.tsx, components/display/item.tsx, components/feedback/message.tsx (+4) |
| `1.5` | 6px | 9 | 7 | 0 | `pl-1.5 px-1.5 py-1.5` | charts/dag-frame.tsx, components/display/badge.tsx, components/display/data-table.tsx, components/inputs/multi-select.tsx, components/overlays/tooltip.tsx (+2) |
| `0.5` | 2px | 4 | 4 | 0 | `p-0.5 py-0.5` | charts/dag-frame.tsx, components/display/badge.tsx, components/display/stat.tsx, components/navigation/tabs-pill-styles.ts |
| `10` | 40px | 3 | 2 | 0 | `px-10 py-10` | charts/dag-frame.tsx, components/feedback/empty-state.tsx |
| `5.5` | 22px | 3 | 2 | 0 | `px-5.5` | components/actions/button.tsx, vault/capture-card.tsx |
| `4.5` | 18px | 3 | 2 | 0 | `pb-4.5 px-4.5` | vault/capture-card.tsx, vault/documents/upload-row.tsx |
| `6.5` | 26px | 2 | 1 | 0 | `px-6.5` | components/actions/button.tsx |
| `13` | 52px | 2 | 1 | 0 | `pl-13` | labs/components/item.tsx |
| `3.5` | 14px | 2 | 1 | 0 | `pr-3.5` | vault/people/person-picker.tsx |
| `7` | 28px | 1 | 1 | 0 | `pl-7` | charts/dag-frame.tsx |
| `12` | 48px | 1 | 1 | 0 | `p-12` | components/feedback/empty-state.tsx |
| `80` | 320px | 0 | 0 | 1 | `pt-80` |  |
| `1001` | 4004px | 0 | 0 | 1 | `p-1001` |  |
| `8` | 32px | 0 | 0 | 1 | `p-8` |  |
| `64` | 256px | 0 | 0 | 1 | `pt-64` |  |

#### margin

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `2` | 8px | 17 | 15 | 2 | `-mx-2 mb-2 ml-2 mr-2 mt-2 my-2` | charts/dag-frame.tsx, components/actions/menu.tsx, components/display/data-table.tsx, components/inputs/multi-select.tsx, components/internal/popover-surface.ts (+10) |
| `1` | 4px | 20 | 12 | 3 | `-mr-1 -mt-1 -mx-1 mb-1 mr-1 mt-1 mx-1 my-1` | admin/pipeline-graph.tsx, components/display/item.tsx, forms/error-summary.tsx, forms/inline-edit.tsx, patterns/bulk-action-bar.tsx (+7) |
| `auto` |  | 14 | 12 | 3 | `mb-auto ml-auto mr-auto mx-auto` | charts/chart.tsx, components/actions/menu.tsx, components/display/data-table.tsx, forms/fields/address-field.tsx, patterns/bulk-action-bar.tsx (+7) |
| `1.5` | 6px | 12 | 9 | 0 | `-mr-1.5 -mx-1.5 -my-1.5 mb-1.5 mt-1.5 my-1.5` | components/display/data-table.tsx, components/feedback/message.tsx, forms/inline-edit.tsx, labs/components/item.tsx, patterns/filter-card-row.tsx (+4) |
| `0.5` | 2px | 10 | 8 | 0 | `ml-0.5 mt-0.5 my-0.5` | charts/dag-frame.tsx, components/display/stat.tsx, components/feedback/message.tsx, patterns/filters-popover.tsx, shell/header-search.tsx (+3) |
| `3` | 12px | 8 | 7 | 6 | `-mx-3 mb-3 ml-3 mt-3 my-3` | forms/form-section.tsx, labs/components/item.tsx, vault/capture-card.tsx, vault/fact-field.tsx, vault/fact-item.tsx (+2) |
| `0` | 0px | 7 | 6 | 0 | `m-0 mb-0 ml-0 mr-0 mt-0` | charts/chart.tsx, components/feedback/empty-state.tsx, components/inputs/input-group.tsx, forms/form-section.tsx, patterns/panel.tsx (+1) |
| `4` | 16px | 7 | 6 | 4 | `mb-4 mt-4` | forms/form-section.tsx, patterns/panel.tsx, templates/page-header.tsx, vault/areas/area-tile.tsx, vault/people/person-add-form.tsx (+1) |
| `8` | 32px | 6 | 4 | 1 | `mb-8 ml-8 mt-8` | forms/form-footer.tsx, forms/form-section.tsx, setup/flow-footer.tsx, vault/item-row.tsx |
| `6` | 24px | 3 | 3 | 0 | `mb-6 mt-6` | admin/rev-share.tsx, forms/form.tsx, templates/page-header.tsx |
| `3.5` | 14px | 2 | 1 | 0 | `mb-3.5 mt-3.5` | vault/capture-card.tsx |
| `12` | 48px | 1 | 1 | 0 | `mt-12` | forms/form-section.tsx |
| `10` | 40px | 0 | 0 | 1 | `mb-10` |  |

#### gap

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `2` | 8px | 54 | 34 | 34 | `gap-2 gap-x-2 gap-y-2` | admin/admin-sidebar.tsx, admin/pages/partners.tsx, admin/pipeline-graph.tsx, admin/rev-share.tsx, charts/chart.tsx (+29) |
| `3` | 12px | 31 | 22 | 34 | `gap-3 gap-x-3 gap-y-3` | admin/pages/partners.tsx, admin/pipeline-graph.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, components/display/callout.tsx (+17) |
| `4` | 16px | 25 | 18 | 43 | `gap-4 gap-x-4 gap-y-4` | admin/pipeline-graph.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, charts/dag-status.tsx, forms/field.tsx (+13) |
| `1` | 4px | 18 | 15 | 5 | `gap-1 gap-y-1` | admin/pages/partners.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, charts/dag-status.tsx, components/actions/disclosure-trigger.tsx (+10) |
| `0.5` | 2px | 18 | 14 | 0 | `gap-0.5` | admin/pages/partners.tsx, admin/pages/plans.tsx, admin/pages/subscriptions.tsx, admin/rev-share.tsx, charts/dag-frame.tsx (+9) |
| `1.5` | 6px | 17 | 13 | 1 | `gap-1.5` | admin/pages/partners.tsx, admin/pages/plans.tsx, admin/rev-share.tsx, charts/dag-frame.tsx, charts/dag-status.tsx (+8) |
| `6` | 24px | 9 | 9 | 29 | `gap-6 gap-x-6` | admin/rev-share.tsx, components/display/card.tsx, components/feedback/empty-state.tsx, forms/field.tsx, primitives/grid.tsx (+4) |
| `0` | 0px | 6 | 6 | 0 | `gap-0` | labs/components/item.tsx, patterns/kpi-card.tsx, patterns/panel.tsx, vault/areas/area-tile.tsx, vault/areas/link-out.tsx (+1) |
| `8` | 32px | 6 | 5 | 9 | `gap-8 gap-x-8 gap-y-8` | admin/rev-share.tsx, forms/field.tsx, primitives/grid.tsx, app:features/admin/partner-stand-in.tsx, app:features/admin/person-stand-in.tsx |
| `2.5` | 10px | 3 | 3 | 0 | `gap-2.5` | components/inputs/multi-select.tsx, components/internal/popover-surface.ts, patterns/panel.tsx |
| `5` | 20px | 1 | 1 | 0 | `gap-5` | admin/rev-share.tsx |
| `12` | 48px | 1 | 1 | 0 | `gap-12` | charts/dag-frame.tsx |
| `3.5` | 14px | 1 | 1 | 0 | `gap-3.5` | vault/capture-card.tsx |

#### inset

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `0` | 0px | 8 | 7 | 0 | `inset-0 inset-x-0 left-0 top-0` | components/display/avatar.tsx, components/display/data-table.tsx, components/display/stat.tsx, components/navigation/tabs-pill-styles.ts, forms/fields/address-field.tsx (+2) |
| `3` | 12px | 5 | 2 | 0 | `bottom-3 left-3 right-3 top-3` | charts/dag-frame.tsx, vault/choice-card.tsx |
| `2` | 8px | 3 | 2 | 2 | `right-2 top-2` | components/inputs/select.tsx, shell/notification-bell.tsx |
| `2.5` | 10px | 2 | 2 | 0 | `right-2.5` | components/inputs/select.tsx, components/internal/popover-surface.ts |
| `0.5` | 2px | 2 | 1 | 0 | `-bottom-0.5 -right-0.5` | components/display/avatar.tsx |
| `1` | 4px | 2 | 1 | 0 | `-bottom-1 -right-1` | vault/areas/area-icon.tsx |
| `14` | 56px | 1 | 1 | 0 | `inset-x-14` | charts/dag-frame.tsx |
| `full` |  | 1 | 1 | 0 | `bottom-full` | forms/fields/address-field.tsx |

#### radius

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `sm` |  | 31 | 23 | 6 | `rounded-sm` | admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/plans.tsx, admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx (+18) |
| `full` |  | 25 | 21 | 0 | `rounded-full` | charts/dag-frame.tsx, components/actions/button.tsx, components/display/avatar.tsx, components/display/badge.tsx, components/display/dot.tsx (+16) |
| `lg` |  | 18 | 14 | 26 | `rounded-lg` | charts/chart.tsx, charts/dag-frame.tsx, charts/lazy-chart.tsx, charts/lazy-dag-frame.tsx, components/display/data-table.tsx (+9) |
| `md` |  | 16 | 13 | 4 | `rounded-md` | admin/admin-sidebar.tsx, admin/pipeline-graph.tsx, components/display/item.tsx, components/feedback/skeleton.tsx, components/inputs/multi-select.tsx (+8) |
| `none` |  | 8 | 8 | 0 | `rounded-none` | charts/dag-frame.tsx, components/display/data-table.tsx, components/display/item.tsx, components/feedback/message.tsx, components/inputs/combobox.tsx (+3) |
| `xl` |  | 3 | 3 | 6 | `rounded-xl` | components/display/card.tsx, vault/capture-card.tsx, vault/documents/upload-row.tsx |

#### text-size

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `sm` |  | 105 | 52 | 79 | `text-sm` | admin/admin-sidebar.tsx, admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx (+47) |
| `xs` |  | 69 | 40 | 25 | `text-xs` | admin/admin-sidebar.tsx, admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/plans.tsx, admin/pages/subscriptions.tsx (+35) |
| `base` |  | 24 | 20 | 4 | `text-base` | admin/rev-share.tsx, charts/dag-frame.tsx, components/actions/button.tsx, components/display/avatar.tsx, components/display/data-table.tsx (+15) |
| `2xl` |  | 5 | 3 | 2 | `text-2xl` | admin/rev-share.tsx, components/display/avatar.tsx, patterns/filter-card-row.tsx |
| `lg` |  | 3 | 3 | 3 | `text-lg` | components/feedback/empty-state.tsx, vault/areas/area-tile.tsx, vault/capture-card.tsx |
| `2xs` |  | 2 | 1 | 0 | `text-2xs` | components/display/badge.tsx |
| `size-inherit` |  | 1 | 1 | 0 | `text-size-inherit` | components/actions/button.tsx |
| `xl` |  | 1 | 1 | 3 | `text-xl` | templates/page-header.tsx |
| `3xl` |  | 1 | 1 | 2 | `text-3xl` | templates/page-header.tsx |
| `4xl` |  | 1 | 1 | 2 | `text-4xl` | patterns/page-intro.tsx |

#### font-weight

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `medium` |  | 108 | 56 | 30 | `font-medium` | admin/pages/partners.tsx, admin/pages/people.tsx, admin/pages/plans.tsx, admin/pages/promotion-codes.tsx, admin/pages/subscriptions.tsx (+51) |
| `semibold` |  | 79 | 45 | 23 | `font-semibold` | admin/admin-sidebar.tsx, admin/pages/partners.tsx, admin/pages/plans.tsx, admin/pages/promotion-codes.tsx, admin/partner-logo.tsx (+40) |
| `bold` |  | 8 | 6 | 3 | `font-bold` | patterns/page-intro.tsx, patterns/panel.tsx, templates/page-header.tsx, vault/areas/area-tile.tsx, vault/areas/link-out.tsx (+1) |
| `normal` |  | 5 | 5 | 1 | `font-normal` | components/display/stat.tsx, components/inputs/select.tsx, components/internal/control.ts, components/internal/rich-textarea.tsx, forms/inline-edit.tsx |

#### leading

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `display` |  | 5 | 4 | 1 | `leading-display` | patterns/page-intro.tsx, templates/page-header.tsx, vault/areas/area-tile.tsx, vault/capture-card.tsx |
| `5` |  | 2 | 2 | 0 | `leading-5` | components/inputs/multi-select.tsx, patterns/filters-popover.tsx |
| `none` |  | 1 | 1 | 0 | `leading-none` | components/display/badge.tsx |

#### border-width

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `0` | 0px | 15 | 10 | 1 | `border-0 border-b-0 border-t-0` | charts/dag-frame.tsx, components/display/data-table.tsx, components/display/item.tsx, components/feedback/message.tsx, components/inputs/input-group.tsx (+5) |
| `2` | 2px | 3 | 3 | 0 | `border-2 border-b-2` | components/display/status-mark.tsx, vault/areas/area-icon.tsx, vault/fact-field.tsx |
| `dot` |  | 4 | 1 | 0 | `border-dot` | components/display/status-mark.tsx |

#### ring-width

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `0` | 0px | 7 | 6 | 0 | `ring-0` | components/actions/button.tsx, components/inputs/checkbox.tsx, components/inputs/input-group.tsx, components/inputs/radio-group.tsx, components/inputs/switch.tsx (+1) |
| `2` | 2px | 4 | 3 | 0 | `ring-2` | charts/dag-frame.tsx, components/display/avatar.tsx, components/display/dot.tsx |
| `3` | 3px | 5 | 2 | 0 | `ring-3` | components/display/avatar.tsx, components/internal/control.ts |
| `1` | 1px | 0 | 0 | 1 | `outline-1` |  |

#### opacity

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `100` |  | 5 | 4 | 0 | `opacity-100` | components/actions/menu.tsx, components/inputs/input-group.tsx, components/navigation/tabs-pill-styles.ts, labs/components/item.tsx |
| `0` |  | 1 | 1 | 0 | `opacity-0` | components/navigation/tabs-pill-styles.ts |

#### colour-alpha

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `current/10` |  | 1 | 1 | 0 | `fill-current/10` | components/display/sparkline.tsx |

#### hard-colour

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `transparent` |  | 31 | 14 | 0 | `bg-transparent border-transparent to-transparent` | components/actions/button.tsx, components/display/badge.tsx, components/display/callout.tsx, components/display/data-table.tsx, components/display/status-mark.tsx (+9) |
| `current` |  | 3 | 3 | 0 | `fill-current text-current` | components/display/callout.tsx, components/display/sparkline.tsx, components/feedback/message.tsx |
| `inherit` |  | 3 | 2 | 0 | `text-inherit` | components/actions/button.tsx, components/inputs/combobox.tsx |
| `white` |  | 1 | 1 | 0 | `ring-white` | components/display/avatar.tsx |

#### translate/scale

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `98` |  | 1 | 1 | 0 | `scale-98` | components/actions/button.tsx |
| `100` |  | 1 | 1 | 0 | `scale-100` | components/actions/button.tsx |
| `0` |  | 1 | 1 | 0 | `translate-y-0` | components/feedback/message.tsx |
| `0.5` |  | 1 | 1 | 0 | `translate-y-0.5` | labs/components/item.tsx |

#### line-clamp

| Value | px | Uses (components) | Files | Uses (stories) | Forms seen | Where |
|---|---|---|---|---|---|---|
| `none` |  | 3 | 3 | 0 | `line-clamp-none` | components/display/callout.tsx, components/display/item.tsx, components/feedback/message.tsx |

<!-- tokens:end -->
