# Review 18 — Auth pages intake (opened 2026-10-30)

The first run of [`INTAKE.md`](INTAKE.md): the auth pages. George, 2026-10-30: *"the first ones are actually built in vue and we don't want to port all the cruft, we only want a general idea of the look and feel or the intent. then we build correctly in our spike — which is becoming vnext."* So the legacy webapp is **intent, not spec** here (product-engineering rule 5, INTAKE § What arrives): none of its code, structure or copy crosses; the pages get built properly in `@paige/ui`.

Same rules as earlier rounds: a held list, IDs `R18-nn` never reused, statuses proposed → agreed → built → verified, plus deferred. Each row says who decides: **George** (product or design) or **Eng** (an engineering call, ours to make).

**Where this round stands (2026-10-30, end of day).** Steps 0–2 passed on George's word in the conversation about the intro (Checkpoint 2's one-liner below) and "let's finish that up by adding the rest of the auth views" (Checkpoint 1: the parts as named, nothing contested). Steps 4 and 5 are **built at level 1**: the frame is `src/templates/auth-page.tsx` (`AuthPage` + `LegalFooter`), the views are stories in a new `src/auth/` layer — nine pages, 33 stories, all rendering on 6107 (§ Step 4–5 below). Level 2 (plays, `--a11y`, a walk in `apps/web`) is George's call, as LEVELS.md says; open questions 1 and 3 stay his.

---

## Step 0 — Brief (Checkpoint 0: George)

**Outcome.** A person can create an account, sign in, prove the second factor and land in the Vault (journey 01, J1-01…J1-17), and can recover a forgotten password, on a phone or a desktop, without a wrong turn; the pages read as Paige (the Essential Setup pages' calm, not the legacy watercolor), and the copy never confirms whether an email is known (anti-enumeration, as the API already behaves).

**Sources, ranked.**

| Rank | Source | What it gives | Treated as |
|---|---|---|---|
| 1 | `agents/docs/journeys/01-register-and-onboard.md` | J1-01…J1-17: the order of screens, the done-when, the same-message rule for unknown and known emails | **done-when** |
| 2 | `src/api/application/Paige.Application/Accounts/*` | the wire: `LoginRequest {Email, Password}` → `{Token, HasPhone, Code}`; `RegisterRequest {Email, Password, AcquisitionSource?, PartnerSlug?}` → `{}`; `ForgotPasswordRequest {Email}`; `ResetPasswordRequest {Email, Code, Password}`; MFA send/verify | **contract** (API-NEEDS rows where the UI needs something it lacks) |
| 3 | Legacy webapp `src/web/Paige.Webapp/src/pages/auth/*` + `features/auth/*` | the general look and feel (one centred card on a quiet page, logo-only bar, title + one-line subtitle, hairline footer), which states exist, which calls each route makes, the route list | **intent, not spec** — no code, structure or copy crosses |
| 4 | shadcn/ui blocks `login-01`…`login-05`, `signup-01`, `otp-01` (ui.shadcn.com, MIT) | compositions to take apart: how they lay a Card, Field and Button out; `input-otp` is the one base we lack | **a composition to take apart**; a base to add if the OTP control is wanted (R18-07) |
| 5 | Prototype tag `core/vX.Y.Z` auth screens | the experience spec — **no checkout exists in this workspace**, so it is unranked until George points at a tag or confirms there are no auth screens in the prototype | **spec, when available** |

**In scope** (eight routes, the legacy names kept only as the list of jobs): sign in · register · MFA code · MFA phone · forgot password (legacy "reset-password") · set new password (legacy "confirm-password") · verify email · confirm email change.

**Out of scope** (this round): accept-invite, confirm-delegate, confirm-document, confirm-memory, cancel — journeys 5 and 7; they share the frame but their jobs are not auth's. Any admin sign-in. Social sign-in (nothing in the contract).

**Reuse.** Everything the card holds already exists in `@paige/ui` (the table in Step 1). The only things that do not exist are the **frame** (an auth page layout: one centred card, nothing else on the page) and a **one-time-code control**.

**Done when.** The eight pages exist as stories at level 2 (INTAKE § Step 5): each state a story, plays green, `--a11y` clean, walked in `apps/web` on 1280 and 375, screenshots in the review, catalog regenerated. The copy is written once in the stories' fixtures, from the journey and the contract, not from the legacy strings.

**Open questions for George** (answers unblock Steps 1–2):

1. Is there a prototype tag with auth screens? If yes, which; if no, the legacy look-and-feel is the only visual reference and the Essential Setup pages set the tone.
2. ~~The legacy watercolor Splash background: keep a quiet band, or the plain page background the Setup pages use? The proposal below uses the plain background (one frame family, less to maintain) — R18-02.~~ **Answered 2026-10-30**: the watercolor stays (George: "a hard sell to deviate from what is currently being used unless it is a banger" → "totally agreed" to keeping the live look). R18-02, R18-21.
3. Co-branding: the legacy bar shows a partner's logo beside Paige's when `partner_slug` is in the URL (register). Carry it? The proposal keeps a slot for it (R18-03).

---

## Step 1 — Named (Checkpoint 1: George, since the intake is a screen)

The parts of all eight pages, each with a verdict from INTAKE's six: **Reuse** (a Paige part as is) · **Wrap** (a Paige part with a thin variant) · **Add base** (`ui:add` from shadcn) · **New part** (nothing has it) · **Story helper** (`src/stories` only) · **Out**.

| ID | Part | Where it is today | Verdict | Deciding | Notes |
|---|---|---|---|---|---|
| R18-01 | **AuthPage frame** — bar (logo, optional partner mark), one centred card, hairline footer in flow; phone: one viewport tall, the card scrolls | nothing: `Page` gives width/gutters, `SetupBar` gives a bar, no template centres one card | **New part** (template) | **George** → built | A new template is a foundation change (ORGANIZATION §11). Proposed in `labs/auth/` at level 0, agreed at Checkpoint 2, now `src/templates/auth-page.tsx` (`AuthPage`, level 1; the labs sketch is gone, git has it at `e26727de5`) |
| R18-02 | Page background | legacy: watercolor Splash | **Reuse the art** — the watercolor along the foot of the page (George 2026-10-30, question 2); the art is Paige's own, copied as is to `apps/web/public/assets/watercolor.png` (1440×379 PNG, 575 KB — the same blob the legacy webapp already has, so git stores it once; a WebP at Step 4) | built | Not `Page`'s `band` after all (that is a tinted content band): an `aria-hidden` block absolutely at the frame's foot, `h-72` / `sm:h-96`, `opacity-art` (a new token, `--opacity-art: 0.5` — decorative art behind content; the three existing opacities are states), the image `object-cover object-top` so it crops at the sides rather than squash (the legacy's `min-width: 900px` is not needed) |
| R18-03 | Partner co-brand in the bar | legacy: `bannerLogo` from `partner_slug` | **Reuse** `PartnerLogo` (`admin/partner-logo`, size `sm`) in a `brand` slot | **George** | Only register shows it (`Auth › Register › With Partner`, and the template's `With Partner`). `PartnerLogo` still sits in `admin/`: a story may import any tier, so nothing moves until an auth *module* needs it (Eng, then) |
| R18-04 | Card: title + one-line subtitle + body | `Card` (components/display) with `CardHeader`/`CardTitle`/`CardDescription`/`CardContent` from `base/card` | **Reuse** | built | `Card` with the template's own `hgroup` (R18-23: `h1` at `text-2xl`, lede `text-sm`), not `CardHeader`/`CardTitle` — the card's heading is the page's `h1`. 448 wide (`max-w-card`, R18-18) |
| R18-05 | Email field, password field, confirm password | `Field` + `Input`; `PasswordField` (`autoComplete` current-password / new-password) | **Reuse** | built | Register's rule is one `FieldDescription` ("At least 8 characters. Longer is stronger."); no confirm-password field anywhere (the eye toggle on `PasswordField` does that job). The minimum is a guess — API-NEEDS |
| R18-06 | Phone field (MFA phone) | `PhoneField` (E.164) | **Reuse** | built | `Auth › EnrollPhone` (default and change-number) |
| R18-07 | One-time code (MFA code, 6 digits) | nothing; shadcn `input-otp` is **not added** (REUSE.md § not added) | **Add base** (`ui:add input-otp`) then **Wrap** as `forms/fields/code-field.tsx` — or **Reuse** a plain `Input` with `inputMode="numeric"` `autoComplete="one-time-code"` | **George** → built as recommended | The plain input is the smaller change and pastes SMS codes cleanly; the OTP control is the nicer look. Built: a plain `Input` (`inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`, digits only, centred and letter-spaced) in `Auth › VerifyCode`; OTP stays a later Wrap if George wants the look |
| R18-08 | Submit + cancel row | `FormFooter` (cancel · submit, pending from `Form`) | **Wrap** | built | On the auth card the submit fills the width and the footer has no rule (the card's edge is the rule). Built as `FormFooter fill` (a boolean, not an axis: it is one fact about the footer — the actions fill the width, with no rule above); the labs `className` string is gone |
| R18-09 | Form, errors, pending, double-submit guard, **credentials failed / code did not work** | `Form` + `ErrorSummary` | **Reuse** | built | The in-band login `Code` (`failed`) and the MFA "did not work" are the Form's own form-level `error` — `ErrorSummary` shows it and takes focus. Each names its failure in the heading (`summaryTitle`: "Couldn’t sign in", "Couldn’t verify") so the sentence under it says only why. Every auth form sets `warnUnsaved={false}`: leaving a sign-in half-typed is not losing work |
| R18-10 | In-card status that is not a form's failure (link sent, code sent, inbox copy) | `Message` (components/feedback; tone, title, body, actions — `Callout` since 2026-10-30, D-05) | ~~Reuse~~ **Out** | Eng | Not used after all: on a 448 card a boxed callout inside a card is a box in a box. A status *is* the card — its title and lede say it ("Check your inbox" / "We sent a note to maya@…"), one short paragraph adds the practical line, one full-width button is the way on (R18-11). A wait is a `role="status"` line with a `Spinner` |
| R18-11 | Status pages (verify email, confirm email, "check your inbox") — no form, one line and one button | `Stack` + text + `Button` inside the same card | **Reuse** | built | No new part; one body filling of the frame. Register › Check Inbox, ForgotPassword › Sent, SetNewPassword › Updated / Expired, VerifyEmail ×3, ConfirmEmail ×3, AcceptInvite × 6 |
| R18-12 | Links block under a hairline ("Forgot your password?", "New to Paige? Get started") | `Separator` + `Button variant="link"` | **Reuse** | built | The template's `links` slot draws the hairline (R18-25, `border-t`), so no `Separator`; the links are `Button asChild variant="link" size="inline"` |
| R18-13 | Resend code with 60 s cooldown | `Button variant="quiet"` with a countdown label | **Reuse** (behaviour is the page's) | built | Countdown is page state (`useCountdown` in the story). Built at **30 s**, not the legacy's 60: a text usually lands inside ten seconds, 30 stops a double tap without stranding someone whose text never came. The wait is text ("Resend code in 0:27"), then the link; "Use a different number" is the other way out |
| R18-14 | Footer (legal links, hairline) | nothing centred-and-in-flow; `FlowFooter` is Setup's | **New part** inside the frame (a `footer` slot), *not* a component | built | `LegalFooter` (in `templates/auth-page.tsx`, exported with the template: `nav aria-label="Legal"` + copyright) fills the `footer` slot; the stories pass `AuthLegalFooter` (a fixture with Privacy · Terms · Security as stub links and the © line) |
| R18-15 | Logo | `PaigeLogo` (stories fixture) | **Story helper** | built | Same as Setup; the app passes its own |
| R18-16 | shadcn Guides / Anatomy overlay on the docs page | shadcn.io (third-party) | **Story helper**, later | Eng | Install commands are behind a sign-in token; see § Guides below |
| R18-24 | `ErrorSummary` with only a form-level error | `forms/error-summary.tsx` | **Reuse**, one refinement | built | Seen while building the frame: a lone form-level error rendered as a one-item bullet list under "Check these and try again". Now one problem (a lone form-level error, or a lone field error) is a sentence, no bullet; the bullets start at the second item; and the default heading counts with it (`formMessages.summaryTitleOne`: "Check this and try again"). `Forms › Form › Failed submit` still has two problems and still reads "these" |
| R18-26 | **Copy** | legacy strings | **Our own** (George 2026-10-30: *"many of the ones in the vue version don't hit the quality bar with font, spacing, consistency, etc. the copy throws them out of balance. so we don't need these to be exactly the same"*) | agreed, built | One rule across the nine pages: a title of two to four words that says what the page is for, a lede of one line that says what happens next, field descriptions only where a rule needs stating, errors as "what happened" (heading) + "why / what to do" (one sentence). No legacy sentence was carried |

**States per page** as named at Step 1 (`Form` handles pending/double-submit on every form). What was built is the table in § Step 4–5; the differences: pending is `Form`'s own and gets no story; "sending on mount" is the app's; the invite pages (Gate, Document, Delegate, Memory, Expired) joined the list from the Vue storybook's overview, which has them under Authentication.

| Page | States |
|---|---|
| Sign in | default · invalid field · credentials failed (`Code: failed`, one message, no lockout distinction — the contract has none) · pending · success (→ MFA code if `HasPhone`, else MFA phone; preserves `redirect` and `partner_slug`) |
| Register | default · co-branded (partner) · rules not met · pending · done → "check your inbox" status (always, `{}` back, no token: anti-enumeration) |
| MFA code | sending (on mount, unless `codeSent=sent`) · default · resend cooldown (60 s) · wrong code ("This code did not work", WL-28) · pending · verified (→ me → onboarding → setup / vault / redirect) |
| MFA phone | default · invalid phone · pending · sent (→ MFA code) · change-number variant (`intent=change`) |
| Forgot password | default · pending · sent — **one** copy for known and unknown email (J1-15) · cancel → back or sign in |
| Set new password | missing code (inline, no form) · default · rules not met (400) · link invalid/expired (409) · pending · done → sign in |
| Verify email | no form: pending · verified · failed, one button |
| Confirm email change | signed-out gate · pending · confirmed · failed |

**What the UI needs that the contract lacks** (→ `API-NEEDS.md` when George signs Checkpoint 1):

- Lockout vs. wrong password: `LoginResponse.Code` has `failed` only; a "too many attempts, try in N minutes" state needs a distinct code (or stays one message, as the legacy did).
- Resend cooldown is client-only; the server's real rate limit is not surfaced, so the UI cannot tell "wait" from "failed".
- Register with an existing email returns `{}` like a fresh one (J1-17) — fine for the UI; noted so nobody "fixes" it.
- The password rule the register and set-password pages state ("At least 8 characters") is a guess; the contract's real rule (length, mix) needs to be one the UI can read, so the description and the server agree.
- Link lifetimes the pages state (confirm email 24 hours, reset link 30 minutes) are guesses too — the contract should say them, or the UI stops saying a number.
- Verify code's lede says the last digits of the number ("ending in 0142"); the login response (`HasPhone`) does not carry them.

---

## Step 2 — Framed (Checkpoint 2: George)

Proposal: [`packages/ui/src/labs/auth/auth-page.stories.tsx`](packages/ui/src/labs/auth/auth-page.stories.tsx) — level 0, in `Labs › Auth`. The Welcome pattern: `AuthPageSlots` (`brand`, `title`, `subtitle`, `body`, `links`, `footer`), an `AuthPageFrame`, and two fillings — `wireframe` (measured `Placeholder`s) and `content` (a sign-in card built from the Step 1 parts, so the frame is proven with real parts and the wireframe cannot drift). Stories: **Wireframe** @1280, **Desktop** @1280, **Phone** @375 (`!autodocs`).

What the frame decides (and what George is signing):

| ID | Decision | Proposal | Deciding |
|---|---|---|---|
| R18-17 | Bar | `SetupBar` with the logo, no exit, no rail; a `brand` slot beside the logo for the partner mark | George |
| R18-18 | Column width | one column of 448 px (28rem; legacy 500) inside `Page width="focused"`, which centres it; full width minus gutters on the phone. Named at Step 4: `--container-card` / `max-w-card` — one card alone on a page (the same 448 `dialog-sm` has: a form's one comfortable column) | built |
| R18-19 | Vertical rhythm | **Agreed 2026-10-30** ("fix top is better. it should just end up being about vertical center"): a fixed top, not vertical centring (no jump when an error appears, a short card and a tall one start at the same line), tuned so the card lands about the centre: 48 on the phone (`Page top="roomy"`, every setup page's), **128 from sm** (`sm:pt-20` on the column — kept as a spacing step inside the template at Step 4 rather than a `Page` `top` value: one page uses it, and templates compose whole steps by rule; it becomes a `top` value the day a second page wants the same line). Measured on 6107 at 1280×900: the sign-in card (457 tall) spans 193–650, its centre 29px above the viewport's — where a card reads as centred; a taller register card runs lower and the page scrolls; on a 768-tall laptop the sign-in card still clears the footer | agreed |
| R18-20 | Footer | **Revised 2026-10-30** to the live site's: the *page's* footer, not the column's — small (`text-xs`), centred, legal links (Privacy · Terms · Security, `aria-label="Legal"`) over the copyright line, in flow after the page, never sticks, no rule (the live "hairline" variant has no fill and no edge). On a 667-tall phone the copyright falls 39px below the fold and the page scrolls as one — the legacy's one-viewport phone layout is CSS it fought for and we don't need | agreed |
| R18-21 | Background | **Revised 2026-10-30**: the watercolor along the foot of the page, behind everything (R18-02) | agreed |
| R18-22 | Where it lands | `src/templates/auth-page.tsx` after Checkpoint 2; stories for the pages in a new `src/auth/` product-area layer beside `setup/` (`vault|admin|setup|auth` in `check-layers.mjs`, `Auth` in `.storybook/main.ts` and `catalog.mjs`), titled `Auth` | built |
| R18-23 | **Title placement and size** | ~~the intro sits **above the card**, left-aligned, at the one page-title size (`PageIntro`, 40 px, George 2026-10-28), with an eyebrow ("Sign in") and a lede; the card holds only the form. The legacy centred a smaller title *inside* the card — this is the one visible departure from its look, made so auth reads like every other Paige page~~ **Revised 2026-10-30** after George ("should the intro use the standard left and right gutters? … a hard sell to deviate from what is currently being used unless it is a banger"): the intro sits **inside the card at the card's gutters, centred**, as a card heading (24 px, `text-2xl`) with its lede and no eyebrow — the live site's placement (`dev.go-paige.com/auth/signin`: centred h4 in the card) and shadcn's `login-01/03/04`. Above-the-card shared an edge with the card's border but with nothing inside it, and it was a system nicety, not a banger. `PageIntro`'s 40 px is the page-title size; an auth card's title is the card's, with nothing on the page to match, so the one-size rule is not in play. **Agreed** ("totally agreed"), the comparison story removed; the frame has one intro, in the card | agreed |
| R18-25 | Rule above the links | **Added 2026-10-30**, the live site's: a `divider-tint` hairline between the submit and the links inside the card (`border-t pt-6` on the links block), so the form ends and the ways out begin | agreed |

Checkpoint 2 as agreed 2026-10-30, in one line: *the live sign-in's look — logo-only bar, one 448 card with its centred title inside, the watercolor along the foot, a small centred legal footer — with one behaviour of ours, a fixed top that lands the card about the centre.* Checked on 6107 at 1280×900 and 375×667: Wireframe, Desktop (default and after a failed submit — the `ErrorSummary` takes the top of the card) and Phone.

**Status table** for the round is at the end. R18-19…R18-21, R18-23 and R18-25 were agreed 2026-10-30 in the conversation about the intro; R18-17, R18-18 and R18-22 were in the frame he looked at and unchallenged; Checkpoint 2 was taken as passed on his word for the shape, and "let's finish that up by adding the rest of the auth views" passed Checkpoint 1 with the parts as named. The frame moved to `src/templates/auth-page.tsx` at Step 4 (below).

---

## Step 4 — Conformed, Step 5 — Stories (built 2026-10-30, level 1)

**The frame.** [`packages/ui/src/templates/auth-page.tsx`](packages/ui/src/templates/auth-page.tsx): `AuthPage` (`@archetype Frame`; slots `logo`, `brand?`, `title`, `lede?`, `children`, `links?`, `footer?`) and `LegalFooter` (`children` = the legal links, `copyright?`). Server-safe, no state. Its stories (`Templates › AuthPage`): Wireframe (plan cells, R18-19's line visible), Desktop and Phone (a forgot-password form as the proof), With Partner (`PartnerLogo` in `brand`). Two tokens came with it, both in `theme.css` beside their kind: `--container-card` (28rem; `max-w-card`) and `--opacity-art` (0.5; `opacity-art`). Two forms parts changed for it: `FormFooter fill` (R18-08) and `ErrorSummary`'s one-sentence form with the counted heading (R18-24).

**The views.** A new product-area layer `src/auth/` (`vault|admin|setup|auth` in the layer tiers; `Auth` in Storybook and the catalog) holding **stories only** — each page is a story on `AuthPage` with the forms parts inside; a part lands in `src/auth/*.tsx` the day two pages share one (none do yet: ORGANIZATION §12). Every form sets `warnUnsaved={false}`; every story is `layout: "fullscreen"`, tagged `level-1` and its R18 rows; the Phone stories are `!autodocs`.

| Page (`Auth › …`) | Stories | Title / lede | Body | Ways out |
|---|---|---|---|---|
| SignIn | Default (submit fails after 600 ms, the summary takes the card's top) · Invalid · Phone | Welcome back / Sign in to pick up where you left off. | Email, Password (`current-password`); Sign in | Forgot your password? · New to Paige? Create an account |
| Register | Default · Check Inbox · With Partner · Phone | Create your account / A few details and you’re in. (partner: *Paige, with {partner}.*) | Email, Password (`new-password`, "At least 8 characters. Longer is stronger."); Create account; the terms line under it | Already a member? Sign in |
| Register › Check Inbox | | Check your inbox / We sent a note to {email}. | "Open the link in it to confirm your address, then sign in. It’s good for 24 hours."; Continue to sign in | |
| ForgotPassword | Default · Sent | Forgot your password? / Enter your email and we’ll send a link to set a new one. | Email; Send reset link | Back to sign in |
| ForgotPassword › Sent | | Check your inbox / If {email} is on file, a reset link is on its way. (one copy, known or not — J1-15) | "It’s good for 30 minutes…"; Back to sign in | |
| SetNewPassword | Default · Updated · Expired | Set a new password / Choose one you don’t use anywhere else. | New password; Set password | Back to sign in |
| EnrollPhone | Default · Change Number | Add your mobile number / We’ll text you a code each time you sign in, so only you can get in. (change: Change your mobile number / We’ll text a code to the new number to confirm it.) | `PhoneField`, "Standard text rates apply."; Send code | Sign out (none on change) |
| VerifyCode | Default · Incorrect · Phone | Enter your code / We texted a 6-digit code to the number ending in 0142. | the six digits (R18-07); Verify; "Couldn’t verify" on a wrong code | Resend code in 0:30 → Resend code · Use a different number |
| VerifyEmail | Checking · Confirmed · Invalid | Confirming your email / One moment while we check the link. → Email confirmed / Your account is ready. → This link isn’t valid / It may have been used already, or copied incompletely. | a `role="status"` spinner line, or Sign in | |
| ConfirmEmail | Applying · Updated · Invalid | Updating your email → Email updated / From now on, sign in as {email}. → This link isn’t valid / It may have expired or been used already. Ask for a new one from your account. | spinner line, or Sign in | |
| AcceptInvite | Gate · Document · Delegate · Memory · Expired · Phone | You’ve been invited / {inviter} shared a document with you on Paige. → Accept document access · Help keep a legacy secure · A memory for you → This invitation has expired / Ask {inviter} to send a new one. | one line of what accepting means; Accept + Not now (gate: Create an account + Sign in) | |

**Checked on 6107** (restarted for the new folder): `index.json` lists 5 `templates-authpage-*` and 38 `auth-*` entries; `run-plays.mjs auth templates-authpage` 33/33 render; screenshots at 1280×900 — SignIn Default and Invalid (the summary reads "Couldn’t sign in / The email and password didn’t match an account. Check both and try again."), Register Default, VerifyCode Incorrect, AcceptInvite Document — and Register Phone at 375×667. `typecheck`, `lint`, `check` (tokens 0 in Paige code, layers 0, exports 150, reuse 0, vocab at the 74 baseline), 259 unit tests. Catalog regenerated: `AuthPage` is the one new row (the views have no component of their own).

**Level.** Template and views at **level 1** (LEVELS.md: George approved the direction, one story per state, in their layer folders, no plays required). Level 2 would take: a play per form (submit empty → summary, submit → pending label, a wrong code → "Couldn’t verify"), `run-plays.mjs --a11y` clean on all 43, a walk in `apps/web` on 1280 and 375 (the app has no auth route yet), and the real legal links. That is George's call to ask for.

## Guides (INTAKE § Applied next, 1) — landed 2026-10-30

The shadcn.io **Guides** overlay (the layout lines George liked) is a third-party registry item behind a free account; the token is a Bearer token (their MCP config says so). George scoped the token rule to unmanned runs and put the token in a file outside the repo; `npm run ui:intake -w packages/ui -- https://www.shadcn.io/r/guides.json --from-file …` landed it in `src/labs/intake/guides/` (the secret never passed through chat or a shell line).

**Survey (what arrived).** One file, 280 lines, `cn` only: **no npm dependencies, no registry dependencies, no CSS variables of its own**, no Base UI, no `tailwind-variants` — far less than INTAKE's third-party row assumed. Plain markup: an `aria-hidden` `pointer-events-none` absolute layer that fills its `relative` parent; lines are `border-s`/`border-t` in the theme's border colour, marks are inline SVGs in `muted-foreground`. Props: `bleed`, `extend` (none·sm·md·lg), `fade`, `gutter` (hatch·dots), `inner`, `inset`, `markShape`, `marks`, `rules`, `sides`, `variant` (solid·dashed). Renders on our theme untouched (Plan and Gutter stories checked on 6107). `check:tokens` counts 9 findings in it, all **arbitrary values**: three mask gradients (`fade`), two background patterns (`gutter`), `[--guides-inset:…]` steps, `calc(50%+0.5px)` mark translates, `-inset-x-[100vw]` (`bleed`).

**Licence.** A free item. shadcn.io's licence page is the Pro licence and says "the free components … need only a free account, and nothing on this page makes them Pro" — there is **no stated open-source licence** for free items. Recorded in the `@from` line. Acceptable for a story helper that never ships (I-04); **George to confirm** he is fine with that footing — if not, our own helper is the fallback (half a day).

**Conformed (Step 4, 2026-10-30, George: "please").** `src/stories/guides.tsx` + `src/stories/guides.css`; the as-arrived copy in `labs/intake/` is gone (git has it at `78b5da4ab`; INTAKE says `@from` + `changed:` is the record). The `changed:` lines: every arbitrary value → a `guides-*` utility in `guides.css` (`@utility`, like theme.css's `focus-ring`; masks, pattern fills, `--guides-inset` steps as literal rems named by spacing step, mark offsets, bleed) — `.storybook/preview.css` imports it, `theme.css` never does, so nothing ships; the lines' colour explicit (`border-border`, was the base layer's default); `variant` → `lineStyle`; RTL mark flips dropped (en-US only, R5-01); `border-0` on the root dropped; interface → type, exports at the foot, house formatting. No `cva`: Guides has no archetype axes, only class maps on its own words, and `check:vocab` skips `src/stories` anyway. `check:tokens` 0 in Paige code (the 9 upstream findings went with the copy); typecheck, lint, layers, exports, reuse clean.

**Adopted.** `Placeholder` and `PlaceholderImage` take `plan`: `relative`, square corners, the dashed border transparent, and `<Guides extend="sm" marks="corners" />` first in the box — hairlines 8px past the corners, a plus on each crossing. Welcome's Wireframe passes `plan` on its five slots (the first user, as planned); nothing else changed look. Checked on 6107: Welcome Wireframe at 1280 (5 Guides, 20 marks, offsets resolve), and every option on `Labs › Wireframes › Guides` (now `Foundations › Wireframes`, G-03).

**Checkpoint 5 — George, 2026-10-30: "that is sooo much better. let's keep that as a standard."**

| ID | Decision | Outcome |
|---|---|---|
| G-01 | `plan` becomes every Wireframe's look (flip the default) or stays opt-in | **Agreed, built**: Placeholder and PlaceholderImage default to the plan cell; Welcome's explicit `plan` props came off; `plan={false}` keeps the dashed box for the odd story where lines would collide; the xs size (a 24px line of text) draws lines without marks, which would be more than half its height. Every Wireframe (templates, setup, vault pages, the primitives' demos, labs/auth) now draws as a plan with no story edits. Written as the standard in ORGANIZATION.md §11 and CLAUDE.md § Rules |
| G-02 | Guides' lines at `border` (neutral-300) or the lighter `divider-tint` | Kept `border` (the look George approved) |
| G-03 | The `Labs › Wireframes` page (Placeholders · Plain · Guides' options) becomes `Foundations › Wireframes` — which amends "helpers have no story of their own" (CLAUDE.md § Rules, 2026-10-28) — or goes | **Approved** (George 2026-10-30 "approved."): moved to `src/foundations/wireframes.stories.tsx`; the rule now carries this one exception — the page documents how Wireframes are drawn, the helpers stay out of the catalog |
| G-04 | Licence footing: a free shadcn.io item with free-account terms and no stated open-source licence, as a story helper that never ships | Taken as accepted with the standard; recorded in the `@from` line |

**Status: approved, level 2** (INTAKE Checkpoint 5: look approved, plays pass on every Wireframe that uses it, walked on 6107, screenshots above; hardening to level 3 is its own pass). The first third-party intake went end to end — land with `ui:intake`, Conform, adopt — in one afternoon, which is what INTAKE was for.

## Status

| ID | Status |
|---|---|
| R18-01, R18-02, R18-04…R18-09, R18-11…R18-15, R18-24, R18-26 | **built** (level 1, 2026-10-30): `templates/auth-page.tsx`, `src/auth/*.stories.tsx`, `FormFooter fill`, `ErrorSummary` one-sentence form |
| R18-03 | built as a slot (`brand`) with `PartnerLogo` in the With Partner stories; **George**: carry co-branding or not (open question 3) |
| R18-10 | out (a status is the card, not a box in it) |
| R18-16 | story helper, later |
| R18-17…R18-23, R18-25 | **built** (agreed at Checkpoint 2, George 2026-10-30: the live look + a fixed top); `--container-card`, `--opacity-art` named |
| Level 2 for the door | George's call (plays, `--a11y`, a walk in `apps/web`, the real legal links) |
| Guides | **approved** (level 2, `src/stories/guides.tsx`); the plan cell is every Placeholder's default (G-01); `Foundations › Wireframes` (G-03) |
