"use client"

import type { ElementType, MouseEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { ArrowLeftIcon, DownloadIcon, PlusIcon, FilePenLineIcon, FileTextIcon, Share2Icon, Trash2Icon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { useActionMenu, type ListAction } from "../../../components/actions/action-menu"
import { PageHeader } from "../../../templates/page-header"
import { WorkspacePage } from "../../../templates/workspace-page"
import { ListGroup } from "../../patterns/list-group"
import { PickPanel } from "../../patterns/pick-panel"
import { StageBar } from "../../patterns/stage-bar"
import { DocumentRecord, type DocumentRecordCopy } from "../documents/document-record"
import { DocumentRow } from "../documents/document-row"
import type { AreaRef, VaultDocument } from "./data"
import { ViewList } from "./view-list"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §5 step 7, Documents on WorkspacePage, in labs
   (D-V5): the screen the app's /documents will render once the pieces move. People's twin:
   band (the count, Add a document) · list (search; the filter button with Needs and Show; the
   Area chips; the rows grouped "Needs you" then "Ready", v0) · stage (with nothing open the Pick
   panel; with a document open the stage bar — its name, its type as a chip when that isn't the
   name, its file and when it came in — and its record) · back (phone).
   The ⋯: Edit details when the caller can edit, Remove this document (destructive, last,
   confirmed in ConfirmDialog). Add a document opens the add dialog, not built in this pass
   (VIEWS-PLAN §4): the button is left out until it is (absent beats broken). */

export type DocumentsViewCopy = {
  title: string
  /** The stage bar's Download (the file, as it was added). */
  download: string
  lead: string
  add: string
  count: (n: number) => string
  search: string
  searchLabel: string
  areas: string
  filters: string
  needs: string
  show: string
  shared: string
  generated: string
  groupNeeds: string
  groupReady: string
  ready: string
  none: string
  clear: string
  pickTitle: string
  pickLead: string
  pickEmpty: string
  startWith: string
  /** The phone's way back to the list, the arrow's name ("Back to Documents"). */
  back: string
  share: string
  more: (title: string) => string
  editDetails: string
  remove: string
  removeConfirm: (title: string) => { title: string; description: string; confirmLabel: string }
  record: DocumentRecordCopy
}

/** Documents on WorkspacePage: everything filed, grouped by what needs you; the open document's record. */
export function DocumentsView({
  documents,
  copy,
  initialOpenId,
  onConfirm,
  onFix,
  onUse,
  onKeep,
  onEdit,
  onRemove,
  onShare,
  onAdd,
  hrefFor = (id) => `?id=${id}`,
  linkAs,
}: {
  documents: VaultDocument[]
  copy: DocumentsViewCopy
  initialOpenId?: string
  /** The owner checked these values of a document. Without it, no Looks right or Confirm all. */
  onConfirm?: (id: string, keys: string[]) => Promise<void | { error: string }>
  /** The owner fixed a value's reading. Without it, no Fix. */
  onFix?: (id: string, key: string, value: string) => Promise<void | { error: string }>
  onUse: (id: string, key: string) => Promise<void | { error: string }>
  onKeep: (id: string, key: string) => Promise<void | { error: string }>
  onEdit?: (id: string) => void
  onRemove?: (id: string) => Promise<void>
  onShare?: (id: string) => void
  /** Add a document (opens the add dialog, not built yet: VIEWS-PLAN §4). Without it, the band has no Add: absent beats broken. */
  onAdd?: () => void
  hrefFor?: (id: string) => string
  linkAs?: ElementType
}) {
  const [openId, setOpenId] = useState(initialOpenId)
  const [query, setQuery] = useState("")
  const [areaFilter, setAreaFilter] = useState<string[]>([])
  const [more, setMore] = useState<string[]>([])
  const open = documents.find((d) => d.id === openId)

  const areaItems = useMemo(() => {
    const counts = new Map<string, { area: AreaRef; count: number }>()
    for (const d of documents) for (const a of d.areas) counts.set(a.id, { area: a, count: (counts.get(a.id)?.count ?? 0) + 1 })
    return [...counts.values()]
  }, [documents])
  const needChips = useMemo(() => {
    const counts = new Map<string, { value: string; label: string; count: number }>()
    for (const d of documents)
      for (const n of d.needs)
        counts.set(`need:${n.kind}`, { value: `need:${n.kind}`, label: n.text, count: (counts.get(`need:${n.kind}`)?.count ?? 0) + 1 })
    return [...counts.values()]
  }, [documents])
  const showChips = [
    { value: "shared", label: copy.shared, count: documents.filter((d) => d.shares.length).length },
    { value: "generated", label: copy.generated, count: documents.filter((d) => d.generated).length },
  ]

  const q = query.trim().toLowerCase()
  const shown = documents.filter(
    (d) =>
      (!q || [d.title, d.type ?? "", d.fileName ?? ""].some((s) => s.toLowerCase().includes(q))) &&
      (areaFilter.length === 0 || d.areas.some((a) => areaFilter.includes(a.id))) &&
      more.every((f) => (f === "shared" ? d.shares.length > 0 : f === "generated" ? d.generated : d.needs.some((n) => `need:${n.kind}` === f))),
  )
  const needing = shown.filter((d) => d.needs.length)
  const ready = shown.filter((d) => !d.needs.length)

  const RowLink = useMemo<ElementType>(
    () =>
      function RowLink({ href, children, ...rest }: { href: string; children: ReactNode }) {
        const Link = linkAs ?? "a"
        const id = documents.find((d) => hrefFor(d.id) === href)?.id
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
    [documents, hrefFor, linkAs],
  )

  const actions: ListAction[] = open
    ? [
        ...(onEdit ? [{ id: "edit", kind: "action" as const, label: copy.editDetails, icon: <FilePenLineIcon />, run: () => onEdit(open.id) }] : []),
        ...(onRemove
          ? [
              {
                id: "remove",
                kind: "destructive" as const,
                irreversible: true,
                label: copy.remove,
                icon: <Trash2Icon />,
                confirm: copy.removeConfirm(open.title),
                run: async () => {
                  await onRemove(open.id)
                  setOpenId(undefined)
                },
              },
            ]
          : []),
      ]
    : []
  const menu = useActionMenu({ actions, label: open ? copy.more(open.title) : "", variant: "secondary", shape: "rect" })

  const rows = (list: VaultDocument[]) =>
    list.map((d) => <DocumentRow key={d.id} document={d} href={hrefFor(d.id)} current={d.id === openId} ready={copy.ready} linkAs={RowLink} />)

  return (
    <>
      <WorkspacePage
        open={Boolean(open)}
        listLabel={copy.title}
        stageLabel={open ? open.title : copy.pickTitle}
        band={
          <PageHeader
            density="compact"
            icon={
              <span
                aria-hidden
                className="inline-flex size-control items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-lg"
              >
                <FileTextIcon />
              </span>
            }
            title={copy.title}
            description={copy.lead}
            meta={copy.count(documents.length)}
            actions={
              onAdd && (
                <Button size="sm" icon={<PlusIcon />} onClick={onAdd}>
                  {copy.add}
                </Button>
              )
            }
          />
        }
        list={
          <ViewList
            search={{ value: query, onChange: setQuery, label: copy.searchLabel, placeholder: copy.search }}
            areas={{ label: copy.areas, items: areaItems, value: areaFilter, onChange: setAreaFilter }}
            filters={{
              label: copy.filters,
              sets: [...(needChips.length ? [{ label: copy.needs, chips: needChips }] : []), { label: copy.show, chips: showChips }],
              value: more,
              onChange: setMore,
            }}
            matches={shown.length > 0}
            none={{ title: copy.none, clear: copy.clear }}
          >
            {needing.length > 0 && (
              <ListGroup label={copy.groupNeeds} count={needing.length}>
                {rows(needing)}
              </ListGroup>
            )}
            {ready.length > 0 && (
              <ListGroup label={copy.groupReady} count={ready.length}>
                {rows(ready)}
              </ListGroup>
            )}
          </ViewList>
        }
        stageBar={
          open && (
            <StageBar
              back={
                <Button
                  variant="quiet"
                  size="icon"
                  shape="rect"
                  icon={<ArrowLeftIcon />}
                  aria-label={copy.back}
                  onClick={() => setOpenId(undefined)}
                />
              }
              title={open.title}
              chip={open.type !== open.title ? open.type : undefined}
              sub={[open.fileName, open.added].filter(Boolean).join(" · ")}
              actions={
                <>
                  {open.file && (
                    <Button asChild variant="secondary" size="sm" shape="rect" icon={<DownloadIcon />}>
                      <a href={open.file.src} download={open.fileName}>
                        <span className="max-sm:sr-only">{copy.download}</span>
                      </a>
                    </Button>
                  )}
                  {onShare && (
                    <Button variant="secondary" size="sm" shape="rect" icon={<Share2Icon />} onClick={() => onShare(open.id)}>
                      <span className="max-sm:sr-only">{copy.share}</span>
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
            <DocumentRecord
              key={open.id}
              document={open}
              copy={copy.record}
              linkAs={linkAs}
              onConfirm={onConfirm && ((keys) => onConfirm(open.id, keys))}
              onFix={onFix && ((key, value) => onFix(open.id, key, value))}
              onUse={(key) => onUse(open.id, key)}
              onKeep={(key) => onKeep(open.id, key)}
            />
          ) : (
            <PickPanel
              icon={<FileTextIcon />}
              title={copy.pickTitle}
              lead={copy.pickLead}
              start={copy.startWith}
              empty={documents.length === 0 ? copy.pickEmpty : undefined}
              linkAs={RowLink}
              items={documents.filter((d) => d.needs.length).map((d) => ({ id: d.id, title: d.title, need: d.needs[0]!.text, href: hrefFor(d.id) }))}
            />
          )
        }
      />
      {menu.dialog}
    </>
  )
}
