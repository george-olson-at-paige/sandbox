// adminNav (R9-03, GAPS #108): the admin destinations are one definition the sidebar renders and
// the app's routes check against. node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { adminHref, adminNav, adminNavItems } from "./admin-nav.ts"

const appAdmin = new URL("../../../../apps/web/app/admin", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")

/** Every route under apps/web/app/admin, as its URL path ("/admin", "/admin/jobs"). */
function adminRoutes(dir = appAdmin): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return adminRoutes(p)
    if (n !== "page.tsx") return []
    const all = relative(appAdmin, dir).split(sep).filter(Boolean).filter((s) => !/^\(.*\)$/.test(s)) // route groups add no segment
    // A page under a dynamic segment (/admin/people/[id], R12-10) is a row of that destination, not one of its own.
    const dynamic = all.findIndex((s) => s.startsWith("["))
    const segs = dynamic === -1 ? all : all.slice(0, dynamic)
    return ["/" + ["admin", ...segs].join("/")]
  })
}

test("ids are unique across sections", () => {
  const ids = adminNavItems.map((i) => i.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(adminNav.map((s) => s.id)).size, adminNav.length)
})

test("hrefs are unique and under /admin", () => {
  const hrefs = adminNavItems.map((i) => i.href)
  assert.equal(new Set(hrefs).size, hrefs.length)
  for (const h of hrefs) assert.match(h, /^\/admin(\/[a-z0-9-]+)*$/)
})

test("adminHref returns the definition's route", () => {
  assert.equal(adminHref("pulse"), "/admin")
  assert.equal(adminHref("jobs"), "/admin/jobs")
})

test("every admin route in the app is a destination in adminNav", () => {
  const hrefs = new Set(adminNavItems.map((i) => i.href))
  const routes = adminRoutes()
  assert.ok(routes.includes("/admin"), "the app has /admin")
  // A page inside a destination (/admin/reporting/rev-share, R15-03) belongs to it; Pulse (/admin) owns no sub-pages.
  const owned = (r: string) => hrefs.has(r as `/admin${string}`) || [...hrefs].some((h) => h !== "/admin" && r.startsWith(`${h}/`))
  for (const r of routes) assert.ok(owned(r), `${r} has no adminNav entry (add it to src/admin/admin-nav.ts)`)
})
