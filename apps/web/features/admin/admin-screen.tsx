"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import type { AdminNavId } from "@paige/ui/admin/admin-nav"
import type { BreadcrumbEntry } from "@paige/ui/components/navigation/breadcrumb"
import { AccountMenu } from "@paige/ui/shell/account-menu"
import { AdminPage } from "@paige/ui/templates/admin-page"

/* Every admin screen's frame (R17-07): AdminPage with the app's router link, the sidebar's badges
   and the account menu, in one place. The signed-in operator and the failed-run count are fixtures
   here; with the session and data layer they come from the session (the admin site plan's A11,
   A12) and the jobs endpoint, and this is the one file that changes. */

/** Failed job runs, shown on the sidebar's Jobs (a fixture until the jobs endpoint feeds it). */
const NAV_BADGES = { jobs: "4" } as const

export function AdminScreen({
  current,
  title,
  description,
  breadcrumb,
  meta,
  tabs,
  actions,
  children,
}: {
  current: AdminNavId
  title: ReactNode
  description?: ReactNode
  /** AdminPage's header slots (R21-02). */
  breadcrumb?: BreadcrumbEntry[]
  meta?: ReactNode
  tabs?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <AdminPage
      current={current}
      linkAs={Link}
      navBadges={NAV_BADGES}
      title={title}
      description={description}
      breadcrumb={breadcrumb}
      meta={meta}
      tabs={tabs}
      actions={actions}
      globalActions={<AccountMenu name="George Olson" email="george@example.com" items={[{ label: "Sign out", href: "/" }]} linkAs={Link} />}
    >
      {children}
    </AdminPage>
  )
}
