"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { formatAgo, PERSON_STATUS, PLAN_LABEL, type PersonRow } from "@paige/ui/admin/pages/people"
import { formatDay } from "@paige/ui/lib/format"
import { Badge } from "@paige/ui/components/display/badge"
import { Card } from "@paige/ui/components/display/card"

import { PEOPLE_NOW } from "@paige/ui/fixtures/people"
import { AdminScreen } from "./admin-screen"
import { listHref } from "./use-list-url-state"

/* The stand-in person page (R12-10): who they are and the list's columns as facts, and the way
   back to the People list as it was left (its segment, filters, sort and page; the search comes
   back from the tab's storage). The real page comes later. */
export function PersonStandIn({ person }: { person: PersonRow }) {
  const list = adminHref("people")
  // The stored list URL is this tab's: read after hydration so the server and client agree.
  const [back, setBack] = useState<string>(list)
  useEffect(() => setBack(listHref(list, "people")), [list])
  const status = PERSON_STATUS[person.status]
  const facts: Array<[string, React.ReactNode]> = [
    ["Plan", PLAN_LABEL[person.plan]],
    ["Status", <Badge key="s" tone={status.tone} appearance={status.outline ? "outline" : "soft"}>{status.label}</Badge>],
    ["Partner", person.partner ?? "None"],
    ["Created", formatDay(person.createdAt)],
    ["Last active", formatAgo(person.lastActiveAt, PEOPLE_NOW)],
    ["MFA phone", person.mfaPhone ? "On file" : "None"],
  ]
  return (
    <AdminScreen
      current="people"
      title={person.name}
      description={person.email}
      actions={
        <Link href={back} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Back to People
        </Link>
      }
    >
      <Card className="gap-4 px-6 py-5">
        <h2 className="text-base font-semibold text-foreground-strong">Account</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
              <dd className="text-sm font-medium text-card-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm font-medium text-muted-foreground">The person page (sign-in, subscriptions, passing reports and the support actions) is designed in a later round.</p>
      </Card>
    </AdminScreen>
  )
}
