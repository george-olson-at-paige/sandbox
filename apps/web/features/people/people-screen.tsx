import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { EmptyState } from "@paige/ui/components/feedback/empty-state"
import { PageHeader } from "@paige/ui/templates/page-header"
import { WorkspacePage } from "@paige/ui/templates/workspace-page"

import type { PersonRecord } from "@/fixtures/types"

/* People on WorkspacePage: the walking skeleton (VIEWS-PLAN.md §5 step 2). It proves the frame
   inside the Vault shell: the band, the list beside the stage, `?id=` opening a person, two
   screens on a phone. The list's rows, the stage bar and the record card are placeholders
   until steps 3 to 5 build them; Add someone waits for the add form (absent beats broken).
   Copy: the webapp's docs/views.md, word for word. */
export function PeopleScreen({ people, openId }: { people: Array<PersonRecord & { id: string }>; openId?: string }) {
  const open = people.find((person) => person.id === openId)
  return (
    <WorkspacePage
      open={Boolean(open)}
      listLabel="People"
      stageLabel={open ? open.name : "Pick someone"}
      band={
        <PageHeader
          icon={<UsersIcon aria-hidden />}
          title="People"
          description="Everyone in your Vault, and what each of them does for you."
          meta={people.length === 1 ? "1 person" : `${people.length} people`}
        />
      }
      list={
        <ul className="flex flex-col p-4">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/people?id=${person.id}`}
                aria-current={person.id === openId ? "true" : undefined}
                className="flex flex-col rounded-md px-3 py-2 focus-ring hover:layer-hover aria-[current=true]:bg-muted"
              >
                <span className="font-semibold">{person.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{person.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      }
      back={
        <Link href="/people" className="text-sm font-semibold focus-ring">
          People
        </Link>
      }
      stageBar={open ? <h2 className="px-6 py-3 font-display text-lg font-bold">{open.name}</h2> : undefined}
      stage={
        open ? (
          // The record card (vault, step 5) owns its width, max-w-record; the app may not.
          <div className="rounded-lg border border-surface-edge bg-card p-6">
            <p className="font-medium text-muted-foreground">{open.detail}</p>
          </div>
        ) : (
          <EmptyState
            title="Pick someone"
            description="See what they do for you, the documents that name them, and what they can see."
          />
        )
      }
    />
  )
}
