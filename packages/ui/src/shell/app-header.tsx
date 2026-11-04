import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"
import { PopoverGroup } from "../components/internal/popover-group"

/* @archetype Composite (ARCHETYPES.md).
   AppHeader: layout and slots only (R1-19). logo · nav · actions. The Vault nav fills actions
   with HeaderSearch, NotificationBell and AccountMenu; the Essential Setup top bar fills it
   with StepRail and an exit link.
   Header actions are GLOBAL only: things that apply on every page (search, notifications,
   account, the Mode switch). Actions for the page you're on (add, edit, export, filter) go in
   that page's PageHeader `actions`, never here.
   Narrow screens (R2-22, GAPS #85): below sm (640) the nav moves to its own full-width row
   under the bar, its pills sharing the width; logo and actions stay on the 64px bar. The
   prototype has no phone layout (inventory gap 9), so this is ours. From sm everything is one
   row.
   Actions (R11-09, R11-10): 16px apart; one PopoverGroup around them, so only one header
   popover (search results, notifications, the account menu) is open at a time. */
/** The bar at the top of every page: logo, nav and the global actions. */
function AppHeader({
  logo,
  nav,
  actions,
  frame = "page",
  className,
}: {
  /** The product mark (usually a link home). */
  logo: ReactNode
  /** Primary navigation after the logo (optional). */
  nav?: ReactNode
  /** Global actions only, at the right edge: search, notifications, account, the Mode switch. Page actions go in PageHeader. */
  actions?: ReactNode
  /** page (default): the row in the page frame (1400, the page gutter), over a reading page. workspace: full width with the workspace gutter, over a WorkspacePage, so the logo starts on the workspace's edge. */
  frame?: "page" | "workspace"
  /** Extra classes on the header element (sticky positioning and the like), not restyling. */
  className?: string
}) {
  return (
    <header data-slot="app-header" className={cn("shrink-0 border-b bg-background", className)}>
      <div className={cn("flex flex-wrap items-center gap-x-6", frame === "workspace" ? "w-full gutter-workspace" : "page-frame")}>
        <div className="flex h-app-header shrink-0 items-center">{logo}</div>
        {nav && (
          <div
            data-slot="app-header-nav"
            className="order-last basis-full pb-3 *:w-full *:*:flex-1 sm:order-none sm:basis-auto sm:pb-0 sm:*:w-fit sm:*:*:flex-none"
          >
            {nav}
          </div>
        )}
        <span className="flex-1" />
        {actions && (
          <div data-slot="app-header-actions" className="flex h-app-header items-center gap-4">
            <PopoverGroup>{actions}</PopoverGroup>
          </div>
        )}
      </div>
    </header>
  )
}

export { AppHeader }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AppHeaderProps = ComponentProps<typeof AppHeader>
