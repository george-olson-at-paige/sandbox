"use client"

import type { ChangeEvent, ElementType } from "react"
import { formatCents, formatCount, plural, possessive } from "../lib/format"
import { useState } from "react"
import { CircleCheck } from "lucide-react"

import {
  describeRevShare,
  fromRevShareDraft,
  planName,
  shareCents,
  toRevShareDraft,
  validateRevShareDraft,
  type PartnerPlan,
  type PartnerRevShare,
  type PartnerRow,
  type RevShareDraft,
  type RevShareParams,
} from "./partner-rules"
import { Button } from "../components/actions/button"
import { Badge } from "../components/display/badge"
import { Card } from "../components/display/card"
import { Checkbox } from "../components/inputs/checkbox"
import { Input } from "../components/inputs/input"
import { ConfirmDialog, type ActionResult } from "../components/overlays/confirm-dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { FieldGroup } from "../forms/field-group"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { InlineEdit } from "../forms/inline-edit"

/* @archetype Composite (ARCHETYPES.md).
   Rev share (R15-11, R15-12; model in REVIEW-15): a pricing agreement with a partner, its terms in
   HubSpot (not integrated yet). One parameter set: the rate (entered by hand), the paid month
   subscription payments count from, wills counted per person, refunds deducted. The global
   defaults (on /admin/settings) or a partner's override of the whole set; enabled per plan; the
   results are calculated by the API (eligible people, qualifying revenue) and the share is
   revenue × rate.
   - RevShareParamsForm: the four fields, each described in plain words; used for the defaults
     and for a partner's override (Form: pending, errors, input kept on a failure).
   - RevShareParamsView: the set in force, read-only, each value with what it means.
   - PartnerRevShareSection: the partner page's Rev share section: a switch per plan (saves on the
     flip, flips back on a failure), the set labelled Global defaults or Override with Override
     for this partner / Edit override / Use global defaults (confirmed), the results and a link to
     the statement.
   - RevShareDefaultsSection: the defaults on the settings page; saving says how many partners use
     them and that overrides are untouched, in place. */

const money = formatCents

/** The note the rate always carries until HubSpot is integrated (R15-11). */
const RATE_NOTE = "Entered by hand — not connected to HubSpot."

/** The rev share parameter form: rate, count from paid month, wills counted, refunds deducted. */
function RevShareParamsForm({
  initial,
  onSave,
  submitLabel = "Save",
  onCancel,
}: {
  /** The set to start from. */
  initial: RevShareParams
  /** Saves; return `{ error }` when it didn't. */
  onSave: (params: RevShareParams) => ActionResult | Promise<ActionResult>
  /** The submit's label ("Save defaults", "Save override"). */
  submitLabel?: string
  /** Shows a Cancel that calls this. */
  onCancel?: () => void
}) {
  const [values, setValues] = useState<RevShareDraft>(() => toRevShareDraft(initial))
  const set = (k: "ratePercent" | "countFromPaidMonth" | "willsCounted") => (e: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }))
  return (
    <Form
      values={values}
      validate={validateRevShareDraft}
      warnUnsaved={false}
      onSubmit={async (v) => {
        const result = await onSave(fromRevShareDraft(v))
        if (result && "error" in result) return { error: result.error }
      }}
      aria-label="Rev share parameters"
    >
      <FieldGroup>
        <Field name="ratePercent" span={6}>
          <FieldLabel>Rate (%)</FieldLabel>
          <Input inputMode="decimal" value={values.ratePercent} onChange={set("ratePercent")} placeholder="Not set" />
          <FieldDescription>The partner&apos;s share of qualifying revenue. {RATE_NOTE} Leave it empty until you have it; no share is calculated without it.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="countFromPaidMonth" span={6}>
          <FieldLabel>Count from paid month</FieldLabel>
          <Input inputMode="numeric" value={values.countFromPaidMonth} onChange={set("countFromPaidMonth")} />
          <FieldDescription>Subscription payments count from this paid month on. With 4, a person&apos;s first three payments don&apos;t count.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="willsCounted" span={6}>
          <FieldLabel>Wills counted</FieldLabel>
          <Input inputMode="numeric" value={values.willsCounted} onChange={set("willsCounted")} />
          <FieldDescription>Will purchases counted per person, ever. With 2, only a person&apos;s first two count.</FieldDescription>
          <FieldError />
        </Field>
        <div className="flex flex-col gap-2 md:col-span-6">
          <span className="eyebrow">Refunds</span>
          <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <Checkbox checked={values.deductRefunds} onCheckedChange={(deductRefunds) => setValues((v) => ({ ...v, deductRefunds }))} />
            Deduct refunds
          </label>
          <p className="text-sm font-medium text-muted-foreground">Refunded amounts come off the revenue.</p>
        </div>
      </FieldGroup>
      <FormFooter submitLabel={submitLabel} cancel={onCancel ? { label: "Cancel", onClick: onCancel } : undefined} className="mt-6" />
    </Form>
  )
}

/** A rev share parameter set, read-only: each value with what it means. */
function RevShareParamsView({ params }: { params: RevShareParams }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2" data-slot="rev-share-params">
      {describeRevShare(params).map((w) => (
        <div key={w.id} className="flex flex-col gap-0.5">
          <dt className="text-xs font-semibold text-muted-foreground">{w.label}</dt>
          <dd className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-card-foreground">{w.value}</span>
            <span className="text-sm font-medium text-muted-foreground">{w.meaning}</span>
            {w.id === "ratePercent" && <span className="text-xs font-medium text-muted-foreground italic">{RATE_NOTE}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** What the API answers to a rev share change: the partner's rev share as it now stands. */
type RevShareChangeResult = { revShare: PartnerRevShare; plans?: PartnerPlan[] } | { error: string }

/** The API calls the partner's Rev share section makes (fixtures in the spike; API-NEEDS A37). */
type PartnerRevShareActions = {
  /** Turns rev share on or off for one plan. */
  setPlanEnabled: (partner: PartnerRow, planId: string, enabled: boolean) => Promise<RevShareChangeResult>
  /** Saves the partner's own parameter set. */
  saveOverride: (partner: PartnerRow, params: RevShareParams) => Promise<RevShareChangeResult>
  /** Drops the override: the partner uses the global defaults again. */
  useDefaults: (partner: PartnerRow) => Promise<RevShareChangeResult>
}

/** The partner page's Rev share section: a switch per plan, the parameters (defaults or override), the results and the statement link. */
function PartnerRevShareSection({
  partner,
  revShare: initialRevShare,
  actions,
  statementHref,
  linkAs: Link = "a",
}: {
  partner: PartnerRow
  /** The rev share as the API serves it (A37). */
  revShare: PartnerRevShare
  actions: PartnerRevShareActions
  /** The rev share statement filtered to this partner. */
  statementHref: string
  /** The app's router link. */
  linkAs?: ElementType
}) {
  const [revShare, setRevShare] = useState(initialRevShare)
  const [plans, setPlans] = useState(partner.plans)
  const [editing, setEditing] = useState(false)
  const [confirmDefaults, setConfirmDefaults] = useState(false)
  const [said, setSaid] = useState("")
  const enabled = plans.some((p) => p.revShare)
  /** The partner as it now stands (its plans' switches as last saved), for the API calls. */
  const current = { ...partner, plans }
  const share = shareCents(revShare.result.qualifyingRevenueCents, revShare.params.ratePercent)
  const take = (r: RevShareChangeResult, words: string): ActionResult => {
    if ("error" in r) return { error: r.error }
    setRevShare(r.revShare)
    if (r.plans) setPlans(r.plans)
    setSaid(words)
  }

  return (
    <Card className="gap-6 px-6 py-5" data-slot="partner-rev-share">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground-strong">Rev share</h2>
        <p className="text-sm font-medium text-muted-foreground">
          A pricing agreement whose terms are in HubSpot. {possessive(partner.name)} rev share is {enabled ? "on" : "off"}: it&apos;s on when any plan has it on.
        </p>
      </div>

      <section aria-labelledby={`${partner.id}-rs-plans`} className="flex flex-col gap-3">
        <h3 id={`${partner.id}-rs-plans`} className="text-sm font-semibold text-card-foreground">
          Plans
        </h3>
        {plans.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">No plans yet, so there&apos;s nothing to turn on.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <InlineEdit
                key={p.id}
                control="switch"
                label={`${planName(p)} plan`}
                defaultValue={p.revShare}
                onSave={async (on) => take(await actions.setPlanEnabled(current, p.id, on), `Rev share is ${on ? "on" : "off"} for the ${planName(p)} plan.`)}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby={`${partner.id}-rs-params`} className="flex flex-col gap-3 border-t border-divider pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={`${partner.id}-rs-params`} className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            Parameters
            <Badge tone={revShare.source === "override" ? "info" : "neutral"} data-slot="rev-share-source">
              {revShare.source === "override" ? "Override" : "Global defaults"}
            </Badge>
          </h3>
          {!editing && (
            <span className="flex flex-wrap gap-2">
              {revShare.source === "defaults" ? (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Override for this partner
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                    Edit override
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDefaults(true)}>
                    Use global defaults
                  </Button>
                </>
              )}
            </span>
          )}
        </div>
        {editing ? (
          <RevShareParamsForm
            initial={revShare.params}
            submitLabel="Save override"
            onCancel={() => setEditing(false)}
            onSave={async (params) => {
              const result = take(await actions.saveOverride(current, params), `${possessive(partner.name)} override is saved.`)
              if (!result) setEditing(false)
              return result
            }}
          />
        ) : (
          <RevShareParamsView params={revShare.params} />
        )}
      </section>

      <section aria-labelledby={`${partner.id}-rs-results`} className="flex flex-col gap-3 border-t border-divider pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={`${partner.id}-rs-results`} className="text-sm font-semibold text-card-foreground">
            Results
          </h3>
          <Link href={statementHref} className="rounded-sm text-sm font-semibold text-primary underline-offset-4 focus-ring hover:underline">
            Rev share statement
          </Link>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-slot="rev-share-results">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold text-muted-foreground">Eligible people</dt>
            <dd className="text-2xl font-semibold text-foreground-strong tabular-nums">{formatCount(revShare.result.eligiblePeople)}</dd>
            <dd className="text-xs font-medium text-muted-foreground">On a plan with rev share on, paying themselves.</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold text-muted-foreground">Qualifying revenue</dt>
            <dd className="text-2xl font-semibold text-foreground-strong tabular-nums">{money(revShare.result.qualifyingRevenueCents)}</dd>
            <dd className="text-xs font-medium text-muted-foreground">What they paid that counts under the parameters.</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold text-muted-foreground">Share</dt>
            <dd className="text-2xl font-semibold text-foreground-strong tabular-nums" data-slot="rev-share-share">
              {share === null ? (
                <>
                  <span aria-hidden className="text-muted-foreground">—</span>
                  <span className="sr-only">Not calculated</span>
                </>
              ) : (
                money(share)
              )}
            </dd>
            <dd className="text-xs font-medium text-muted-foreground">{share === null ? "Needs a rate." : `Qualifying revenue × ${revShare.params.ratePercent}%.`}</dd>
          </div>
        </dl>
      </section>
      <p role="status" data-slot="rev-share-status" className="flex items-center gap-1.5 text-sm font-medium text-success-foreground empty:hidden">
        {said && (
          <>
            <CircleCheck aria-hidden className="size-icon" />
            {said}
          </>
        )}
      </p>
      <ConfirmDialog
        open={confirmDefaults}
        onOpenChange={setConfirmDefaults}
        title={`Use the global defaults for ${partner.name}?`}
        description={`${possessive(partner.name)} override is removed and its results are calculated with the global defaults. You can override again later.`}
        confirmLabel="Use global defaults"
        onConfirm={async () => take(await actions.useDefaults(current), `${partner.name} uses the global defaults.`)}
      />
    </Card>
  )
}

/** What saving the defaults reports: how many partners use them and how many keep an override. */
type SaveDefaultsResult = { usingDefaults: number; overrides: number } | { error: string }

/** The global rev share defaults on the settings page: the parameter form, and what saving changed. */
function RevShareDefaultsSection({ defaults, onSave }: { defaults: RevShareParams; onSave: (params: RevShareParams) => Promise<SaveDefaultsResult> }) {
  const [said, setSaid] = useState("")
  return (
    <Card className="gap-5 px-6 py-5" data-slot="rev-share-defaults">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground-strong">Rev share defaults</h2>
        <p className="text-sm font-medium text-muted-foreground">Every partner with rev share uses these unless it has its own override on its page.</p>
      </div>
      <RevShareParamsForm
        initial={defaults}
        submitLabel="Save defaults"
        onSave={async (params) => {
          setSaid("")
          const result = await onSave(params)
          if ("error" in result) return { error: result.error }
          setSaid(
            `Saved. ${plural(result.usingDefaults, "partner uses", "partners use")} the defaults; ${plural(result.overrides, "override is", "overrides are")} untouched.`
          )
        }}
      />
      <p role="status" data-slot="rev-share-status" className="flex items-center gap-1.5 text-sm font-medium text-success-foreground empty:hidden">
        {said && (
          <>
            <CircleCheck aria-hidden className="size-icon" />
            {said}
          </>
        )}
      </p>
    </Card>
  )
}

type RevShareParamsFormProps = Parameters<typeof RevShareParamsForm>[0]
type RevShareParamsViewProps = Parameters<typeof RevShareParamsView>[0]
type PartnerRevShareSectionProps = Parameters<typeof PartnerRevShareSection>[0]
type RevShareDefaultsSectionProps = Parameters<typeof RevShareDefaultsSection>[0]

export { PartnerRevShareSection, RevShareDefaultsSection, RevShareParamsForm, RevShareParamsView }
export type {
  PartnerRevShareActions,
  PartnerRevShareSectionProps,
  RevShareChangeResult,
  RevShareDefaultsSectionProps,
  RevShareParamsFormProps,
  RevShareParamsViewProps,
  SaveDefaultsResult,
}
/* R13-02: the rev share types and rules live in partner-rules.ts; re-exported so a screen imports one entry. */
export { describeRevShare, REV_SHARE_DEFAULTS, shareCents } from "./partner-rules"
export type { PartnerRevShare, RevShareParams, RevShareResult, RevShareSource } from "./partner-rules"
