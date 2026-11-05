"use client"

import type { ComponentProps, ElementType } from "react"
import { DownloadIcon, FileTextIcon, PenLineIcon, ScrollTextIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { DisclosureTrigger } from "../../../components/actions/disclosure-trigger"
import { Badge } from "../../../components/display/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/display/collapsible"
import { Progress } from "../../../components/feedback/progress"
import { Page } from "../../../templates/page"
import { PageHeader } from "../../../templates/page-header"
import type { PersonPickerPerson } from "../../../vault/people/person-picker"
import { RecordCard, RecordSection } from "../record-section"
import type { WILL_COPY } from "./fixtures"
import { summaryOf, type WillAnswers } from "./will-builder"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). WILL-PLAN.md §2 (George 2026-11-04: "simple, but not looking
   incomplete with minimal data — maybe just the will, with some options, if there's only one").
   The hub is the will itself: one card in the reading column, the same in every state, so it
   never looks like an empty list waiting for rows.
   - Its head: the will's tile, "Last will and testament", one line of where it stands, and its
     status chip; the one primary action, with the others beside it.
   - Not started: what the builder asks, as the eight steps in order with "about 15 minutes",
     and Start. The outline is the content, so a new owner sees what's ahead, not a blank.
   - A draft: how far (the step and when it was saved, a progress bar), Continue, then what's
     answered so far (the Review's sections, only the filled ones).
   - Finalized: Open it (the will in Documents, where the finalized PDF lives), Download,
     Update my will (a new draft from this one; the finalized will stays as it was); then what
     it says (the Review's sections) and How to sign it (the state's steps, folded).
   - Earlier versions: only when there's more than one, a quiet list under the card. */

type Copy = typeof WILL_COPY

export type WillHubState =
  | { kind: "none" }
  | { kind: "draft"; answers: WillAnswers; step: number; total: number; saved: string }
  | { kind: "final"; answers: WillAnswers; finalized: string; state: string; versions: Array<{ id: string; label: string; href: string }> }

/** Your will: the will itself as one card, whatever state it's in, with its options. */
export function WillHub({
  will,
  people,
  states,
  signing,
  copy,
  hrefs,
  linkAs: Link = "a",
}: {
  will: WillHubState
  people: PersonPickerPerson[]
  states: Array<{ value: string; label: string }>
  signing: string[]
  copy: Copy
  /** The builder (start or continue), the finalized will in Documents, its file, and a new draft from it. */
  hrefs: { builder: string; document: string; download: string; update: string }
  linkAs?: ElementType
}) {
  const h = copy.hub
  const chip =
    will.kind === "final" ? (
      <Badge tone="success" size="sm" className="inline-flex h-6 items-center py-0 text-xs">
        {h.finalChip}
      </Badge>
    ) : will.kind === "draft" ? (
      <Badge tone="neutral" size="sm" className="inline-flex h-6 items-center py-0 text-xs">
        {h.draftChip}
      </Badge>
    ) : null
  const line =
    will.kind === "final"
      ? h.finalLine(will.finalized, will.state)
      : will.kind === "draft"
        ? h.draftLine(will.step, will.total, will.saved)
        : h.noneLine
  const sections = will.kind === "none" ? [] : summaryOf(will.answers, copy, people, states, true)
  return (
    <Page width="focused">
      <PageHeader
        icon={
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-xl">
            <ScrollTextIcon aria-hidden />
          </span>
        }
        title={h.title}
        description={h.lead}
      />
      <RecordCard label={h.willTitle}>
        <header className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border-medium bg-surface-page text-muted-foreground [&_svg]:size-icon-xl"
            >
              {will.kind === "final" ? <FileTextIcon /> : <PenLineIcon />}
            </span>
            <div className="flex min-w-0 flex-col gap-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl leading-tight font-bold text-foreground-strong">{h.willTitle}</h2>
                {chip}
              </div>
              <p className="text-sm font-medium text-muted-foreground">{line}</p>
            </div>
          </div>
          {will.kind === "draft" && <Progress value={Math.round(((will.step - 1) / will.total) * 100)} aria-label={line} />}
          <div className="flex flex-wrap gap-2">
            {will.kind === "final" ? (
              <>
                <Button asChild size="sm">
                  <Link href={hrefs.document}>{h.open}</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" shape="rect" icon={<DownloadIcon />}>
                  <Link href={hrefs.download}>{h.download}</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" shape="rect" icon={<PenLineIcon />}>
                  <Link href={hrefs.update}>{h.update}</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href={hrefs.builder}>{will.kind === "draft" ? h.continue : h.start}</Link>
              </Button>
            )}
          </div>
        </header>
        {will.kind === "none" && (
          <RecordSection audience="shared" title={h.whatItAsks} aside={h.time}>
            <ol className="flex flex-col gap-1.5 text-sm font-medium">
              {h.outline.map((step, n) => (
                <li key={step} className="flex gap-3">
                  <span className="w-5 shrink-0 text-right font-semibold text-muted-foreground tabular-nums">{n + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </RecordSection>
        )}
        {sections.map((sec) => (
          <RecordSection key={sec.id} audience="shared" title={sec.title}>
            <div className="flex flex-col gap-1 text-sm font-medium">
              {sec.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </RecordSection>
        ))}
        {will.kind === "final" && (
          <Collapsible>
            <CollapsibleTrigger>
              <DisclosureTrigger>{h.howToSign(will.state)}</DisclosureTrigger>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm font-medium">
                {signing.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        )}
      </RecordCard>
      {will.kind === "final" && will.versions.length > 1 && (
        <section aria-label={h.versions} className="flex flex-col gap-2">
          <h2 className="eyebrow text-muted-foreground">{h.versions}</h2>
          <ul className="flex flex-col">
            {will.versions.slice(1).map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 border-t border-divider py-2 text-sm first:border-t-0">
                <span className="font-medium text-muted-foreground">{v.label}</span>
                <Link href={v.href} className="rounded-sm text-xs font-semibold text-primary focus-ring hover:underline">
                  {h.open}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  )
}

export type WillHubProps = ComponentProps<typeof WillHub>
