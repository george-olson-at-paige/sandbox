"use client"

import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"

import { Sidebar } from "../components/navigation/sidebar"
import { adminNav, type AdminNavId } from "./admin-nav"

/* @archetype Composite (ARCHETYPES.md).
   AdminSidebar (R8-07): the admin site's own nav, the Components › Navigation Sidebar with the
   admin's sections and mark. Product chrome is explicit (R8-06): the generic Sidebar is in
   components/, the admin's destinations here in admin/, the customer header's composition in
   the app (features/shell/vault-shell.tsx); shell/ holds only chrome both products share
   (AppHeader's slots, AccountMenu, NotificationBell, HeaderSearch, StepRail).
   The destinations are data (R9-03, GAPS #108): `adminNav` in admin-nav.ts, which the app's
   routes also take their paths from; this component only renders it.
   R10-06/07: the collapse control is in the footer (Ctrl/Cmd+B still toggles), and there is no
   rail on the edge: a plain border with the default cursor, nothing to resize. */

/** The admin site's side nav: its sections and mark, the current page marked. */
function AdminSidebar({
  current,
  linkAs,
  footer,
  badges,
}: {
  /** The current page. */
  current: AdminNavId
  /** The app's router link (next/link). */
  linkAs?: ElementType
  /** Below the nav: the signed-in person. */
  footer?: ReactNode
  /** Counts by destination ("jobs": "2" failed runs). */
  badges?: Partial<Record<AdminNavId, string>>
}) {
  const sections = adminNav.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, badge: badges?.[i.id] })) }))
  return (
    <Sidebar
      label="Admin"
      sections={sections}
      activeId={current}
      linkAs={linkAs}
      footer={footer}
      collapseControl
      rail={false}
      header={        
        <span className="flex items-center gap-2 overflow-hidden font-semibold text-foreground-strong">
          {/* TODO: component for this */}
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
            P
          </span>
          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">Paige Admin</span>
        </span>
      }
    />
  )
}

export { AdminSidebar }
export type { AdminNavId }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AdminSidebarProps = ComponentProps<typeof AdminSidebar>
