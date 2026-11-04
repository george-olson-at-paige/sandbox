import { Activity, BadgeDollarSign, Building2, ChartLine, CircleGauge, ListChecks, Route, Settings, Tags, TicketPercent, Users } from "lucide-react"

import type { SidebarIcon } from "../components/navigation/sidebar"

/* adminNav (R9-03, GAPS #108): the admin site's destinations as one typed definition. The
   sidebar renders it (AdminSidebar), the app's routes take their paths from it (`adminHref`),
   and `src/admin/admin-nav.test.ts` checks it: ids and hrefs unique, every href under /admin,
   and every admin route the app has (every page.tsx under apps/web/app/admin) is a destination here.
   The names are the admin site plan's vocabulary (agents/docs/admin-site-2026-10.md: Pulse,
   People, Partners — never "banks" — Billing, Reporting, Journeys, Jobs; "offers" means only a
   partner's ad strip, R15-09; billing is Plans, Subscriptions and Promotion codes, list pages
   linked by filters, R16-03 and R16-05, George 2026-10-21; Settings holds the rev share
   defaults, R15-12); the hrefs follow its
   one /admin site and stay provisional until the admin route map lands: changing one is an edit
   here, nothing else. A badge (a count of failed runs) is the page's data, passed to
   AdminSidebar's `badges`, not part of the definition. */

/** One admin destination. */
type AdminNavItem = {
  /** Stable id: AdminSidebar's `current`, the key for `badges`. */
  readonly id: string
  readonly label: string
  /** The route, under /admin. */
  readonly href: `/admin${string}`
  readonly icon: SidebarIcon
}

/** A labelled group of destinations (the first, Pulse, has no label). */
type AdminNavSection = { readonly id: string; readonly label?: string; readonly items: readonly AdminNavItem[] }

const adminNav = [
  { id: "overview", items: [{ id: "pulse", label: "Pulse", href: "/admin", icon: CircleGauge }] },
  {
    id: "customers",
    label: "Customers",
    items: [
      { id: "people", label: "People", href: "/admin/people", icon: Users },
      { id: "partners", label: "Partners", href: "/admin/partners", icon: Building2 },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    items: [
      { id: "plans", label: "Plans", href: "/admin/billing/plans", icon: Tags },
      { id: "subscriptions", label: "Subscriptions", href: "/admin/billing/subscriptions", icon: BadgeDollarSign },
      { id: "promotionCodes", label: "Promotion codes", href: "/admin/billing/promotion-codes", icon: TicketPercent },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "reporting", label: "Reporting", href: "/admin/reporting", icon: ChartLine },
      { id: "journeys", label: "Journeys", href: "/admin/journeys", icon: Route },
      { id: "usage", label: "Usage", href: "/admin/usage", icon: Activity },
      { id: "jobs", label: "Jobs", href: "/admin/jobs", icon: ListChecks },
      { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
] as const satisfies readonly AdminNavSection[]

/** The id of every admin destination, derived from the definition. */
type AdminNavId = (typeof adminNav)[number]["items"][number]["id"]

/** Every destination, in nav order. */
const adminNavItems: readonly AdminNavItem[] = (adminNav as readonly AdminNavSection[]).flatMap((s) => s.items)

/** The route of a destination: `adminHref("jobs")` → "/admin/jobs". */
function adminHref(id: AdminNavId): `/admin${string}` {
  const item = adminNavItems.find((i) => i.id === id)
  if (!item) throw new Error(`adminHref: no admin destination "${id}"`)
  return item.href
}

export { adminHref, adminNav, adminNavItems }
export type { AdminNavId, AdminNavItem, AdminNavSection }
