"use client"

import type { ElementType, MouseEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { ArrowLeftIcon, PlusIcon, Share2Icon, Trash2Icon, UsersIcon, UserRoundCogIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { useActionMenu, type ListAction } from "../../../components/actions/action-menu"
import { PageHeader } from "../../../templates/page-header"
import { WorkspacePage } from "../../../templates/workspace-page"
import { PickPanel } from "../../patterns/pick-panel"
import { StageBar } from "../../patterns/stage-bar"
import { PersonRecord, type PersonRecordCopy } from "../people/person-record"
import { PersonRow } from "../people/person-row"
import type { ReachDraft } from "../people/reach-form"
import type { AreaRef, Person } from "./data"
import { ViewList } from "./view-list"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §5 step 7, People on WorkspacePage, in labs
   (D-V5): the screen the app's /people will render once the pieces move. It holds the screen's
   own state (the search, the filters, which person is open, the phone's two screens); the
   records and every word come in.
   Regions (§1a): band (PageHeader compact, the count, Add someone) · list (ViewList: search, the
   filter button with Needs, the Area chips; PersonRows, ungrouped as in v0) · stage (with no one
   open the Pick panel; with someone open the stage bar and their record) · back (phone).
   The stage bar's actions: Share (a tool), then ⋯ (useActionMenu, `shape="rect"`): Edit details
   when the caller can edit, Assign to roles (not a pet), Remove from People (destructive, last,
   confirmed in the library's ConfirmDialog — the webapp asked inline; the library's rule wins). */

export type PeopleViewCopy = {
  title: string
  lead: string
  add: string
  count: (n: number) => string
  search: string
  searchLabel: string
  areas: string
  filters: string
  needs: string
  none: string
  clear: string
  pickTitle: string
  pickLead: string
  pickEmpty: string
  startWith: string
  back: string
  share: string
  more: (name: string) => string
  editDetails: string
  assign: string
  remove: string
  removeConfirm: (name: string) => { title: string; description: string; confirmLabel: string }
  record: PersonRecordCopy
}

/** People on WorkspacePage: the list of everyone, the open person's record, what to choose with no one open. */
export function PeopleView({
  people,
  copy,
  initialOpenId,
  onSaveReach,
  onEdit,
  onAssign,
  onRemove,
  onShare,
  hrefFor = (id) => `?id=${id}`,
  linkAs,
}: {
  people: Person[]
  copy: PeopleViewCopy
  /** Who is open when the screen loads (the route's `?id=`). */
  initialOpenId?: string
  onSaveReach?: (id: string, draft: ReachDraft) => Promise<void | { error: string }>
  /** Edit details. Without it, the ⋯ menu leaves it out (VIEWS-PLAN finding: PersonAddForm can't take a saved person yet). */
  onEdit?: (id: string) => void
  onAssign?: (id: string) => void
  onRemove?: (id: string) => Promise<void>
  onShare?: (id: string) => void
  /** A person's record link. */
  hrefFor?: (id: string) => string
  linkAs?: ElementType
}) {
  const [openId, setOpenId] = useState(initialOpenId)
  const [query, setQuery] = useState("")
  const [areaFilter, setAreaFilter] = useState<string[]>([])
  const [needFilter, setNeedFilter] = useState<string[]>([])

  const open = people.find((p) => p.id === openId)

  // The Areas anyone is in, with how many; an Area with nobody isn't offered.
  const areaItems = useMemo(() => {
    const counts = new Map<string, { area: AreaRef; count: number }>()
    for (const p of people) for (const a of p.areas) counts.set(a.id, { area: a, count: (counts.get(a.id)?.count ?? 0) + 1 })
    return [...counts.values()]
  }, [people])
  const needSets = useMemo(() => {
    const counts = new Map<string, { value: string; label: string; count: number }>()
    for (const p of people) for (const n of p.needs) counts.set(n.kind, { value: n.kind, label: n.text, count: (counts.get(n.kind)?.count ?? 0) + 1 })
    return [...counts.values()]
  }, [people])

  const q = query.trim().toLowerCase()
  const shown = people.filter(
    (p) =>
      (!q || [p.name, p.stated, p.email ?? ""].some((s) => s.toLowerCase().includes(q))) &&
      (areaFilter.length === 0 || p.areas.some((a) => areaFilter.includes(a.id))) &&
      (needFilter.length === 0 || p.needs.some((n) => needFilter.includes(n.kind))),
  )

  // A row's link opens the person in place; the href is still a real link (a new tab, a copy).
  // Memoised, so a re-render doesn't remount every row (and lose the focused one).
  const RowLink = useMemo<ElementType>(
    () =>
      function RowLink({ href, children, ...rest }: { href: string; children: ReactNode }) {
        const Link = linkAs ?? "a"
        const id = people.find((p) => hrefFor(p.id) === href)?.id
        return (
          <Link
            href={href}
            {...rest}
            onClick={(e: MouseEvent) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || !id) return
              e.preventDefault()
              setOpenId(id)
            }}
          >
            {children}
          </Link>
        )
      },
    [people, hrefFor, linkAs],
  )

  const actions: ListAction[] = open
    ? [
        ...(onEdit ? [{ id: "edit", kind: "action" as const, label: copy.editDetails, icon: <UserRoundCogIcon />, run: () => onEdit(open.id) }] : []),
        ...(onAssign && !open.pet ? [{ id: "assign", kind: "action" as const, label: copy.assign, icon: <UsersIcon />, run: () => onAssign(open.id) }] : []),
        ...(onRemove
          ? [
              {
                id: "remove",
                kind: "destructive" as const,
                irreversible: true,
                label: copy.remove,
                icon: <Trash2Icon />,
                confirm: copy.removeConfirm(open.name),
                run: async () => {
                  await onRemove(open.id)
                  setOpenId(undefined)
                },
              },
            ]
          : []),
      ]
    : []
  const menu = useActionMenu({ actions, label: open ? copy.more(open.name) : "", shape: "rect" })

  return (
    <>
      <WorkspacePage
        open={Boolean(open)}
        listLabel={copy.title}
        stageLabel={open ? open.name : copy.pickTitle}
        band={
          <PageHeader
            density="compact"
            icon={
              <span aria-hidden className="inline-flex size-control items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-lg">
                <UsersIcon />
              </span>
            }
            title={copy.title}
            description={copy.lead}
            meta={copy.count(people.length)}
            actions={
              <Button size="sm" icon={<PlusIcon />}>
                {copy.add}
              </Button>
            }
          />
        }
        list={
          <ViewList
            search={{ value: query, onChange: setQuery, label: copy.searchLabel, placeholder: copy.search }}
            areas={{ label: copy.areas, items: areaItems, value: areaFilter, onChange: setAreaFilter }}
            filters={needSets.length ? { label: copy.filters, sets: [{ label: copy.needs, chips: needSets }], value: needFilter, onChange: setNeedFilter } : undefined}
            matches={shown.length > 0}
            none={{ title: copy.none, clear: copy.clear }}
          >
            <ul className="flex flex-col">
              {shown.map((p) => (
                <PersonRow key={p.id} person={p} href={hrefFor(p.id)} current={p.id === openId} linkAs={RowLink} />
              ))}
            </ul>
          </ViewList>
        }
        back={
          <Button variant="quiet" size="inline" icon={<ArrowLeftIcon />} onClick={() => setOpenId(undefined)}>
            {copy.back}
          </Button>
        }
        stageBar={
          open && (
            <StageBar
              title={open.name}
              chip={open.stated}
              sub={open.roles}
              actions={
                <>
                  {onShare && !open.pet && (
                    <Button variant="secondary" size="sm" shape="rect" icon={<Share2Icon />} onClick={() => onShare(open.id)}>
                      {copy.share}
                    </Button>
                  )}
                  {actions.length > 0 && menu.trigger}
                </>
              }
            />
          )
        }
        stage={
          open ? (
            <PersonRecord
              person={open}
              copy={copy.record}
              linkAs={linkAs}
              onSaveReach={onSaveReach && ((draft) => onSaveReach(open.id, draft))}
            />
          ) : (
            <PickPanel
              icon={<UsersIcon />}
              title={copy.pickTitle}
              lead={copy.pickLead}
              start={copy.startWith}
              empty={people.length === 0 ? copy.pickEmpty : undefined}
              linkAs={RowLink}
              items={people.filter((p) => p.needs.length).map((p) => ({ id: p.id, title: p.name, need: p.needs[0]!.text, href: hrefFor(p.id) }))}
            />
          )
        }
      />
      {menu.dialog}
    </>
  )
}
