import type { ComponentProps, ElementType, ReactNode } from "react"
import { ArrowUpRightIcon, LockIcon } from "lucide-react"

import { Dot } from "../../components/display/dot"
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
   In View a section reads; in Edit the same frame holds fields and actions (FieldSet's legend
   and rule are where it comes from). `empty` is the line it shows with nothing in it.

   AreaLines: lines grouped by Area for a shared section, in two columns from sm: the Area (its
   dot and name) on the left, 120 wide; each line, its quieter detail and where it lives
   ("Open in Family") on the right. Below sm the Area stacks over its lines. */

/** The record on the stage: a white card, its sections one step apart. */
export function RecordCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <article data-slot="record-card" aria-label={label} className="flex flex-col gap-6 rounded-lg border border-surface-edge bg-card p-5 shadow-card md:p-6">
      {children}
    </article>
  )
}

/** A record's section with an audience: `shared` (a résumé section) or `owner` (set back: only the owner sees it). */
export function RecordSection({
  audience,
  title,
  ownerLabel,
  empty,
  children,
}: {
  /** shared: the people the owner shares with read it. owner: only the owner sees it. */
  audience: "shared" | "owner"
  /** The section's name: the legend (shared) or the title under the owner words (owner). */
  title: string
  /** owner only: the words over it ("Only visible to you"). */
  ownerLabel?: string
  /** The line it shows with nothing in it. Drawn when `children` is empty. */
  empty?: string
  /** The section's lines (View) or fields and actions (Edit). */
  children?: ReactNode
}) {
  const body = children ? children : empty && <p className="text-sm text-muted-foreground italic">{empty}</p>
  if (audience === "owner") {
    return (
      <section data-slot="record-section" data-audience="owner" aria-label={title} className="flex flex-col gap-2 rounded-lg border border-dashed border-surface-edge bg-muted px-4 py-3.5">
        <p className="flex items-center gap-2 eyebrow text-muted-foreground after:h-px after:flex-1 after:bg-divider [&_svg]:size-icon-xs">
          <LockIcon aria-hidden />
          {ownerLabel}
        </p>
        <h3 className="font-display text-base font-bold">{title}</h3>
        {body}
      </section>
    )
  }
  return (
    <section data-slot="record-section" data-audience="shared" aria-label={title} className="flex flex-col gap-2">
      <h3 className="border-b border-divider pb-2 eyebrow text-foreground">{title}</h3>
      {body}
    </section>
  )
}

/** One line: what it says, its quieter detail, and where it lives. */
function Line({ line, linkAs: Link }: { line: RecordLine; linkAs: ElementType }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1">
      <span className="min-w-0">
        <span className="font-semibold">{line.label}</span>
        {line.detail && <span className="block text-sm font-medium text-muted-foreground">{line.detail}</span>}
      </span>
      {line.open && (
        <Link href={line.open.href} className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs">
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
    <div data-slot="area-lines" className="flex flex-col gap-2">
      {groups.map((g) => (
        <div key={g.area.id} data-area={g.area.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-record-line">
          <span className="flex items-center gap-2 pt-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
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
