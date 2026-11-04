# Collections: Memories, Messages, Passwords

Started 2026-11-04 (George). These three pages should share one look and feel, which is different from People and Documents. People and Documents are for managing and sharing (WorkspacePage, VIEWS-PLAN.md). These three are for **keeping and composing**: the owner writes and keeps things for the people who come after.

Below: what each page is for (from the Vue pages, their specs, the API and the ADRs), the UI it should have (not a copy of the Vue screens), and what `@paige/ui` has for it. The Will Builder is a separate, later piece: it's a guided flow, not a collection.

## 1. Intent

### Memories: the owner's stories, by when they happened
- **The owner** records a moment: a title, the date it's about (`occurredOn`), a category (Birthday, Wedding… a fixed list with writing prompts), a short note, titled story sections (`details[]`, prompts can suggest titles), and **one** photo, video or file.
- **Later** the owner browses, finds, fixes and removes their memories. Delete is soft.
- **Delivery to people is the emotional point, but it isn't built.** Sharing is deferred (D10, J7-08): no recipients, no schedule, no "shared with me". For now, authoring stands alone.
- API: `memories` (list, get, categories, create, patch = full replace, delete), plus `…/attachment/content` (put, get, delete).

### Messages: letters written now, delivered later
- **The owner** writes for someone: a type (Personal letter, Birthday…), a subject, a rich-text body, up to **2** files, and when it should go out. The schedule rule is: right away, on a date, every year on a month and day, when a delegate triggers it, or after their death.
- **Status** is Draft, Scheduled or Sent, but nothing in the app changes it, and **nothing sends** (D2). Recipients exist in the domain (`ContactId`, migrated) but no endpoint exposes them.
- **Journey 6** is the only recipient intent on record: after a passing, the delegate sees an "after my passing" message as due.
- API: `messages` (list, get, types, schedule-types, create, patch, delete), plus attachments (post, put content, get, delete).

### Passwords: the accounts the family will need
- **What's listed is an external account** (ADR 0037), not a password: a title, one of 7 types (Device, Digital, Financial, Utility & Home, Loan, Subscription, Other), username, website, notes, **0..n credentials** (an optional label plus a secret), and 0..n files.
- **Who uses it later** (heirs, delegates): not built. Today it's owner-only.
- **The per-type prompt** ("Add a Financial account", Skip) is the `workbooks/passwords/worksheet` progress.
- API: `vault/external-accounts` (list with id, title and type only; get, which **decrypts every secret**; create; patch per credential; delete, which is hard), types, the worksheet, and attachments.

### What they share, and where they differ
- **Shared:** each is a collection of the owner's own items, authoring only for now. Each needs: find one, open it and read it, add, edit, delete with a confirm, and one or more files. Each shows a delivery or sharing future that isn't built.
- **Memory:** about a moment; leads with its picture.
- **Message:** for someone; leads with who it's for and when it goes.
- **Account:** a thing to get into; leads with its type, and keeps its secret hidden.

## 2. The UI they should have (not the Vue UI)

**One page shape for all three: CollectionPage** (new, in labs first).
- **Header:** PageHeader, then the count, then **Add**.
- **One find row:** search, plus one filter set (category, type, or account type) as Chips. Not ListToolbar's Apply/Reset.
- **The items in one view, grouped by what matters for that kind:**
  - Memories: by **year it happened**, as media-led cards in a grid.
  - Messages: by **when it goes** (Right away · On a date · Every year · When a delegate says · After I'm gone), as letter cards.
  - Accounts: by **type**, as rows.
- **No Grid/Table/Timeline switcher:** the Vue's three views over one list are legacy shape. Each kind gets the one view its job needs.
- **Empty states:** nothing yet (with the first Add) and no matches (with Clear).
- **The per-type prompt** (Passwords' worksheet) as a quiet strip at the top, not a page intro.

**Opening an item: ItemPage** (Page at the focused width, a back link).
- **The item read as itself:**
  - A memory: its picture large, title, date, category, then the story sections.
  - A message: who it's for and when it goes, then the letter.
  - An account: its type, website, username, the credentials (hidden; reveal and copy), notes.
- Files as Attachments.
- **Actions:** Edit, and ⋯ with Delete (confirmed).
- **What it's waiting on:** an honest "not built yet" line for delivery or sharing, so the schedule doesn't read as a promise.

**Editing: the same ItemPage in edit mode** (a Form with FormSections, at the focused width; cancel warns about unsaved changes). Fields by kind:
- **Memory:** category (its prompts suggest section titles), title, date it happened, note, sections (add, remove, reorder), one file.
- **Message:** type, subject, the letter (rich text), **when it goes** (a rule field that shows only the inputs its choice needs), up to 2 files.
- **Account:** type, title, website, username, credentials (0..n, each with a label and a secret), notes, files.

## 3. What `@paige/ui` has

| Need | Have | Variant of an existing piece | New |
|---|---|---|---|
| Page frame, header with Add, back link | Page, PageHeader | | |
| Find row: search, one filter set | InputGroup search; Chip/ChipGroup (labs) | ViewList's controls without the list column (a `FindRow` pattern) | |
| Grouped items with a heading and count | ListGroup (labs) | | |
| Memory card (picture-led) | Card (interactive) | **Card with media** (image or video lead, the file's glyph when there's no picture) | |
| Message card (for whom, when it goes) | Card, Badge | | **LetterCard**? or a Card body pattern |
| Account row (type glyph, title, username) | Item / ItemFrame, IconButton | | |
| Item page | Page (focused), PageHeader (back) | | **ItemPage** template (read and edit modes) |
| Story sections | RecordSection / FormSection | | **SectionsField** (titled sections: add, remove, reorder via Sortable; prompt suggestions) |
| Delivery rule | Select, DateField | | **DeliveryRuleField** (choice, then only its inputs: date, month and day, none) |
| A secret, read | CopyButton | | **SecretValue** (masked, reveal and hide, copy; never in a list) |
| A secret, edited | PasswordField | | |
| Credentials 0..n | Field, PasswordField | | **RepeatField** (add and remove rows of fields; generic) |
| Files: 1, up to 2, or 0..n | Attachment, FileIcon | | **FileField** (drop or pick, replace, remove, a limit; upload states) |
| Rich letter | Textarea `format="rich"`, RichText | | |
| Delete confirm, row ⋯ | ConfirmDialog, RowActions, useActionMenu | | |
| Empty, loading | EmptyState (md, xs), Skeleton | | |
| Type prompt strip | Callout | | |

So it's mostly composition. **New: 1 template** (ItemPage) **+ 1 page pattern** (CollectionPage) **+ 5 fields and displays** (SectionsField, DeliveryRuleField, SecretValue, RepeatField, FileField), and one Card variant. FileField and RepeatField are generic: Documents' add dialog and other forms need them too.

## 4. Open questions (George)

1. **One view per kind, chosen by its job** (grouped as above), and no view switcher. Recommended. The alternative is one shared view for all three.
2. **Opening an item:** a page of its own at the focused width (recommended: these are things you read and write, not records you manage beside a list), or a WorkspacePage like People.
3. **Passwords security (yours to sign off):**
   - The single-item get returns **every secret in plaintext** as soon as the view loads. "Reveal" is cosmetic.
   - There's no re-auth, no reveal-on-demand and no audit.
   - Hard delete, where Memories and Messages are soft.
   - The UI should reveal per credential, and the API should give each secret only when asked (an endpoint per credential, audited). That's API work, so I'm raising it, not doing it.
4. **Messages that don't send yet:** show the delivery rule as what the owner asked for, plus "Paige doesn't send messages yet" (honest)? Or hide the rule until sending exists? Copy is Product's.
5. **Naming:** the page is "Passwords", but what it holds is accounts. Keep "Passwords" as the nav word (what people search for) and call each item an account?
6. **Recipients for Messages** are in the data but not on the wire. Leave them out until the API exposes them (absent beats broken)? Recommended.

## 5. Order

1. **The generic pieces first** (FileField, RepeatField, SecretValue), each to the full bar: states, stories, a11y. They're needed beyond this.
2. **CollectionPage + ItemPage in labs, on Passwords** (the smallest and the strictest; it sets the security rules).
3. **Memories** (Card with media, SectionsField), then **Messages** (DeliveryRuleField, the letter card).
4. **Promote** what held up, then the app routes.
5. **Will Builder:** its own plan (a guided flow; check the linked will-builder session first).

## 6. Progress

**2026-11-04: the shared pieces, then Passwords, in labs**
- **`labs/components`:**
  - **SecretValue:** hidden as eight dots. Show, which asks for the secret when it's first needed and hides again after 30 seconds or when the tab is left. Copy, without showing it.
  - **RepeatField:** rows with × and Add. Focus moves to the new row, or to the row that takes a removed one's place. It has `max` and `min`.
  - **FileField:** Attachments with × or ↺ (try again), a drop zone, limits and accepted kinds, and Replace when the limit is one.
  - Each has stories, and the key behaviour is tested in the stories.
- **`labs/vault/collections/passwords-view.tsx` (PasswordsView):** one reading column (Page `focused`) for every screen.
  - **The list:** the header with Add, the next-kind prompt (a neutral Callout with Add and Skip), search plus type Chips, the accounts grouped by type, and the empty and no-match states.
  - **An account:** a header with the type tile, chip, Edit and ⋯ Delete (confirmed). A RecordCard holds Signing in (website, username with Copy, each credential as a SecretValue that asks for its secret), Notes and Files, plus the "only you can see this for now" line.
  - **Add and edit:** a Form with FormSections. Credentials are a RepeatField of a label and a secret. Saved secrets are never put back into the form; leave the field blank to keep one. Files use FileField.
- **No CollectionPage or ItemPage template yet:** Page `focused` plus PageHeader carried it. Decide once Memories shows whether a template earns its place.
- `ListGroup` gained `gutter` (off in a reading column).
- **Data:** `labs/vault/collections/data.ts`. A credential carries `hasSecret`, not the secret: the shape the API should take (§4.3).
- **Copy marked ⟨new⟩** in `collections/fixtures.ts` needs Product.

**2026-11-04: Memories, in labs** (`labs/vault/collections/memories-view.tsx`), on the same shape as Passwords.
- **The list:** the header with Add, search plus category Chips, then memories by the year they happened (newest first) as **MemoryCard**s, two across from sm. The picture leads; a video shows a play mark, a file its glyph, a story alone a quote mark. One view, no switcher.
- **A memory:** the header (when · category, Edit, ⋯ Delete), the picture at the column's width, then a RecordCard: the note as its lead, each part of the story as a section under its own title, a non-picture file as an Attachment, and the "only you can see this for now" line (sharing deferred, D10).
- **Add and edit:** The memory (category, when it happened, title, one-line note), The story (**SectionsField**: parts with ↑ ↓ ×, the category's prompts offered as "Start a part with …", a used prompt not offered again), one photo, video or file (FileField `max` 1).
- **Bug found and fixed:** the icon buttons inside SectionsField, RepeatField and FileField had no `type="button"`, so in a form ↑, ↓ and × submitted it. SectionsField's story now checks that nothing submits.
- **Still no ItemPage or CollectionPage template:** Page plus PageHeader carried Memories too. The find row (search plus Chips) and the hrefs-as-routes plumbing are now repeated in two views; extract them when Messages makes it three.
- **The categories and prompts are stand-ins.** The real catalog is the API's (`GET memories/categories`).
- **The alternating timeline (George: it has to be there).** Memories' list has a view switch beside the search: Grid · Timeline, using our icon `ToggleGroup` (the joined, square bar with Tooltips), not pills.
  - The timeline is **AlternatingTimeline** (`labs/patterns`): a rail down the middle in a 40 column (`grid-cols-timeline`), with the same MemoryCards taking turns left and right.
  - Each card has its date over it and a dot on the rail. The years are marks on the rail. Below md it's one column with the rail at the start.
  - The library's Timeline is the other kind (a rail at the start, for activity), so this is separate.
- **Later (George):** more views and a better filter experience. The timeline could stagger its sides so they overlap vertically and use the space better.

