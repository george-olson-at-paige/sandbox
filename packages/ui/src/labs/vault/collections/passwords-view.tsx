"use client"

import type { ComponentProps, ElementType, ReactNode } from "react"
import { useCallback, useState } from "react"
import {
  AtSignIcon,
  ChevronRightIcon,
  HandCoinsIcon,
  HouseIcon,
  KeyRoundIcon,
  LandmarkIcon,
  LockIcon,
  PencilIcon,
  RepeatIcon,
  SmartphoneIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "../../../components/actions/button"
import { useActionMenu, type ListAction } from "../../../components/actions/action-menu"
import { CopyButton } from "../../../components/actions/copy-button"
import { Badge } from "../../../components/display/badge"
import { Attachment } from "../../../components/display/attachment"
import { Callout, CalloutAction } from "../../../components/feedback/callout"
import { EmptyState } from "../../../components/feedback/empty-state"
import { Input } from "../../../components/inputs/input"
import { Select } from "../../../components/inputs/select"
import { Textarea } from "../../../components/inputs/textarea"
import { Field } from "../../../forms/field"
import { PasswordField } from "../../../forms/fields/password-field"
import { FieldGroup } from "../../../forms/field-group"
import { Form } from "../../../forms/form"
import { FormFooter } from "../../../forms/form-footer"
import { FormSection } from "../../../forms/form-section"
import { PageHeader } from "../../../templates/page-header"
import { Page } from "../../../templates/page"
import { FileField, type FileFieldFile } from "../../components/file-field"
import { RepeatField } from "../../components/repeat-field"
import { SecretValue } from "../../components/secret-value"
import { FindRow } from "../../patterns/find-row"
import { ListGroup } from "../../patterns/list-group"
import { RecordCard, RecordSection } from "../record-section"
import { useRoutes } from "./use-routes"
import type { Account, AccountSummary, AccountsPrompt, AccountType } from "./data"
import type { PASSWORDS_COPY } from "./fixtures"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2 (George 2026-11-04): Passwords, the first
   of the keep-and-compose pages (Memories and Messages follow its shape). Not WorkspacePage:
   these are things you keep and read, not records you manage beside a list. One reading column
   (Page `focused`) for every screen:
   - the list: the header (icon, title, lead, count, Add), the next-kind prompt (the worksheet,
     a quiet Callout with Add and Skip), one find row (search, then the types as Chips), then
     the accounts grouped by type, each a row that opens it. No secrets and no usernames on the
     list (the wire's list is id, title, type). Nothing yet / nothing matches: EmptyState md.
   - an account: back to the list; its header (type tile, name, type chip, when added; Edit and
     ⋯ with Delete, confirmed: delete is hard); then a RecordCard: Signing in (website,
     username with Copy, each credential as a SecretValue that asks for its secret), Notes,
     Files; and one quiet line on who can see it (sharing isn't built).
   - add and edit: a Form at the same width: The account (type, name), Signing in (website,
     username, credentials as a RepeatField of a label and a secret), Notes, Files (FileField);
     Save and Cancel; leaving with changes warns (Form). A saved secret isn't sent back to the
     form: its field is blank, "Leave blank to keep the one saved."
   Navigation is by `href`s (`hrefs`) so a page can be deep-linked; in labs `linkAs` stands in
   for the router and the view keeps its own route. */

type Copy = typeof PASSWORDS_COPY
type Result = void | { error: string }
type Route = { name: "list" } | { name: "view"; id: string } | { name: "edit"; id: string } | { name: "add"; typeId?: string }

/** What a form saves: the account's fields, credentials with a new secret only when one was typed. */
export type AccountDraft = {
  typeId: string
  title: string
  webSite: string
  userName: string
  notes: string
  credentials: Array<{ id: string; label: string; secret: string; hasSecret: boolean }>
}

const TYPE_ICON: Record<string, ReactNode> = {
  financial: <LandmarkIcon />,
  digital: <AtSignIcon />,
  device: <SmartphoneIcon />,
  utility: <HouseIcon />,
  loan: <HandCoinsIcon />,
  subscription: <RepeatIcon />,
  other: <KeyRoundIcon />,
}

/** An account type's glyph on a quiet tile (the list's rows, the account's header). */
function TypeTile({ type, size = "sm" }: { type: AccountType; size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      data-slot="account-type-tile"
      className={
        size === "lg"
          ? "inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border-medium bg-surface-page text-muted-foreground [&_svg]:size-icon-xl"
          : "inline-flex size-control-sm shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-icon"
      }
    >
      {TYPE_ICON[type.id] ?? <KeyRoundIcon />}
    </span>
  )
}

/** One account on the list: its tile and name; the row opens it. */
function AccountRow({ account, href, linkAs: Link }: { account: AccountSummary; href: string; linkAs: ElementType }) {
  return (
    <li className="relative flex items-center gap-3 border-t border-divider py-2.5 first:border-t-0 hover:layer-hover">
      <TypeTile type={account.type} />
      <Link href={href} className="min-w-0 flex-1 truncate rounded-sm text-sm font-semibold focus-ring after:absolute after:inset-0">
        {account.title}
      </Link>
      <ChevronRightIcon aria-hidden className="size-icon text-muted-foreground" />
    </li>
  )
}

/** One line of an account's sign-in: its name, then the value and what you can do with it. */
function SignInLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-x-3 gap-y-0.5 py-1.5 text-sm sm:grid sm:grid-cols-record-line sm:items-center">
      <span className="font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Passwords: the list, an account, and adding or editing one, in one reading column. */
export function PasswordsView({
  accounts,
  types,
  prompt,
  copy,
  getAccount,
  onReveal,
  onSave,
  onRemove,
  onSkip,
  initialRoute = { name: "list" },
  hrefs = {
    list: "?",
    view: (id) => `?id=${id}`,
    edit: (id) => `?id=${id}&edit`,
    add: (typeId) => (typeId ? `?add=${typeId}` : "?add"),
  },
  linkAs = "a",
}: {
  /** Every account, as the list has them (no secrets). */
  accounts: AccountSummary[]
  types: AccountType[]
  /** The next kind to add, from the worksheet; none when every kind is covered or skipped. */
  prompt?: AccountsPrompt
  copy: Copy
  /** An account's details (no secrets: each credential says whether it has one). */
  getAccount: (id: string) => Account | undefined
  /** One credential's secret, when the owner asks for it. */
  onReveal: (accountId: string, credentialId: string) => Promise<string | { error: string }>
  /** Saves a new account (no id) or changes one. Resolve the saved account's id, or `{ error }`. */
  onSave: (draft: AccountDraft, id?: string) => Promise<string | { error: string }>
  /** Deletes an account (hard). */
  onRemove?: (id: string) => Promise<void>
  /** Skips the prompt's kind. */
  onSkip?: (typeId: string) => Promise<void>
  initialRoute?: Route
  hrefs?: { list: string; view: (id: string) => string; edit: (id: string) => string; add: (typeId?: string) => string }
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const resolve = useCallback((href: string) => routeOf(href, hrefs, accounts), [hrefs, accounts])
  const { route, setRoute, NavLink } = useRoutes<Route>(initialRoute, resolve, linkAs)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string[]>([])

  if (route.name === "view") {
    const account = getAccount(route.id)
    if (account)
      return (
        <AccountPage
          account={account}
          copy={copy}
          hrefs={hrefs}
          linkAs={NavLink}
          onReveal={onReveal}
          onRemove={onRemove}
          onGone={() => setRoute({ name: "list" })}
        />
      )
  }
  if (route.name === "edit" || route.name === "add") {
    const account = route.name === "edit" ? getAccount(route.id) : undefined
    return (
      <AccountForm
        account={account}
        typeId={route.name === "add" ? route.typeId : undefined}
        types={types}
        copy={copy}
        back={account ? hrefs.view(account.id) : hrefs.list}
        linkAs={NavLink}
        onCancel={() => setRoute(account ? { name: "view", id: account.id } : { name: "list" })}
        onSave={async (draft) => {
          const result = await onSave(draft, account?.id)
          if (typeof result !== "string") return result
          setRoute({ name: "view", id: result })
        }}
      />
    )
  }

  const q = query.trim().toLowerCase()
  const shown = accounts.filter((a) => (!q || a.title.toLowerCase().includes(q)) && (!typeFilter.length || typeFilter.includes(a.type.id)))
  const present = types.filter((t) => accounts.some((a) => a.type.id === t.id))
  return (
    <Page width="focused">
      <PageHeader
        icon={
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary text-on-tone [&_svg]:size-icon-xl">
            <LockIcon aria-hidden />
          </span>
        }
        title={copy.title}
        description={copy.lead}
        meta={copy.count(accounts.length)}
        actions={
          <Button asChild size="sm" icon={<KeyRoundIcon />}>
            <NavLink href={hrefs.add()}>{copy.add}</NavLink>
          </Button>
        }
      />
      {prompt && (
        <Callout
          tone="neutral"
          title={copy.prompt.title(prompt.next.label)}
          actions={
            <>
              <CalloutAction asChild>
                <NavLink href={hrefs.add(prompt.next.id)}>{copy.prompt.add(prompt.next.label)}</NavLink>
              </CalloutAction>
              {onSkip && (
                <CalloutAction variant="ghost" onClick={() => void onSkip(prompt.next.id)}>
                  {copy.prompt.skip}
                </CalloutAction>
              )}
            </>
          }
        >
          {copy.prompt.line(prompt.done, prompt.of)}
        </Callout>
      )}
      {accounts.length === 0 ? (
        <EmptyState size="md" icon={<KeyRoundIcon />} title={copy.emptyTitle} description={copy.emptyLine} />
      ) : (
        <section aria-label={copy.title} className="flex flex-col gap-4">
          <FindRow
            search={{ value: query, onChange: setQuery, label: copy.search }}
            filters={{
              label: copy.types,
              items: present.map((t) => ({ value: t.id, label: t.label, count: accounts.filter((a) => a.type.id === t.id).length })),
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
              {types
                .filter((t) => shown.some((a) => a.type.id === t.id))
                .map((t) => {
                  const inType = shown.filter((a) => a.type.id === t.id)
                  return (
                    <ListGroup key={t.id} label={t.label} count={inType.length} gutter={false}>
                      {inType.map((a) => (
                        <AccountRow key={a.id} account={a} href={hrefs.view(a.id)} linkAs={NavLink} />
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
function routeOf(
  href: string,
  hrefs: { list: string; view: (id: string) => string; edit: (id: string) => string; add: (typeId?: string) => string },
  accounts: AccountSummary[],
): Route | undefined {
  if (href === hrefs.list) return { name: "list" }
  if (href === hrefs.add()) return { name: "add" }
  for (const a of accounts) {
    if (href === hrefs.view(a.id)) return { name: "view", id: a.id }
    if (href === hrefs.edit(a.id)) return { name: "edit", id: a.id }
  }
  const typed = /[?&]add=([^&]+)/.exec(href)
  return typed ? { name: "add", typeId: typed[1] } : undefined
}

/** One account, read: its header, then Signing in, Notes and Files in a RecordCard. */
function AccountPage({
  account,
  copy,
  hrefs,
  linkAs: Link,
  onReveal,
  onRemove,
  onGone,
}: {
  account: Account
  copy: Copy
  hrefs: { list: string; edit: (id: string) => string }
  linkAs: ElementType
  onReveal: (accountId: string, credentialId: string) => Promise<string | { error: string }>
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
          confirm: copy.removeConfirm(account.title),
          run: async () => {
            await onRemove(account.id)
            onGone()
          },
        },
      ]
    : []
  const menu = useActionMenu({ actions, label: copy.more(account.title), variant: "secondary", shape: "rect" })
  return (
    <Page width="focused">
      <PageHeader
        back={{ href: hrefs.list, label: copy.back }}
        linkAs={Link}
        icon={<TypeTile type={account.type} size="lg" />}
        title={account.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="info" size="sm" className="inline-flex h-6 items-center py-0 text-xs">
              {account.type.label}
            </Badge>
            <span>{account.added}</span>
          </span>
        }
        actions={
          <span className="flex items-center gap-1.5">
            <Button asChild variant="secondary" size="sm" shape="rect" icon={<PencilIcon />}>
              <Link href={hrefs.edit(account.id)}>{copy.edit}</Link>
            </Button>
            {actions.length > 0 && menu.trigger}
          </span>
        }
      />
      <RecordCard label={account.title}>
        {(account.webSite || account.userName || account.credentials.length > 0) && (
          <RecordSection audience="shared" title={copy.signIn}>
            <div className="flex flex-col">
              {account.webSite && (
                <SignInLine label={copy.webSite}>
                  <a
                    href={account.webSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-sm font-semibold text-primary focus-ring hover:underline wrap-anywhere"
                  >
                    {account.webSite.replace(/^https?:\/\//, "")}
                  </a>
                </SignInLine>
              )}
              {account.userName && (
                <SignInLine label={copy.userName}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate font-semibold">{account.userName}</span>
                    <CopyButton
                      text={account.userName}
                      size="inline"
                      variant="quiet"
                      label="Copy"
                      aria-label={copy.copyUserName(account.title)}
                      className="text-xs"
                    />
                  </span>
                </SignInLine>
              )}
              {account.credentials
                .filter((c) => c.hasSecret)
                .map((c) => {
                  const label = c.label || copy.password
                  return (
                    <SignInLine key={c.id} label={label}>
                      <SecretValue name={copy.secretName(label, account.title)} onReveal={() => onReveal(account.id, c.id)} />
                    </SignInLine>
                  )
                })}
            </div>
          </RecordSection>
        )}
        {account.notes && (
          <RecordSection audience="shared" title={copy.notes}>
            <p className="text-sm font-medium whitespace-pre-line">{account.notes}</p>
          </RecordSection>
        )}
        {account.files.length > 0 && (
          <RecordSection audience="shared" title={copy.files}>
            <div className="flex flex-col gap-2">
              {account.files.map((f) => (
                <Attachment key={f.id} name={f.name} onOpen={() => {}} />
              ))}
            </div>
          </RecordSection>
        )}
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground [&_svg]:size-icon">
          <LockIcon aria-hidden />
          {copy.who}
        </p>
      </RecordCard>
      {menu.dialog}
    </Page>
  )
}

/** Adding or editing an account: a Form in the same reading column. */
function AccountForm({
  account,
  typeId,
  types,
  copy,
  back,
  linkAs,
  onCancel,
  onSave,
}: {
  account?: Account
  typeId?: string
  types: AccountType[]
  copy: Copy
  back: string
  linkAs: ElementType
  onCancel: () => void
  onSave: (draft: AccountDraft) => Promise<Result>
}) {
  const f = copy.form
  const [draft, setDraft] = useState<AccountDraft>(() => ({
    typeId: account?.type.id ?? typeId ?? "",
    title: account?.title ?? "",
    webSite: account?.webSite ?? "",
    userName: account?.userName ?? "",
    notes: account?.notes ?? "",
    // The unnamed credential is the password: the form says so.
    credentials: account?.credentials.map((c) => ({ id: c.id, label: c.label || copy.password, secret: "", hasSecret: c.hasSecret })) ?? [
      { id: "new-0", label: copy.password, secret: "", hasSecret: false },
    ],
  }))
  const [files, setFiles] = useState<FileFieldFile[]>(account?.files ?? [])
  const set = (patch: Partial<AccountDraft>) => setDraft((d) => ({ ...d, ...patch }))
  let next = draft.credentials.length
  return (
    <Page width="focused">
      <PageHeader
        back={{ href: back, label: account ? account.title : copy.back }}
        linkAs={linkAs}
        title={account ? f.editTitle(account.title) : f.addTitle}
      />
      <Form
        values={draft}
        validate={(v) => ({
          ...(v.typeId ? {} : { typeId: f.required }),
          ...(v.title.trim() ? {} : { title: f.required }),
        })}
        onSubmit={async (v) => {
          const result = await onSave(v)
          if (result && "error" in result) return { error: result.error }
        }}
      >
        <FormSection title={f.about}>
          <FieldGroup>
            <Field label={f.type} name="typeId">
              <Select
                placeholder={f.typePlaceholder}
                value={draft.typeId}
                onValueChange={(typeId) => set({ typeId })}
                options={types.map((t) => ({ value: t.id, label: t.label }))}
              />
            </Field>
            <Field label={f.title} name="title" description={f.titleHint}>
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
          </FieldGroup>
        </FormSection>
        <FormSection title={f.signIn}>
          <FieldGroup>
            {draft.typeId !== "device" && (
              <>
                <Field label={f.webSite} name="webSite" span={6}>
                  <Input type="url" inputMode="url" value={draft.webSite} placeholder="https://" onChange={(e) => set({ webSite: e.target.value })} />
                </Field>
                <Field label={f.userName} name="userName" span={6}>
                  <Input value={draft.userName} autoComplete="off" onChange={(e) => set({ userName: e.target.value })} />
                </Field>
              </>
            )}
          </FieldGroup>
          <div className="mt-6 flex flex-col gap-2">
            <span className="eyebrow text-muted-foreground">{f.credentials}</span>
            <RepeatField
              items={draft.credentials}
              onChange={(credentials) => set({ credentials })}
              create={() => ({ id: `new-${next++}`, label: "", secret: "", hasSecret: false })}
              keyOf={(c) => c.id}
              rowLabel={f.credentialRow}
              addLabel={f.addCredential}
              row={(c, update) => (
                <FieldGroup>
                  <Field label={f.credentialLabel} span={6}>
                    <Input value={c.label} placeholder={f.credentialLabelPlaceholder} onChange={(e) => update({ ...c, label: e.target.value })} />
                  </Field>
                  <Field label={f.secret} span={6} description={c.hasSecret ? f.keep : undefined}>
                    <PasswordField value={c.secret} autoComplete="new-password" onValueChange={(secret) => update({ ...c, secret })} />
                  </Field>
                </FieldGroup>
              )}
            />
          </div>
        </FormSection>
        <FormSection title={f.notes}>
          <Field name="notes" description={f.notesHint}>
            <Textarea aria-label={f.notes} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
        </FormSection>
        <FormSection title={f.files}>
          <FileField
            files={files}
            copy={copy.file}
            onAdd={(added) => setFiles((now) => [...now, ...added.map((file, i) => ({ id: `up-${Date.now()}-${i}`, name: file.name }))])}
            onRemove={(id) => setFiles((now) => now.filter((x) => x.id !== id))}
          />
        </FormSection>
        <FormFooter submitLabel={f.save} pendingLabel={f.saving} cancel={{ label: f.cancel, onClick: onCancel }} />
      </Form>
    </Page>
  )
}

export type PasswordsViewProps = ComponentProps<typeof PasswordsView>
