# Review 9 — admin background, round-9 gaps, DAG v1 (opened 2026-10-19)

George: make the admin background the standard off-white (a shade darker, still matching); close the gaps; start the DAG as a v1, with a quality reference for the frame and what it should do. Structure and design-system calls are delegated to Claude until the walk. Same rules as earlier rounds (held list, IDs `R9-nn`, statuses → built → verified, plus deferred).

## A. Admin background

| ID | Item | Take | Status |
|---|---|---|---|
| R9-01 | Admin content background: the standard off-white, a shade darker than white, matching the palette | One theme token `--surface-page` (the off-white step between white and `--surface-muted`, in the same blue-white family, e.g. `#f7f9fc`; pick the value that matches and record it). AdminPage's content area uses it; cards, tables and charts stay white on top; the sidebar becomes white with a 1px border so it still reads apart from the content. Customer pages are unchanged | **built**. Built: `--surface-page: #f7f9fd` (theme.css layer 1, `bg-surface-page`): hue 220°, the same as `--surface-muted` (#f3f6fc) and `--paige-blue-bg`, lightness 98.0% between muted's 97.1% and white's 100%, so it reads as the same blue-white family one step lighter than the band. AdminPage's content area uses it; `--sidebar` is white and keeps upstream's 1px `border-r`; Card, DataTable, Chart and GraphFrame are white surfaces on it; customer templates untouched. Seen in Storybook (Admin › AdminProof); the screenshot on `/admin` is still to take (see Verification) |

## B. Round-9 gaps

| ID | Gap | Take | Status |
|---|---|---|---|
| R9-02 | [#107] The unsaved-changes guard misses the browser's back/forward | Catch `popstate` in the app router (Next App Router navigation events) while the form is dirty; confirm before leaving; restore the URL if the user stays | **built**. Built: in Form, not the app. popstate can't be cancelled, and on `window` listeners run in the order added (checked in Chrome: a capture listener added later still runs after an earlier bubble one), so Next's handler can't be pre-empted. Form keeps a guard history entry while dirty (same URL, Next's state, a flag): Back lands on the same page, which Next restores in place, then asks; No pushes the guard back (URL unchanged), Yes goes back for real. Story Forms › Form › "Unsaved changes: Back asks" drives real `history.back()`. Costs in GAPS #114 |
| R9-03 | [#108] AdminSidebar's nav list is hard-coded | Nav as data: one typed `adminNav` definition (sections, items, icons, href, optional badge) the sidebar renders; routes check against it | **built**. Built: `admin/admin-nav.ts` (`adminNav` as const, `AdminNavId` derived from it, `adminHref`); AdminSidebar renders it; `admin-nav.test.ts` checks unique ids and hrefs, everything under /admin, and that every `apps/web/app/admin` route is in it; the app's logs link uses `adminHref("jobs")` |
| R9-04 | [#109] AccountMenu trigger: visible initials don't match its accessible name (axe label-content-name-mismatch) | Accessible name starts with the visible text ("GO, account menu for George Olson") or the initials are hidden from the name and the photo/initials carry `aria-hidden` with a proper label on the button; pick the axe-clean pattern | **built**. Built: name = "GO, account menu for George Olson" (initials first, also with a photo, since the fallback shows them while it loads or if it fails). `aria-hidden` on the avatar was rejected: axe's rule compares the text on screen, not the exposed text. axe on Shell › AccountMenu (photo and initials) and on the admin proof: no violations |
| R9-05 | [#110] `ui:add` stalls when the shadcn CLI prompts to overwrite | `ui:add` runs the CLI non-interactively (`--yes`, no overwrite of existing Paige-edited files; report a would-overwrite instead of prompting) | **built**. Built: `--yes --overwrite` (never a prompt), then every existing base and theme.css is put back and listed as a would-overwrite (`ui:add sidebar`: button, input and separator differ from today's registry; theme.css's hsl and `.dark` variables listed); `--replace-existing` takes the registry's version on purpose. That test run broke `node_modules` with the dev servers running (GAPS #111); `ui:add` now refuses while 6106 or 3105 answers |

## C. DAG v1 — the frame is the quality bar

**What the frame must do** (the reference: React Flow's viewport model, and the run graphs in Dagster, Airflow's Graph view, GitHub Actions and Argo Workflows — the behaviours they share are the bar; we take the behaviour, not their look):

| Area | Behaviour |
|---|---|
| Opening view | Fits all nodes on load with padding. Keeps fitting when the container resizes, until the user pans or zooms. Zoom limits 25%–200% |
| Page scroll | **Never hijacks the page's scroll.** A plain mouse wheel scrolls the page; zoom is Ctrl/⌘ + wheel or pinch; inside the frame, drag on the background pans |
| Controls | Bottom-left: zoom in, zoom out, fit to view, reset. A minimap only when the graph is larger than the frame (above ~25 nodes). A full-screen toggle |
| Keyboard | The frame is one tab stop; arrows pan, `+`/`−` zoom, `0` fits; Tab moves between nodes in dependency order; Enter selects; Escape clears the selection |
| Layout | Automatic and deterministic (same graph → same picture), left to right by default (top to bottom as an option), ranked by dependency. A status change never re-lays out the graph or makes it jump |
| Nodes | Fixed width; name (truncated with a tooltip), status (the StatusDot tones: queued, running, succeeded, failed, skipped, cancelled), duration; selected state; running nodes animate only without reduced motion |
| Edges | Routed with rounded right angles and arrowheads; when a node is selected, its upstream and downstream paths highlight and the rest dim; a failure's downstream path is marked |
| Selection | Clicking a node opens its details in a side panel inside the frame (status, timings, logs link, inputs/outputs); the selection is in the URL so it deep-links; Escape closes |
| States | Loading skeleton, empty ("Nothing has run yet"), error with retry; a legend for the status colours |
| Live updates | Statuses update in place with a short transition; new nodes appear without moving existing ones where possible |
| Accessibility | A **list view** toggle shows the same graph as an ordered table (step, status, depends on, duration), the screen-reader path and the fallback for large graphs; the frame has a text summary ("12 steps: 9 succeeded, 1 failed, 2 skipped") |
| Scale | Smooth at 200 nodes; no virtualisation in v1 |

| ID | Item | Take | Status |
|---|---|---|---|
| R9-06 | DAG frame v1 (`GraphFrame`) | Build the frame above as a generic component in `charts/` (lazy entry, never on customer pages), on **@xyflow/react** (React Flow, MIT) for the viewport and **@dagrejs/dagre** (MIT) for the layout, both pinned and audited. Our own controls, nodes and edges in Paige styling; React Flow's defaults hidden. Stories: small, medium and 200-node graphs, every state, selection, list view, live-update simulation | **built**. Built: `charts/graph-frame.tsx` (+ `lazy-graph-frame.tsx` for pages, `graph-status-mark.tsx` without React Flow, `internal/graph-model.ts` tested under node, `graph-frame.css`); `@xyflow/react` 12.12.0 and `@dagrejs/dagre` 3.1.1, exact, MIT, `npm audit` 0 vulnerabilities. charts/ became its own tier above components so the frame can use Button, Tooltip, DataTable, Skeleton and Message (check-layers TIERS, CLAUDE.md). Row by row below |
| R9-07 | Jobs pipeline graph (domain) | `PipelineGraph` in `admin/` built on GraphFrame: pipeline steps as nodes, step statuses and durations, the run-details panel. The Vue admin's `features/admin-jobs` (PipelineGraph, PipelineStepNode, PipelineLegend, PipelineRunView, layout.ts) is the needs list, not the design. Shown on the admin proof page with a realistic run fixture | **built**. Built: `admin/pipeline-graph.tsx` on LazyGraphFrame, typed by the run-detail shape; a still-running nightly run (11 steps: a failure after 3 attempts, its downstream "Won't run", two running with the time left from the median, two waiting); panel: status, started, finished, duration, usually, attempts, kind, queue, depends on, description, the error, a logs link. On Admin › AdminProof and `/admin` (the step in `?step=`). No inputs/outputs: not in the contract (GAPS #112) |
| R9-08 | Out of v1 | Collapsing groups/sub-graphs, editing (drag to connect), export to image, virtualisation for very large graphs; Sankey stays deferred (R8-12) | deferred (Claude, delegated, 2026-10-19) |

## R9-06 against the frame table (built 2026-10-19)

| Area | Met? | Note |
|---|---|---|
| Opening view | yes | fitView on load (padding 24px, 72px on the left to clear the controls, never above 100%), refit on every resize (ResizeObserver) and when the graph grows, until a drag or zoom actually moves the view (a click on a node doesn't count). 25%–200%. Below about 600px of canvas a wide graph clamps at 25% and clips (GAPS #115) |
| Page scroll | yes | zoomOnScroll, panOnScroll and preventScrolling off; Ctrl+wheel and pinch zoom (React Flow's pinch path), ⌘ through its zoom activation key. Play "Wheel scrolls the page; Ctrl + wheel zooms": a plain wheel event is not cancelled and the transform doesn't change; Ctrl+wheel is cancelled and zooms. Background drag pans. By hand on /admin: not done yet (Verification) |
| Controls | yes | Our buttons bottom left (zoom in, zoom out, fit, reset = fresh layout, fit, auto-fit back on); full screen in the header (Fullscreen API on the frame); MiniMap only above 25 nodes |
| Keyboard | yes, one reading | The canvas is the one tab stop; arrows pan, + and − zoom, 0 fits; Tab and Shift+Tab walk the nodes in dependency order (Tab after the last node leaves the frame, Shift+Tab from the first returns to the canvas), Home/End jump; Enter opens; Escape closes and keeps focus on the node. "One tab stop" and "Tab moves between nodes" conflict if read literally; read as one stop from outside, Tab walking inside. Play "Keyboard" |
| Layout | yes | dagre LR (TB option), ranked by dependency, deterministic (tested); re-runs only on a shape change (ids, dependencies, direction), never on a status; new nodes are placed without moving existing ones (tested) |
| Nodes | yes | 240×72; name truncated with a Tooltip (names over about 24 characters); status mark (queued, running, succeeded, failed, skipped, canceled: en-US spelling, R5-01); duration; selected ring; the running mark and the edge into it animate only without reduced motion |
| Edges | yes | smoothstep with 10px corners, our arrowheads; a selection lights upstream and downstream and dims the rest; a failure's downstream path is dashed in the attention colour. Dimmed nodes use the muted card and ink, so their text keeps 4.5:1 |
| Selection | yes, but inputs/outputs | Panel inside the frame (`renderDetails`); controlled `selectedId`/`onSelect`; the app writes `?step=` with router.replace; Escape closes. Inputs/outputs aren't in the contract (GAPS #112) |
| States | yes | Loading skeleton, empty "Nothing has run yet", error with "Try again", the legend ("Status key") |
| Live updates | yes | In place, 200ms transitions (none under reduced motion); Live stories on GraphFrame and PipelineGraph |
| Accessibility | yes | List view (DataTable: #, name, status, depends on, duration; the names open the panel); the summary in the header (role=status) and in the canvas's name. axe clean on the GraphFrame and PipelineGraph stories after three fixes (pressed-toggle ink, attribution ink, label-in-name spacing) |
| Scale | yes, Storybook only | 200 nodes render and pan without visible lag in Storybook (memoised nodes and edges); not profiled |
| Attribution | kept visible | The MIT licence allows `proOptions.hideAttribution`, but React Flow's own type docs ask "If you hide the attribution, please support our work with a subscription", and Paige isn't a Pro subscriber. So it stays, muted at 11px bottom right (graph-frame.css) |

**Verification.** Done: typecheck (both workspaces), `npm test` 171/171, check:tokens 0, check:layers 0, check:exports 0, catalog; every new play passing and axe clean in the running Storybook. **Not done:** `npm run build`, `build-storybook`, the Next bundle check (React Flow and dagre only in /admin's lazy chunk), and the by-hand checks on `/admin` (wheel, Ctrl+wheel, fit, selection, list view, the off-white screenshot). `node_modules` was stripped during the R9-05 test (GAPS #111) and can't be repaired while Storybook and the app hold its files. To finish: stop both, `npm install` (lock file unchanged), start them, run those checks.

## Verification by Claude (2026-10-19, after the build)

The building agent broke the shared `node_modules` by running the shadcn CLI while both dev servers ran, and its repair install failed because an orphaned `next start -p 3125` (left by an earlier agent's check) held Next's native binary. Recovered: stopped both servers (Claude's terminal tabs) and the orphan, `npm ci` from the unchanged lock file (0 vulnerabilities), restarted both. `ui:add` now refuses while 6106/3105 answer (R9-05).

| Check | Result |
|---|---|
| Typecheck, tests, checks | 0 type errors; 171/171 tests; `check:tokens` 0 (Paige code), `check:layers` 0, `check:exports` 0 (95 entry points) |
| Production build | `next build` passes |
| Bundle | The graph code (React Flow, dagre) is referenced only by `/admin`; `/`, `/area/[area]`, `/setup/about-you` reference none of it |
| Plain wheel over the graph | Page scrolled 300px; the graph viewport did not change |
| Ctrl + wheel over the graph | Zoomed 55% → 73%; the page did not scroll (checked with a synthetic Ctrl-wheel event: the browser pane's scroll tool drops the Ctrl modifier) |
| Selecting a step | "SendGrid contacts" (failed): outlined, failure path dashed to the "Won't run" steps, unrelated steps washed out, details panel (status, started, finished, duration, usual duration, attempts, kind, queue, depends on), URL `?step=sendgrid-contacts` |
| List view | Toggle replaces the graph with an ordered table: `# \| Step \| Status \| Depends on \| Duration`, 11 rows |
| Admin background | Content area `#f7f9fd` (`--surface-page`), cards white |
