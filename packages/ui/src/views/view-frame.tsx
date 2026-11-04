"use client"

import type { ComponentProps, ReactNode } from "react"
import { SearchIcon } from "lucide-react"

import type { AreaId } from "../icons/area-glyphs"
import { Dot } from "../components/display/dot"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/inputs/input-group"
import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   The cross-area views (People, Documents, Passwords): a list rail on the left, the selected
   record on a tinted stage on the right. One column below lg; the stage follows the list. */

export const AREA_LABEL: Record<AreaId, string> = {
  personal: "Personal",
  family: "Family",
  household: "Household",
  money: "Money",
  assets: "Assets",
  health: "Health",
  insurance: "Insurance",
  estate: "Estate",
  final: "Final wishes",
}

/** The page-header icon for a view: a solid primary square holding a lucide glyph. */
function ViewIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground [&>svg]:size-icon-lg"
    >
      {children}
    </span>
  )
}

/** The list rail and the stage, side by side from lg. */
function MasterDetail({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-lg border border-divider lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {list}
      {detail}
    </div>
  )
}

/** The left rail: a search box over the rows. */
function ListPane({
  label,
  placeholder,
  query,
  onQueryChange,
  count,
  children,
}: {
  /** Accessible name of the list, e.g. "People". */
  label: string
  placeholder: string
  query: string
  onQueryChange: (query: string) => void
  /** Rows shown after filtering; 0 shows the empty line. */
  count: number
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-divider bg-background p-4 lg:border-r">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </InputGroup>
      {count === 0 ? (
        <p className="px-1 py-6 text-sm text-muted-foreground">
          {"Nothing matches "}
          <span className="font-semibold text-foreground">{`"${query}"`}</span>.
        </p>
      ) : (
        <ul aria-label={label} className="flex flex-col overflow-hidden rounded-lg border border-divider bg-card shadow-card">
          {children}
        </ul>
      )}
    </div>
  )
}

/** One record in the rail. The selected row has a primary edge and a tint. */
function ListRow({
  selected,
  onSelect,
  lead,
  title,
  detail,
  note,
  areas = [],
}: {
  selected?: boolean
  onSelect: () => void
  /** An Avatar or file glyph. */
  lead: ReactNode
  title: ReactNode
  detail?: ReactNode
  /** A short warning under the detail ("No phone or email"). */
  note?: ReactNode
  /** The Areas this record belongs to, as dots at the end of the row. */
  areas?: AreaId[]
}) {
  return (
    <li className="border-b border-divider last:border-b-0">
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-3 border-l-3 border-transparent px-4 py-3 text-left transition-colors focus-ring hover:bg-muted",
          selected && "border-primary bg-primary-subtle hover:bg-primary-subtle"
        )}
      >
        {lead}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground-strong">{title}</span>
          {detail && <span className="truncate text-sm text-muted-foreground">{detail}</span>}
          {note && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
              <Dot tone="warning" />
              {note}
            </span>
          )}
        </span>
        {areas.length > 0 && (
          <span className="flex shrink-0 items-center gap-1" aria-label={`In ${areas.map((a) => AREA_LABEL[a]).join(", ")}`}>
            {areas.map((a) => (
              <span key={a} data-area={a} className="flex">
                <Dot tone="area" />
              </span>
            ))}
          </span>
        )}
      </button>
    </li>
  )
}

/** The right side: the selected record on a card, on a tinted stage, with optional tools above. */
function DetailStage({ label, tools, children }: { label: string; tools?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex min-w-0 flex-col gap-3 bg-muted p-4 lg:p-5">
      {tools && <div className="flex items-center justify-end gap-1">{tools}</div>}
      <div className="flex flex-col gap-6 rounded-lg bg-card p-6 text-card-foreground shadow-card">{children}</div>
    </section>
  )
}

/** A titled block on the stage: small caps label over a rule. */
function StageSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h3 className="border-b border-divider pb-2 text-xs font-bold tracking-wider text-foreground-strong uppercase">{title}</h3>
      {children}
    </section>
  )
}

/** One place a record is used: the Area, what it's for there, and a link into that Area. */
function AreaUse({
  area,
  title,
  detail,
  href,
  linkLabel,
}: {
  area: AreaId
  title: ReactNode
  detail?: ReactNode
  href: string
  linkLabel?: string
}) {
  return (
    <div data-area={area} className="grid grid-cols-1 gap-x-4 gap-y-1 py-1 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-baseline">
      <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <Dot tone="area" />
        {AREA_LABEL[area]}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground-strong">{title}</span>
        {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
      </span>
      <a href={href} className="rounded-sm text-sm font-semibold text-muted-foreground focus-ring hover:text-primary">
        {linkLabel ?? `Open in ${AREA_LABEL[area]}`}
      </a>
    </div>
  )
}

/** The quiet line a section shows when it has nothing yet. */
function StageEmpty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground italic">{children}</p>
}

export { AreaUse, DetailStage, ListPane, ListRow, MasterDetail, StageEmpty, StageSection, ViewIcon }

export type ListRowProps = ComponentProps<typeof ListRow>
export type AreaUseProps = ComponentProps<typeof AreaUse>
