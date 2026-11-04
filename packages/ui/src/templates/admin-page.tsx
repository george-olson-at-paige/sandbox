import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"

import { cn } from "../lib/utils"
import { AdminSidebar, type AdminNavId } from "../admin/admin-sidebar"
import { Breadcrumb, type BreadcrumbEntry } from "../components/navigation/breadcrumb"
import { SidebarLayout, SidebarToggle } from "../components/navigation/sidebar"
import { Separator } from "../components/display/separator"
import { PageHeader } from "./page-header"
import { PopoverGroup } from "../components/internal/popover-group"

/* @archetype Frame (ARCHETYPES.md).
   AdminPage (R8-07): the admin site's page frame. Sidebar on the left (AdminSidebar), then a
   56px top bar (the global actions at the right: the signed-in person, nothing page-specific,
   R1-28), then the
   page: PageHeader (title, one line, the page's own actions) and the sections 24 apart.
   Desktop-first (the admin rule, George: better, not perfect): the content uses the inset's full
   width with the page gutter, because tables and charts want width; no reading-width column.
   The collapse control is in the sidebar's footer (R10-06), so the top bar has no toggle on a
   desktop; below 768 the sidebar becomes a sheet (upstream) and the top bar's toggle opens it,
   and the page stacks; it works on a phone but isn't designed for one.
   Completions show in place (no global success banner, George): there is no banner slot.
   The sidebar is AdminPage's own (R12-09): the page names where it is (`current`) and AdminPage
   renders AdminSidebar, so every admin page has the admin nav and its footer Collapse control;
   a page can't pass a different sidebar or leave it out.
   Surfaces (R9-01): the content area is the page off-white (--surface-page, `bg-surface-page`),
   so the white cards, tables and charts on it read as surfaces; the top bar and the sidebar
   stay white, the sidebar apart by its 1px border. Customer templates stay on white. The content
   says so (`data-surface="page"`, R21-01, TOKENS.md §4), so the surfaces on it draw their edge in
   the hairline tint (`--surface-edge`) rather than the grey `--border`.
   Header slots (R21-02, George 2026-10-31, approved as a template change for the Journeys page):
   - `breadcrumb`: the levels above this page ("Admin", "Usage"), drawn by Breadcrumb over the
     title; the page itself (the title, when it is a string) is added as the last, current level,
     so the trail is a real trail (`aria-current="page"` on its end), never collapsed.
   - `meta`: the source and freshness line ("As of 31 Oct · nightly", "Local events · 24–31 Oct"),
     PageHeader's own `meta` (muted, before the actions), so it sits at the header's right.
   - `tabs`: views of this page (TabsLine, R21-03) on the header's rule: with tabs the rule moves
     from under the title to under the tabs, so the current tab's bar sits on it. PageHeader draws
     its rule on its row; AdminPage turns that off from outside (`[&>…]:border-b-0`, its row is
     the only child PageHeader renders here, since AdminPage passes no `back` or `lead`) and the
     tabs' wrapper draws the rule instead, one region line either way. */
/** The admin page layout: side nav, a top bar with the global actions (and the nav toggle on a phone), then the page header and sections. */
function AdminPage({
  current,
  navBadges,
  linkAs,
  title,
  description,
  breadcrumb,
  meta,
  tabs,
  actions,
  globalActions,
  defaultSidebarOpen = true,
  children,
}: {
  /** The admin destination this page is (marked current in the sidebar). */
  current: AdminNavId
  /** Counts on the sidebar's destinations ({ jobs: "4" } failed runs). */
  navBadges?: Partial<Record<AdminNavId, string>>
  /** The app's router link (next/link) for the sidebar's links. */
  linkAs?: ElementType
  /** The page's h1. */
  title: ReactNode
  /** One line under the title. */
  description?: ReactNode
  /** The levels above this page, top first ("Admin", "Usage"); the title is added as the current level. Omit for no trail. */
  breadcrumb?: BreadcrumbEntry[]
  /** The source and freshness line ("As of 31 Oct · nightly"), muted, at the header's right before the actions. */
  meta?: ReactNode
  /** Views of this page (a TabsLine), on the header's rule under the title. */
  tabs?: ReactNode
  /** Actions for this page (export, refresh, a date range), at the right of the header. */
  actions?: ReactNode
  /** Global actions in the top bar (the account menu). Page actions go in `actions`. */
  globalActions?: ReactNode
  /** Start with the sidebar expanded (default) or as the icon rail. */
  defaultSidebarOpen?: boolean
  /** The page sections, 24px apart. */
  children: ReactNode
}) {
  return (
    <SidebarLayout sidebar={<AdminSidebar current={current} badges={navBadges} linkAs={linkAs} />} defaultOpen={defaultSidebarOpen}>
      <header data-slot="admin-top-bar" className="sticky top-0 z-sticky flex h-bar shrink-0 items-center gap-2 border-b bg-background px-4">
        {/* On a phone only: on a desktop the sidebar's footer has the collapse control (R10-06). */}
        <SidebarToggle className="md:hidden" />
        <Separator orientation="vertical" className="h-5 md:hidden" />
        <span className="flex-1" />
        {globalActions && (
          <div className="flex items-center gap-4">
            {/* R11-09/R11-10: the header's spacing and its one-popover-at-a-time rule. */}
            <PopoverGroup>{globalActions}</PopoverGroup>
          </div>
        )}
      </header>
      <div data-slot="admin-page" data-surface="page" className="flex min-w-0 flex-1 flex-col gap-section bg-surface-page px-gutter pt-page-top pb-page-bottom">
        <div data-slot="admin-page-header" className={cn(tabs && "[&>[data-slot=page-header]>div]:border-b-0 [&>[data-slot=page-header]>div]:pb-3")}>
          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumb
              items={typeof title === "string" ? [...breadcrumb, { label: title }] : breadcrumb}
              maxItems={Infinity}
              linkAs={linkAs}
              className="mb-2"
            />
          )}
          <PageHeader title={title} description={description} meta={meta} actions={actions} />
          {tabs && (
            <div data-slot="admin-page-tabs" className="border-b">
              {tabs}
            </div>
          )}
        </div>
        {children}
      </div>
    </SidebarLayout>
  )
}

export { AdminPage }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AdminPageProps = ComponentProps<typeof AdminPage>
