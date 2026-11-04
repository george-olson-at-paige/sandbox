import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   WorkspacePage (D-V1, George 2026-11-04; VIEWS-PLAN.md §1a): a View's workspace — find a
   record on the left, read or fix it on the right. People and Documents; the next Views too.
   Full bleed under the app header: no page frame, no 1400 cap. A reading page uses Page.

   Each region has one job. Anything that isn't that job goes in another region.
   - band     Name the View and its one way in: icon tile, title, lead, count, the View's
              primary action. Never filters, record actions or a record's notices.
   - list     Find and choose: search, filters, groups, rows, the list's own notices. A row is a
              link to its record, never a form. Scrolls on its own.
   - stage    Show the one chosen record (the record card), or, with nothing open, what to
              choose (the Pick panel). Never list controls or page actions. Scrolls on its own.
   - stageBar Which record is open and what can be done to all of it: title, chip, a quiet
              line, Share, ⋯ or Done. Stays at the top of the stage while it scrolls.
              Actions on one part of the record sit on that part, not here.
   - back     Below md only: the way from the record back to the list.

   Breakpoints (theme.css, the standard ones):
   - below md (768): one column, two screens. `open` false shows the band and the list;
     `open` true shows the stage, with `back` over it and no band.
   - md: list (300) | stage, each the window's height under the app header.
   - lg (1024): the list is 360.
   The record card sets its own width on the stage (max-w-record, 720, centred). */
/** A View's workspace: a band, a list to find and choose, and a stage that shows the chosen record. */
function WorkspacePage({
  band,
  list,
  stage,
  stageBar,
  back,
  open = false,
  listLabel,
  stageLabel,
}: {
  /** Names the View and its one way in: icon, title, lead, count, the primary action (a PageHeader). Hidden below md while a record is open. */
  band: ReactNode
  /** Find and choose: search, filters, groups, rows. Never edits. Scrolls on its own from md. */
  list: ReactNode
  /** The chosen record (its card), or what to choose when nothing is open (the Pick panel). Scrolls on its own from md. */
  stage: ReactNode
  /** Which record is open and the actions on all of it. Omit with nothing open. Sticks to the top of the stage. */
  stageBar?: ReactNode
  /** Below md, over the stage: the way back to the list (a link). Hidden from md, where the list is beside the stage. */
  back?: ReactNode
  /** A record is open. Below md it picks the screen: false, the band and list; true, the stage. From md both show. */
  open?: boolean
  /** The list region's accessible name, e.g. "People". */
  listLabel: string
  /** The stage region's accessible name, e.g. the open record's name, or "Pick someone". */
  stageLabel: string
}) {
  return (
    <main data-slot="workspace-page" data-open={open} className="flex flex-1 flex-col md:h-workspace md:min-h-0">
      <div data-slot="workspace-band" className={cn("border-b border-divider bg-background px-gutter py-3", open && "max-md:hidden")}>
        {band}
      </div>
      <div data-slot="workspace-columns" className="flex flex-1 flex-col md:grid md:min-h-0 md:grid-cols-workspace lg:grid-cols-workspace-wide">
        <section
          data-slot="workspace-list"
          aria-label={listLabel}
          className={cn("flex min-w-0 flex-col bg-background md:min-h-0 md:overflow-x-clip md:overflow-y-auto md:border-r md:border-divider scrollbar-thin", open && "max-md:hidden")}
        >
          {list}
        </section>
        <section
          data-slot="workspace-stage"
          aria-label={stageLabel}
          className={cn("flex min-w-0 flex-1 flex-col bg-surface-page md:min-h-0 md:overflow-x-clip md:overflow-y-auto scrollbar-thin", open ? "" : "max-md:hidden")}
        >
          {back && (
            <div data-slot="workspace-back" className="border-b border-divider bg-background px-gutter py-2 md:hidden">
              {back}
            </div>
          )}
          {stageBar && (
            <div data-slot="workspace-stage-bar" className="sticky top-0 z-sticky border-b border-divider bg-background">
              {stageBar}
            </div>
          )}
          <div data-slot="workspace-stage-body" className="flex flex-1 flex-col p-4 md:p-6">
            {stage}
          </div>
        </section>
      </div>
    </main>
  )
}

export { WorkspacePage }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type WorkspacePageProps = ComponentProps<typeof WorkspacePage>
