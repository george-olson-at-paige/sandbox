import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   WorkspacePage (D-V1, George 2026-11-04; VIEWS-PLAN.md §1a): a View's workspace — find a
   record on the left, read or fix it on the right. People and Documents; the next Views too.
   It sits in the page frame (1400, the page gutter) like Home and the Area pages, so the logo,
   the band's title and the workspace's edge line up from page to page.

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

   Edges. From md the page behind the workspace is the page tint (`surface-page`), and the list
   and the stage are one panel on it (the list white; the stage open to the page's tint, so the page and the stage are one
   colour and the white list and record card stand on it, George 2026-11-04), edged at `border-medium` (between the region rule
   and the hairline): top, left, right, and one rule between the list and the stage. The band
   sits on the tint with no rule of its own, starting on the frame's edge under the logo, so the
   panel's top edge is what divides it from the band. Inside the panel the list's and the stage
   bar's contents start at the workspace gutter (`gutter-workspace`: 24 from sm), the caller's,
   with the same utility. Below md there is no frame and no tint: the screen is the panel, the
   band has its rule, and everything starts at the workspace gutter (16, 24 from sm).

   Breakpoints (theme.css, the standard ones):
   - below md (768): one column, two screens. `open` false shows the band and the list;
     `open` true shows the stage, with `back` over it and no band.
   - md: list (300) | stage, each the window's height under the app header.
   - lg (1024): the list is 360.
   The stage centres what it shows at the record's width (max-w-record, 720): every record on a
   stage is that wide, and the Pick panel sits in the same column. */
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
  /** The chosen record (its card), or what to choose when nothing is open (the Pick panel). Centred at the record's width (720); scrolls on its own from md. */
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
    <div data-slot="workspace-backdrop" className="flex flex-1 flex-col md:bg-surface-page">
      <main data-slot="workspace-page" data-open={open} className="flex flex-1 flex-col md:h-workspace md:min-h-0 md:page-frame">
        <div
          data-slot="workspace-band"
          className={cn("py-3 max-md:border-b max-md:border-border max-md:bg-background max-md:gutter-workspace", open && "max-md:hidden")}
        >
          {band}
        </div>
        <div
          data-slot="workspace-columns"
          className="flex flex-1 flex-col md:grid md:min-h-0 md:grid-cols-workspace md:border-x md:border-t md:border-border-medium md:bg-background lg:grid-cols-workspace-wide"
        >
          <section
            data-slot="workspace-list"
            aria-label={listLabel}
            className={cn(
              "flex min-w-0 flex-col bg-background md:min-h-0 md:overflow-x-clip md:overflow-y-auto md:border-r md:border-border-medium scrollbar-thin",
              open && "max-md:hidden",
            )}
          >
            {list}
          </section>
          <section
            data-slot="workspace-stage"
            aria-label={stageLabel}
            className={cn(
              "flex min-w-0 flex-1 flex-col bg-surface-page md:min-h-0 md:overflow-x-clip md:overflow-y-auto scrollbar-thin",
              open ? "" : "max-md:hidden",
            )}
          >
            {back && (
              <div data-slot="workspace-back" className="border-b border-border bg-background py-2 gutter-workspace md:hidden">
                {back}
              </div>
            )}
            {stageBar && (
              <div data-slot="workspace-stage-bar" className="sticky top-0 z-sticky border-b border-border-medium bg-background">
                {stageBar}
              </div>
            )}
            <div data-slot="workspace-stage-body" className="flex flex-1 flex-col p-4 md:p-6">
              <div data-slot="workspace-stage-column" className="mx-auto flex w-full max-w-record flex-col gap-4">
                {stage}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export { WorkspacePage }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type WorkspacePageProps = ComponentProps<typeof WorkspacePage>
