# Review 14 — toggle group, icons foundation, checks on round 13 (opened 2026-10-20)

George's notes while round 13 builds. Same rules as earlier rounds: a held list, IDs `R14-nn` never reused, statuses → built → verified, plus deferred; walked item by item at the end. Structure calls are delegated to Claude until the walk.

## Checked in the browser (Claude, 2026-10-20, after round 13)

| Check | Finding |
|---|---|
| R14-04 nested popovers | Filters popover open → open "Any plan" (2 popovers) → pick an option (stays open, 2) → click elsewhere inside Filters (child closes, 1) → click outside on the page (**Filters does not close**, 1). So one click-away closes the inner list but nothing closes the outer one except Apply/Reset/Escape: the "weird to dismiss" feeling |
| R14-10 labels | Every filter label is linked to its control (`for=`), so clicking the label opens the dropdown, and each label spans the full 386px row: the oversized hit area |
| R14-05 date pickers | The calendar's month and year are native `<select>`s ("Choose the Month", "Choose the Year") from the day-picker library's dropdown caption |

**Recommendation, now firm (R14-04, R14-06, R14-10 together):** no popover inside a popover. The Filters popover shows each filter's choices inline (a short checkbox list per filter; date ranges as presets plus an inline calendar on demand), labels are plain text, and the popover closes on click-away and Escape like every other popover, **applying live** (each pick updates the table and its chip at once, as GitHub's and Linear's filters do), so there's no Apply button and nothing pending to lose on click-away; Reset becomes the chips row's Clear all. Pages with more than ~5 filters use a side Sheet instead. Standalone MultiSelect keeps its own popover.

## A. Toggle group

| ID | Note | Take | Status |
|---|---|---|---|
| R14-01 | Memories and Messages have a view selection with icons, where ToggleGroup fits | A ToggleGroup view switch (icon + tooltip per option, one of many) for the Memories/Messages view selection; story with the real options from the Vue app's views | open |
| R14-02 | ToggleGroup needs a look: white background on white with no border; the border should stay strong when an item is disabled, except in the spaced variant | Joined ToggleGroup gets one outer border in the border colour and dividers between items, visible on white; the pressed item uses the accent fill; a disabled item dims its own content but never the shared border or dividers; the spaced variant (separate items) keeps per-item borders that dim with the item | open |

## B. Icons foundation

| ID | Note | Take | Status |
|---|---|---|---|
| R14-03 | Icons in Foundations: guidelines for menus and which icons to use. Different places use different sets (people usually have an avatar). Multiple sets are fine, but only if they're consistent; otherwise it looks random. Add the known icons with guidelines: these are for menus, these for heroes, these for … | A Foundations › Icons page and a short rule set in CLAUDE.md: an inventory of every icon in use (lucide, the area glyphs, status marks, View icons, brand marks), grouped by **role** with one set per role (e.g. menus and buttons: lucide at 16px, stroke 2; navigation: lucide at 20px; heroes and empty states: the larger illustrative set; Areas: the area glyphs only; status: StatusMark only; people: an Avatar, never a generic person icon where a person is meant). Each role: size, stroke, colour token, when to use, and a named icon per common action (edit, delete, add, export, settings, sign out…) so the same action always has the same icon. Audit the package against it and fix the strays | open |

## C. Checks on round 13, when it lands

| ID | Note | Take | Status |
|---|---|---|---|
| R14-04 | The multi-select inside the filter popover makes it awkward to dismiss just one open thing. Close on select and reopen for the next? Or the requirement was wrong | Check it in the browser. Likely cause: a popover inside a popover (MultiSelect inside Filters), where one click-away closes both or neither. Recommendation to weigh with R14-06: inside the Filters popover, show each filter's options **inline** (a checkbox list per filter) rather than as a second popover; standalone MultiSelects keep their popover and stay open for several picks, closing on click-away or Escape | open |
| R14-05 | All date pickers: use our standard dropdown instead of the native one | The calendar's month and year pickers render as native selects today (the day-picker library's default). Supply our Select for those captions so every date picker uses the standard dropdown; touch keeps the native date input as a whole (R3-16) | open |
| R14-06 | The filter popover's direction may be wrong, unless it's backdropped, catches clicks and handles the second layer of popovers differently (one option, not a decision) | Options: (a) no second layer: inline options inside one Filters popover (pairs with R14-04); (b) a filter **Sheet** from the side for many filters; (c) a backdropped popover that owns its children's popovers. Recommend (a) for up to ~5 filters and (b) when a page has more; never popover-in-popover. Decide after checking R13-06 in the browser | open |

## E. More notes (2026-10-20)

| ID | Note | Take | Status |
|---|---|---|---|
| R14-09 | Do any of our reference styles use a "scroll for more" or scroll indicator? | Neither the Vault prototype nor the old Vue app has one (checked: no scroll shadows, fades or hints). Mature systems do: Polaris and Atlassian draw a soft **scroll shadow** on the edge that has more content, and horizontal tables often add a fade. Recommend a CSS-only scroll shadow (background-attachment trick, no JS) as an option on scrollable regions, most useful for horizontally scrolling tables and long panels | open |
| R14-10 | Clicking a label in the Filters popover shouldn't open its dropdown: it breaks click-away, and the hit area is far too big | A filter's label is text only (not a trigger, not wrapping the control); only the control itself opens; the clickable area is the control's own box. Ties to R14-04/R14-06 | open |
| R14-11 | The checkbox is a circle, which is strange: the standard should be square, with a circle variant, or it'll be misused | Checkbox is square (small radius) by default; a `shape="circle"` variant exists for the places that mean "pick" rather than "check" (e.g. ChoiceCard's corner tick); audit current uses so tables and lists use the square one | open |

## D. Future (not now)

| ID | Note | Take | Status |
|---|---|---|---|
| R14-07 | ButtonGroup: a single, consistently named disclosure button such as "Actions" | A future `ActionsButton` (one button labelled "Actions" with a caret, opening the typed Menu) used everywhere a page or table has secondary actions; ButtonGroup base comes with it (needs the servers stopped, like R13-19) | deferred (George, 2026-10-20) |
| R14-08 | Every DataTable should in theory have an export button | Export on DataTable (CSV of what's shown by default; more formats and "all matching" via an API export endpoint, noted in API-NEEDS.md); placement next to Columns | deferred (George, 2026-10-20) |

## Reference: Cloudflare analytics header (George, 2026-10-21; awareness only, no change yet)

Very like our admin list and metric setup. Our KPI cards and our wording are better. What it does that we may want to reuse when the matching items come up:

| What | Where it would land |
|---|---|
| Icon-only **⋯** disclosure button at the end of the toolbar, same height as its neighbours | R14-07 (the Actions button, deferred): weigh ⋯ with a tooltip and aria-label ("More actions") against a labelled "Actions" button |
| Tabs as a segmented control: muted track, the chosen tab a white raised piece | The page-level Tabs look when Tabs is next touched; it matches the white-and-raised chosen state picked for filter cards (R15-13, C) |
| A smaller, denser filter bar: **Add filter** with a count badge, a date range button, a "Filters" row of removable chips ("Referrer equals app.go-paige.com ×") and **Clear all** | R14-04/06/10 filter rework: the chips row with Clear all is already the recommendation; add the count badge on the Filters button and consider the smaller size |
| Sparkline running edge to edge along the card's bottom | Note only; ours sits inside the padding |
