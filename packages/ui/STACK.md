# The stack: one tool per job

The runtime libraries `@paige/ui` speaks to, what job each does, who imports it, and the tools it keeps out. Opened 2026-10-31 at George's ask before the data grid round (REVIEW-20 Round D): *"now is the time to make sure we have the right tools that don't clash with each other."* The ledger is the rule; `npm run check:deps` holds it (a new runtime dependency needs a row here; a tool from the Excluded column fails the check; the families that must resolve to one version are listed in § 4).

How to read it: **Job** is the thing a screen needs done; **Tool** is the one library that does it; **Who** is every non-story file that imports it (`rg` on 2026-10-31); **Excludes** is what the same job would otherwise bring in — through a registry item, a demo, or habit — and is therefore out; **Note** is the version call.

## 1. Runtime, by job

| Job | Tool | Version | Who | Excludes | Note |
|---|---|---|---|---|---|
| Accessible primitives (menus, dialogs, popovers, toggles, tooltips, collapsibles, radio, switch, select, tabs, slots) | `radix-ui` (the one meta-package) | 1.7 → latest 1.8 | `src/base/*` (31 files); Paige code reaches Radix only through a base, except `Slot` in `button.tsx` and `sortable.tsx` (`PRIMITIVE_OK`) | `@base-ui/react` (I-02: a registry item on Base UI is **re-based** on Radix at Conform, never installed — Timeline and Sortable did this), `@headlessui/react`, `react-aria-components`, any single `@radix-ui/react-*` package beside the meta-package | One primitive library; every overlay, menu and toggle inherits the same focus, dismissal and portal behaviour. Bump with `ui:diff-base`. |
| Command palette / typeahead list | `cmdk` | 1.1 | `base/command.tsx` → Combobox, HeaderSearch, PersonPicker, AddressField | `downshift`, `react-select` | Radix-based under the hood; one list-with-keyboard. |
| Calendar grid | `react-day-picker` | 10.0 | `base/calendar.tsx` → DateField, DateRangeField | a second calendar; **`date-fns` directly** (it arrives with the picker; our dates are `lib/dates.ts` on `Intl`, R5-01) | The only reason `date-fns` is in the tree. Never import it. |
| Toasts | `sonner` | 2.0 | `base/sonner.tsx`, `components/feedback/toast.tsx` | `react-hot-toast`, Radix Toast, shadcn's Base UI `toast` | Named Toast, not Sonner (R19-05). `next-themes` rides along for the base's theme prop only. |
| Theme switch for the toaster | `next-themes` | 0.4 | `base/sonner.tsx` | — | Only the base uses it; the package has no dark theme yet. Drops when the base stops wanting it. |
| Tables: model, sorting, filtering, pagination, selection, visibility, pinning, resizing, ordering, expansion, faceting | `@tanstack/react-table` | 9.3 (was 8.21; D-11, moved 2026-10-31) | `components/display/data-table.tsx` | AG Grid, MUI DataGrid, Glide, ReUI's `data-grid` as a dependency (it is a **reference** in Round D, not a part we install) | v9 went stable 2026-08-04 (9.3.1 on 2026-10-12); v8 is the previous major. Our surface on v8 is one file and ten names, and Round D rewrites that file, so the move was made **before** the grid grows, not after (`useTable` + `tableFeatures`; `Row extends object`, which is v9's `RowData`). v9: `useTable({ features: tableFeatures({…}), columns, data })` with tree-shaken feature slots, store-backed state (`table.state`, `table.Subscribe`), `table.FlexRender`, and `createTableHook` with typed cell components (`TextCell`, `NumberCell`, `DateCell`, `CurrencyCell` — the column `type` of R20-21/R20-23 is this, over `lib/format-kind.ts`). `@tanstack/react-table/legacy` (`useLegacyTable`, the v8 `get*RowModel` stubs) is the escape hatch, not the plan. Brings `@tanstack/react-store`. |
| Long lists and tables: render only the visible rows | `@tanstack/react-virtual` | 3.14 | none yet (installed 2026-10-31 for R20-23, R20-40) | `react-window`, `react-virtuoso` | Same family as the table; opt-in past ~200 rows. |
| Drag to reorder (lists, chips, table rows and columns) | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | 6.3 / 10.0 / 3.2 | `components/inputs/sortable.tsx`; `components/display/data-table.tsx` (`reorderable`, on the `th` itself, with Sortable's exported words, sensors and announcements) | `@hello-pangea/dnd` (react-beautiful-dnd), `react-sortablejs`, **`@dnd-kit/react`** (the 0.x rewrite; not stable), a second drag layer or vocabulary in the data grid (R20-23 shares Sortable's) | D-04. The classic kit is what ReUI and the shadcn blocks use; `@dnd-kit/react` is watched, not adopted. Not a graph editor: node dragging in the DAG is `@xyflow/react`'s own (`d3-drag`), a different job on a different surface. |
| Node-and-edge graphs (the jobs DAG) | `@xyflow/react` | 12.12 | `charts/dag-frame.tsx` | `reactflow` (the old name), `cytoscape`, `vis-network` | Brings `zustand` and `d3-drag`/`d3-zoom`/`d3-selection` for its own use; nothing of ours imports them. |
| Graph layout | `@dagrejs/dagre` | 3.1 | `charts/internal/dag-model.ts` | `elkjs` | Pure, no React; runs once per graph. |
| Charts (series, bars, sparklines) | `recharts` | 3.8 → latest 3.10 | `base/chart.tsx`, `charts/chart.tsx` (Sparkline draws on it) | `victory`, `nivo`, `visx`, `chart.js`, a second `d3-shape`/`d3-scale` consumer of ours | shadcn's chart base. Brings `victory-vendor` (its d3 modules), `@reduxjs/toolkit` and `immer` for its own state. Rocket's observability set (Round E) is recharts too, so nothing new there. |
| Rich text | `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extensions` + `@tiptap/pm` | 3.31 → latest 3.32 | `components/internal/rich-text-editor.tsx` | `slate`, `lexical`, `quill`, `draft-js` | One editor; the ProseMirror packages (`@tiptap/pm`) are its. Single-version by its own peer rule. |
| Icons | `lucide-react` | 1.53 → latest 1.66 | 73 files | `react-icons`, `@heroicons/react`, `@tabler/icons-react`, `@radix-ui/react-icons`, inline SVG for a glyph lucide has | One set, one stroke weight, one size scale (T-02). The Area glyphs (`src/icons/`) are ours because lucide has none for them. |
| Variants | `class-variance-authority` | 0.7 | 22 files | `tailwind-variants` (`tv()`), hand-rolled class maps once a part has an axis | INTAKE.md § 5.2: a registry item's `tv()` becomes `cva` at Conform. |
| Class merging | `clsx` + `tailwind-merge` → `cn` | 2.1 / 3.7 | `lib/utils.ts` only | `classnames`, a registry item's own `cn` | Every file imports `cn` from `lib/utils` (`check:layers` ALIAS). |
| Enter/exit animation utilities | `tw-animate-css` | 1.4 | `theme.css` (`@import`) | **`motion` / `framer-motion`** (D-03), `react-spring`, `tailwindcss-animate` (the v3-era plugin) | Radix Presence + CSS keyframes do every open/close we have; a count-up (R20-31) is `requestAnimationFrame` in a hook, not a library. |
| Styling | Tailwind v4 (`@tailwindcss/vite`), tokens in `theme.css` | 4.3 | everything | CSS-in-JS, CSS modules, a UI kit's theme object | D10 rules + `check:tokens`. |

**Not in the stack, on purpose.** Form state and schema (`react-hook-form`, `zod`, `yup`, `valibot`): our forms are `src/forms` (Field by `name`, `values.ts`, the API error adapter); a registry demo that brings `react-hook-form` + `zod` is rewritten onto ours at Conform (the password-strength demos were). `zod` 4 is in the tree as a **dev** dependency of Storybook only. Data fetching (`@tanstack/react-query`, SWR): a consumer's concern (`go-paige/paige`), not the package's. State libraries (`zustand`, `jotai`, `redux`): none of ours; the two in the tree belong to xyflow and recharts. Dates (`date-fns`, `dayjs`, `luxon`, `moment`): `Intl` in `lib/dates.ts`, `lib/format.ts`, `lib/format-kind.ts`.

## 2. Transitive, not ours

Libraries in `node_modules` that a tool above brought for itself. We never import them; they are listed so a duplicate or a surprise is recognisable.

| Package | Brought by | Why it matters |
|---|---|---|
| `date-fns` 4 | `react-day-picker` | The temptation; see § 1. |
| `zustand` 4, `d3-drag` / `d3-zoom` / `d3-selection` 3 | `@xyflow/react` | xyflow's own state and interaction. |
| `victory-vendor`, `d3-shape` 3, `d3-scale` 4, `@reduxjs/toolkit`, `immer` | `recharts` 3 | recharts' rendering and state. `immer` sits at two versions (10 under `recharts`, 11 under `@reduxjs/toolkit`) — both theirs, harmless, watched. |
| `@floating-ui/dom` 1.8, `@floating-ui/react-dom` 2.1, `@radix-ui/react-popper`, `@radix-ui/react-presence` | `radix-ui` | One copy each; every overlay positions the same way. |
| `prosemirror-*` | `@tiptap/pm` | The editor's engine. |
| `@tanstack/table-core` 8 (→ 9), `@tanstack/virtual-core` 3 | the react wrappers | Framework-agnostic cores; one version each. |
| `@dnd-kit/accessibility` | `@dnd-kit/core` | The live-region helper Sortable's announcements use through core. |

## 3. Dev tools (not shipped)

Storybook 10 (`react-vite`, `addon-a11y`, `addon-docs`, `pseudo-states`), Vite 8, TypeScript 5.9, ESLint 10 + `typescript-eslint` 8 + `react-hooks` 7, Tailwind 4, React 19.3 (peer for the package; the dev copy here), Chromatic, `@fontsource-variable/montserrat`, `remark-gfm`. One React in the tree (`npm ls react` is flat).

## 4. The clash check (`npm run check:deps`)

What `scripts/check-deps.mjs` holds, from the lockfile and `packages/ui/package.json`:

1. **Excluded tools are absent** as direct dependencies: `@base-ui/react`, `@headlessui/react`, `react-aria-components`, any `@radix-ui/react-*` beside `radix-ui`, `tailwind-variants`, `motion`, `framer-motion`, `tailwindcss-animate`, `react-icons`, `@heroicons/react`, `@tabler/icons-react`, `@radix-ui/react-icons`, `date-fns`, `dayjs`, `luxon`, `moment`, `react-hook-form`, `zod` (runtime), `@hello-pangea/dnd`, `react-beautiful-dnd`, `@dnd-kit/react`, `react-window`, `react-virtuoso`, `reactflow`, `ag-grid-*`, `@mui/*`, `antd`, `classnames`, `react-hot-toast`.
2. **One version per family** among the runtime tree: `react`, `react-dom`, `radix-ui`, `@radix-ui/*`, `@tanstack/*`, `@dnd-kit/*`, `@floating-ui/*`, `@tiptap/*`, `prosemirror-*`, `lucide-react`, `class-variance-authority`, `tailwind-merge`, `clsx`, `cmdk`, `sonner`, `recharts`, `@xyflow/react`.
3. **Every runtime dependency has a row** in § 1 (the package name in backticks).
4. A finding is one line, `EXCLUDED` / `DUPLICATE` / `UNLISTED`, and fails the check; `npm run check` runs it after `check:scripts`.

## 5. Decided here (2026-10-31)

- **D-11 — TanStack Table v9** for the data grid (George: *"i would be happy to use tanstack"*; the version is Eng's with the facts above). Move `DataTable` to v9 first, on its present behaviour, plays green; then grow it (R20-23). ReUI's `data-grid` is on v9, so it reads as a reference without translation.
- **`@dnd-kit` classic**, not `@dnd-kit/react` — revisit when the rewrite ships 1.0.
- **No `motion`**: Rocket's items that animate are re-drawn with CSS or a hook (D-03 stands).
- **`next-themes` stays** only as long as the sonner base wants it.

Changes to this ledger are a line in the REVIEW that made them.
