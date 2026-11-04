"use client"

import { useMemo, useState } from "react"
import { DownloadIcon, ExpandIcon, EyeIcon, FileTextIcon, PencilIcon, PlusIcon, Share2Icon, UploadIcon } from "lucide-react"

import type { AreaId } from "../icons/area-glyphs"
import { Button } from "../components/actions/button"
import { cn } from "../lib/utils"
import { Page } from "../templates/page"
import { PageHeader } from "../templates/page-header"
import { AREA_LABEL, AreaUse, DetailStage, ListPane, ListRow, MasterDetail, StageEmpty, StageSection, ViewIcon } from "./view-frame"

/* @archetype Frame (ARCHETYPES.md).
   DocumentsView: everything the owner has put in the Vault and what each one is for. The rail
   lists documents (search by name or type); the stage shows a preview, what it's for by Area,
   the values Paige read from it, and who can see it. */

export type DocumentRead = { area: AreaId; fact: string; label: string; value: string; unchecked?: boolean }

export type VaultDocument = {
  id: string
  name: string
  /** What kind of document it is; empty until the owner says. */
  kind?: string
  added: string
  /** Where the original is kept ("Wallet", "Safe deposit box"). */
  original?: string
  /** False when the record exists but no file has been added. */
  hasFile: boolean
  uses: { area: AreaId; title: string }[]
  reads: DocumentRead[]
  sharedWith: string[]
}

function noteFor(d: VaultDocument) {
  if (!d.kind) return "Say what it is"
  if (!d.hasFile) return "No file yet"
  const unchecked = d.reads.filter((r) => r.unchecked).length
  if (unchecked) return `${unchecked} ${unchecked === 1 ? "value" : "values"} to check`
  return undefined
}

function DocGlyph({ area, size = "md" }: { area?: AreaId; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      data-area={area}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-area-tint text-area",
        size === "md" ? "size-10 [&>svg]:size-icon" : "size-16 [&>svg]:size-icon-xl"
      )}
    >
      <FileTextIcon />
    </span>
  )
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
    <Button variant="quiet" size="icon" aria-label="Preview as someone else">
      <EyeIcon />
    </Button>
  </>
)

function DocumentDetail({ doc }: { doc: VaultDocument }) {
  const area = doc.uses[0]?.area
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-2 sm:w-64">
          <div data-area={area} className="flex aspect-[4/3] items-center justify-center rounded-lg bg-area-wash">
            {doc.hasFile ? (
              <DocGlyph area={area} size="lg" />
            ) : (
              <Button variant="secondary" size="sm" icon={<UploadIcon />}>
                Add the file
              </Button>
            )}
          </div>
          {doc.hasFile && (
            <div className="flex gap-4 text-sm">
              <Button variant="link" size="inline" icon={<ExpandIcon />}>
                Open full size
              </Button>
              <Button variant="link" size="inline" icon={<DownloadIcon />}>
                Download
              </Button>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-display text-2xl leading-display font-bold tracking-display text-foreground-strong">{doc.name}</h2>
          <p className="font-semibold text-foreground">{doc.kind ?? `No type yet · added ${doc.added}`}</p>
          {doc.original && (
            <p className="flex gap-3 text-sm">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Original</span>
              <span className="text-foreground">{doc.original}</span>
            </p>
          )}
          {!doc.kind && (
            <div>
              <Button variant="secondary" size="sm">
                Say what it is
              </Button>
            </div>
          )}
        </div>
      </div>

      <StageSection title="What it's for">
        {doc.uses.length ? (
          doc.uses.map((u) => <AreaUse key={u.area + u.title} {...u} href={`/area/${u.area}`} />)
        ) : (
          <StageEmpty>Not in any Area yet.</StageEmpty>
        )}
      </StageSection>

      {doc.reads.length > 0 && (
        <StageSection title="What we read from it">
          <dl className="flex flex-col gap-3">
            {doc.reads.map((r) => (
              <div key={r.label} data-area={r.area} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:w-40">{r.label}</dt>
                <dd className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-foreground-strong">{r.value}</span>
                  <span className="text-xs text-muted-foreground">{`${AREA_LABEL[r.area]} · ${r.fact}`}</span>
                  {r.unchecked && (
                    <Button variant="secondary" size="sm" className="ml-auto">
                      Check it
                    </Button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </StageSection>
      )}

      <StageSection title="Who can see it">
        {doc.sharedWith.length ? (
          <p className="text-sm text-foreground">{doc.sharedWith.join(", ")}</p>
        ) : (
          <StageEmpty>Nobody yet. It isn&apos;t shared with anyone.</StageEmpty>
        )}
      </StageSection>
    </>
  )
}

/** The Documents view: header, the documents rail and the selected document's stage. */
function DocumentsView({ documents, initialId }: { documents: VaultDocument[]; initialId?: string }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialId ?? documents[0]?.id)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((d) => [d.name, d.kind ?? ""].some((s) => s.toLowerCase().includes(q)))
  }, [documents, query])

  const selected = documents.find((d) => d.id === selectedId)

  return (
    <Page>
      <PageHeader
        back={{ href: "/", label: "Vault" }}
        icon={
          <ViewIcon>
            <FileTextIcon />
          </ViewIcon>
        }
        title="Documents"
        description="Everything you've put in your Vault, and what each one is for."
        meta={`${documents.length} ${documents.length === 1 ? "document" : "documents"}`}
        actions={
          <Button variant="secondary" icon={<PlusIcon />}>
            Add a document
          </Button>
        }
      />
      <MasterDetail
        list={
          <ListPane label="Documents" placeholder="Name or type" query={query} onQueryChange={setQuery} count={shown.length}>
            {shown.map((d) => (
              <ListRow
                key={d.id}
                selected={d.id === selectedId}
                onSelect={() => setSelectedId(d.id)}
                lead={<DocGlyph area={d.uses[0]?.area} />}
                title={d.name}
                detail={d.kind ?? `No type yet · added ${d.added}`}
                note={noteFor(d)}
                areas={[...new Set(d.uses.map((u) => u.area))]}
              />
            ))}
          </ListPane>
        }
        detail={
          <DetailStage label={selected ? selected.name : "No document selected"} tools={selected ? VIEW_TOOLS : undefined}>
            {selected ? <DocumentDetail doc={selected} /> : <StageEmpty>Choose a document to see what it&apos;s for.</StageEmpty>}
          </DetailStage>
        }
      />
    </Page>
  )
}

export { DocumentsView }
