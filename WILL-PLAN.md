# Will Builder

Started 2026-11-04 (George: "hammer out Will Builder"). The third family of page: **guided steps**, a flow rather than a collection. It sits on SetupBeat (Essential Setup's template: the step rail, one column, the question, a FlowFooter), not on WorkspacePage or the reading column.

Intent is from the Vue builder, its API slice (`Estate/Workbooks/WillBuilder`), ADRs 0042/0043/0047/0074 and journey 02; the evidence is in the hand-back notes. Not a copy of the Vue screens.

## 1. Intent

**The job.** The owner gets a state-valid will made mostly from what the Vault already holds, then prints and signs it.
- **When they come:** first time; returning to a draft; or later, to update (a finished will is frozen history, and updating starts a new draft from it).
- **Done is two things:**
  - **Finalize:** Paige makes the clean PDF and files it in the Vault (Essential Documents, made by Paige).
  - **Sign:** the will isn't legal until it's printed and signed the way the state says (witnesses, sometimes a notary). The state's instructions are on the PDF's cover.

**What it asks**, step by step. The API saves per section; lists are replaced whole.
1. **You:**
   - legal name and date of birth (an adult);
   - married, single or widowed;
   - state, and county where the state has them.
2. **Your spouse** (married only): legal name, date of birth, email. A "will for your spouse too" option doubles the price, and it's half-built (see §4).
3. **Children:**
   - Do you (or your spouse) have children? Each child has a name and date of birth.
   - Guardians per child: a first choice, then backups.
4. **Who carries it out:** executors in order (the first is primary; the spouse is suggested first), each with name, email and relationship. "They also handle my digital accounts" is on by default.
5. **Who inherits:**
   - Everything to your spouse, and/or then to your children, when they apply.
   - Backups or the residuary otherwise: people with shares that must total 100%.
   - In Vue this is three screens (Assets, Backup, Gifts) on one save.
6. **Specific gifts** (optional): a person or a charity, a kind of gift, and a description.
7. **Anyone left out** (optional): a person and relationship.
8. **Review:** the preview PDF (watermarked), then Finalize, or Checkout first when the will isn't paid for.
9. **Finalize and sign:** finalize makes the clean PDF; then download it and follow the state's signing steps.

**The rules that matter.**
- **Branching:** Spouse only when married. "Who inherits" offers the spouse and children options only when they exist.
- **Shares:** they must total 100.
- **Finalize needs:** a matching state and county, an active draft, and a paid will.
- **Server-side checks:** the server checks almost nothing else (an empty executor list is accepted), so the UI must hold the rules. That's flagged in §4.

## 2. The UI it should have

**Hub: Your will.** A page in the reading column showing where it stands and the one way on:
- **Not started:** what you'll need, about 15 minutes, Start.
- **A draft:** how far it is, and Continue.
- **Finished:** the signed-or-not status, Download, "How to sign it", and Update (starts a new draft from this one).
- **Versions:** a quiet list underneath.

**The steps.** SetupBeat with the step rail, one question per step, and a FlowFooter (Back, then Save and continue). "Save and finish later" is in the bar. Seven steps when single; Spouse is added when married.
- **People come from the Vault.** Every person slot is "Pick from your people" (PersonPicker's pills), or "Someone new" (name, relationship, email). Typing a name twice is the legacy shape.
- **Lists:**
  - Executors and guardians are ordered lists (RepeatField + ↑ ↓, first marked "First choice").
  - Inheritors are a share list (**ShareField**: a person and a %, a running total, "Split evenly", and refused unless it totals 100).
- **"Who inherits" is one step**, not three. A short choice first (Everything to David · Everything to David, then the children · Split it my own way), then the share list only when it's needed.
- **Review** is the record of the answers: each step a RecordSection with Edit, plus the preview PDF behind "See the draft". The primary button is Finalize when paid; otherwise "Pay and finalize" goes to Checkout and comes back to Finalize.
- **Finalize and sign:**
  1. Finalize: a confirm that says what it does.
  2. Download: the **clean** PDF.
  3. Sign: the state's steps as a checklist.

  The Vue order downloads the watermarked preview before finalizing; that's the bug to fix.

## 3. What `@paige/ui` has

| Need | Have | New |
|---|---|---|
| The step frame, rail, footer | SetupBeat, StepRail, FlowFooter | |
| Fields, dates, choices | Form, FormSection, FieldGroup, Field, Input, DateField, Select, RadioGroup | |
| Pick from your people | PersonPicker (pills, then search) | |
| Ordered people (executors, guardians) | RepeatField (labs), SectionsField's ↑ ↓ | **PersonSlots**: pick or new, ordered, "First choice" |
| Shares that total 100 | | **ShareField** |
| Review of the answers | RecordCard, RecordSection, AreaLines | |
| Preview, the PDF | Attachment, Dialog | |
| Sign steps | Callout, a checklist (Checkbox) | |
| Hub | Page (focused), PageHeader, Progress, Card | |

New: **ShareField** and **PersonSlots**. The rest is composition.

## 4. Open (George / API)

1. **The spouse's will is half-built.** It's charged for but never built for the spouse, except by the migration. Recommended: hide "a will for your spouse too" until it is.
2. **Server rules.** The server accepts an empty executor list and shares that don't total 100; the PDF prints "No executors specified yet." Validation belongs on the server too (Engineering: raise).
3. **`currentSection`** has no writer. Resume works from field completeness. Recommended: write it on each save.
4. **Spouse and children from the Vault's family roles:** the live values exist, so the steps should start filled.
5. **Checkout tied to this will** (ADR 0042 gap 2), so the return lands on Finalize for the right draft.
6. **County** is required even where a state has none (`hasCounties`); unconfirmed.

## 5. Order

1. ShareField and PersonSlots in labs, with stories.
2. **WillBuilder in labs:** the steps on SetupBeat with branching, Review, and Finalize-and-sign, on fixtures.
3. The hub.
4. Promote, then wire to the API (`estate/workbooks/will-builder/*`).

## 6. Progress

**2026-11-04: the builder, in labs** (`labs/vault/will/`).
- **ShareField** (`labs/components`): a percent per person, a running total in the success or attention ink ("Total 80% · 20% left"), Split evenly, and the caller's add. `totalOf` and `splitEvenly` are exported.
- **PersonSlots** (`labs/vault/will`): people a will names. Pick from your people (PersonPicker) or someone new (name, relationship, and email when asked). In order, the first marked "First choice", with ↑ ↓ ×.
- **WillBuilder:** the steps on SetupBeat, each a Form whose FlowFooter saves and moves on, with the step rail and "Save and finish later" in the bar.
  - The steps: You (the county only when the state has counties) · Your spouse (married only) · Children with guardians per child · Who carries it out (plus the digital-executors checkbox) · Who inherits (a choice that fits the family, then shares or backups that must total 100) · Specific gifts (skippable) · Anyone left out · Review · Finalize and sign.
  - **Review:** each answer as a RecordSection with Edit, the draft PDF, then Finalize (paid) or Pay and finalize (`checkoutHref`).
  - **Finalize and sign:** finalize first; then the **clean** PDF to download; then the state's signing steps as a checklist.
- **Checked in a headless browser:**
  - an empty You is refused in place;
  - an 80% split is refused, and Split evenly gives 50/50, which saves and moves on;
  - nothing to download before Finalize, and the clean copy after it.
- **Not built yet:** the hub (Your will: start, continue, finished, versions), the checkout return, and the spouse's own will (§4.1). All the copy is ⟨new⟩ for Product.

