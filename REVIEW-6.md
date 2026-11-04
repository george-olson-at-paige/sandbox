# Review 6 — next pass (opened 2026-10-19)

The gaps round 5 filed for round 6 (#98–100), plus the open gaps no R-item had carried: #88 (filed `round 3` while building round 2, never picked up by REVIEW-3 or REVIEW-4), and R2-49's three composites, which George's "close up all gaps that you can" (2026-10-19) moved from "wait for a screen" to build now. Same rules as earlier rounds: a held list, IDs `R6-nn` never reused, statuses open → approved/changed → built → verified, plus deferred; walked item by item at the end. Gap numbers are in brackets.

George's instruction (2026-10-19) approves each take below and asks for it to be built where it needs nothing from him, Product, Design or a real device. Anything that does is left open with what it needs.

Still deferred: R1-01 (focus ring), R2-02 (account menu parts), R2-16 (rich-text link error copy), R5-05 (non-US locales).

## A. Fields

| ID | Note | Take | Status |
|---|---|---|---|
| R6-01 | [#98] The reveal toggle (PasswordField, SsnField) had both a changing label ("Hide password" when on) and `aria-pressed`, so a screen reader said "Hide password, toggle button, pressed": two states at once | WAI-ARIA's toggle-button pattern: **one fixed label with `aria-pressed`** ("Show password" / "Show SSN", pressed or not). The other legal form (a changing label, no `aria-pressed`) loses the toggle role a reader announces. The icon still swaps (eye / eye-off) | built (approved George, 2026-10-19). Built: PasswordField and SsnField keep "Show password" / "Show SSN" in both states, `aria-pressed` carries the state; the labels come from `fieldMessages` (R5-04). FieldAction's header and prop docs state the rule (a toggle keeps its label; a label that changes goes without `aria-pressed`, never both). The plays assert the same button, pressed true then false |
| R6-02 | [#99] Chrome resets the caret to 0 on the first layout after an input's `type` changes, but only after a real click, so the play passed while real clicking lost the caret | Keep the fix (`useKeptSelection` forces that layout before restoring the selection), make sure it is covered and written down. A play can't send a trusted click, so the real-click case is a by-hand check, listed where the walk will find it | built (approved George, 2026-10-19). Built: the plays (`Play · reveal keeps the caret…`, Password and SSN) cover the restore on a scripted click and now say on their docs that the real-click case isn't visible to them; the spike README has a § By-hand checks table with the Chrome steps (also the 4G and 125/150% checks); `stories/typing.ts` names it as the one thing the helpers don't cover; the code comment in `field-support.tsx` already explained the forced layout. **Still open: Safari and Firefox** (not available here) |

## B. Tooling

| ID | Note | Take | Status |
|---|---|---|---|
| R6-03 | [#100] `apps/web/tsconfig.json` gained `allowImportingTsExtensions` because the package's `lib` files import each other as `./locale.ts` (what `node --test` needs) and the app typechecks the package's source | **Keep it, with the reason beside it.** Removing it means dropping the extensions, which breaks `node --test` (Node resolves no extensionless TS import), or a loader script, which is more moving parts for a spike. Harmless with `noEmit`. The real package runs its lib tests through Vitest and drops it | built (approved George, 2026-10-19). Built: a comment above the flag in `apps/web/tsconfig.json` (why, why it's safe, when it goes); CLAUDE.md Fields already records the import form |

## C. Layout

| ID | Note | Take | Status |
|---|---|---|---|
| R6-04 | [#88] At 375px the Essential Setup bar (logo, StepRail with its label, "Save and finish later") was 407px in a 375px page, so `/setup/*` scrolled sideways | Do what R2-22 did for the Vault nav: below `sm` the StepRail moves to its own full-width row under the bar, label kept; logo and the exit stay on the 64px bar. From `sm` it's one row, as the prototype. Keeps every word on screen (the gap's other options dropped the label or moved the exit), and matches the nearest sibling | built (approved George, 2026-10-19). Built: SetupBeat passes the rail to AppHeader's `nav` slot (shown below `sm`) and keeps it beside the exit in `actions` from `sm` (one of the two is `display:none` at any width, so only one is in the accessibility tree). Measured in the app on `/setup/roles`: at 375 no sideways scroll (scroll width 375), bar 64 + rail row; at 1280 one 64px row, rail beside the exit. Stories: Composites/AppHeader › Setup configuration (updated) and › Setup configuration at 375; Layouts/SetupBeat › Phone (375). The prototype has no phone layout, so this is ours: George can reverse it at the walk |

## D. Composites

| ID | Note | Take | Status |
|---|---|---|---|
| R6-05 | [R2-49] CaptureCard, UploadRow and PersonPicker, planned in iteration 1, were never built (R2-49 waited for a screen that needs them) | Build the three to the composite bar from the prototype (`capture/CaptureCard.tsx`, `DocumentCapture.tsx`, `PersonCapture.tsx`, `capture.css`): typed props with doc comments, every state as a story, a play each. Wire them into a spike screen only if one already needs one; none does (no capture on an Area page, no Documents, People or Gaps beat), so stories only | built (George, 2026-10-19: "close up all gaps"). Built: **CaptureCard** (`composites/capture-card.tsx`): the blue-wash shell, `placement` top · inline, slab title + description, Close (`onClose`; the card never closes itself), the unit as children, an actions row; a `<section>` named by its title. **UploadRow** (`composites/upload-row.tsx`): icon (`kind` document · card), the promise line or the files given (ticked, with a part), a note, busy (spinner, "Reading…"), given (success look, `actions` replaces the upload), and an upload button that opens the browser's file picker (hidden input out of the tab order); never red. **PersonPicker** (`composites/person-picker.tsx`): "Someone you’ve named" pills (avatar, name, stated role), one tap `onPick(id)`, "Add someone new", `pendingId` (spinner, all disabled: no double pick); buttons, not a toggle group, so GAPS #62's ToggleGroup `chip` stays unbuilt. Stories for each state, an Interactive story each, a play each. Not wired into a screen (none needs them). Copy in the stories is the prototype's; real copy comes with the screen that uses them |

## Held list

5 items: A 2 · B 1 · C 1 · D 1. R6-01…R6-03 carry the three `round 6` gaps; R6-04 carries #88; R6-05 carries R2-49 (which stays in REVIEW-2 with a pointer here).
