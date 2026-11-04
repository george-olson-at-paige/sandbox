import type { ComponentProps, ElementType, ReactNode } from "react"
import { ArrowUpRightIcon, CircleAlertIcon, LockIcon } from "lucide-react"

import { Dot } from "../../components/display/dot"
import { EmptyState } from "../../components/feedback/empty-state"
import { cn } from "../../lib/utils"
import type { AreaGroup, RecordLine } from "./views/data"

/* @archetype Frame (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). D-V3 (George 2026-11-04; VIEWS-PLAN.md): "Only visible to you"
   is a section, not a callout, and a record's sections have an audience.

   RecordCard: the record on WorkspacePage's stage, the artifact the owner shares (a contact
   card, a résumé). A white card; its sections one step apart. The stage sets its width.

   RecordSection: one section of a record, under its legend, with an `audience`:
   - `shared`: what the people the owner shares with would read ("Who they are to you", "What
     it's for"). The legend in small caps over a rule, the content under it: a résumé's section.
   - `owner`: only the owner sees it ("What they can see", "Who can see it"). Set back from the
     shared sections: a dashed edge on the muted surface, the lock and the owner words ("Only
     visible to you") over a rule, then the section's own title. The audience decides the look,
     so what the owner shares and what they keep to themselves stay visibly apart.
   `attention` (the owner's to-dos, "Needs you"): its legend in the attention ink with the alert,
   shown only when something needs doing.
   In View a section reads; in Edit the same frame holds fields and actions (FieldSet's legend
   and rule are where it comes from). `empty` is the line it shows with nothing in it.

   Type on a record (George 2026-11-04: one scale, not one per piece). Five roles, nothing else:
   - title   the record's name, once, in the letterhead: font-display text-2xl bold, the strong
             ink (as PageHeader's and the stage bar's names).
   - label   section legends, Area names, the owner words, a legend's right: `eyebrow` (12, caps,
             semibold); a legend in the ink (Needs you in the attention ink), the rest muted.
   - value   what a line says, a value, a name: text-sm semibold, the ink.
   - detail  the quieter part: what a line adds, a field's or fact's name ("Date of birth",
             "Original"), a date: text-sm medium, muted.
   - meta    text-xs semibold: a link out ("Open in Family ↗"), muted until hovered; a status
             ("You have …"), in its tone.
   Colour says what a thing does, not how important it is: the ink reads, muted is quieter, the
   brand ink is something you can act on (an action, a contact or file link), the attention ink
   is something waiting on you. The stage bar's name (text-lg) is chrome, not the record.

   Spacing on a record: sections 24 apart (the card's gap), a legend's rule 8 over its content
   (8 under the legend text); a read-only line 6 above and below, no rules between lines (the
   section's rule is enough); the queue's lines (Needs you, which hold buttons) 10 above and
   below with a hairline between. A section that can be empty always shows, with its empty
   line (EmptyState size xs), so a record keeps the same shape whatever is in it.

   AreaLines: lines grouped by Area for a shared section, in two columns from sm: the Area (its
   dot and name) on the left, 120 wide; each line, its quieter detail and where it lives
   ("Open in Family") on the right. Below sm the Area stacks over its lines. */

/** The record on the stage: a white card, its sections one step apart. */
export function RecordCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <article
      data-slot="record-card"
      aria-label={label}
      className="flex flex-col gap-6 rounded-lg border border-surface-edge bg-card p-5 shadow-card md:p-6"
    >
      {children}
    </article>
  )
}

/** A record's section with an audience: `shared` (a résumé section) or `owner` (set back: only the owner sees it). */
export function RecordSection({
  audience,
  title,
  ownerLabel,
  attention = false,
  aside,
  empty,
  children,
}: {
  /** shared: the people the owner shares with read it. owner: only the owner sees it. */
  audience: "shared" | "owner"
  /** The section's name: the legend (shared) or the title under the owner words (owner). */
  title: string
  /** owner only: the words beside its legend ("Only visible to you"). */
  ownerLabel?: string
  /** The owner's to-dos ("Needs you"): the legend in the attention ink, with the alert. */
  attention?: boolean
  /** shared: what sits at the legend's right, in the legend's type ("Read Oct 2, 2026"; "3 to check · Confirm all"). */
  aside?: ReactNode
  /** The line it shows with nothing in it. The caller passes it only then; it sits above any children (an action that fills it). */
  empty?: string
  /** The section's lines (View) or fields and actions (Edit). */
  children?: ReactNode
}) {
  const body = (
    <>
      {empty && <EmptyState size="xs" title={empty} />}
      {children}
    </>
  )
  if (audience === "owner") {
    return (
      <section
        data-slot="record-section"
        data-audience="owner"
        aria-label={title}
        className="flex flex-col gap-2 rounded-lg border border-dashed border-surface-edge bg-muted px-4 py-3.5"
      >
        <div className="flex items-center justify-between gap-3 border-b border-divider pb-2">
          <h3 className="eyebrow text-foreground">{title}</h3>
          <span className="flex items-center gap-1.5 eyebrow text-muted-foreground [&_svg]:size-icon-xs">
            <LockIcon aria-hidden />
            {ownerLabel}
          </span>
        </div>
        {body}
      </section>
    )
  }
  return (
    <section data-slot="record-section" data-audience="shared" aria-label={title} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 border-b border-divider pb-2">
        <h3 className={cn("flex items-center gap-1.5 eyebrow [&_svg]:size-icon-xs", attention ? "text-attention" : "text-foreground")}>
          {attention && <CircleAlertIcon aria-hidden />}
          {title}
        </h3>
        {aside && <span className="flex items-center gap-3 eyebrow text-muted-foreground">{aside}</span>}
      </div>
      {body}
    </section>
  )
}

/** One line: what it says, its quieter detail, and where it lives. */
function Line({ line, linkAs: Link }: { line: RecordLine; linkAs: ElementType }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="text-sm font-semibold">{line.label}</span>
        {line.detail && <span className="block text-sm font-medium text-muted-foreground">{line.detail}</span>}
      </span>
      {line.open && (
        <Link
          href={line.open.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs"
        >
          {line.open.label}
          <ArrowUpRightIcon aria-hidden />
        </Link>
      )}
    </li>
  )
}

/** A shared section's lines, grouped by Area: the Area on the left, its lines on the right (stacked below sm). */
export function AreaLines({ groups, linkAs = "a" }: { groups: AreaGroup[]; linkAs?: ElementType }) {
  return (
    <div data-slot="area-lines" className="flex flex-col gap-1">
      {groups.map((g) => (
        <div key={g.area.id} data-area={g.area.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-record-line">
          <span className="flex min-h-8 items-center gap-2 self-start eyebrow text-muted-foreground">
            <Dot tone="area" />
            {g.area.label}
          </span>
          <ul className={cn("flex flex-col")}>
            {g.lines.map((line) => (
              <Line key={line.key} line={line} linkAs={linkAs} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export type RecordSectionProps = ComponentProps<typeof RecordSection>
export type AreaLinesProps = ComponentProps<typeof AreaLines>
