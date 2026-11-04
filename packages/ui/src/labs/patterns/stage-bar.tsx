import type { ComponentProps, ReactNode } from "react"

import { Badge } from "../../components/display/badge"

/* @archetype Frame (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Stage bar: which record is open and what can
   be done to all of it" (D-V5: lands in labs, for patterns/). WorkspacePage's `stageBar` slot.
   Left: the record's name; a chip (who they are to you, a document's type) when it adds
   something; one quiet line under them. Right: the actions on the whole record, tools not calls
   to action (Share; ⋯ with Edit details, Assign, Remove; Done while editing), the caller's.
   The chip has the list's Chip metrics (24 high, 8 a side, 12 semibold), so a lozenge is one
   size wherever it sits, "ID" or "Spouse". The quiet line is always there, empty or not, so a record gaining its first role doesn't push
   the stage down (the webapp's 2026-11-02 fix). A long name truncates; the actions never wrap
   under it. Below md, `back` (the way back to the list, an icon button: an arrow, named "Back
   to Documents") sits left of the name, as a phone app's top bar does; from md the list is
   beside the stage and it isn't drawn. It is `workspace-bar` high (72), the same as the list's search row, so the two
   rules under them meet in one line across the workspace. Nothing in it knows what kind of
   record it is. */

/** The open record's name, chip and quiet line, and the actions on all of it. */
function StageBar({
  title,
  chip,
  sub,
  actions,
  back,
}: {
  /** The open record's name. */
  title: string
  /** Who they are to you, a document's type; omitted when it would repeat the name. */
  chip?: string
  /** One quiet line: "3 roles", "DriverLicense.png · Added Oct 2, 2026". Holds its height when empty. */
  sub?: string
  /** The actions on the whole record (Share, the ⋯ menu, Done): tools, `shape="rect"`. */
  actions?: ReactNode
  /** Below md: the way back to the list, left of the name (an icon button). Hidden from md. */
  back?: ReactNode
}) {
  return (
    <div data-slot="stage-bar" className="flex h-workspace-bar items-center justify-between gap-4 gutter-workspace">
      <div className="flex min-w-0 items-center gap-2">
        {back && <div className="-ml-2 shrink-0 md:hidden">{back}</div>}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 data-slot="stage-bar-title" className="truncate font-display text-lg font-bold text-foreground-strong">
              {title}
            </h2>
            {chip && (
              <Badge tone="info" size="sm" className="inline-flex h-6 shrink-0 items-center py-0 text-xs">
                {chip}
              </Badge>
            )}
          </div>
          <p data-slot="stage-bar-sub" className="mt-0.5 min-h-5 truncate text-xs font-medium text-muted-foreground">
            {sub}
          </p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}

export { StageBar }

export type StageBarProps = ComponentProps<typeof StageBar>
