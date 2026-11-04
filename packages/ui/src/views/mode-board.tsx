"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { BookImageIcon, LayoutGridIcon, ListIcon, MailIcon, PaperclipIcon, PencilIcon, PlusIcon, SearchIcon, Share2Icon, Trash2Icon } from "lucide-react"

import { Button } from "../components/actions/button"
import { Badge } from "../components/display/badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/inputs/input-group"
import { cn } from "../lib/utils"
import { Page } from "../templates/page"
import { PageHeader } from "../templates/page-header"
import { ViewIcon } from "./view-frame"

/* @archetype Frame (ARCHETYPES.md).
   ModeBoard: the Messages and Memories modes. A header, a search and layout switch, and the
   entries as cards (grid) or rows (list). Messages are words delivered to someone, now or
   later; Memories are moments kept, optionally shared. Same layout, different copy and tools. */

export type ModeEntry = {
  id: string
  /** The kind, shown as a badge ("Birthday", "Story"). */
  tag: string
  /** When it was sent, is scheduled, or happened. Already formatted. */
  when: string
  title: string
  body?: string
  /** Who it's for (messages) or shared with (memories). */
  to: string[]
  attachments: string[]
}

type Kind = "messages" | "memories"

const COPY: Record<Kind, { title: string; one: string; intro: string; icon: ReactNode; add: string; toLabel: string; empty: string }> = {
  messages: {
    title: "Messages",
    one: "message",
    intro: "Whether it's comfort, clarity or celebration, Paige delivers your words, now or in the future.",
    icon: <MailIcon />,
    add: "Add a message",
    toLabel: "For",
    empty: "Write something for someone, and choose when they get it.",
  },
  memories: {
    title: "Memories",
    one: "memory",
    intro: "Capture the moments worth holding onto: a story, a photo, a milestone.",
    icon: <BookImageIcon />,
    add: "Add a memory",
    toLabel: "Shared with",
    empty: "Keep a story, a photo or a milestone, just for you or for the people you choose.",
  },
}

type Layout = "grid" | "list"

function EntryTools({ kind, title }: { kind: Kind; title: string }) {
  return (
    <div className="flex shrink-0 items-center">
      <Button variant="quiet" size="icon" aria-label={`Edit ${title}`}>
        <PencilIcon />
      </Button>
      {kind === "memories" && (
        <Button variant="quiet" size="icon" aria-label={`Share ${title}`}>
          <Share2Icon />
        </Button>
      )}
      <Button variant="quiet" size="icon" aria-label={`Delete ${title}`}>
        <Trash2Icon />
      </Button>
    </div>
  )
}

function Attachments({ files }: { files: string[] }) {
  if (!files.length) return null
  return (
    <ul aria-label="Attachments" className="flex flex-wrap gap-2">
      {files.map((f) => (
        <li key={f} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground [&>svg]:size-icon-xs">
          <PaperclipIcon aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  )
}

function EntryCard({ kind, entry, layout }: { kind: Kind; entry: ModeEntry; layout: Layout }) {
  const to = entry.to.length ? `${COPY[kind].toLabel} ${entry.to.join(", ")}` : kind === "memories" ? "Just for you" : undefined
  return (
    <article
      className={cn(
        "flex gap-4 rounded-lg border border-divider bg-card p-5 text-card-foreground shadow-card",
        layout === "grid" ? "flex-col" : "flex-col sm:flex-row sm:items-start"
      )}
    >
      <div className={cn("flex items-start justify-between gap-2", layout === "list" && "sm:order-last")}>
        <Badge tone="info">{entry.tag}</Badge>
        <EntryTools kind={kind} title={entry.title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm text-muted-foreground">{entry.when}</p>
        <h2 className="font-display text-xl leading-display font-bold tracking-display text-balance text-foreground-strong">{entry.title}</h2>
        {entry.body && <p className="leading-relaxed text-pretty text-foreground">{entry.body}</p>}
        {to && <p className="text-sm font-semibold text-muted-foreground">{to}</p>}
        <Attachments files={entry.attachments} />
      </div>
    </article>
  )
}

/** The Messages or Memories mode: header, search and layout switch, entries. */
function ModeBoard({ kind, entries, initialLayout = "grid" }: { kind: Kind; entries: ModeEntry[]; initialLayout?: Layout }) {
  const copy = COPY[kind]
  const [query, setQuery] = useState("")
  const [layout, setLayout] = useState<Layout>(initialLayout)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => [e.title, e.body ?? "", e.tag, ...e.to].some((s) => s.toLowerCase().includes(q)))
  }, [entries, query])

  return (
    <Page>
      <PageHeader
        back={{ href: "/", label: "Vault" }}
        icon={<ViewIcon>{copy.icon}</ViewIcon>}
        title={copy.title}
        description={copy.intro}
        meta={entries.length ? `${entries.length} ${entries.length === 1 ? copy.one : copy.title.toLowerCase()}` : undefined}
        actions={<Button icon={<PlusIcon />}>{copy.add}</Button>}
      />

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <span className="text-primary [&>svg]:size-icon-xl" aria-hidden>
            {copy.icon}
          </span>
          <p className="max-w-measure text-pretty text-muted-foreground">{copy.empty}</p>
          <Button icon={<PlusIcon />}>{copy.add}</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="w-full sm:max-w-sm">
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label={`Search ${copy.title.toLowerCase()}`}
                placeholder={`Search ${copy.title.toLowerCase()}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <div role="group" aria-label="Layout" className="flex items-center gap-1 rounded-full bg-accent p-1">
              {(
                [
                  ["grid", "Cards", <LayoutGridIcon key="g" />],
                  ["list", "List", <ListIcon key="l" />],
                ] as const
              ).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  aria-pressed={layout === value}
                  onClick={() => setLayout(value)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors focus-ring hover:text-foreground [&>svg]:size-icon-sm",
                    layout === value && "bg-primary text-primary-foreground hover:text-primary-foreground"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {"Nothing matches "}
              <span className="font-semibold text-foreground">{`"${query}"`}</span>.
            </p>
          ) : (
            <div className={cn("grid gap-grid", layout === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
              {shown.map((e) => (
                <EntryCard key={e.id} kind={kind} entry={e} layout={layout} />
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  )
}

export { ModeBoard }
