"use client"

import type { ElementType } from "react"
import { formatCount, formatDayNear, formatPrice, possessive } from "../../lib/format"
import { sortValuesOf, type ListConfig } from "../../lib/list-query"
import { cn } from "../../lib/utils"
import { useEffect, useId, useRef, useState } from "react"
import { Copy, FileText, ImageUp, Link2, Megaphone, Users } from "lucide-react"

import {
  hasRevShare,
  matchPartner,
  otherPlans,
  partnerDefaultSort,
  partnerFilters,
  partnerSegments,
  PARTNER_KIND_LABEL,
  PARTNER_STATUS,
  partnerStatus,
  PLAN_SEGMENT_LABEL,
  PLAN_SEGMENTS,
  planName,
  planOf,
  planStatus,
  SETUP_ISSUE_LABEL,
  setupIssues,
  signupPlans,
  type PartnerPlan,
  type PartnerRow,
  type PlanSegment,
} from "../partner-rules"
import { PartnerLogo } from "../partner-logo"
import type { ListAction } from "../../components/actions/row-actions"
import type { DataTableColumn } from "../../components/display/data-table"
import { Badge } from "../../components/display/badge"
import { Button } from "../../components/actions/button"
import { copyText } from "../../components/actions/copy-button"
import { ConfirmDialog, type ActionResult } from "../../components/overlays/confirm-dialog"
import { Tooltip } from "../../components/overlays/tooltip"

/* @archetype Composite (ARCHETYPES.md).
   The admin Partners list's own parts (R13-22, reworked by REVIEW-15): what the list page pattern
   (templates/list-page.tsx) is given for partners, plus the Update logo dialog. The data and rules
   (row type, plan status, needs setup, filter cards, filters, prices) are `partner-rules.ts`, pure
   and tested; Manage offers is `partner-offers.tsx`; rev share is `rev-share.tsx`.
   - Columns (R15-01…R15-03, R15-06): the partner (its name linking to its page, its type; no logo
     in the table, R16-06); Customer, VIP and Employee, each the count of people on that plan with a small
     status under it (Live, "Starts Nov 3", Not live) and a "Rev share" mark when the plan has it
     on, or "—" when the partner has no such plan; the price shows on hover only (the partner's
     page will have it too); People, the total with "+1 other plan" for a segment outside the
     three, the count itself linking to People filtered to the partner (R16-06: no icon, it read as
     a trend); Status (with the first setup
     issue). Counts, not prices, in the cells (REVIEW-15 § Model): one name never means two values.
   - Row actions: Partner (Update logo…, Manage offers…, Copy signup link ▸ one item per plan with
     a link, R15-07), then Go to (View people, Rev share statement, R15-14). Deactivating a
     partner is on its page, not here (REVIEW-15 Decided (c)).
   - Update logo: the current logo and the new one side by side before Upload; PNG, SVG, JPG or
     WebP, 1 MB at most; the API stores it (API-NEEDS A31). The logo itself is the root's
     `partner-logo.tsx` (shared with the offer preview and the partner page). */

/** One plan cell: the people on it and its status, the price on hover; "—" when the partner has no such plan. */
function PlanCell({ plan, kind, today }: { plan: PartnerPlan | null; kind: PlanSegment; today: string }) {
  if (!plan)
    return (
      <span className="text-muted-foreground" data-slot="plan-cell" data-empty="">
        <span aria-hidden>—</span>
        <span className="sr-only">No {PLAN_SEGMENT_LABEL[kind]} plan</span>
      </span>
    )
  const status = planStatus(plan, today)
  const statusText = status.kind === "live" ? "Live" : status.kind === "scheduled" ? `Starts ${formatDayNear(status.startsAt, today)}` : "Not live"
  const price = `${formatPrice(plan.priceCents, plan.cycle)} · ${plan.planName}${plan.stripePriceId ? "" : " · no Stripe price yet"}`
  return (
    <Tooltip content={price} side="bottom" align="start">
      <span className="flex w-fit flex-col items-start gap-0.5" data-slot="plan-cell" data-status={status.kind}>
        <span className="font-medium text-card-foreground tabular-nums">{formatCount(plan.people)}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          {/* "Starts Jan 5, 2027" may wrap within the column (R20-25: the columns have widths now). */}
          <span className={cn("whitespace-normal", status.kind === "live" ? "text-success-foreground" : status.kind === "scheduled" ? "text-info-foreground" : "text-muted-foreground")}>{statusText}</span>
          {plan.revShare && (
            <Badge size="xs" tone="neutral" appearance="outline" data-slot="plan-rev-share">
              Rev share
            </Badge>
          )}
        </span>
      </span>
    </Tooltip>
  )
}

/** The Partners columns. `href` is the partner's page, `peopleHref` People filtered to it; `today` decides live and scheduled. */
function partnerColumns({
  href,
  peopleHref,
  today,
  linkAs: Link = "a",
}: {
  href: (p: PartnerRow) => string
  peopleHref: (p: PartnerRow) => string
  /** ISO date: plans with a start date after it are scheduled. */
  today: string
  linkAs?: ElementType
}): DataTableColumn<PartnerRow>[] {
  // R20-25: the list is resizable, so each column states a width (the last takes what is left). No
  // typed column here: every cell is a composite (a count with its status, a count that links).
  return [
    {
      id: "name",
      header: "Partner",
      width: 230,
      minWidth: 160,
      sortValue: (p) => p.name,
      // No logo in the table (George 2026-10-21, consistency with the other lists): the logo is on the partner's page and in Update logo.
      cell: (p) => (
        <span className="flex max-w-56 min-w-0 flex-col">
          <Link href={href(p)} className="max-w-full truncate rounded-sm font-medium text-card-foreground focus-ring hover:underline" title={p.name}>
            {p.name}
          </Link>
          <span className="text-xs text-muted-foreground">{p.kind ? PARTNER_KIND_LABEL[p.kind] : "Type not set"}</span>
        </span>
      ),
    },
    ...PLAN_SEGMENTS.map(
      (kind): DataTableColumn<PartnerRow> => ({
        id: kind,
        header: PLAN_SEGMENT_LABEL[kind],
        width: 120,
        sortValue: (p) => planOf(p, kind, today)?.people ?? null,
        cell: (p) => <PlanCell plan={planOf(p, kind, today)} kind={kind} today={today} />,
      })
    ),
    {
      id: "people",
      header: "People",
      width: 130,
      numeric: true,
      sortValue: (p) => p.people,
      cell: (p) => {
        const others = otherPlans(p)
        const n = others.length
        return (
          <span className="flex items-center justify-end gap-2">
            {n > 0 && (
              <Tooltip content={others.map((x) => `${planName(x)}: ${formatCount(x.people)}`).join(" · ")} side="bottom">
                <span className="text-xs font-medium whitespace-nowrap text-muted-foreground" data-slot="other-plans">
                  +{n} other plan{n === 1 ? "" : "s"}
                </span>
              </Tooltip>
            )}
            {/* The count is the link to People filtered to the partner (George 2026-10-21: an arrow icon beside it read as a trend). */}
            <Link
              href={peopleHref(p)}
              aria-label={`View ${possessive(p.name)} people`}
              title="View people"
              className="rounded-sm font-medium text-card-foreground tabular-nums focus-ring hover:underline"
            >
              {formatCount(p.people)}
            </Link>
          </span>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      width: 140,
      sortValue: (p) => PARTNER_STATUS[partnerStatus(p)].label,
      cell: (p) => {
        const s = PARTNER_STATUS[partnerStatus(p)]
        const issues = setupIssues(p)
        return (
          <span className="flex flex-col items-start gap-1">
            <Badge tone={s.tone} appearance={s.outline ? "outline" : "soft"}>
              {s.label}
            </Badge>
            {issues.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {SETUP_ISSUE_LABEL[issues[0]]}
                {issues.length > 1 ? ` +${issues.length - 1}` : ""}
              </span>
            )}
          </span>
        )
      },
    },
  ]
}

/** One partner's row actions: Partner (logo, offers, signup link per plan), then Go to (its people, its rev share statement). */
function partnerActions(
  p: PartnerRow,
  {
    onUpdateLogo,
    onManageOffers,
    onCopySignupLink,
    peopleHref,
    statementHref,
  }: {
    onUpdateLogo: (p: PartnerRow) => void
    onManageOffers: (p: PartnerRow) => void
    /** Copies the plan's link; the screen says so in its status line. */
    onCopySignupLink: (p: PartnerRow, plan: PartnerPlan) => ActionResult | Promise<ActionResult>
    /** People filtered by this partner. */
    peopleHref: (p: PartnerRow) => string
    /** The rev share statement filtered to this partner. */
    statementHref: (p: PartnerRow) => string
  }
): ListAction[] {
  const links = signupPlans(p)
  return [
    { kind: "action", id: "updateLogo", group: "Partner", label: p.logoUrl ? "Update logo…" : "Add logo…", icon: <ImageUp aria-hidden />, run: () => onUpdateLogo(p) },
    {
      kind: "action",
      id: "manageOffers",
      group: "Partner",
      label: "Manage offers…",
      icon: <Megaphone aria-hidden />,
      disabledReason: p.active ? undefined : "The partnership has ended",
      run: () => onManageOffers(p),
    },
    links.length > 0
      ? {
          kind: "menu",
          id: "copySignupLink",
          group: "Partner",
          label: "Copy signup link",
          icon: <Link2 aria-hidden />,
          items: links.map((plan) => ({ kind: "action" as const, id: `copy-${plan.id}`, label: planName(plan), icon: <Copy aria-hidden />, run: () => onCopySignupLink(p, plan) })),
        }
      : { kind: "action", id: "copySignupLink", group: "Partner", label: "Copy signup link", icon: <Link2 aria-hidden />, disabledReason: "No plan has a signup link", run: () => undefined },
    { kind: "link", id: "viewPeople", group: "Go to", label: "View people", icon: <Users aria-hidden />, href: peopleHref(p) },
    hasRevShare(p)
      ? { kind: "link", id: "revShareStatement", group: "Go to", label: "Rev share statement", icon: <FileText aria-hidden />, href: statementHref(p) }
      : { kind: "action", id: "revShareStatement", group: "Go to", label: "Rev share statement", icon: <FileText aria-hidden />, disabledReason: "Rev share isn't on for any plan", run: () => undefined },
  ]
}

/** Copies a plan's signup link; `{ error }` when the browser refuses. */
async function copySignupLink(url: string): Promise<ActionResult> {
  return (await copyText(url)) ? undefined : { error: "The browser didn't allow copying. Open the partner to copy the link by hand." }
}

/* ---------- Update logo ---------- */

/** What the logo can be: the types and the size the API accepts (A31). */
const LOGO_TYPES = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"]
const LOGO_MAX_BYTES = 1024 * 1024

/** Why a file can't be the logo, or null when it can. */
function logoProblem(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) return "Choose a PNG, SVG, JPG or WebP image."
  if (file.size > LOGO_MAX_BYTES) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; a logo can be 1 MB at most.`
  return null
}

/** Uploads the partner's new logo (the API stores it and answers with its URL). */
type UploadPartnerLogo = (partner: PartnerRow, file: File, reason: string) => ActionResult | Promise<ActionResult>

/** The Update logo dialog: the current logo and the chosen one side by side, the rules for the file, then Upload. */
function PartnerLogoDialog({
  partner,
  open,
  onOpenChange,
  onUpload,
}: {
  /** The partner whose logo this is (null while closed). */
  partner: PartnerRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: UploadPartnerLogo
}) {
  const ids = useId()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  // A fresh start each time it opens; the preview's object URL is released when it changes or closes.
  useEffect(() => {
    if (open) return
    setFile(null)
    setProblem(null)
  }, [open])
  useEffect(() => {
    if (!file || problem) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, problem])
  if (!partner) return null
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${partner.logoUrl ? "Update" : "Add"} ${possessive(partner.name)} logo`}
      description="It shows wherever Paige co-brands for this partner: its signup page and its members' header."
      confirmLabel="Upload logo"
      reason="optional"
      canConfirm={file !== null && problem === null}
      onConfirm={({ reason }) => (file ? onUpload(partner, file, reason) : { error: "Choose an image first." })}
    >
      <div className="grid grid-cols-2 gap-3" data-slot="logo-compare">
        <figure className="flex min-w-0 flex-col gap-1.5">
          <figcaption className="text-xs font-semibold text-muted-foreground">Current</figcaption>
          {partner.logoUrl ? (
            <PartnerLogo partner={partner} size="lg" />
          ) : (
            <span className="grid h-20 place-items-center rounded-sm border border-dashed border-border text-sm text-muted-foreground">No logo yet</span>
          )}
        </figure>
        <figure className="flex min-w-0 flex-col gap-1.5">
          <figcaption className="text-xs font-semibold text-muted-foreground">New</figcaption>
          {preview ? (
            <span className="grid h-20 place-items-center rounded-sm border border-border bg-card p-3">
              <img src={preview} alt={`New ${partner.name} logo`} className="max-h-full max-w-full object-contain" />
            </span>
          ) : (
            <span className="grid h-20 place-items-center rounded-sm border border-dashed border-border text-sm text-muted-foreground">Not chosen</span>
          )}
        </figure>
      </div>
      {/* Not a Field: the control is a button that opens the file picker, so the label, the rules
          and the problem are wired to it by hand (aria-describedby). */}
      <div role="group" aria-labelledby={`${ids}-label`} className="flex flex-col gap-2">
        {/* FieldLabel's look (the eyebrow), as the offer dialog's labels. */}
        <span id={`${ids}-label`} className={problem ? "eyebrow text-error" : "eyebrow"}>
          Image
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<ImageUp aria-hidden />}
            aria-describedby={problem ? `${ids}-rules ${ids}-problem` : `${ids}-rules`}
            onClick={() => input.current?.click()}
          >
            {file ? "Choose another…" : "Choose image…"}
          </Button>
          <span className="min-w-0 truncate text-sm font-medium text-card-foreground" data-slot="logo-file-name">
            {file?.name ?? "No file chosen"}
          </span>
        </span>
        <input
          ref={input}
          type="file"
          accept={LOGO_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Logo image file"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            e.target.value = ""
            if (!f) return
            setFile(f)
            setProblem(logoProblem(f))
          }}
        />
        <p id={`${ids}-rules`} className="text-sm font-medium text-muted-foreground">
          PNG, SVG, JPG or WebP, 1 MB at most. A wide banner, at least 400 × 100, on a transparent background.
        </p>
        {problem && (
          <p id={`${ids}-problem`} role="alert" className="text-sm font-medium text-error">
            {problem}
          </p>
        )}
      </div>
    </ConfirmDialog>
  )
}

type PartnerLogoDialogProps = Parameters<typeof PartnerLogoDialog>[0]
type PlanCellProps = Parameters<typeof PlanCell>[0]

/* R17-06: the Partners page's fixed parts, shared by its story and the app screen so the two can't
   drift: the heading, ListPage's props that don't change, the list state's config (the app keeps
   it in the URL), and what an action says it did. The caller adds the rows, the state, the
   dialogs and the handlers. */
/** The Partners list: each partner's plans, people and setup, and its actions (logo, offers, signup links); ListPage's parts for it. */
function partnersPage({ href, peopleHref, linkAs, today }: { href: (p: PartnerRow) => string; peopleHref: (p: PartnerRow) => string; linkAs?: ElementType; today: string }) {
  const columns = partnerColumns({ href, peopleHref, today, linkAs })
  const segments = partnerSegments(today)
  const search = { match: matchPartner, label: "Search partners", placeholder: "Search by name or signup slug" }
  const config: ListConfig<PartnerRow> = { segments, filters: partnerFilters, search: matchPartner, sortValues: sortValuesOf(columns), defaultSort: partnerDefaultSort }
  return {
    title: "Partners",
    description: "The banks, credit unions and universities that sponsor Paige: their plans, offers and people.",
    config,
    logoUpdated: (p: PartnerRow) => `${possessive(p.name)} logo is updated.`,
    signupCopied: (p: PartnerRow, plan: PartnerPlan) => `${possessive(p.name)} ${planName(plan)} signup link is copied.`,
    list: { noun: { one: "partner", other: "partners" }, label: "Partners", getRowId: (p: PartnerRow) => p.id, rowLabel: (p: PartnerRow) => p.name, columns, segments, filters: partnerFilters, search, defaultSort: partnerDefaultSort, emptyMessage: "No partners yet.", resizable: true, density: "compact" as const, linkAs, today },
  }
}

export { copySignupLink, logoProblem, partnerActions, partnerColumns, PartnerLogoDialog, partnersPage, PlanCell }
export type { PartnerLogoDialogProps, PlanCellProps, UploadPartnerLogo }
/* R13-02: the data types and rules live in partner-rules.ts; re-exported so a screen imports one entry. */
export {
  hasRevShare,
  matchPartner,
  otherPlans,
  PARTNER_KIND_LABEL,
  PARTNER_STATUS,
  partnerDefaultSort,
  partnerFilters,
  partnerKey,
  partnerSegments,
  partnerStatus,
  PLAN_SEGMENT_LABEL,
  PLAN_SEGMENTS,
  planSegment,
  planName,
  planOf,
  planStatus,
  SETUP_ISSUE_LABEL,
  setupIssues,
  signupPlans,
} from "../partner-rules"
export type { PartnerKind, PartnerOffer, PartnerPlan, PartnerRow, PartnerStatus, PlanSegment, PlanStatus, SetupIssue } from "../partner-rules"
export type { Cycle } from "../../lib/format"
