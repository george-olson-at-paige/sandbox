"use client"

import type { ComponentProps, ElementType } from "react"
import { useCallback, useState } from "react"
import { ChevronRightIcon, MailIcon, PencilIcon, PenLineIcon, Trash2Icon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { useActionMenu, type ListAction } from "../../../components/actions/action-menu"
import { Attachment } from "../../../components/display/attachment"
import { Badge } from "../../../components/display/badge"
import { EmptyState } from "../../../components/feedback/empty-state"
import { Input } from "../../../components/inputs/input"
import { RichText, type RichTextValue } from "../../../components/inputs/rich-text"
import { Select } from "../../../components/inputs/select"
import { Textarea } from "../../../components/inputs/textarea"
import { Field } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { Form } from "../../../forms/form"
import { FormFooter } from "../../../forms/form-footer"
import { FormSection } from "../../../forms/form-section"
import { Page } from "../../../templates/page"
import { PageHeader } from "../../../templates/page-header"
import { FileField, type FileFieldFile } from "../../components/file-field"
import { FindRow } from "../../patterns/find-row"
import { ListGroup } from "../../patterns/list-group"
import { RecordCard, RecordSection } from "../record-section"
import { DeliveryRuleField, draftOf, ruleOf, type DeliveryDraft } from "./delivery-rule-field"
import type { DeliveryKind, DeliveryRule, Message, MessageStatus, MessageType } from "./messages"
import type { MESSAGES_COPY } from "./messages-fixtures"
import { useRoutes } from "./use-routes"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2 (George 2026-11-04): Messages on the
   keep-and-compose shape (one reading column, Page `focused`, for every screen; FindRow and
   useRoutes shared with Passwords and Memories):
   - the list: the header (icon, title, lead, count, Write a message), the find row (search, the
     types as Chips), then the letters grouped by when they go — Right away · On a date · Every
     year · When a delegate says · After I'm gone — each a row: the envelope, the subject, its
     type and when it goes, and its status (Draft, Ready, Sent). No recipients: they aren't on
     the wire (COLLECTIONS-PLAN §4.6).
   - a message: back; its header (subject; type and when written; Edit and ⋯ Delete); then a
     RecordCard: when it goes, and under it that Paige doesn't send yet (D2: the rule is the
     owner's intent, kept); the letter itself (RichText); its files.
   - add and edit: a Form at the same width: The message (type, subject), the letter (rich
     Textarea), When it goes (DeliveryRuleField: only the chosen choice's inputs), files
     (FileField, `max` 2). A choice without its inputs filled doesn't save. */

type Copy = typeof MESSAGES_COPY
type Result = void | { error: string }
type Route = { name: "list" } | { name: "view"; id: string } | { name: "edit"; id: string } | { name: "add" }
type Hrefs = { list: string; view: (id: string) => string; edit: (id: string) => string; add: string }

/** What a form saves. */
export type MessageDraft = { typeId: string; subject: string; body?: RichTextValue; rule?: DeliveryRule }

const ORDER: DeliveryKind[] = ["now", "date", "yearly", "delegate", "after"]
const STATUS_TONE: Record<MessageStatus, "neutral" | "info" | "success"> = { draft: "neutral", scheduled: "info", sent: "success" }

/** A message's status as a chip: Draft, Ready, Sent. */
function StatusChip({ status, copy }: { status: MessageStatus; copy: Copy }) {
  return (
    <Badge tone={STATUS_TONE[status]} size="sm" className="inline-flex h-6 shrink-0 items-center py-0 text-xs">
      {copy.status[status]}
    </Badge>
  )
}

/** One letter on the list: the envelope, the subject, its type and when it goes, its status; the row opens it. */
function MessageRow({ message, href, copy, linkAs: Link }: { message: Message; href: string; copy: Copy; linkAs: ElementType }) {
  return (
    <li className="relative flex items-center gap-3 border-t border-divider py-2.5 first:border-t-0 hover:layer-hover">
      <span
        aria-hidden
        className="inline-flex size-control-sm shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-icon"
      >
        {message.status === "draft" ? <PenLineIcon /> : <MailIcon />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Link href={href} className="truncate rounded-sm text-sm font-semibold focus-ring after:absolute after:inset-0">
          {message.subject}
        </Link>
        <span className="truncate text-xs font-medium text-muted-foreground">
          {message.type.label} · {copy.rule(message.rule)}
        </span>
      </span>
      <StatusChip status={message.status} copy={copy} />
      <ChevronRightIcon aria-hidden className="size-icon text-muted-foreground" />
    </li>
  )
}

/** Messages: the letters by when they go, a letter, and writing or editing one, in one reading column. */
export function MessagesView({
  messages,
  types,
  copy,
  onSave,
  onRemove,
  initialRoute = { name: "list" },
  hrefs = { list: "?", view: (id) => `?id=${id}`, edit: (id) => `?id=${id}&edit`, add: "?add" },
  linkAs = "a",
}: {
  messages: Message[]
  types: MessageType[]
  copy: Copy
  /** Saves a new message (no id) or changes one. Resolve the saved message's id, or `{ error }`. */
  onSave: (draft: MessageDraft, id?: string) => Promise<string | { error: string }>
  onRemove?: (id: string) => Promise<void>
  initialRoute?: Route
  hrefs?: Hrefs
  linkAs?: ElementType
}) {
  const resolve = useCallback((href: string) => routeOf(href, hrefs, messages), [hrefs, messages])
  const { route, setRoute, NavLink } = useRoutes<Route>(initialRoute, resolve, linkAs)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string[]>([])

  if (route.name === "view") {
    const message = messages.find((m) => m.id === route.id)
    if (message)
      return (
        <MessagePage message={message} copy={copy} hrefs={hrefs} linkAs={NavLink} onRemove={onRemove} onGone={() => setRoute({ name: "list" })} />
      )
  }
  if (route.name === "edit" || route.name === "add") {
    const message = route.name === "edit" ? messages.find((m) => m.id === route.id) : undefined
    return (
      <MessageForm
        message={message}
        types={types}
        copy={copy}
        back={message ? hrefs.view(message.id) : hrefs.list}
        linkAs={NavLink}
        onCancel={() => setRoute(message ? { name: "view", id: message.id } : { name: "list" })}
        onSave={async (draft) => {
          const result = await onSave(draft, message?.id)
          if (typeof result !== "string") return result
          setRoute({ name: "view", id: result })
        }}
      />
    )
  }

  const q = query.trim().toLowerCase()
  const shown = messages.filter((m) => (!q || m.subject.toLowerCase().includes(q)) && (!typeFilter.length || typeFilter.includes(m.type.id)))
  const present = types.filter((t) => messages.some((m) => m.type.id === t.id))
  return (
    <Page width="focused">
      <PageHeader
        icon={
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-xl">
            <MailIcon aria-hidden />
          </span>
        }
        title={copy.title}
        description={copy.lead}
        meta={copy.count(messages.length)}
        actions={
          <Button asChild size="sm" icon={<PenLineIcon />}>
            <NavLink href={hrefs.add}>{copy.add}</NavLink>
          </Button>
        }
      />
      {messages.length === 0 ? (
        <EmptyState size="md" icon={<MailIcon />} title={copy.emptyTitle} description={copy.emptyLine} />
      ) : (
        <section aria-label={copy.title} className="flex flex-col gap-4">
          <FindRow
            search={{ value: query, onChange: setQuery, label: copy.search }}
            filters={{
              label: copy.types,
              items: present.map((t) => ({ value: t.id, label: t.label, count: messages.filter((m) => m.type.id === t.id).length })),
              value: typeFilter,
              onChange: setTypeFilter,
            }}
          />
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
                    setTypeFilter([])
                  }}
                >
                  {copy.clear}
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {ORDER.filter((k) => shown.some((m) => m.rule.kind === k)).map((k) => {
                const inGroup = shown.filter((m) => m.rule.kind === k)
                return (
                  <ListGroup key={k} label={copy.groups[k]} count={inGroup.length} gutter={false}>
                    {inGroup.map((m) => (
                      <MessageRow key={m.id} message={m} href={hrefs.view(m.id)} copy={copy} linkAs={NavLink} />
                    ))}
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
function routeOf(href: string, hrefs: Hrefs, messages: Message[]): Route | undefined {
  if (href === hrefs.list) return { name: "list" }
  if (href === hrefs.add) return { name: "add" }
  for (const m of messages) {
    if (href === hrefs.view(m.id)) return { name: "view", id: m.id }
    if (href === hrefs.edit(m.id)) return { name: "edit", id: m.id }
  }
  return undefined
}

/** One letter, read: its header, when it goes (and that nothing sends yet), the letter, its files. */
function MessagePage({
  message,
  copy,
  hrefs,
  linkAs: Link,
  onRemove,
  onGone,
}: {
  message: Message
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
          confirm: copy.removeConfirm(message.subject),
          run: async () => {
            await onRemove(message.id)
            onGone()
          },
        },
      ]
    : []
  const menu = useActionMenu({ actions, label: copy.more(message.subject), variant: "secondary", shape: "rect" })
  return (
    <Page width="focused">
      <PageHeader
        back={{ href: hrefs.list, label: copy.back }}
        linkAs={Link}
        title={message.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusChip status={message.status} copy={copy} />
            <span>
              {message.type.label} · {message.written}
            </span>
          </span>
        }
        actions={
          <span className="flex items-center gap-1.5">
            <Button asChild variant="secondary" size="sm" shape="rect" icon={<PencilIcon />}>
              <Link href={hrefs.edit(message.id)}>{copy.edit}</Link>
            </Button>
            {actions.length > 0 && menu.trigger}
          </span>
        }
      />
      <RecordCard label={message.subject}>
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg leading-snug font-bold text-foreground-strong">{copy.rule(message.rule)}</p>
          {message.status !== "sent" && <p className="text-sm font-medium text-muted-foreground">{copy.notYet}</p>}
        </div>
        <RecordSection audience="shared" title={copy.letter}>
          <RichText value={message.body} className="text-sm" />
        </RecordSection>
        {message.files.length > 0 && (
          <RecordSection audience="shared" title={copy.files}>
            <div className="flex flex-col gap-2">
              {message.files.map((f) => (
                <Attachment key={f.id} name={f.name} onOpen={() => {}} />
              ))}
            </div>
          </RecordSection>
        )}
      </RecordCard>
      {menu.dialog}
    </Page>
  )
}

/** Writing or editing a letter: a Form in the same reading column. */
function MessageForm({
  message,
  types,
  copy,
  back,
  linkAs,
  onCancel,
  onSave,
}: {
  message?: Message
  types: MessageType[]
  copy: Copy
  back: string
  linkAs: ElementType
  onCancel: () => void
  onSave: (draft: MessageDraft) => Promise<Result>
}) {
  const f = copy.form
  const [typeId, setTypeId] = useState(message?.type.id ?? "")
  const [subject, setSubject] = useState(message?.subject ?? "")
  const [body, setBody] = useState<RichTextValue | undefined>(message?.body)
  const [when, setWhen] = useState<DeliveryDraft>(draftOf(message?.rule))
  const [files, setFiles] = useState<FileFieldFile[]>(message?.files ?? [])
  const values: MessageDraft & { when: DeliveryDraft } = { typeId, subject, body, rule: ruleOf(when), when }
  return (
    <Page width="focused">
      <PageHeader
        back={{ href: back, label: message ? message.subject : copy.back }}
        linkAs={linkAs}
        title={message ? f.editTitle(message.subject) : f.addTitle}
      />
      <Form
        values={values}
        validate={(v) => ({
          ...(v.typeId ? {} : { typeId: f.required }),
          ...(v.subject.trim() ? {} : { subject: f.required }),
          ...(v.rule ? {} : { when: f.required }),
        })}
        onSubmit={async ({ when: _when, ...v }) => {
          const result = await onSave(v)
          if (result && "error" in result) return { error: result.error }
        }}
      >
        <FormSection title={f.about}>
          <FieldGroup>
            <Field label={f.type} name="typeId" span={5}>
              <Select
                placeholder={f.typePlaceholder}
                value={typeId}
                onValueChange={setTypeId}
                options={types.map((t) => ({ value: t.id, label: t.label }))}
              />
            </Field>
            <Field label={f.subject} name="subject" span={7} description={f.subjectHint}>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
          </FieldGroup>
        </FormSection>
        <FormSection title={f.letter}>
          <Field name="body">
            <Textarea format="rich" aria-label={f.letter} placeholder={f.letterPlaceholder} value={body} onChange={setBody} />
          </Field>
        </FormSection>
        <FormSection title={f.when} description={f.whenHint}>
          <Field name="when">
            <DeliveryRuleField draft={when} onChange={setWhen} copy={f.rule} />
          </Field>
        </FormSection>
        <FormSection title={f.files}>
          <FileField
            files={files}
            max={2}
            copy={copy.file}
            onAdd={(added) => setFiles((now) => [...now, ...added.map((x, i) => ({ id: `up-${Date.now()}-${i}`, name: x.name }))])}
            onRemove={(id) => setFiles((now) => now.filter((x) => x.id !== id))}
          />
        </FormSection>
        <FormFooter submitLabel={f.save} pendingLabel={f.saving} cancel={{ label: f.cancel, onClick: onCancel }} />
      </Form>
    </Page>
  )
}

export type MessagesViewProps = ComponentProps<typeof MessagesView>
