"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { peoplePage, personActionMessage, personActions, type PersonActionId, type PersonActionInput, type PersonRow } from "@paige/ui/admin/pages/people"
import { PARTNER_NAMES } from "@paige/ui/fixtures/partners"
import { PEOPLE_NOW, previewPlanChange } from "@paige/ui/fixtures/people"
import { ListPage } from "@paige/ui/templates/list-page"

import { AdminScreen } from "./admin-screen"
import { useListUrlState } from "./use-list-url-state"

/* /admin/people (R12-10): the list page pattern for people. The page's fixed parts are
   `peoplePage` from @paige/ui/admin/people (the story uses the same, R17-06); the state is in the
   URL (useListUrlState: all but the search). The rows and the actions are fixtures: each action
   waits a moment, changes the row where it shows (status, plan) and says what it did in the
   toolbar's status line, never a banner. A row click opens the stand-in person page
   (/admin/people/[id]). No row selection for now (R16-06): the bulk actions are switched off. */

const href = (p: PersonRow) => `${adminHref("people")}/${p.id}`
/** The fixtures' today, so the date presets match the rows' "last active". */
const TODAY = PEOPLE_NOW.toISOString().slice(0, 10)
// Every partner (R13-22), so the Partners list's "View people" (?partner=<key>) lands filtered
// even for a partner with no one in the People sample.
const page = peoplePage({ href, linkAs: Link, now: PEOPLE_NOW, partners: PARTNER_NAMES, today: TODAY })
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PeopleScreen({ initial }: { initial: PersonRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [state, setState] = useListUrlState(page.config, "people")
  const [status, setStatus] = useState<string>()

  async function run(id: PersonActionId, people: PersonRow[], input: PersonActionInput) {
    await wait(600)
    const ids = new Set(people.map((p) => p.id))
    const update = (patch: Partial<PersonRow>) => setRows((all) => all.map((p) => (ids.has(p.id) ? { ...p, ...patch } : p)))
    if (id === "unlock" || id === "enable") update({ status: "active" })
    else if (id === "resetMfa") update({ mfaPhone: false })
    else if (id === "changePlan") update({ plan: input.plan ?? "direct", partner: null })
    else if (id === "disable" || id === "disableMany") update({ status: "disabled" })
    setStatus(personActionMessage(id, people, input))
  }

  return (
    <AdminScreen current="people" title={page.title} description={page.description}>
      <ListPage
        {...page.list}
        rows={rows}
        state={state}
        onStateChange={(next) => {
          setStatus(undefined)
          setState(next)
        }}
        onRowClick={(p) => router.push(href(p))}
        rowActions={(p) => personActions(p, { run, previewPlan: previewPlanChange })}
        status={status}
      />
    </AdminScreen>
  )
}
