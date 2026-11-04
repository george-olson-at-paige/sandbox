# Review 21 — The Journeys page and the parts it needs (opened 2026-10-31)

George, 2026-10-31: the People page's top cards *"look much less clean"* than the Journeys mock's, and the admin Journeys page is next. The read-only inventory (`rc-scratch-2026-10-29/react-inventory/inventory.md`, with its screenshots and `measurements.json`) compared the mock (`journeys-mock/project/Main.dc.html`, real local Setup numbers) with the React library piece by piece and named the gaps and a build order. This file is the held list for that build: IDs `R21-nn`, never reused; statuses proposed → agreed → built → verified.

**George's decisions (2026-10-31), the brief's.**

1. **KpiCard may carry one caption line.** Still no second number: the mock's "14 · 14%" is 14, with the share in the caption. `src/admin/README.md`'s metric rule says so (R21-05).
2. **Segmented control:** the chosen segment takes the **muted fill**, as the icon toggle bar does, not the mock's dark ink (R21-04).
3. **AdminPage** (a template, so a foundation change) gets three slots, approved: **breadcrumb**, **tabs**, **meta** (R21-02).
4. **Sankey is out of scope.** Nothing Sankey-related is built, touched or "improved" in this review.

Mock details that break package rules and are not followed: the 11px labels (R2-08: 12px is the smallest text; they are `text-xs`), the white header band (AdminPage's header sits on the page surface; an experience difference for Product, not taken), and the dark-ink segment (decision 2).

## The list

| ID | Piece | Where | Step | Status |
|---|---|---|---|---|
| R21-01 | **Card surface and FilterCardRow** (George's complaint) | `components/display/card.tsx`, `components/inputs/toggle-group.tsx`, `patterns/filter-card-row.tsx`, `components/display/stat.tsx`, `patterns/kpi-card.tsx`, `theme.css`, `templates/admin-page.tsx` | 1 | **built** |
| R21-02 | **AdminPage `breadcrumb`, `tabs`, `meta`** | `templates/admin-page.tsx` | 2 | **built** |
| R21-03 | **TabsLine** (underline tabs) | `components/navigation/tabs-line.tsx` | 3 | **built** |
| R21-04 | **ToggleGroup `segment`** (text segmented control) | `components/inputs/toggle-group.tsx` | 3 | **built** |
| R21-05 | **KpiCard `caption`** and the metric rule | `patterns/kpi-card.tsx`, `components/display/stat.tsx`, `admin/README.md` | 4 | **built** |
| R21-06 | **InsightCard** (attention tone, the whole card is the button) | `patterns/insight-card.tsx` | 4 | **built** |
| R21-07 | **MeterBar** | `components/display/meter-bar.tsx` | 5 | **built** |
| R21-08 | **RangeBar** (box, median tick, whisker) | `components/display/range-bar.tsx` | 5 | **built** |
| R21-09 | **Legend** | `components/display/legend.tsx` | 5 | **built** |
| R21-10 | **Formatted `tone="attention"`** | `components/display/formatted.tsx` | 5 | **built** |
| R21-11 | **DataTable `currentRowId`** | `components/display/data-table.tsx` | 5 | **built** |
| R21-12 | **NavList** (screens with counts and an attention dot) | `components/navigation/nav-list.tsx` | 6 | **built** |
| R21-13 | **ShareBar** (stacked share bar, with Legend) | `components/display/share-bar.tsx` | 6 | **built** |
| R21-14 | **Admin › Pages › Journeys** | `admin/pages/journeys.tsx`, `journeys.stories.tsx`, `admin/journey-rules.ts`, `fixtures/journeys.ts`, `apps/web/app/admin/journeys` | 7 | **built** |
| R21-17 | **ToggleGroup `segment` never runs past its holder** | `components/inputs/toggle-group.tsx` | 8 | **verified** |
| R21-18 | **Journeys: opening a screen takes you to it** (focus, scroll) | `admin/pages/journeys.tsx`, `journeys.stories.tsx` | 8 | **verified** |
| R21-19 | **DataTable's toolbar controls keep their width** | `components/display/data-table.tsx` | 8 | **verified** |
| R21-20 | **Journeys at a phone: the screens nav sits above the content** | `admin/pages/journeys.tsx` | 8 | **deferred** (George 2026-11-01: phone gets its own adaptive view) |
| R21-21 | **Journeys on the API's shape, from recorded responses** (George 2026-11-01: option a) | `admin/journey-rules.ts`, `admin/pages/journeys.tsx`, `journeys.stories.tsx`, `fixtures/journeys.ts`, `apps/web/features/admin/journeys-data.ts`, `journeys-screen.tsx`, `API-NEEDS.md` A48–A51 | 9 | **built** |

## Step 1 — built (2026-10-31): R21-01, the card surface

The cards George means on People are FilterCardRow (ToggleGroupItem `card` over the shadcn Toggle base, on `cardVariants({ interactive: true })`), not KpiCards; Pulse's KpiCards share the Card surface. The inventory's §5 recommendations, applied:

| What | Before | After |
|---|---|---|
| Card `density` | none | `cardVariants` `density: default · compact`; `compact` is `rounded-md` (10px), `px-4.5 py-4` (18 × 16), `gap-1`. KpiCard and FilterCardRow use it; customer cards keep `default` |
| Edge | `--border` (#d9d9d9) everywhere | `--surface-edge`, the surface model's first context variable (TOKENS.md §4): `--border` by default, `--divider-tint` (#e4eaf5) under `[data-surface="page"]`, which AdminPage's content now declares. Card, DataTable's box and DagFrame's frame read it, so the admin's white surfaces read by their fill. Customer pages unchanged |
| Hover token | `--border-strong` (#9fb1c8) + `shadow-lift` | **`--hairline-strong` #d4d8e4** (the mock's control border; the one new colour) + `shadow-card` at most |
| Rest | `shadow-card` | flat |
| Pressed | `bg-surface-warm` (warm off-white; broke R4-01) | `layer-press` |
| Chosen | brand border + inset ring + `shadow-pop` + label in the info ink + 20px check beside the count | brand border + inset ring only; a 16px check top-right on the label's line |
| Focus (chosen) | the halo on the border, merging with the inset ring | the halo 2px off the border (`ring-offset-2`) |
| Label | 14/500 body ink | `text-xs font-semibold text-muted-foreground` (12/600) — Stat too, so Pulse gets it |
| Value | 24/600, line-height 32 | `font-bold tracking-tight leading-none` — Stat too |
| Heights | the grid stretched short cards to the tallest (18px dead space) | when any card has a description, every card keeps its line's room (`min-h-4`): even by content |
| Item | the base's 36px Toggle restyled class by class | Radix's `ToggleGroup.Item` with `asChild` around a plain `<button>` wearing the compact card (`PRIMITIVE_OK` entry in `check-layers.mjs` with the reason); the `icon` item still uses the base |

Screenshots: `rc-scratch-2026-10-29/react-journeys/before-*.png` and `after-*.png` (People, Pulse, FilterCardRow states, 1440).

**Checks.** `tsc` clean. `npm run check` clean except `check:vocab` 76 (was 75): `density` is not yet a Surface axis in `lib/vocabulary.ts` (ARCHETYPES.md §2 lists Surface as emphasis · tone · fill); the inventory and the brief asked for it on `cardVariants`, so it warns until the axis is agreed. Lint: the 7 baseline problems. `npm test` 277 pass. Plays: 225 / 225 over FilterCardRow, KpiCard, KpiRow, Stat, ToggleGroup, Card, MetricCard, ListPage and the six admin pages (the Partners `label-content-name-mismatch` axe notes are the pre-existing ones).

## Step 2 — built (2026-10-31): R21-02, AdminPage's header slots

| Slot | What landed |
|---|---|
| `breadcrumb` | `BreadcrumbEntry[]`, the levels above the page; AdminPage adds the title (a string) as the current level and draws Breadcrumb (`maxItems={Infinity}`, the app's `linkAs`) over the title. **Deviation from the mock**: the mock's eyebrow is "Admin / Usage" alone; a breadcrumb's last level is the page (`aria-current="page"`, R20-15), so the trail reads "Admin › Usage › Journeys" |
| `meta` | Passed to PageHeader's existing `meta` (muted, semibold, before the actions): the header's right, where Vue's `.rpt-topbar__asof` sits |
| `tabs` | A node under the title. With tabs, the header's region rule moves under them (AdminPage turns PageHeader's row rule off from outside, `[&>[data-slot=page-header]>div]:border-b-0`, and the tabs' wrapper draws `border-b`), so the current tab's bar sits on the one rule. PageHeader itself is unchanged (another template) |

Stories: *Header · trail, meta and tabs* (play: the trail's links and current level, the meta line, one rule) and *Header · trail and meta, no tabs* (the rule stays under the title). Plays: AdminPage + People 14 / 14.

## Step 3 — built (2026-10-31): R21-03 TabsLine, R21-04 ToggleGroup `segment`

| ID | What landed |
|---|---|
| R21-03 | `components/navigation/tabs-line.tsx` (Frame): `TabsLineList` (`as` nav · div, `aria-label` required) and `tabsLineTriggerVariants()` for each tab, in one server-safe file (no state, so no separate styles file as TabsPill needs). 44px tabs, 14/600 muted, the current one 700 strong with a 3px brand bar drawn by `::after` (always present, transparent when not current: no layout shift), `focus-ring`. Links with `aria-current="page"` or Radix Tabs' list (`data-state="active"`, arrow keys). No rule of its own. Stories: *Links · Essential Setup current*, *Keyboard*, *States*, *Panels · arrow keys*, *Phone* |
| R21-04 | ToggleGroup `segment`: the `icon` bar's root (outline, dividers, `rounded-sm`, white) with text items (`h-control-sm`, `px-3.5`, 14/600, muted ink); on = `bg-muted` + the strong ink (George's decision 2); single mode sets `role="radiogroup"` on the root. Stories: *Segment · single*, *Segment · keyboard*, *Segment · states* (hover, disabled) |

**Seen in the browser:** on a white bar the muted fill (#f3f6fc) is a faint signal, fainter than the hover wash on the next segment; the strong ink carries most of the "on". The same is true of the `icon` bar today. Flagged for George, not changed (his decision was the muted fill).

Plays: TabsLine, ToggleGroup, FilterCardRow 29 / 29.

## Step 4 — built (2026-10-31): R21-05 KpiCard caption, R21-06 InsightCard

| ID | What landed |
|---|---|
| R21-05 | Stat `caption?: string` (KpiCard takes it through its Stat props): one muted 12px line, last in the card (so a row's deltas and sparklines stay aligned), truncated with the whole text as its title; a text skeleton while loading; hidden with no data. The metric rule in `src/admin/README.md` now allows the one caption and keeps "no second number" ("14 · 14%" → 14, "14% of those who started"). MetricCard has none. Stories: *Caption · a summary card* (play: the value alone, the caption one line), *Caption · with delta and trend*, *Caption · loading* |
| R21-06 | `patterns/insight-card.tsx` (Surface): `eyebrow`, `title`, `description`, `action`, `tone` attention · info · neutral (`Extract<Tone, …>`); the whole card is a `<button>` (`onSelect`) or a link (`href` + `linkAs`), a discriminated union. The compact Card; attention = `bg-attention-subtle` + `border-warning-border`, the eyebrow in `text-attention-foreground`, the title 18/700, the action phrase in the link ink; hover/press relative, focus `cardFocus`. No `fill` prop (only soft is asked for). Stories: *Attention* (click and Enter), *Info*, *Neutral*, *As a link*, *Focus*, *Hover*, *In a summary row* (two captioned KpiCards and the InsightCard, the Journeys row) |

Plays: InsightCard, KpiCard, KpiRow, Stat, MetricCard, Pulse 80 / 80.

## Step 5 — built (2026-10-31): R21-07…R21-11, the table's marks

| ID | What landed |
|---|---|
| R21-07 | `components/display/meter-bar.tsx` (Chart): `value` (null allowed), `max`, `label`, `valueText`, `showValue`, `color`. A 14px `bg-accent` track and a data-colour fill whose width is one CSS variable (`--meter-fill`, set from a named `CSSProperties`, as Sortable's transform: a measurement, not a design value; `check:tokens`' `style={{` rule is about literals). `role="meter"` with "84 of 101"; with no value it is an image named "…: no value" (axe: a meter must have a value). Stories: *Default* (play: name, value text, fill share), *Bar only*, *Column*, *Colors*, *No value*, *Over the whole* |
| R21-08 | `components/display/range-bar.tsx` (Chart): `low`, `high`, `mark`, `whisker?`, `domain`, `summary`. Box `bg-primary-subtle`, 2px tick `bg-info-foreground`, 1px whisker and cap `bg-border-strong`; values clamped into the domain. One `role="img"` named by `summary`. Stories: *Default* (play: the tick inside the box at the median's share; the whisker stops at the end), *No whisker*, *Column* (with its Legend) |
| R21-09 | `components/display/legend.tsx` (Chart): `items` (`label`, `color`, `shape` block · line · dot, `value?`), `label`, `size` xs · sm. A named `ul`, swatches aria-hidden. Stories: *Default*, *With values (sm)*, *Shapes*, *Phone*. `check:vocab` warns once: `size` isn't a Chart axis (77 warnings, was 76) |
| — | `components/internal/data-color.ts`: the data colours (brand · brand-subtle · brand-ink · attention · neutral · chart-1…5) as fill classes over theme roles, and `percentOf` (clamped share → CSS length). Not exported; the type is re-exported as `DataColor` from MeterBar and Legend |
| R21-10 | Formatted `tone` gains `attention` (`text-attention-foreground`, ink only). Story *Tones* (play: the low rate takes another ink) |
| R21-11 | DataTable `currentRowId`: `aria-current="true"`, `data-current`, and the hover wash held (`data-[current]:layer-hover`). Story *Current row* (play: one current row; a click moves it; the row's own button is the keyboard path) |

Plays: MeterBar, RangeBar, Legend, Formatted, DataTable 39 / 39 (axe clean after the no-value fix).

## Step 6 — built (2026-10-31): R21-12 NavList, R21-13 ShareBar

| ID | What landed |
|---|---|
| R21-12 | `components/navigation/nav-list.tsx` (Item): `items` (`id`, `label`, `count?`, `marker?`, `href?`), `current`, `onSelect`, `label`, `framed`, `linkAs`. Buttons with `aria-current="true"` (a view on this page) or links with `aria-current="page"`; every item tabbable with `pressable`'s ring (a short list, no roving focus). Current: `bg-sidebar-accent`, the sidebar's dark blue ink, 700, a 3px brand bar on `::before`. The marker is a Dot `tone="attention"` with its name, so "Biggest drop" is part of the item's name. Stories: *Default*, *Keyboard*, *States*, *Unframed*, *Links*, *Long label* |
| R21-13 | `components/display/share-bar.tsx` (Chart): `segments` (`label`, `value`, `color`), `label`, `total?`, `legend` (default on). A 14px `bg-track` rounded track, segment widths as `--share`; the Legend (`size="sm"`, dots, counts) under it is what assistive tech reads (the bar is aria-hidden), and without it the bar is an image naming its shares. A zero share stays in the legend. Stories: *Default* (play: widths, legend text), *Four shares*, *No legend*, *Part of the whole*, *Phone* |

Plays: NavList, ShareBar, Legend 17 / 17.

## Step 7 — built (2026-10-31): R21-14, Admin › Pages › Journeys

| Part | What landed |
|---|---|
| Rules | `admin/journey-rules.ts` (pure, tested in `journey-rules.test.ts`, 4 cases): `screenStats` (went on = the next required screen's people over this one's, stopped, share reached; the optional screen and the end have none), `biggestDrop` (lowest went-on; Getting in, 30 of 44), `stopsMost` (three lowest, in screen order: Your people, What they'd need, Getting in), `isLow` (< 75%) |
| Data | `fixtures/journeys.ts`: the mock's nine Setup screens (people, p25/p50/p75/p90 seconds, "what they did next" for the three screens the mock had), the 0–5 min scale, the window and source lines, the three entries |
| Page | `admin/pages/journeys.tsx`: `JourneysToolbar` (Field horizontal "Dates" + Select; ToggleGroup `segment`), `JourneysView` (Flex: NavList `framed` at 240 beside the main column; All = Grid of two compact KpiCards with captions + InsightCard, then DataTable with title, Legend in its toolbar, `pageSize="all"`, no Columns menu, row click and the screen's own button open the screen, "Show all 9 screens" / "Show only where people stop most"; a screen = Card with the Biggest drop Badge, Split heading + reached line, three facts on the recessed card, ShareBar, "See who stopped here"), `JourneysMixpanelLink` (secondary Button as a link, new tab) |
| Stories | `journeys.stories.tsx`: *All screens* (play: nav, trail, tab, Mixpanel link, summary count, three rows, show all, the InsightCard opens the drop), *A screen · the biggest drop* (play: badge, stopped line, legend, People link, back to All), *A screen · optional*, *All screens · every screen*, *Loading*, *Empty (nobody started)*, *At 1280*, *At 1440* (play: the summary is one row; the table doesn't scroll sideways), *A screen · at 1440*, *A screen · at 1280* |
| App | `/admin/journeys` (`app/admin/journeys/page.tsx`, `features/admin/journeys-screen.tsx`): the same composition with the screen and show-all in the URL (`?screen=…&all=1`, `router.push`, so back walks the views); `AdminScreen` passes the three new slots through. `adminNav`'s Journeys entry already pointed at `/admin/journeys`; the route now exists (`next build`: `○ /admin/journeys`) |

**Deviations from the mock, on purpose.** Durations in the package's words ("8 s", "2 min", not "8s", "1m 43s"); the "Dates" label is a Field label (the eyebrow); the trail ends at the page ("Admin › Usage › Journeys"); the segmented control's chosen segment is the muted fill (George); labels 12px not 11; the header sits on the page surface, not a white band; the source line is the header's `meta`, not at the end of the filter row; "Slowest 10%" is a fourth legend entry because the whisker is drawn. The summary's second card reads "14" with "14% of those who started" (decision 1), not "14 · 14%" and "saw What you've put in place". The screen trio is a small composition with Stat's type (label 12/600, value 24/700, a caption) rather than Stat: Stat's `MetricFormat` has no duration and `lib/metrics` can't import `lib/format-kind` (it would be a cycle).

**Not wired, and said so.** Sign-up and First things in the Vault have no data: their tabs link to the same route (story: switch only the tab). The dates and the entry change nothing yet (local state, no data per window or entry). "See who stopped here" carries `?stoppedAt=<screen>`, which People doesn't filter by yet (API-NEEDS). Copy invented for the page (the empty state's title and line, "Show only where people stop most" kept from the mock) is for Product to confirm. DataTable `currentRowId` (R21-11) is built and tested but this page never shows the table and a picked screen together, so it doesn't use it.

Checks: `tsc` clean (ui + web); `npm run check` clean (vocab 77); lint baseline 7; `npm test` 281 pass; plays: all admin stories and AdminPage 94 / 94; `next build` passes (it printed a Next.js security-upgrade notice and stopped once after compiling; a retry completed — see the hand-off).

## Step 8 — walked (2026-11-01): phone width and keyboard only

Lane 2 walked *All screens*, *A screen · the biggest drop* and the optional screen in Storybook (6107) at 375 × 812 and keyboard only. The admin site is desktop-first, so the bar at 375 is "nothing breaks and nothing is unreachable", not a phone layout.

**What held.** No page-level sideways scroll (the table scrolls inside its own box, as DataTable does everywhere). Tab order follows the page: sidebar toggle, account, the trail, Open in Mixpanel, the three journey tabs, Dates, the segment (one stop, arrows inside), the ten nav items, the InsightCard, each table row's screen button, Show all. Every stop shows its focus (the gapped ring, the select's halo, the InsightCard's halo). The screen card at 375 is clean: the trio stacks, the ShareBar and its legend fit.

| ID | What failed | Fix |
|---|---|---|
| R21-17 | The segment bar ("Everyone · Signed up · 100 · Came back · 52", 373 px) ran 14 px past the 343 px content at 375: "Came back · 52" was cut off | `segment` root `max-w-full items-stretch`; items 8 px sides under `sm` (14 px from `sm`, unchanged on desktop), and as a last resort they shrink and wrap their text (`whitespace-normal`, `min-h-control-sm`) so the bar grows taller instead of overflowing. At 375 it now fits on one line |
| R21-18 | Opening a screen from a table row's button or the InsightCard unmounted the control that had focus: focus fell to `<body>`, so a keyboard user started again from the top. From the nav at 375, the card opened under the ten nav items (its top at 745 of 812): the tap seemed to do nothing | When the view changes to a screen: if focus fell to the body, the screen's heading takes it (`tabIndex={-1}`, `focus-ring`, like ErrorSummary); otherwise (the nav kept focus) the card is scrolled into view (`block: "nearest"`, so nothing moves on desktop where it is already in view; `scroll-mt-bar` clears the sticky 56 px bar). A deep link (the first render) moves nothing |
| R21-19 | At 375 the table's key (Legend in DataTable's `toolbar`) squeezed into a 90 px column beside "Where people stop most", every label wrapping | DataTable's toolbar slot is `grow` (its own width as the basis), not `flex-1` (basis 0): when the controls don't fit beside the title they drop under it as a whole. Desktop is unchanged (they fit, and grow into the rest of the row) |

**Proposed, not built (R21-20).** At 375 the screens NavList (ten items, ~540 px) comes before the summary and the table, so the page's point is a long scroll away. Options: (a) under `md`, the nav becomes a Select labelled "Screen" above the main column (recommended: one control, the same choices, and the screen card is then right under it); (b) the main column first, the nav after it (source order changes, so keyboard order does too); (c) leave it — the admin site is desktop-first. **Deferred** (George, 2026-11-01): phone is little used, and when it comes it is *adaptive*, not responsive — a separate phone view per surface, not this page reflowed. So no phone layout work here; R21-17…19 stay because they only stop things running off the page.

Stories: *At 375* (play: the toolbar, the segment and the table's toolbar inside the page; the legend's labels on one line each) and *A screen · at 375* (play: picking the biggest drop from the nav keeps focus on the nav and brings the card into the top half of the viewport); *All screens*' play now checks the heading has focus after the InsightCard opens the screen.

Checks: `tsc` clean (ui + web); `npm run check` clean (vocab 77, unchanged); lint the 7 baseline problems; `npm test` 281 pass; plays over Journeys, ToggleGroup, DataTable, AdminPage and the list pages 101 / 101 (the Partners `label-content-name-mismatch` axe notes are the pre-existing ones).

## Step 9 — built (2026-11-01): R21-21, real responses instead of the mock's numbers

George chose (a) of Lane 2's data proposal: record real `GET admin/usage/journeys` responses from the local stack and put the page on the API's shape, before the spike has an API module of its own (Lane 4 is building that).

| Part | What landed |
|---|---|
| Recordings | 16 responses from the RC API (Lane 3's phase 2, 1c868aa0b) as the local operator, GETs only, aggregates only: Sign-up, Essential Setup and First things in the Vault × all time, the last 7 days and the last 30 days, and Setup by each entry the API lists in that window. `fixtures/journeys.ts` is generated from them, trimmed to the fields the page reads; the mock's invented funnel is gone. The recorder and generator are in the Lane 2 hand-off notes |
| Types | `journey-rules.ts` types are a structural subset of the response (`JourneyUsage`, `JourneyTask`, `JourneySpread`, `JourneyEdge`, `JourneyEntry`, `JourneyOption`), so the app passes the response straight in (R13-02); `JourneyScreen` and the fixture-only `time`/`people`/`id` shapes are gone |
| Rules | Went on is **edge-based** now (a task's next = the tasks its edges lead to that aren't optional; on a branch every next task is required, so the one fewest people reached is the measure), so Sign-up's branch, an Area's essentials and First things' two roots work; a drop needs someone to have stopped (one person who went all the way has none); it is capped at 100% and stopped at 0, because `reached` isn't monotonic on real data (Your people 95 after About you 94: people resume past a screen). **Not** `edges[].continued`: it counts people who *completed* this task, and most tasks never show completed on today's events, so it read 6 of 106 going on from Welcome. `nextOf` folds the API's `next` keys into on · back · elsewhere · left · other with words (unknown keys are "other", shown as sent); `timeDomain` picks the time scale from the slowest 10% (30 s steps up to an hour), null when nobody was timed; `entryLabel` words the entries; `journeyRanges` + `fromForRange` turn All time / Last 7 days / Last 30 days into `from`. 10 node tests on the recorded counts |
| Page | `JourneysView` takes `usage` (null while loading or after an error) and gains an `error` state (Callout, Try again) and the no-event-store state (`eventsAvailable: false`: an info Callout above the zeros). A task nobody was timed on shows "—" in the time column and "nobody timed" in its card; the card says how many were timed. The segment is "Everyone · n" plus each entry with its count, and is hidden for a journey with no entries. "Started" / "Reached the end" read `people` / `reachedEnd`. "Open in Mixpanel" is not rendered (Mixpanel is off until phase 4); the component stays for then |
| App | `/admin/journeys` keeps everything in the URL (`?journey&range&entry&screen&all`; a new journey, window or entry drops the screen). Data comes through `features/admin/journeys-data.ts` `loadJourneyUsage(query)`, the one function Lane 4's API module replaces; null (not recorded) shows the error state. The tabs are named in the screen (the API's journeys with no group) so they draw before the numbers land |
| Stories | *All screens*, *A screen · the biggest drop*, *A screen · optional*, *All screens · every screen*, *One way in · signed up* (play: the segment answers from that entry's recording), *Sign-up · a branch, no entries* (play: no segment, every task), *First things*, *Tabs · switch journey* (play), *Loading*, *Error* (play), *Empty (nobody started)*, *No event store* (play), the phone, 1280 and 1440 ones. The zeroed states are built from a recording in the story |

**Found on the real data, for Lane 3** (API-NEEDS A48–A51): Setup's entries are `signup` · `existing` · `resumed` (the doc said `resumed`; `existing` is new), and Setup's `next` has `navigate`, which isn't in the spec (A50, the closed lists); `from` with no end (A48); no `asOf`, and is anyone excluded from the counts (A49); People's "stopped at" filter (A51). `edges[].continued` is right by its definition but not usable as "went on" until completion is recorded for most tasks.

**Words for Product** (invented here, not from the prototype): the entry words ("Had an account", "Not known"), the next words ("Went on", "Went elsewhere in Paige", "Left it", "Left Paige"…), "Started" with "people reached {first screen}", the error copy, "This host keeps no events".

Checks: `tsc` clean (ui + web); `npm run check` clean (vocab 77, unchanged); lint the 7 baseline problems; `npm test` 287 pass; plays over Journeys, ToggleGroup, DataTable, AdminPage and the list pages 102 / 102 (one earlier run failed while Storybook re-indexed mid-edit; Journeys then passed 18 / 18 twice); `next build` passes. Walked `/admin/journeys` on `next start` (port 3117): an entry deep link, the dates and the entry update the URL and the numbers, the tab links keep the window, a combination not recorded shows the error state, a screen deep-links and Back returns to it.

**Setup has no entry segment** (George 2026-11-01, via Lane 3's 5d1f89200: "Came back" was 0 in every window under the query layer's rule; coming back to Setup becomes a Getting around question). The page needed no change, since it hides the segment when `entries` is empty. The recordings were re-made against the restarted RC API: 9 responses, everyone only, `entries` empty. The *One way in · signed up* story went, *All screens* now checks there is no segment, and the Setup words (`signup`, `existing`, `resumed`) left `ENTRY_WORDS`. The Areas keep a segment (`not-started` · `in-progress` · `set-up`), which the toolbar still draws when a response has entries; no recording covers it until the Areas tab is built. Checks: `tsc` clean, `npm run check` clean (vocab 77), lint baseline 7, `npm test` 287, Journeys plays 17 / 17.

## Not done, on purpose

- **Sankey** (George, decision 4).
- The interactive Card's own hover (`border-strong` + `shadow-lift`, R15-13) is unchanged: the brief named FilterCardRow's states; a link card on the admin page still lifts.
- Panel and Chart's frames are Cards already and follow; nothing else moved to `--surface-edge`.

## Decided

- **`--surface-edge` stays** (2026-10-31; George left the call to Claude). One context variable on the surface model, pointing at existing colours only, rather than each component carrying its own admin border: the admin's white surfaces read by their fill, and a new surface needs one rule, not one per component. It is the surface model's first context variable (TOKENS.md §4); the next one follows the same shape.

- **R21-15 · The chosen segment and icon toggle read stronger than hover** (2026-10-31). `bg-muted` (#f3f6fc) was fainter than the hover wash on the next item, on the `segment` bar and the `icon` bar alike. Both bars' chosen item is now `bg-divider-tint` (the hairline tint, #e4eaf5) with the strong ink: still the muted family George chose, one step darker. Hover is unchanged (the relative wash, R4-01). Screenshots: `rc-scratch-2026-10-29/react-journeys/after-seg-hover.png`, `after-icon-bar.png`.
- **R21-16 · Next.js 16.4.0 → 16.4.3** (2026-10-31). `npm audit` rated 16.0.0–16.4.0 critical: unauthenticated remote code execution in the Image Optimization API with SVGs (GHSA-2464-fhr4-w9xw) and in `use cache` returning typed arrays (GHSA-673q-mjm6-r5xr), and a Server Actions denial of service (GHSA-p3m5-59mp-jv5r). A patch release. The lock was regenerated in `node:24` on Linux (`--package-lock-only`; Windows npm drops platform packages) and installed with `npm ci`.
