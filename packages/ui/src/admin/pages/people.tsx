"use client"

import { useEffect, useState, type ElementType } from "react"
import { CalendarPlus, CreditCard, KeyRound, LockOpen, Mail, Power, PowerOff } from "lucide-react"

import { formatDay, plural } from "../../lib/format"
import { sortValuesOf, type ListConfig } from "../../lib/list-query"
import {
  describePlanPreview,
  formatAgo,
  matchPerson,
  peopleDefaultSort,
  peopleFilters,
  peopleSegments,
  PERSON_STATUS as STATUS,
  PLAN_CHOICES,
  PLAN_LABEL,
  TRIAL_CHOICES,
  type PersonActionId,
  type PersonActionInput,
  type PersonRow,
  type PlanChangePreview,
  type PlanKind,
  type PreviewPlanChange,
} from "../people-rules"
import type { ListAction } from "../../components/actions/row-actions"
import type { ActionResult } from "../../components/overlays/confirm-dialog"
import type { DataTableColumn } from "../../components/display/data-table"
import { Badge } from "../../components/display/badge"
import { Select } from "../../components/inputs/select"
import { Field, FieldLabel } from "../../forms/field"

/* The admin People list's own parts (R12-10, rationale in REVIEW-12): what the generic list page
   pattern (templates/list-page.tsx) is given for people. Everything here is People-specific;
   everything it plugs into is generic. The data and rules (row type, kinds, cards, filters, the
   preview's words) are `people-rules.ts`, pure and tested (R17-08).
   The fields, statuses and actions come from what admins use today (the Vue admin's
   features/admin-people: the person's sign-in, subscription and partner; the support actions,
   grouped Sign-in · Billing, each off with its reason; every action asks why, for the audit
   trail). The plan vocabulary is the company's subscription kinds: Direct, Sponsored,
   Discounted, Free, Trial, No plan, Cancelled.
   - Columns: the person (name, a link to their page, over their email), plan (the partner over
     the kind, or the kind alone, R16-06), status, created, last active (the dates right-aligned,
     being compared).
   - Segments (the filter cards): All · Paying (Direct or Discounted) · Sponsored · Trial · Needs
     attention (past due, locked out or unverified: the questions support asks first).
   - Filters (R13-06, a popover applied together, mirrored by chips): plan (any of the seven
     kinds), status (any), last active and created (date ranges), partner (one).
   - Row actions: Sign-in (resend verification, unlock, reset MFA, enable); Billing (change
     plan…, extend trial…); Disable account last, confirmed, not red (it can be enabled again).
     No "View person" (R13-03): the row click and the name link already open the person.
   - Change plan is a real plan change (R13-08): the API carries it through to Stripe; the
     confirm shows the API's preview (charged now, the next invoice) for the plan chosen
     (`previewPlan`). API-NEEDS.md has the endpoints.
   - Bulk actions: resend verification (to the unverified among them), disable accounts. Switched
     off on the page for now (R16-06, George 2026-10-21: selection made everything harder); kept
     here to come back.
   Disable/enable has no endpoint yet and isn't in the Vue admin's list (GAPS #132). */

/** The People columns. `href` is the person's page; `now` makes "last active" relative.
    Widths (R20-25): the list is resizable, so each column states where it starts; the last one
    takes what is left. Created is a typed date (the kind formats and sorts it); Last active stays
    a cell, relative time being no Formatted kind. */
function peopleColumns({ href, linkAs: Link = "a", now }: { href: (p: PersonRow) => string; linkAs?: ElementType; now: Date }): DataTableColumn<PersonRow>[] {
  return [
    {
      id: "name",
      header: "Person",
      width: 230,
      minWidth: 160,
      sortValue: (p) => p.name,
      cell: (p) => (
        // Capped so a long email truncates instead of widening the table (cells don't wrap).
        <span className="flex max-w-64 min-w-0 flex-col">
          <Link href={href(p)} className="w-fit rounded-sm font-medium text-card-foreground focus-ring hover:underline">
            {p.name}
          </Link>
          <span className="truncate text-xs text-muted-foreground">{p.email}</span>
        </span>
      ),
    },
    {
      // One Plan column (R16-06, George 2026-10-21, after the Vue admin's Partner column): the partner
      // on top and the kind under it (Sponsored, Discounted), or the kind alone without a partner.
      id: "plan",
      header: "Plan",
      width: 190,
      sortValue: (p) => `${p.partner ?? ""} ${PLAN_LABEL[p.plan]}`.trim(),
      cell: (p) =>
        p.partner ? (
          // Partner names run long ("Summit Wealth Partners"): they wrap, as the person column already has two lines.
          <span className="flex max-w-44 flex-col whitespace-normal">
            <span className="font-medium">{p.partner}</span>
            <span className="text-xs text-muted-foreground">{PLAN_LABEL[p.plan]}</span>
          </span>
        ) : (
          <span className="font-medium">{PLAN_LABEL[p.plan]}</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      width: 150,
      sortValue: (p) => STATUS[p.status].label,
      cell: (p) => (
        <Badge tone={STATUS[p.status].tone} appearance={STATUS[p.status].outline ? "outline" : "soft"}>
          {STATUS[p.status].label}
        </Badge>
      ),
    },
    { id: "created", header: "Created", type: "date", width: 130, value: (p) => p.createdAt },
    {
      id: "lastActive",
      header: "Last active",
      numeric: true,
      width: 120,
      sortValue: (p) => p.lastActiveAt,
      cell: (p) => <span title={p.lastActiveAt ? formatDay(p.lastActiveAt) : undefined}>{formatAgo(p.lastActiveAt, now)}</span>,
    },
  ]
}

/** Runs a support action for these people (the page calls the API; the fixtures simulate it). */
type RunPersonAction = (id: PersonActionId, people: PersonRow[], input: PersonActionInput) => ActionResult | Promise<ActionResult>

/** A Select in a confirm whose value the action reads when it runs. */
function ChoiceField<V extends string>({ label, options, initial, onChange }: { label: string; options: { value: V; label: string }[]; initial: V; onChange: (v: V) => void }) {
  const [value, setValue] = useState<V>(initial)
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        options={options}
        value={value}
        onValueChange={(v) => {
          setValue(v as V)
          onChange(v as V)
        }}
      />
    </Field>
  )
}

/** The plan to move to and, under it, what the change will do per the API's preview. */
function PlanChangeFields({ person, initial, preview, onChange }: { person: PersonRow; initial: PlanKind; preview?: PreviewPlanChange; onChange: (plan: PlanKind) => void }) {
  const [plan, setPlan] = useState(initial)
  const [result, setResult] = useState<PlanChangePreview | { error: string } | "loading" | null>(preview ? "loading" : null)
  useEffect(() => {
    if (!preview) return
    let live = true
    setResult("loading")
    preview(person, plan).then(
      (r) => live && setResult(r),
      () => live && setResult({ error: "Stripe's preview isn't available right now." })
    )
    return () => {
      live = false
    }
  }, [preview, person, plan])
  return (
    <>
      <ChoiceField
        label="New plan"
        options={PLAN_CHOICES}
        initial={initial}
        onChange={(v) => {
          setPlan(v)
          onChange(v)
        }}
      />
      {result && (
        <p data-slot="plan-preview" aria-live="polite" className="text-sm font-medium text-body-muted">
          {result === "loading"
            ? "Checking what Stripe will charge…"
            : "error" in result
              ? result.error
              : describePlanPreview(result)}
        </p>
      )}
    </>
  )
}

/** One person's row actions, in the person page's groups; each off with its reason when it can't apply. */
function personActions(p: PersonRow, { run, previewPlan }: { run: RunPersonAction; previewPlan?: PreviewPlanChange }): ListAction[] {
  const who = [p]
  const disabled = p.status === "disabled"
  const plan: { plan: PlanKind } = { plan: "direct" }
  const trial = { days: 14 }
  const actions: ListAction[] = [
    {
      kind: "action",
      id: "verificationEmail",
      group: "Sign-in",
      label: "Resend verification email",
      icon: <Mail aria-hidden />,
      disabledReason: p.status === "unverified" ? undefined : "Email already verified",
      confirm: { title: `Resend the verification email to ${p.name}?`, description: `Sends ${p.email} the link that verifies it.`, confirmLabel: "Send email", reason: "required" },
      run: ({ reason }) => run("verificationEmail", who, { reason }),
    },
    {
      kind: "action",
      id: "unlock",
      group: "Sign-in",
      label: "Unlock sign-in",
      icon: <LockOpen aria-hidden />,
      disabledReason: p.status === "locked" ? undefined : "Not locked out",
      confirm: { title: `Unlock ${p.name}'s sign-in?`, description: "Clears the lockout and the failed sign-in attempts.", confirmLabel: "Unlock", reason: "required" },
      run: ({ reason }) => run("unlock", who, { reason }),
    },
    {
      kind: "action",
      id: "resetMfa",
      group: "Sign-in",
      label: "Reset MFA phone",
      icon: <KeyRound aria-hidden />,
      disabledReason: p.mfaPhone ? undefined : "No MFA phone on file",
      confirm: { title: `Reset ${p.name}'s MFA phone?`, description: "Removes the phone and ends their sessions. They enroll a phone at their next sign-in.", confirmLabel: "Reset MFA phone", reason: "required" },
      run: ({ reason }) => run("resetMfa", who, { reason }),
    },
  ]
  if (disabled)
    actions.push({
      kind: "action",
      id: "enable",
      group: "Sign-in",
      label: "Enable account",
      icon: <Power aria-hidden />,
      confirm: { title: `Enable ${p.name}'s account?`, description: "They can sign in again.", confirmLabel: "Enable account", reason: "required" },
      run: ({ reason }) => run("enable", who, { reason }),
    })
  actions.push(
    {
      kind: "action",
      id: "changePlan",
      group: "Billing",
      label: "Change plan…",
      icon: <CreditCard aria-hidden />,
      disabledReason: disabled ? "The account is disabled" : undefined,
      confirm: {
        title: `Change ${p.name}'s plan`,
        description: `They're on ${PLAN_LABEL[p.plan]}${p.partner ? ` through ${p.partner}` : ""}.`,
        confirmLabel: "Change plan",
        reason: "required",
        children: <PlanChangeFields person={p} initial={plan.plan} preview={previewPlan} onChange={(v) => (plan.plan = v)} />,
      },
      run: ({ reason }) => run("changePlan", who, { reason, plan: plan.plan }),
    },
    {
      kind: "action",
      id: "extendTrial",
      group: "Billing",
      label: "Extend trial…",
      icon: <CalendarPlus aria-hidden />,
      disabledReason: p.plan === "trial" ? undefined : "Not in a trial",
      confirm: {
        title: `Extend ${p.name}'s trial`,
        description: p.trialEndsAt ? `It ends ${formatDay(p.trialEndsAt)}.` : undefined,
        confirmLabel: "Extend trial",
        reason: "required",
        children: <ChoiceField label="Extend by" options={TRIAL_CHOICES} initial="14" onChange={(v) => (trial.days = Number(v))} />,
      },
      run: ({ reason }) => run("extendTrial", who, { reason, days: trial.days }),
    }
  )
  if (!disabled)
    actions.push({
      kind: "destructive",
      id: "disable",
      label: "Disable account",
      icon: <PowerOff aria-hidden />,
      confirm: {
        title: `Disable ${p.name}'s account?`,
        description: "They're signed out everywhere and can't sign in until it's enabled again. Nothing in their vault is removed.",
        confirmLabel: "Disable account",
        reason: "required",
      },
      run: ({ reason }) => run("disable", who, { reason }),
    })
  return actions
}


/** The selection's actions: resend verification (to the unverified among them), disable accounts. */
function peopleBulkActions(selected: PersonRow[], run: RunPersonAction): ListAction[] {
  const unverified = selected.filter((p) => p.status === "unverified")
  const enabled = selected.filter((p) => p.status !== "disabled")
  const skipped = (n: number, why: string) => (n > 0 ? ` ${plural(n, "person", "people")} ${why} ${n === 1 ? "is" : "are"} skipped.` : "")
  return [
    {
      kind: "action",
      id: "verificationEmail",
      label: "Resend verification email",
      icon: <Mail aria-hidden />,
      disabledReason: unverified.length ? undefined : "No one selected is unverified",
      confirm: {
        title: `Resend the verification email to ${plural(unverified.length, "person", "people")}?`,
        description: `Sends each the link that verifies their email.${skipped(selected.length - unverified.length, "already verified")}`,
        confirmLabel: "Send emails",
        reason: "required",
      },
      run: ({ reason }) => run("verificationEmail", unverified, { reason }),
    },
    {
      kind: "destructive",
      id: "disableMany",
      label: "Disable accounts",
      icon: <PowerOff aria-hidden />,
      disabledReason: enabled.length ? undefined : "They're all disabled already",
      confirm: {
        title: `Disable ${plural(enabled.length, "account", "accounts")}?`,
        description: `They're signed out everywhere and can't sign in until enabled again. Nothing in their vaults is removed.${skipped(selected.length - enabled.length, "already disabled")}`,
        confirmLabel: enabled.length === 1 ? "Disable account" : `Disable ${enabled.length} accounts`,
        reason: "required",
      },
      run: ({ reason }) => run("disableMany", enabled, { reason }),
    },
  ]
}

/* R17-06: the People page's fixed parts, shared by its story and the app screen so the two can't drift:
   the heading, ListPage's props that don't change, the list state's config (the app keeps it in
   the URL), and what an action says it did. The caller adds the rows, the state and the handlers. */
/** The People list: everyone with a sign-in, their plan and standing, and the support actions; ListPage's parts for it. */
function peoplePage({ href, linkAs, now, partners, today }: { href: (p: PersonRow) => string; linkAs?: ElementType; now: Date; partners: readonly string[]; today: string }) {
  const columns = peopleColumns({ href, linkAs, now })
  const filters = peopleFilters(partners)
  const search = { match: matchPerson, label: "Search people", placeholder: "Search by name or email" }
  const config: ListConfig<PersonRow> = { segments: peopleSegments, filters, search: matchPerson, sortValues: sortValuesOf(columns), defaultSort: peopleDefaultSort }
  return {
    title: "People",
    description: "Everyone with a sign-in: find a person, check their plan, act on their account.",
    config,
    list: {
      noun: { one: "person", other: "people" },
      label: "People",
      getRowId: (p: PersonRow) => p.id,
      rowLabel: (p: PersonRow) => p.name,
      columns,
      segments: peopleSegments,
      filters,
      search,
      defaultSort: peopleDefaultSort,
      emptyMessage: "No one has signed up yet.",
      // The common experience (R20-25, the first page to take it): columns drag, rows compact.
      resizable: true,
      density: "compact" as const,
      linkAs,
      today,
    },
  }
}

export { peopleBulkActions, peopleColumns, peoplePage, personActions }
export type { RunPersonAction }
/* R13-02: the data types and rules live in people-rules.ts; re-exported so a screen imports one entry. */
export { formatAgo, matchPerson, PERSON_STATUS, personActionMessage, peopleDefaultSort, peopleFilters, peopleSegments, PLAN_LABEL } from "../people-rules"
export type { PersonActionId, PersonActionInput, PersonRow, PersonStatus, PlanChangePreview, PlanKind, PreviewPlanChange } from "../people-rules"
