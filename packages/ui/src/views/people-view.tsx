"use client"

import { useMemo, useState } from "react"
import { ExpandIcon, EyeIcon, PencilIcon, PlusIcon, Share2Icon, UsersIcon } from "lucide-react"

import type { AreaId } from "../icons/area-glyphs"
import { Button } from "../components/actions/button"
import { Avatar } from "../components/display/avatar"
import { Page } from "../templates/page"
import { PageHeader } from "../templates/page-header"
import { AreaUse, DetailStage, ListPane, ListRow, MasterDetail, StageEmpty, StageSection, ViewIcon } from "./view-frame"

/* @archetype Frame (ARCHETYPES.md).
   PeopleView: everyone in the Vault and what each of them does for the owner. The rail lists
   people (search by name, relation or email); the stage shows the selected person's roles by
   Area, where else they're named, and what they can see. */

export type PersonUse = { area: AreaId; title: string; detail?: string }

export type Person = {
  id: string
  name: string
  relation: string
  phone?: string
  email?: string
  avatar?: string
  /** Roles the owner gave them ("The people who depend on you"). */
  roles: PersonUse[]
  /** Records that name them without a role (a beneficiary on a policy). */
  namedIn: PersonUse[]
  /** What in the Vault is shared with them. */
  canSee: string[]
}

function noteFor(p: Person) {
  if (p.roles.length === 0 && p.namedIn.length === 0) return "Not on anything yet"
  if (!p.phone && !p.email) return "No phone or email"
  return undefined
}

function areasOf(p: Person): AreaId[] {
  return [...new Set([...p.roles, ...p.namedIn].map((u) => u.area))]
}

const VIEW_TOOLS = (
  <>
    <Button variant="quiet" size="icon" aria-label="Edit">
      <PencilIcon />
    </Button>
    <Button variant="quiet" size="icon" aria-label="Open full screen">
      <ExpandIcon />
    </Button>
    <Button variant="quiet" size="icon" aria-label="Share">
      <Share2Icon />
    </Button>
    <Button variant="quiet" size="icon" aria-label="Preview as them">
      <EyeIcon />
    </Button>
  </>
)

function PersonDetail({ person }: { person: Person }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={person.name} src={person.avatar} size="2xl" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-display text-2xl leading-display font-bold tracking-display text-foreground-strong">{person.name}</h2>
          <p className="font-semibold text-foreground">{person.relation}</p>
          {(person.phone || person.email) && (
            <p className="text-sm text-muted-foreground">{[person.phone, person.email].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      </div>

      <StageSection title="What they do for you">
        {person.roles.length ? (
          person.roles.map((r) => <AreaUse key={r.area + r.title} {...r} href={`/area/${r.area}`} />)
        ) : (
          <StageEmpty>Nothing yet. Give them a role from any Area.</StageEmpty>
        )}
      </StageSection>

      {person.namedIn.length > 0 && (
        <StageSection title="Also named in">
          {person.namedIn.map((r) => (
            <AreaUse key={r.area + r.title} {...r} href={`/area/${r.area}`} />
          ))}
        </StageSection>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-border p-5">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Only visible to you</p>
        <h3 className="font-display text-lg font-bold text-foreground-strong">What they can see</h3>
        {person.canSee.length ? (
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {person.canSee.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <StageEmpty>Nothing yet. Nothing in your Vault is shared with them.</StageEmpty>
        )}
      </div>
    </>
  )
}

/** The People view: header, the people rail and the selected person's stage. */
function PeopleView({ people, initialId }: { people: Person[]; initialId?: string }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialId ?? people[0]?.id)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => [p.name, p.relation, p.email ?? ""].some((s) => s.toLowerCase().includes(q)))
  }, [people, query])

  const selected = people.find((p) => p.id === selectedId)

  return (
    <Page>
      <PageHeader
        back={{ href: "/", label: "Vault" }}
        icon={
          <ViewIcon>
            <UsersIcon />
          </ViewIcon>
        }
        title="People"
        description="Everyone in your Vault, and what each of them does for you."
        meta={`${people.length} ${people.length === 1 ? "person" : "people"}`}
        actions={
          <Button variant="secondary" icon={<PlusIcon />}>
            Add someone
          </Button>
        }
      />
      <MasterDetail
        list={
          <ListPane label="People" placeholder="Name, relation or email" query={query} onQueryChange={setQuery} count={shown.length}>
            {shown.map((p) => (
              <ListRow
                key={p.id}
                selected={p.id === selectedId}
                onSelect={() => setSelectedId(p.id)}
                lead={<Avatar name={p.name} src={p.avatar} size="lg" />}
                title={p.name}
                detail={p.relation}
                note={noteFor(p)}
                areas={areasOf(p)}
              />
            ))}
          </ListPane>
        }
        detail={
          <DetailStage label={selected ? selected.name : "No one selected"} tools={selected ? VIEW_TOOLS : undefined}>
            {selected ? <PersonDetail person={selected} /> : <StageEmpty>Choose someone to see what they do for you.</StageEmpty>}
          </DetailStage>
        }
      />
    </Page>
  )
}

export { PeopleView }
