import type { ElementType, ReactNode } from "react"
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

import { Dot } from "../../../components/display/dot"
import { cn } from "../../../lib/utils"
import { ItemFrame } from "../../components/item"
import type { AreaRef } from "./data"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4: what PersonRow and DocumentRow share.
   - ViewRow: a row of a View's list. ItemFrame's regions, the title a link whose target is the
     whole row (a row opens its record; it is never a form, §1a), and the open record's row
     marked (`current`: the brand's subtle fill and a 3px brand bar at its start, `aria-current`).
     Findings for Item (labs, S-27): it has no link mode (`hooks.onActivate` is a button), and no
     trailing region for information — the Area dots ride in `actions`, which is for actions.
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
        "relative border-t border-divider first:border-t-0 hover:layer-hover",
        "data-[current]:bg-primary-subtle data-[current]:before:absolute data-[current]:before:inset-y-0 data-[current]:before:left-0 data-[current]:before:w-0.75 data-[current]:before:bg-primary",
      )}
    >
      <ItemFrame
        size="sm"
        activatable
        media={media}
        title={
          <Link href={href} aria-current={current ? "page" : undefined} className="rounded-sm focus-ring after:absolute after:inset-0">
            {title}
          </Link>
        }
        description={
          (description || status) && (
            <span className="flex flex-col gap-0.5">
              {description && <span className="truncate">{description}</span>}
              {status}
            </span>
          )
        }
        actions={meta}
      />
    </li>
  )
}
