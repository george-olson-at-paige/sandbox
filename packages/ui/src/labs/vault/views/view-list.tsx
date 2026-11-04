"use client"

import type { ReactNode } from "react"
import { FilterIcon, Search, X } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { Dot } from "../../../components/display/dot"
import { EmptyState } from "../../../components/feedback/empty-state"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../../components/inputs/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/overlays/popover"
import { FieldAction } from "../../../forms/fields/field-action"
import { Chip, ChipGroup } from "../../components/chip"
import type { AreaRef } from "./data"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "List: find and choose" (D-V5: lands in
   labs). A View's list region, top to bottom:
   - the search, then the filter button beside it (a tool, `shape="rect"`, D-V2), which opens the
     filters that aren't Areas (what needs doing, shared, made by Paige) as ChipGroups that apply
     on the press, no Apply (a View's list narrows as you choose; ListToolbar's Apply/Reset is the
     admin table's). The button shows how many of them are on.
   - the Areas the list's records are in, as Chips with each Area's dot and a count (D-V4: the
     Chip archetype's first specialization), always visible: there are a handful, never nine,
     because an Area with nothing in it isn't offered.
   - the rows (the caller's: ListGroups of PersonRows or DocumentRows), ruled off from the
     controls, scrolling inside the column (WorkspacePage's list region scrolls).
   - nothing matching: the caller's words and a way back (clear the search and the filters).
   The list filters nothing itself: the caller passes the rows that match. */

export type FilterSet = {
  /** The set's name in the popover ("Needs"). */
  label: string
  chips: Array<{ value: string; label: string; count: number }>
}

/** A View's list: search, the filter button, the Area chips, then the rows. */
export function ViewList({
  search,
  areas,
  filters,
  matches,
  none,
  children,
}: {
  /** The search's text, name and placeholder ("Name, relation or email"). */
  search: { value: string; onChange: (q: string) => void; label: string; placeholder: string }
  /** The Areas offered (with how many records each has) and which are on. */
  areas: { label: string; items: Array<{ area: AreaRef; count: number }>; value: string[]; onChange: (v: string[]) => void }
  /** The other filters, in the popover; omitted, no filter button. */
  filters?: { label: string; sets: FilterSet[]; value: string[]; onChange: (v: string[]) => void }
  /** Whether any row matches. False shows `none`. */
  matches: boolean
  /** Nothing matches: the words ("Nobody matches that."), with Clear search and filters under them. */
  none: { title: string; clear: string }
  /** The rows: ListGroups, or a bare list. */
  children: ReactNode
}) {
  const on = filters?.value.length ?? 0
  const clearAll = () => {
    search.onChange("")
    areas.onChange([])
    filters?.onChange([])
  }
  return (
    <div data-slot="view-list" className="flex min-h-0 flex-1 flex-col">
      <div data-slot="view-list-controls" className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <InputGroup size="sm" className="min-w-0 flex-1">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label={search.label}
              placeholder={search.placeholder}
              value={search.value}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => search.onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && search.value) {
                  e.preventDefault()
                  search.onChange("")
                }
              }}
              className="[&::-webkit-search-cancel-button]:hidden"
            />
            {search.value && (
              <InputGroupAddon align="inline-end">
                <FieldAction aria-label="Clear search" icon={<X />} onClick={() => search.onChange("")} />
              </InputGroupAddon>
            )}
          </InputGroup>
          {filters && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size={on ? "sm" : "icon"}
                  shape="rect"
                  icon={<FilterIcon />}
                  aria-label={on ? `${filters.label}, ${on} on` : filters.label}
                >
                  {on ? on : undefined}
                </Button>
              </PopoverTrigger>
              <PopoverContent aria-label={filters.label} className="flex w-popover flex-col gap-4">
                {filters.sets.map((set) => (
                  <div key={set.label} className="flex flex-col gap-2">
                    <span className="eyebrow text-muted-foreground">{set.label}</span>
                    <ChipGroup
                      type="multiple"
                      label={set.label}
                      value={filters.value.filter((v) => set.chips.some((c) => c.value === v))}
                      onValueChange={(next) => filters.onChange([...filters.value.filter((v) => !set.chips.some((c) => c.value === v)), ...next])}
                    >
                      {set.chips.map((c) => (
                        <Chip key={c.value} value={c.value} count={c.count} disabled={c.count === 0 && !filters.value.includes(c.value)}>
                          {c.label}
                        </Chip>
                      ))}
                    </ChipGroup>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
        {areas.items.length > 0 && (
          <ChipGroup type="multiple" label={areas.label} value={areas.value} onValueChange={areas.onChange}>
            {areas.items.map(({ area, count }) => (
              <Chip
                key={area.id}
                value={area.id}
                count={count}
                mark={
                  <span data-area={area.id} className="inline-flex">
                    <Dot tone="area" />
                  </span>
                }
              >
                {area.label}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </div>
      <div data-slot="view-list-rows" className="min-h-0 flex-1 border-t border-divider">
        {matches ? (
          children
        ) : (
          <EmptyState
            kind="no-results"
            title={none.title}
            actions={
              <Button variant="secondary" size="sm" shape="rect" onClick={clearAll}>
                {none.clear}
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
