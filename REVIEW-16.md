# Review 16 — Subscriptions (opened 2026-10-21)

The admin Billing › Subscriptions page (`/admin/billing/subscriptions`, already in `adminNav`, no route yet: GAPS #139). Same rules as earlier rounds: a held list, IDs `R16-nn` never reused, statuses → built → verified, plus deferred. **Nothing here is built.** This round is the design pass, the way R13-22 was for Partners: a rationale from what the codebase knows, then open questions, then the build once George has answered.

**Sources read** (2026-10-21). Most of the billing work is on `feature/admin-site`, not this branch; read there with `git show`:
- `agents/docs/admin-site-2026-10.md` (A2 roles, A3 reasons, A5 named use cases, A8 Paige's model with Stripe as a detail, A9 price lines, A10/A11 Stripe untouched until pricing is confirmed and live subscriptions "mapped, never moved", P1–P10 pricing proposals, all unconfirmed);
- `Admin/Billing/ListSubscriptions` (`GET admin/billing/subscriptions`: the nightly Stripe mirror, live mode, status · price-map state · partner · search, paged at 50) and the Vue `BillingSubscriptionsView.vue` it backs (state tabs, Person · Stands for · Partner · Status · Charged · Member pays · Period ends; no row actions);
- `Admin/People` actions, new model only, Stripe untouched: PutPersonOnPlan (a comp with an end date), ExtendPersonTrial (reverted by the next Stripe sync for a Stripe-managed subscription), SetPersonSponsorship;
- ADR 0082 (No plan replaces Free at registration) and `Paige.Migration`'s `SubscriptionRules`;
- on this branch: `Paige.Domain/Entitlements` (`Subscription`: Trial · Active · PastDue · Canceled · Paused · Incomplete, `CurrentPeriodEnd`, `TrialEndsAt`, `CanceledAt`, sponsorship and plan pointers, frozen grants), `Paige.Stripe`'s `SubscriptionSnapshot` (`CancelAtPeriodEnd`, discounts, one price), `docs/architecture/subscription-states.md` (three layers: access, funding, grants; "not one big enum");
- this spike: People (`admin/people.tsx`: `PlanKind`, `PersonStatus`, segments), API-NEEDS A14–A16, A21, A24–A27, A30, A39.

**Scale** (live Stripe load, 2026-10-05, `pricing-billing-report-2026-10.md`): 4,038 subscriptions; 1,912 active, 4 trialing, 3 past due, 17 incomplete, 2,102 canceled. About 74% of customers came through a partner; most partner subscriptions are $0 prices the partner pays for. So the list is ~1,940 live rows: server paging and sorting from the start (DataTable's controlled seam, GAPS #133), not the client paging People's fixtures use.

## The design pass (R16-01)

**(1) A row is one subscription, not a person.** People already answers "who is this person and what are they on" (one plan kind per person). This page answers billing questions across people: what renews this month, who is past due, which partner plans carry how many members, what's ending. A person with a canceled subscription and a newer live one is two rows here and one row in People. Row click opens the person's page (its billing section); the page never edits a person.

**(2) Status and funding are two columns, not one kind.** People's `PlanKind` (direct · sponsored · discounted · free · trial · no plan · cancelled) mixes two questions: *is it working* (trial, cancelled) and *who pays* (direct, sponsored, discounted). `subscription-states.md` warns against exactly that, and no server code derives the seven (they exist only in this spike and A21). On a subscription the two are separate facts:
- **Status** (the model's `SubscriptionStatus`, our words): Trial · Active · Past due · Paused · Canceled · Incomplete. A subscription set to cancel at period end stays Active with "Ends Nov 3" under it; a trial shows "Trial ends Nov 3".
- **Funding**: Self-pay (the member pays list price) · Promotion (a promotion code or coupon lowers it: the code shows) · Partner (a sponsorship: the partner's name and the plan's segment, Customer · VIP · Employee, as on Partners R15-02) · Comp (a Manual billing account: given by support, with its end date).
People's single kind then becomes a server derivation from these two (status + funding → kind), so both pages say the same thing about the same person. That changes A21: recorded below as A42.

**(3) Filter cards** (five at most, counts under the same search and filters):
**Live** (default: Trial, Active, Past due) · **Paying** (live and the member pays something) · **Partner** (live and partner-funded) · **Ending** (live and either canceling at period end or a trial ending within 14 days) · **Needs attention** (Past due, Incomplete, or a price the price map can't explain).
Canceled and Paused aren't cards; the Status filter reaches them (2,102 canceled rows would bury the live ones as a default). "Needs attention" is the operator's queue; "Ending" is the save-them queue.

**(4) Columns** (six, so the table fits the 1280 inset as Partners does):
- **Person**: name (a link to their page) and email under it; "Not matched to a person" with the Stripe customer id when the mirror can't match one (the Vue view's case).
- **Plan**: the plan's name and cadence ("Paige Membership · Annual"); a small "Grandfathered" badge for a kept price version (A12).
- **Funding**: as in (2); a partner links to its partner page.
- **Status**: the badge (Past due in attention ink, never red: R2-03) and its date line ("Ends Nov 3", "Trial ends Nov 3").
- **Member pays**: per term ("$30.00 / year"; "$0 · partner pays"); hovering shows the price lines (list → term discount → agreement → promotion → member pays, A9).
- **Renews**: the current period's end ("Nov 3, 2026"; "—" when it won't renew).
In the Columns menu, off by default: Started, Charged (what Stripe charges, which for a partner plan differs from what the member pays), Subscription id, Customer id, Price map (mapped · provisional · unmapped). Ids and price map are engineering facts (A8: Stripe is a detail), so they're available, not shown.
**Sort**: Renews ascending by default (what's next); any column sorts. **Search**: name, email, subscription id; kept per tab, never in the URL (product rule 7, as People).

**(5) Filters** (the Filters popover, R13-06): Status (any of, all six), Funding (any of), Partner (any of), Plan (any of), Renews (date range), Started (date range).

**(6) Actions: none on the list in this round; Go to only.** What exists: on `feature/admin-site`, three new-model actions that leave Stripe alone, and Extend trial is undone by the next sync for any Stripe-managed subscription. What doesn't: cancel for someone, reactivate, refund, a plan change through Stripe, retry a payment. Those all wait on Stripe writes, which the admin plan puts last (after P1–P9). A Cancel or Refund that does nothing, or that the night's sync reverses, is broken UI; absent beats broken. So each row's menu is **Go to**: View person (their billing section), Partner (when partner-funded), and copy the subscription id. The person-level actions (put on a plan, extend a trial, move onto or off a partner plan) stay on the person's page, where admin-site already put them. When Stripe writes land, the list's Subscription group (Cancel at period end, Extend trial, Change plan with its preview, A25/A26) is one `ListAction` edit, destructive last and confirmed with a reason (A3).

**(7) States**: loading (the table's skeleton and the cards' counts as skeletons), empty (per card: "Nothing needs attention."), error with Retry in place, a stale-data line ("As of 1:30 AM": the mirror is nightly; the response carries `asOf`), no-permission (Reporting, Support and Admin may read, A2; anyone else gets the admin site's 403).

**(8) Not on this page**: MRR, ARR, churn and active-subscriber metrics. They live on Pulse and have no definition yet (A14, A15, GAPS #130); a number here before its definition would be the wrong number. Purchases (one-time wills) isn't a subscription and has no clean source yet.

## Open questions for George

| | Question | Options | Recommendation |
|---|---|---|---|
| (a) | What is a row? | One subscription · one person with their current billing | **One subscription** (1). People is the person view. |
| (b) | Status and who pays: two columns, or People's single plan kind? | Two columns, and People's kind derived from them on the server · People's seven kinds here too | **Two columns** (2). It also gives People's kind one definition instead of the web's guess. |
| (c) | Actions on the list now? | None, Go to only, until Stripe writes · the three admin-site new-model actions now, with a warning that Stripe-managed ones are reverted at night | **Go to only** (6). The person page already holds the new-model actions. |
| (d) | "Discounted": what does it mean? | A promotion code or coupon (Stripe discount) · any partner discount below list · both | **A promotion code or coupon**, named "Promotion"; partner pricing is "Partner". Today the report's "Discounted Customer" means something else (any non-VIP, non-Employee bank user), so the old word goes. |
| (e) | Default view | Live · everything | **Live** (3). |

## Two pages: Plans, then Subscriptions (R16-03, George 2026-10-21)

Sketched with George after a first build of R16-02 (two sketches in the session). **Supersedes R16-02 and answer (f).**

- **Partners offer prices, not discounts** (George). A partner plan (Cedar Trust · VIP) has its own price ($0 a year, $15 a year), not "Paige's list price less a partner discount". So the price map's reading is gone from the UI: no provisional (pricing resting on unconfirmed proposals), no price lines, no "stands for … covers it", no mapped or not-mapped state. A price belongs to a plan, Paige's or a partner's, and has an amount. A promotion code stays what it is: a discount on one member's subscription.
- **Two pages, Plans first in the nav, both the common list page** (filter cards, search, Filters with chips, the table, row menus):
  - **Plans** (`/admin/billing/plans`; the Vue admin's Pricing): one row per plan price. Columns: Plan (its name and cycle, the Stripe price id under it; Grandfathered for a kept old price), Offered by (Paige or the partner), Price, Live, Past due, Ending. Cards: Live (prices with live subscriptions; default) · Paige · Partner · Grandfathered · Needs attention (someone on it past due). A trial is a subscription's state, not a price, so a trial Stripe price folds into its plan's price. Legacy prices show as grandfathered Paige prices.
  - **Subscriptions** (`/admin/billing/subscriptions`; the Vue admin's Subscriptions): R16-01's list, flat. Columns: Person, Plan (and who offers it), Status, Started, Renews, Last payment, Pays, Promotion. Cards: Live · Paying · Partner · Ending · Needs attention (past due or incomplete). A row opens the subscription's page (R16-02 (5), less the price lines).
- **Linked by a filter, not nested.** A Plans row opens Subscriptions filtered to that price (`?plan=<price>`), as Partners' View people opens People; the filter shows as a chip with Clear all, so the person is on the whole Subscriptions page and can widen it.

## Stale (R16-03): the master page, plans first (R16-02, George 2026-10-21)

George, looking at the Vue admin (`feature/admin-site`): its price views are the best start, because they show the plan, then its prices, with the details that matter (Billing › Pricing: a section per plan with its price versions and live counts; Stripe › Prices: each Stripe price and what it stands for, who covers the discount, trial, live count). Their naming ("offering") is wrong. Subscriptions should open on that view and drill into the subscriptions on a price. So R16-01's list is the drill-down, not the page you land on.

**(1) The master: one section per plan, one row per price.**
- **A section per plan** (Paige Membership; a will plan; the grandfathered 2020 tiers): the plan's name, its live subscriptions in total, and how many are past due or ending.
- **A row per price version** (a term at an amount, version n): **Price** (term and list price, "Annual · $47.88", with Grandfathered or Provisional badges and v2 muted), **Member pays** (the range across the Stripe prices that stand for it: "$0 – $47.88"), **Funding** (counts of live subscriptions by who pays: self-pay, promotion, partner, comp, as small figures), **Live**, **Past due**, **Ending** (counts), **Stripe prices** (how many stand for it).
- **Under a row**, opened in place (DataTable's expandable row, new): the Stripe prices that stand for it, each with what it charges, who covers the discount ("Cedar Trust covers it", "Paige discount", none), Trial, its price-map state and its live count. That's the Vue Stripe › Prices table, grouped under the price it stands for instead of flat.
- **A last section, "Not explained by a plan"**: Stripe prices the price map doesn't map. With live subscriptions on them, they count toward Needs attention. Test prices aren't shown (a filter brings them back). Partner contract fees aren't on the page at all (h).
- **Above the sections**: the page header, an "As of 1:30 AM" line, and a search that jumps straight to a person or subscription id (it opens the drill-down with that search), so finding one person never needs the tree.
- **No metric cards**: counts live in the rows. MRR and churn stay on Pulse (8).

**(2) The drill-down: the subscriptions on one price** (`/admin/billing/subscriptions/<price>`, the price's key). A header with the price's facts (plan, term, list price, version, badges), its price lines (A9: list → term discount → agreement → promotion → member pays) and the Stripe prices standing for it; then R16-01's list as designed (cards, columns, filters, Go to), scoped to that price. The same list also opens from a plan section ("All on Paige Membership") and from the header search ("All subscriptions"), so a cross-price question ("who's past due anywhere?") has one place too: the Needs attention card, unscoped.

**(3) What it replaces.** R16-01 (a) stands: a row in the list is one subscription. What changes is where you land: on plans and prices, never on 1,900 rows.

**(4) One page, named Subscriptions** (f). This master *is* the plans list, with counts, so the Plans nav entry (`/admin/billing/plans`, R15-09) goes: one page, and "Subscriptions" is the least ambiguous name. Catalog editing (a new price version, confirming P1–P10) has no backend; when it comes it's a section or an action here, not a second page. The path stays `/admin/billing/subscriptions` as provisional as every admin href (GAPS #108).

**(5) The drill-down list is subscriptions and who is on them; the details are one click further** (g). The table carries what you scan: **Person** (name, linking to their page; email under it), **Status** (badge and its date line), **Started**, **Renews / Ends** (the period end, or the end date when it won't renew), **Last payment** (amount and date; a failed one in attention ink with "Failed"), **Member pays** (per cycle: "$30.00 / year", so the cycle shows where the list spans terms), **Funding**. Columns menu: Canceled on, Trial ends, Charged, ids. **Row click opens the subscription's details** in a panel beside the list (the Sheet base, kept in the URL as `?subscription=<id>` like the DAG's selection, so Back and a shared link work); the person's name still goes to the person. The panel:
- **Subscription**: status, started, current period (start – end), cycle, renews on or ends on, canceled on, trial ends.
- **Price**: plan and price version, the price lines (A9), the Stripe price it's on.
- **Funding**: self-pay, the promotion code, the partner and segment, or the comp and its end.
- **Payments**: every payment on it, newest first: date, amount, the period it paid for, and paid · failed · refunded (partly or in full) · open. Stripe's manual ledger entries are left out (h).
- **Go to**: the person, the partner (when partner-funded); copy the subscription and customer ids.

**(6) Partner invoices are going away** (h, George 2026-10-21). Partners won't be invoiced through the app; the partner data kept as an exception lives outside it. So the page shows no partner contract fees and no partner-invoice payments, and it ignores Stripe's manual ledger entries (the out-of-band payments recorded by hand). Partner-*funded member* subscriptions (the $0 sponsored ones) stay: they're members' subscriptions. Found in passing: Pulse's "partner invoices per quarter" and the reporting that counts invoices and payments outside Stripe rest on what's going away (follow-up, not this page).

**Answers (George, 2026-10-21)**

| | Question | Options | Recommendation |
|---|---|---|---|
| (f) | The Plans nav entry | Remove it until catalog editing exists; Subscriptions is the plans view · keep Plans as the catalog (proposals, versions) and Subscriptions as counts and drill-down | **One page, named Subscriptions** (the least ambiguous); the path isn't settled. (4) |
| (g) | What you drill into | A price version (term · amount · version) · a whole plan · one Stripe price | **The list of subscriptions and the person on each**, with start, end, cycle, last payment, payments and the rest: some in the table, the rest in the details. (5); the scope is a price version, as recommended |
| (h) | Partner contract fees (the partner's own invoice, not a member) | Their own section on this page · only on Partners and the rev share statement | **Neither: partner invoices are going away**; the partner data kept as an exception lives outside the app; ignore Stripe's manual ledger entries. (6) |

## What the API owes (API-NEEDS A41–A45, rewritten for R16-03)

- **A41, the Subscriptions list**: a row per subscription with its status, dates, the plan price it's on, any promotion code or comp, what the member pays, the last payment, the person and the Stripe ids; server-side counts, filters, sort and paging.
- **A42, one status derivation**: and People's plan kind derived from the person's current subscription, so both pages agree.
- **A43, `unpaid`**: one meaning (past due).
- **A44, the Plans list**: every plan price, Paige's and partners', with live, past-due and ending counts from A41's rows. Admin-site's `GET admin/billing/pricing` reads prices through the price map; that reading goes.
- **A45, one subscription**: A41's row plus the current period and its payments, manual ledger entries left out.

## Found in passing (engineering, not this page)

- `reporting.SubscriptionClasses` and `SubscriptionStates` are cited by ADR 0082 and the migrator but aren't committed on any branch.
- ADR number 0081 is two different documents (`operator-reporting` on `feature/admin-site`, `kinship-role-group` on `feature/cy-areas`); one needs renumbering when they meet develop.
- This branch still has `EstablishDefaultSubscription` and the catalog Free plan that ADR 0082 retired on `feature/admin-site`.
- The spike's People `PLAN_CHOICES` says Direct is "$99 a year"; P1 proposes $47.88 list, $30 after the term discount. Both are unconfirmed; the fixture should say neither until P1 is decided.

| ID | Item | Take | Status |
|---|---|---|---|
| R16-01 | Subscriptions list: design pass | (1)–(8) above; questions (a)–(e) | **agreed** (George, 2026-10-21: "I think that is correct"; the recommendations stand for (a)–(e)). It becomes the drill-down under R16-02 |
| R16-02 | Subscriptions opens on plans and prices | The master above: a section per plan, a row per price version with counts, its Stripe prices opened in place, the unmapped and partner-fee sections; drill into a price's subscriptions (R16-01's list, scoped); questions (f)–(h) | **superseded by R16-03** (2026-10-21): built once, then reworked after sketching |
| R16-03 | Plans, then Subscriptions | Two common list pages linked by a filter; partners offer prices, not discounts (above) | **built** (2026-10-21). Built: `admin/subscription-rules.ts` (types for A41/A44/A45, the words, both pages' cards and filters, `planPriceRows`; 8 tests), `admin/plans.tsx` (Plans columns and row menu), `admin/subscriptions.tsx` (Subscriptions columns and row menu, `SubscriptionDetailSections`); app routes `/admin/billing/plans`, `/admin/billing/subscriptions`, `/admin/billing/subscriptions/[id]`; `adminNav` Plans then Subscriptions; fixtures in `stories/subscriptions-data.ts` and `apps/web/fixtures/subscriptions.ts` (People's people). Stories: Admin › PlansPage, Admin › SubscriptionsPage (with Details per kind). **Changed from the design** (4): the subscription opens on a page of its own, not a panel (a panel is a new overlay component; a page gives Back and a shared link); Started and Promotion are in the Columns menu and the promotion code sits under Pays, so the table fits the 1280 inset (it was 1168 in 911); a trial Stripe price folds into its plan's price (a trial is a state); legacy prices are grandfathered Paige prices. Verified: typecheck, 221 unit tests, check:tokens/layers/exports, lint (0 errors), plays 21/21 for both pages; 3105 at 1440 and 1280: Plans (12 live prices), Cedar Trust · VIP → Subscriptions filtered to its 10 with the chip, Needs attention, a past-due subscription's page (the failed renewal first). Not verified: phone width by hand beyond the cards stacking; the clipboard in a foreground browser |
| R16-04 | Subscriptions cards: Direct and Partner instead of Paying | George (2026-10-21): use Plans' split; Paige is Direct; a hybrid plan (a partner's that the member also pays for) is Partner. Cards: Live · Direct · Partner · Ending · Needs attention | **built** (2026-10-21). Built: `subscriptionSegments` (Direct = live on a Paige plan; Paying and `isPaying` removed). Plans keeps its Paige card, matching its Offered by column |
| R16-05 | Promotion codes, from the Vue admin's page | A third Billing page on the common list page: Code · Takes off · For · Redeemed · Live · Status; cards Active · In use · Partner · Inactive (or gone from Stripe) · All codes; a row opens Subscriptions filtered to the code (`?promotion=<code>`), as Plans does. The Vue page's code map (mapped, not mapped, "decide") goes with the price map (R16-03): "For" is a partner, a program or a dash | **built** (2026-10-21). Built: rules in `subscription-rules.ts` (types for A46, what a code takes off, who it's for, the cards and filters; tested), `admin/promotion-codes.tsx`, `/admin/billing/promotion-codes`, nav Plans · Subscriptions · Promotion codes; Subscriptions' Promotion filter is now the codes (any of). Fixtures: 12 invented codes, live counts from the subscriptions. Story: Admin › PromotionCodesPage. Verified: 221 unit tests, checks, lint, plays 27/27 for the three pages; 3105 at 1280: 8 active codes, the table fits, DEVSIDE26 → Subscriptions filtered to its 3. Not verified: phone width by hand; the clipboard in a foreground browser |
| R16-06 | Consistency pass on the admin lists (George, 2026-10-21) | (1) People: Plan and Partner become one **Plan** column, the partner over the kind (Sponsored, Discounted) as the Vue admin's Partner column, or the kind alone. (2) People: no row selection for now (it makes everything harder); add it back later. (3) Partners: no logo in the table (it stays on the partner's page and in Update logo); the People count is the link to People, no arrow icon (it read as a trend). (4) Subscriptions: as is. (5) Plans: Cycle gets its own column and Price is the amount alone, so prices line up. (6) Promotion codes: Created shown | **built** (2026-10-21). Built: `peopleColumns` (one Plan column; `peopleBulkActions` kept, not wired: GAPS #150), `partnerColumns` (no logo, the count is the link), `planColumns` (Cycle; Price via `formatCents`), `codeColumns` (Created shown). Verified: 221 unit tests, checks, lint, plays 49/49 for People, Partners, Plans, Subscriptions and Promotion codes; 3105 at 1280: every list fits its box (911 or 926), no images in any table, Plans' prices share one right edge, a sponsored person reads "Cedar Trust / Sponsored" |
