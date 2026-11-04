import type { ElementType, ReactNode } from "react"
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

import { Dot } from "../../../components/display/dot"
import { cn } from "../../../lib/utils"
import type { AreaRef } from "./data"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4: what PersonRow and DocumentRow share.
   - ViewRow: a row of a View's list, compact (v0): the mark (32–36), the name at 14, its line and
     status at 12, the Area dots at the end; about 52 high. The name is a link whose target is the
     whole row (a row opens its record; never a form, §1a). The open record's row: the brand's
     lightest tint and a 3px brand bar at its start, `aria-current`. It starts on the workspace
     gutter, like the band and the stage bar. Its own layout, not ItemFrame: ItemFrame's 12px
     sides can't take the gutter, it has no link mode (`hooks.onActivate` is a button) and no
     trailing region for information (VIEWS-PLAN finding 1).
   - StatusLine: one line, what it needs (an alert, the attention ink) or that it is ready (a
     check, the success ink). One signal per row (VIEWS-PLAN §1; the webapp had a dot and a
     coloured Area dot that read as an error).
   - AreaDots: one dot per Area the record is in, in each Area's colour; named for a screen
     reader ("In Family, Household"). */

/** One dot per Area, in each Area's colour; a screen reader hears the Area names. */
export function AreaDots({ areas }: { areas: AreaRef[] }) {
  if (areas.length === 0) return null
  return (
    <span data-slot="area-dots" role="img" aria-label={`In ${areas.map((a) => a.label).join(", ")}`} className="flex max-w-16 flex-wrap justify-end gap-1">
      {areas.map((a) => (
        <span key={a.id} data-area={a.id} className="inline-flex">
          <Dot tone="area" />
        </span>
      ))}
    </span>
  )
}

/** One status line: what it needs (alert, attention ink) or that it is ready (check, success ink). */
export function StatusLine({ need, ready }: { need?: string; ready?: string }) {
  if (!need && !ready) return null
  return (
    <span
      data-slot="status-line"
      data-tone={need ? "need" : "ready"}
      className={cn("flex items-center gap-1 text-xs font-semibold [&_svg]:size-icon-xs", need ? "text-attention" : "text-success")}
    >
      {need ? <CircleAlertIcon aria-hidden /> : <CircleCheckIcon aria-hidden />}
      {need ?? ready}
    </span>
  )
}

/** A row of a View's list: a link to its record, the open one marked. */
export function ViewRow({
  href,
  current = false,
  linkAs: Link = "a",
  media,
  title,
  description,
  status,
  meta,
}: {
  /** The record this row opens. */
  href: string
  /** This row's record is the one open on the stage. */
  current?: boolean
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
  /** Avatar, a document tile. */
  media: ReactNode
  /** The record's name. */
  title: string
  /** "Spouse · 3 roles", "ID · DriverLicense.png". */
  description?: string
  /** A StatusLine. */
  status?: ReactNode
  /** Trailing information (AreaDots). */
  meta?: ReactNode
}) {
  return (
    <li
      data-slot="view-row"
      data-current={current || undefined}
      className={cn(
        "relative grid grid-cols-view-row items-center gap-3 border-t border-divider py-2.5 gutter-workspace first:border-t-0 hover:layer-hover",
        // The open record: the brand's lightest tint and a 3px brand bar at the start.
        "data-[current]:bg-accent data-[current]:before:absolute data-[current]:before:inset-y-0 data-[current]:before:left-0 data-[current]:before:w-0.75 data-[current]:before:bg-primary",
      )}
    >
      <span className="flex justify-center">{media}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <Link href={href} aria-current={current ? "page" : undefined} className="truncate rounded-sm text-sm font-semibold focus-ring after:absolute after:inset-0">
          {title}
        </Link>
        {description && <span className="truncate text-xs font-medium text-muted-foreground">{description}</span>}
        {status}
      </span>
      <span className="flex justify-end">{meta}</span>
    </li>
  )
}
