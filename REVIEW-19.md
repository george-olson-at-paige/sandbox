# Review 19 — Files: Attachment, Toast, and the document in flight (opened 2026-10-30)

The second run of [`INTAKE.md`](INTAKE.md), this time for parts below a screen: the file row (shadcn's **Attachment**), a toast layer (shadcn's **sonner**), and the composition George asked for — one document sent, classified over SSE, and its progress shown while the person keeps working. George, 2026-10-30: *"this can be our files/attachment components. we want to bring in the file types UI and probably whatever would be helpful for the eventual react version of the site."*

Same rules as earlier rounds: a held list, IDs `R19-nn` never reused, statuses proposed → agreed → built → verified, plus deferred. Each row says who decides: **George** (product or design) or **Eng** (an engineering call, ours to make).

**Where this round stands (2026-10-30).** Checkpoints 0 and 1 passed in the conversation (the quotes below). Steps 4 and 5 are **built at level 1**: two bases added, three Paige parts, the toast-carried attachment, stories per state, checks clean, catalog regenerated (§ Step 4–5). Level 2 is George's call.

---

## Step 0 — Brief (Checkpoint 0: George)

**Outcome.** A person hands Paige one document (a photo of a licence, a PDF of a will) and keeps going. The card they sent it from says what Paige is doing with it ("Reading…") and then what it found; a toast carries the same progress so they can see it from anywhere on the page, stays until they dismiss it or leave, and becomes the failure message if the read fails. No file list appears under a card that takes one document.

**Sources, ranked.**

| Rank | Source | What it gives | Treated as |
|---|---|---|---|
| 1 | George, in conversation (2026-10-30), with the screenshot of the Essential Setup photo-id card | the experience: *"the setup should be simple, and the file row on a container that says it is just one doesn't make sense. the experience would be to change that pill to reading… then it shows the pill based on the results. but it would be good to have the progress in sonner. and the percent would be estimated."* · *"think of it as a facade instead of exact file. it can take more than one and is kind of service vs files"* · *"these ones would be persistent until navigated away or dismissed"* | **spec** for the behaviour |
| 2 | `Paige.Webapp` `features/vault/adapters/uploadProgress.ts`, `VaultItemDocuments.vue`, `VaultStackDocumentEntry.vue`, `VaultDocumentPreview.vue` | the stream's beats (`uploading` until the server says `stored`, `reading` until `complete`, then the snapshot; a truncated stream is a failure), the status words, the preview kinds (image · pdf · text · other) and the MIME → extension map | **intent, not spec**; the stage names are the contract's |
| 3 | ui.shadcn.com `attachment` (`/r/styles/new-york-v4/attachment.json`, MIT) | the file row: media, title, description, actions, a full-card trigger, states `idle · uploading · processing · error · done` with a title shimmer, sizes, a snapping group | **base** |
| 4 | ui.shadcn.com `sonner` (`/r/styles/new-york-v4/sonner.json`, MIT; the `sonner` library, MIT) | the toast layer: stacking, swipe, pause on hover, update by id, `duration: Infinity`, JSX titles, `toast.promise` | **base** |
| 5 | ui.shadcn.com `toast` (Base UI Toast, 2026) | the same job on Base UI (`toast.add`, `toast.promise`) | **Out**: Base UI never lands beside Radix (INTAKE I-02, `check:layers` PRIMITIVE) |

**In scope.** The file row and its states; a file-kind helper (what the icon and the "PDF · 2.4 MB" line come from); the toast layer with its basics; the attachment carried by a toast, updated as the stream moves, persistent until dismissed or the page is left.

**Out of scope (this round).** The service card itself (the Essential Setup card with the pill; a Setup screen, its own intake). A drag-and-drop zone (the prototype has none, R2-49). A document preview (legacy `VaultDocumentPreview`: image, PDF, text; a Dialog opened by the attachment's trigger later). A "finished while you were away" entry in the notification bell. Tone-filled toasts (`richColors`): the icon carries the type for now.

**Done when.** Attachment, Toast and the attachment-in-a-toast exist as stories at level 1: each state a story, `npm run typecheck` and `npm run check` clean, the catalog row and the guide row written. Level 2 (plays, `--a11y`, a walk in `apps/web`) is George's.

---

## Step 1 — Named (Checkpoint 1: George, since two bases are added)

George's words carried the direction: *"i think this is something that is worth doing. it would be multiple components."* and *"this can be our files/attachment components."* The map:

| ID | Piece | Where it is today | Verdict | Deciding | Notes |
|---|---|---|---|---|---|
| R19-01 | **The file row** — media, name, status or metadata line, actions, whole-card open; in flight it shimmers | `vault/documents/upload-row.tsx` is the *capture* (promise, parts given, the upload button), not a file row; `components/display/item.tsx` has a `file` media look but no states | **Add base** (`attachment`) then **Wrap** as `components/display/attachment.tsx` | George → built | The base brings `cn`, `radix-ui` (Slot) and `button` as a registry dependency (our base Button already has `icon-xs`, so the would-overwrite is kept as ours). It expects three utilities our theme lacked: `shimmer`, `scroll-fade-x`, `scrollbar-none` (from `shadcn/tailwind.css`, which we do not import) — added to `theme.css` by hand, light only, reduced motion honoured |
| R19-02 | **The states**, in the stream's words | legacy `VaultDocumentEntryStatus`: `uploading · reading · present · failed`; shadcn: `idle · uploading · processing · error · done` | **Wrap** | Eng | The Paige prop is `status: uploading · reading · done · failed` (not `state`: that is the Item axis with rest · expanded · new · struck). `reading` → upstream `processing`, `failed` → `error`. `idle` (the dashed empty slot) is not exposed until a screen needs it |
| R19-03 | **File kinds** — the glyph and the type word by MIME or extension, and a size in words | legacy `kindOf` (image · pdf · text · other) and `EXTENSIONS` in `VaultDocumentPreview.vue` | **New part** (`lib/file-kind.ts`, pure, tested) | Eng | `fileKind`, `fileTypeLabel`, `formatFileSize`, `fileLine` ("PDF · 2.4 MB"). Kinds: image · pdf · document · spreadsheet · archive · text · other — legacy's four plus the three the Documents view will meet. Sizes are binary (1024) with KB/MB/GB, one decimal under 10 |
| R19-04 | **The toast layer** | nothing; `@radix-ui/react-toast` is in the lock file only as another base's dependency; REUSE.md lists `sonner` as not added | **Add base** (`sonner`) then **Wrap** as `components/feedback/toast.tsx` | George → built | Brings `sonner` and `next-themes` (the base reads the theme from it; the Paige Toaster passes `theme="light"`, so no provider is needed and the OS's dark setting never flips it) |
| R19-05 | **The name**: toast or sonner | — | **Eng** | Eng | **Toast.** The part is named for what a person sees, as Dialog is not called Radix: `Toaster` (mounted once) and `toast` (the call) from `components/feedback/toast`; "sonner" appears only in `src/base/sonner.tsx` and `package.json`. The app never imports `sonner` directly, so the engine can change under the name |
| R19-06 | **The attachment in a toast** — the document in flight, updated as the stream moves, persistent | — | **Wrap** (`attachmentToast` in `toast.tsx`) | George → built | `toast(<Attachment framed={false} …/>, { id, duration: Infinity })`: sonner's card and close button, our row inside with its own frame off (the `framed` boolean Callout already has). Calling it again with the same `id` updates in place; `done` and `failed` stay too (George: *"persistent until navigated away or dismissed"*). Leaving the page is the caller's `toast.dismiss(id)`; the story shows the pattern |
| R19-07 | **The percent** | the server sends stages, not bytes | **Wrap** | George | Estimated, as George said: the description is the stage word with the estimate after it ("Uploading · 40%"); the words are the status, the number keeps it from looking frozen. The estimate's clock is the caller's; the story has one |
| R19-08 | **The group** (a snapping row of attachments) | — | **Add base** (comes with R19-01), not wrapped | Eng | A composer's row, not this flow's. The Base story shows it; a Paige wrapper waits for the Messages mode |
| R19-09 | **The trigger** (the whole row opens the document) | — | **Wrap** (`onOpen`) | Eng | A button trigger with an accessible name ("Open IMG_4821.jpg"); a link form arrives with the app's router. "A link to the document or viewing what it read" is the evolution George named |
| R19-10 | **Where it goes**: the service card, the toast, the bell | — | **George** | George → agreed | The card is the service; its pill is the status; the files stay behind it. The toast is the wait. The bell is "it finished while you were elsewhere" — out of this round |
| R19-11 | **Drag and drop**, a dropzone | — | **Out** | — | The prototype has none (R2-49); a picker button is the capture |
| R19-12 | **Preview** (image, PDF, text) | legacy `VaultDocumentPreview` | **Deferred** | George | A Dialog the trigger opens; its own small intake |
| R19-13 | **Tone-filled toasts** (`richColors`) | — | **Deferred** | George | The icon carries the type at level 1; Paige's tones (Callout's) can skin the card later through `toastOptions.classNames` |

**Dependencies and licence.** `attachment`: npm `radix-ui` (present), `cn` (the registry's helper; `ui:add` removes it), registry `button` (ours kept); MIT. `sonner`: npm `sonner`, `next-themes`; MIT. No CSS variables of their own; the three utilities above are the base's expectations, written into `theme.css` as Paige's.

---

## Step 3 — Frame

Not a screen; no Frame step. The service card (the pill that says "Reading…") is a Setup screen's and gets its own round.

---

## Step 4–5 — Landed and Conformed (built at level 1, 2026-10-30)

Filled in as built; see the commit on `spike/ui-audit`.

**Bases** (`ui:add sonner attachment`, servers stopped, `npm ci` after): `src/base/sonner.tsx`, `src/base/attachment.tsx`, each with a Base story. `src/base/button.tsx` was reported as a would-overwrite and kept as ours.

**Theme.** `shimmer` (a highlight sweeping the text while a row is in flight; the one looping animation in the theme, so it is a deliberate departure from T-12's one speed, and it stops under reduced motion), `scroll-fade-x` (an edge fade on a horizontal scroll box, scroll-driven where the browser has it), `scrollbar-none` (beside `scrollbar-thin`; the group hides its bar). Each registered in `cn`'s merge with a test.

**Paige parts.**

- `lib/file-kind.ts` — `FILE_KINDS` (image · pdf · document · spreadsheet · archive · text · other), `fileKind` (MIME first — exact types before the `image/` and `text/` prefixes, so `text/csv` is a spreadsheet — then the extension), `fileExtension`, `fileTypeLabel` ("JPG"), `formatFileSize` (binary units, "1.1 MB"), `fileLine` ("PDF · 2.4 MB"); `node --test` cases beside it.
- `components/display/file-icon.tsx` — `FileIcon` (Media): the lucide glyph for a kind, from `kind` or from the file itself; `data-kind` on the svg. Its own file because `check:vocab` reads one `@archetype` per file, and Attachment (Item) carries `density`, which Media does not.
- `components/display/attachment.tsx` — `Attachment` (Item): `name`, `file` (type, size → the glyph and the line), `kind` to override, `status` (uploading · reading · done · failed, mapped onto the base's uploading · processing · done · error), `description` to override the line (a stage with an estimate, the reading result, a failure's reason), `image` for a thumbnail, `actions`, `onOpen` (+ `openLabel`), `density` (default · compact → the base's default · sm), `framed`. `aria-busy` while in flight; the line is a polite live region; a failed row's reason wraps where the base would truncate it (a toast is 356px). `AttachmentAction` is a ghost icon Button. The base's `xs`, vertical orientation, dashed `idle` and `AttachmentGroup` stay upstream's until a screen needs them.
- `components/feedback/toast.tsx` — `Toaster` (light only, bottom-right, close button, three visible, five seconds), `toast` (sonner's, re-exported so nothing imports the engine), `attachmentToast(id, props)` (persistent, updates in place, the Attachment compact and unframed). `unstyled` + `classNames` because sonner's stylesheet is unlayered and beats Tailwind's layered utilities; two of sonner's gated rules redrawn in the class names (a collapsed toast behind the front one hides its children; the icon box is `relative` for the absolutely-placed loading spinner); the font reaches sonner's list as a style. The string-form action and cancel buttons sonner draws get `buttonClassName("primary" | "secondary", "sm")`, a new export of Button that returns exactly the classes a `<Button>` renders.
- `scripts/catalog.mjs` — one `OVERRIDES` row: the part is Toast, the function with the purpose line is `Toaster`.

**Stories.** Base › Sonner (Default), Base › Attachment (Default, States, Group); Components › Display › FileIcon (Default, By kind, From the file); Components › Display › Attachment (Default, By kind, States, With a description, With actions, Opens the file, Thumbnail, Compact, Unframed); Components › Feedback › Toast (Kinds, With an action, Persistent, With a promise, and *A document in flight*: uploading with an estimate → reading → read, or failed with a retry that restarts the stream in the same toast; "Leave the page" dismisses it, as does the story unmounting).

**Checks (2026-10-30, 6107).** `typecheck` clean; 268 tests, 265 pass, 3 todo (pre-existing); `check:tokens` 0 in Paige code (91 upstream); `check:layers` 0; `check:exports` 153 entry points; `check:reuse` 0 (REUSE.md: `attachment` and `sonner` each inherited by one Paige file; the toast's badge signal went with `buttonClassName`, U-18); `check:vocab` 75, the baseline (the FileIcon split removed the one new finding); lint: no new warnings (the baseline six and `address-field.stories.tsx:47` pre-exist); 21 plays pass (one axe note on `base-attachment--group`, upstream's scroll region, not failing). Walked in the browser: the four states, actions, thumbnail, compact, unframed; the toast kinds, collapsed and expanded stacks, both Undo forms the same 36px Button; the document stream end to end (37% → 79% → "Driver's license · read and filled in for you"; the failed branch with its reason wrapped and the retry; leave dismisses). Two story bugs found and fixed on the walk: the complete timer was cleared by the stored handler (chained now), and the failed reason truncated (wraps now).

**Not done, on purpose.** The Setup service card (its pill; its own round); the preview dialog (R19-12); a bell entry for "finished while away" (R19-10); `richColors` (R19-13); `AttachmentGroup` (R19-08); a dropzone (R19-11, Out). Level 2 is George's.
