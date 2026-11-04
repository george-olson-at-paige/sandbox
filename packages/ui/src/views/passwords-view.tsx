"use client"

import { useMemo, useState } from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, KeyRoundIcon, PencilIcon, PlusIcon, ShieldAlertIcon } from "lucide-react"

import type { AreaId } from "../icons/area-glyphs"
import { Button } from "../components/actions/button"
import { Page } from "../templates/page"
import { PageHeader } from "../templates/page-header"
import { AreaUse, DetailStage, ListPane, ListRow, MasterDetail, StageEmpty, StageSection, ViewIcon } from "./view-frame"

/* @archetype Frame (ARCHETYPES.md).
   PasswordsView: the owner's logins, and who gets each one when the time comes. The rail
   lists logins (search by service, site or username); the stage shows the login with the
   password hidden until asked, where it lives in the Vault, and who it's released to. */

export type Login = {
  id: string
  service: string
  url: string
  username: string
  password: string
  area: AreaId
  /** Last changed, already formatted. */
  updated: string
  /** People who get this login when it's released. */
  releaseTo: string[]
  note?: string
  /** Short or reused: Paige suggests changing it. */
  weak?: boolean
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, value: string) => {
    void navigator.clipboard?.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }
  return { copied, copy }
}

function Secret({ label, value, masked, copied, onCopy, children }: { label: string; value: string; masked?: boolean; copied: boolean; onCopy: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:w-32">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1">
        <span className="min-w-0 flex-1 truncate font-mono text-foreground-strong">{masked ? "•".repeat(12) : value}</span>
        {children}
        <Button variant="quiet" size="icon" aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`} onClick={onCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </dd>
    </div>
  )
}

function LoginDetail({ login }: { login: Login }) {
  const [revealed, setRevealed] = useState(false)
  const { copied, copy } = useCopy()
  return (
    <>
      <div className="flex items-center gap-4">
        <span data-area={login.area} aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-area-tint font-display text-2xl font-bold text-area">
          {login.service.charAt(0)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-display text-2xl leading-display font-bold tracking-display text-foreground-strong">{login.service}</h2>
          <a href={`https://${login.url}`} target="_blank" rel="noreferrer" className="w-fit rounded-sm text-sm font-semibold text-primary focus-ring hover:underline">
            {login.url}
          </a>
        </div>
      </div>

      {login.weak && (
        <div role="note" className="flex items-start gap-3 rounded-lg bg-warning-subtle p-4 text-warning-foreground [&>svg]:mt-0.5 [&>svg]:size-icon [&>svg]:shrink-0">
          <ShieldAlertIcon aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{"This password is short and hasn't changed since " + login.updated + ". "}</span>
            Change it on {login.service}, then update it here.
          </p>
        </div>
      )}

      <StageSection title="The login">
        <dl className="flex flex-col gap-3">
          <Secret label="Username" value={login.username} copied={copied === "user"} onCopy={() => copy("user", login.username)} />
          <Secret label="Password" value={login.password} masked={!revealed} copied={copied === "pass"} onCopy={() => copy("pass", login.password)}>
            <Button variant="quiet" size="icon" aria-label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </Secret>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:w-32">Last changed</dt>
            <dd className="text-foreground">{login.updated}</dd>
          </div>
        </dl>
        {login.note && <p className="rounded-md bg-muted p-3 text-sm leading-relaxed text-foreground">{login.note}</p>}
      </StageSection>

      <StageSection title="Where it lives">
        <AreaUse area={login.area} title={`${login.service} account`} href={`/area/${login.area}`} />
      </StageSection>

      <StageSection title="Who gets it">
        {login.releaseTo.length ? (
          <ul className="flex flex-col gap-1 text-foreground">
            {login.releaseTo.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <StageEmpty>No one yet. It stays private until you choose someone.</StageEmpty>
        )}
      </StageSection>
    </>
  )
}

/** The Passwords view: header, the logins rail and the selected login's stage. */
function PasswordsView({ logins, initialId }: { logins: Login[]; initialId?: string }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialId ?? logins[0]?.id)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return logins
    return logins.filter((l) => [l.service, l.url, l.username].some((s) => s.toLowerCase().includes(q)))
  }, [logins, query])

  const selected = logins.find((l) => l.id === selectedId)
  const weak = logins.filter((l) => l.weak).length

  return (
    <Page>
      <PageHeader
        back={{ href: "/", label: "Vault" }}
        icon={
          <ViewIcon>
            <KeyRoundIcon />
          </ViewIcon>
        }
        title="Passwords"
        description="Your logins, kept private, and who gets each one when the time comes."
        meta={weak ? `${logins.length} logins · ${weak} to change` : `${logins.length} logins`}
        actions={
          <Button variant="secondary" icon={<PlusIcon />}>
            Add a login
          </Button>
        }
      />
      <MasterDetail
        list={
          <ListPane label="Logins" placeholder="Service, site or username" query={query} onQueryChange={setQuery} count={shown.length}>
            {shown.map((l) => (
              <ListRow
                key={l.id}
                selected={l.id === selectedId}
                onSelect={() => setSelectedId(l.id)}
                lead={
                  <span data-area={l.area} aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md bg-area-tint font-display font-bold text-area">
                    {l.service.charAt(0)}
                  </span>
                }
                title={l.service}
                detail={l.username}
                note={l.weak ? "Change this password" : l.releaseTo.length === 0 ? "No one gets it yet" : undefined}
                areas={[l.area]}
              />
            ))}
          </ListPane>
        }
        detail={
          <DetailStage
            label={selected ? selected.service : "No login selected"}
            tools={
              selected ? (
                <Button variant="quiet" size="icon" aria-label="Edit">
                  <PencilIcon />
                </Button>
              ) : undefined
            }
          >
            {selected ? <LoginDetail key={selected.id} login={selected} /> : <StageEmpty>Choose a login to see it.</StageEmpty>}
          </DetailStage>
        }
      />
    </Page>
  )
}

export { PasswordsView }
