"use client"

import type { ComponentProps, ElementType, MouseEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { CameraIcon, LockIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { useActionMenu, type ListAction } from "../../../components/actions/action-menu"
import { Attachment } from "../../../components/display/attachment"
import { EmptyState } from "../../../components/feedback/empty-state"
import { Input } from "../../../components/inputs/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../../components/inputs/input-group"
import { Select } from "../../../components/inputs/select"
import { Field } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { DateField } from "../../../forms/fields/date-field"
import { FieldAction } from "../../../forms/fields/field-action"
import { Form } from "../../../forms/form"
import { FormFooter } from "../../../forms/form-footer"
import { FormSection } from "../../../forms/form-section"
import { Page } from "../../../templates/page"
import { PageHeader } from "../../../templates/page-header"
import { Chip, ChipGroup } from "../../components/chip"
import { FileField, type FileFieldFile } from "../../components/file-field"
import { SectionsField, type Section } from "../../components/sections-field"
import { ListGroup } from "../../patterns/list-group"
import { RecordCard, RecordSection } from "../record-section"
import { MemoryCard } from "./memory-card"
import type { Memory, MemoryCategory } from "./memories"
import type { MEMORIES_COPY } from "./memories-fixtures"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2 (George 2026-11-04): Memories on the
   keep-and-compose shape Passwords set (one reading column, Page `focused`, for every screen):
   - the list: the header (icon, title, lead, count, Add), one find row (search, the categories
     as Chips), then the memories by the year they happened, newest first, as picture-led
     cards (MemoryCard) two across from sm. One view, not Grid/Table/Timeline: the job is
     "browse by when it happened" and "find one".
   - a memory: back to the list; its header (title; when and category; Edit and ⋯ Delete); its
     picture at the column's width when it has one; then a RecordCard: the note as its lead,
     each part of the story as a section under its own title, a file that isn't a picture as
     an Attachment; and one quiet line on who it goes to (sharing is deferred, D10).
   - add and edit: a Form at the same width: The memory (category, title, when it happened, a
     one-line note), The story (SectionsField, the category's prompts as suggestions), the one
     photo, video or file (FileField, `max` 1). Leaving with changes warns (Form). */

type Copy = typeof MEMORIES_COPY
type Result = void | { error: string }
type Route = { name: "list" } | { name: "view"; id: string } | { name: "edit"; id: string } | { name: "add" }
type Hrefs = { list: string; view: (id: string) => string; edit: (id: string) => string; add: string }

/** What a form saves. */
export type MemoryDraft = { categoryId: string; title: string; occurredOn: string; note: string; sections: Section[] }

/** Memories: the list by year, a memory, and adding or editing one, in one reading column. */
export function MemoriesView({
  memories,
  categories,
  copy,
  onSave,
  onRemove,
  initialRoute = { name: "list" },
  hrefs = { list: "?", view: (id) => `?id=${id}`, edit: (id) => `?id=${id}&edit`, add: "?add" },
  linkAs = "a",
}: {
  memories: Memory[]
  categories: MemoryCategory[]
  copy: Copy
  /** Saves a new memory (no id) or changes one. Resolve the saved memory's id, or `{ error }`. */
  onSave: (draft: MemoryDraft, id?: string) => Promise<string | { error: string }>
  onRemove?: (id: string) => Promise<void>
  initialRoute?: Route
  hrefs?: Hrefs
  linkAs?: ElementType
}) {
  const [route, setRoute] = useState<Route>(initialRoute)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])

  const NavLink = useMemo<ElementType>(
    () =>
      function NavLink({ href, children, ...rest }: { href: string; children: ReactNode }) {
        const Link = linkAs
        return (
          <Link
            href={href}
            {...rest}
            onClick={(e: MouseEvent) => {
              const to = routeOf(href, hrefs, memories)
              if (e.metaKey || e.ctrlKey || e.shiftKey || !to) return
              e.preventDefault()
              setRoute(to)
            }}
          >
            {children}
          </Link>
        )
      },
    [linkAs, hrefs, memories],
  )

  if (route.name === "view") {
    const memory = memories.find((m) => m.id === route.id)
    if (memory) return <MemoryPage memory={memory} copy={copy} hrefs={hrefs} linkAs={NavLink} onRemove={onRemove} onGone={() => setRoute({ name: "list" })} />
  }
  if (route.name === "edit" || route.name === "add") {
    const memory = route.name === "edit" ? memories.find((m) => m.id === route.id) : undefined
    return (
      <MemoryForm
        memory={memory}
        categories={categories}
        copy={copy}
        back={memory ? hrefs.view(memory.id) : hrefs.list}
        linkAs={NavLink}
        onCancel={() => setRoute(memory ? { name: "view", id: memory.id } : { name: "list" })}
        onSave={async (draft) => {
          const result = await onSave(draft, memory?.id)
          if (typeof result !== "string") return result
          setRoute({ name: "view", id: result })
        }}
      />
    )
  }

  const q = query.trim().toLowerCase()
  const shown = memories
    .filter((m) => (!q || `${m.title} ${m.note ?? ""}`.toLowerCase().includes(q)) && (!categoryFilter.length || categoryFilter.includes(m.category.id)))
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
  const years = [...new Set(shown.map((m) => m.occurredOn.slice(0, 4)))]
  const present = categories.filter((c) => memories.some((m) => m.category.id === c.id))
  return (
    <Page width="focused">
      <PageHeader
        icon={
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-xl">
            <CameraIcon aria-hidden />
          </span>
        }
        title={copy.title}
        description={copy.lead}
        meta={copy.count(memories.length)}
        actions={
          <Button asChild size="sm" icon={<PlusIcon />}>
            <NavLink href={hrefs.add}>{copy.add}</NavLink>
          </Button>
        }
      />
      {memories.length === 0 ? (
        <EmptyState size="md" icon={<CameraIcon />} title={copy.emptyTitle} description={copy.emptyLine} />
      ) : (
        <section aria-label={copy.title} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label={copy.search}
                placeholder={copy.search}
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                className="[&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <FieldAction aria-label="Clear search" icon={<XIcon />} onClick={() => setQuery("")} />
                </InputGroupAddon>
              )}
            </InputGroup>
            {present.length > 1 && (
              <ChipGroup type="multiple" label={copy.categories} value={categoryFilter} onValueChange={setCategoryFilter}>
                {present.map((c) => (
                  <Chip key={c.id} value={c.id} count={memories.filter((m) => m.category.id === c.id).length}>
                    {c.label}
                  </Chip>
                ))}
              </ChipGroup>
            )}
          </div>
          {shown.length === 0 ? (
            <EmptyState
              kind="no-results"
              title={copy.none}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  shape="rect"
                  onClick={() => {
                    setQuery("")
                    setCategoryFilter([])
                  }}
                >
                  {copy.clear}
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {years.map((y) => {
                const inYear = shown.filter((m) => m.occurredOn.startsWith(y))
                return (
                  <ListGroup key={y} label={y} count={inYear.length} gutter={false}>
                    <li className="grid gap-4 pt-1 pb-3 sm:grid-cols-2">
                      {inYear.map((m) => (
                        <MemoryCard key={m.id} memory={m} href={hrefs.view(m.id)} linkAs={NavLink} />
                      ))}
                    </li>
                  </ListGroup>
                )
              })}
            </div>
          )}
        </section>
      )}
    </Page>
  )
}

/* An href back to a route, when it's one of the view's. */
function routeOf(href: string, hrefs: Hrefs, memories: Memory[]): Route | undefined {
  if (href === hrefs.list) return { name: "list" }
  if (href === hrefs.add) return { name: "add" }
  for (const m of memories) {
    if (href === hrefs.view(m.id)) return { name: "view", id: m.id }
    if (href === hrefs.edit(m.id)) return { name: "edit", id: m.id }
  }
  return undefined
}

/** One memory, read: its header, its picture, then the note and the story's parts in a RecordCard. */
function MemoryPage({
  memory,
  copy,
  hrefs,
  linkAs: Link,
  onRemove,
  onGone,
}: {
  memory: Memory
  copy: Copy
  hrefs: Hrefs
  linkAs: ElementType
  onRemove?: (id: string) => Promise<void>
  onGone: () => void
}) {
  const actions: ListAction[] = onRemove
    ? [
        {
          id: "remove",
          kind: "destructive",
          irreversible: true,
          label: copy.remove,
          icon: <Trash2Icon />,
          confirm: copy.removeConfirm(memory.title),
          run: async () => {
            await onRemove(memory.id)
            onGone()
          },
        },
      ]
    : []
  const menu = useActionMenu({ actions, label: copy.more(memory.title), variant: "secondary", shape: "rect" })
  const picture = memory.file?.src
  return (
    <Page width="focused">
      <PageHeader
        back={{ href: hrefs.list, label: copy.back }}
        linkAs={Link}
        title={memory.title}
        description={`${memory.when} · ${memory.category.label}`}
        actions={
          <span className="flex items-center gap-1.5">
            <Button asChild variant="secondary" size="sm" shape="rect" icon={<PencilIcon />}>
              <Link href={hrefs.edit(memory.id)}>{copy.edit}</Link>
            </Button>
            {actions.length > 0 && menu.trigger}
          </span>
        }
      />
      {picture && <img src={picture} alt={memory.title} className="aspect-video w-full rounded-xl border border-surface-edge object-cover" />}
      <RecordCard label={memory.title}>
        {memory.note && <p className="font-display text-lg leading-snug font-bold text-foreground-strong">{memory.note}</p>}
        {memory.sections.map((s) => (
          <RecordSection key={s.id} audience="shared" title={s.title}>
            <p className="text-sm font-medium whitespace-pre-line">{s.text}</p>
          </RecordSection>
        ))}
        {memory.file && !picture && <Attachment name={memory.file.name} kind={memory.file.kind} onOpen={() => {}} openLabel={copy.openFile(memory.file.name)} />}
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground [&_svg]:size-icon">
          <LockIcon aria-hidden />
          {copy.who}
        </p>
      </RecordCard>
      {menu.dialog}
    </Page>
  )
}

/** Adding or editing a memory: a Form in the same reading column. */
function MemoryForm({
  memory,
  categories,
  copy,
  back,
  linkAs,
  onCancel,
  onSave,
}: {
  memory?: Memory
  categories: MemoryCategory[]
  copy: Copy
  back: string
  linkAs: ElementType
  onCancel: () => void
  onSave: (draft: MemoryDraft) => Promise<Result>
}) {
  const f = copy.form
  const [draft, setDraft] = useState<MemoryDraft>(() => ({
    categoryId: memory?.category.id ?? "",
    title: memory?.title ?? "",
    occurredOn: memory?.occurredOn ?? "",
    note: memory?.note ?? "",
    sections: memory?.sections ?? [],
  }))
  const [file, setFile] = useState<FileFieldFile[]>(memory?.file ? [{ id: memory.file.id, name: memory.file.name, kind: memory.file.kind }] : [])
  const set = (patch: Partial<MemoryDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const prompts = categories.find((c) => c.id === draft.categoryId)?.prompts ?? []
  let next = draft.sections.length
  return (
    <Page width="focused">
      <PageHeader back={{ href: back, label: memory ? memory.title : copy.back }} linkAs={linkAs} title={memory ? f.editTitle(memory.title) : f.addTitle} />
      <Form
        values={draft}
        validate={(v) => ({
          ...(v.categoryId ? {} : { categoryId: f.required }),
          ...(v.title.trim() ? {} : { title: f.required }),
          ...(v.occurredOn ? {} : { occurredOn: f.required }),
        })}
        onSubmit={async (v) => {
          const result = await onSave(v)
          if (result && "error" in result) return { error: result.error }
        }}
      >
        <FormSection title={f.about}>
          <FieldGroup>
            <Field label={f.category} name="categoryId" span={6}>
              <Select
                placeholder={f.categoryPlaceholder}
                value={draft.categoryId}
                onValueChange={(categoryId) => set({ categoryId })}
                options={categories.map((c) => ({ value: c.id, label: c.label }))}
              />
            </Field>
            <Field label={f.occurredOn} name="occurredOn" span={6}>
              <DateField value={draft.occurredOn} onValueChange={(occurredOn) => set({ occurredOn })} />
            </Field>
            <Field label={f.title} name="title" description={f.titleHint}>
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label={f.note} name="note" description={f.noteHint}>
              <Input value={draft.note} onChange={(e) => set({ note: e.target.value })} />
            </Field>
          </FieldGroup>
        </FormSection>
        <FormSection title={f.story} description={f.storyHint}>
          <SectionsField
            sections={draft.sections}
            onChange={(sections) => set({ sections })}
            suggestions={prompts}
            newId={() => `new-${next++}`}
            copy={{
              row: f.sectionRow,
              title: f.sectionTitle,
              text: f.sectionText,
              add: f.addSection,
              suggestions: f.suggestions,
              up: (row) => `Move ${row.toLowerCase()} up`,
              down: (row) => `Move ${row.toLowerCase()} down`,
              remove: (row) => `Remove ${row.toLowerCase()}`,
            }}
          />
        </FormSection>
        <FormSection title={f.file}>
          <FileField
            files={file}
            max={1}
            accept="image/*,video/*,application/pdf"
            copy={copy.file}
            onAdd={(added) => setFile(added.slice(0, 1).map((x) => ({ id: `up-${Date.now()}`, name: x.name })))}
            onRemove={() => setFile([])}
          />
        </FormSection>
        <FormFooter submitLabel={f.save} pendingLabel={f.saving} cancel={{ label: f.cancel, onClick: onCancel }} />
      </Form>
    </Page>
  )
}

export type MemoriesViewProps = ComponentProps<typeof MemoriesView>
