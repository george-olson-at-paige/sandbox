"use client"

import type { ComponentProps, ReactNode } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"
import { FieldAction } from "../../forms/fields/field-action"
import { Chip, ChipGroup } from "../components/chip"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2: the keep-and-compose pages' one way to
   find an item (Passwords, Memories, Messages; extracted on the third). The search (Escape or
   × clears it), then the caller's tools beside it (a view switch), then one filter set under
   them as Chips with counts — what kind it is. Shown only when there are two or more kinds to
   choose between. It filters nothing itself: the caller passes what matches. A View's list
   (People, Documents) has its own, with a popover for its second set: ViewList. */

export type FindFilter = { value: string; label: string; count: number }

/** Find an item: search, the caller's tools beside it, one filter set as Chips under them. */
export function FindRow({
  search,
  filters,
  tools,
}: {
  /** The search's text and its name ("Search memories"), also its placeholder. */
  search: { value: string; onChange: (q: string) => void; label: string; clear?: string }
  /** The kinds to filter by, with counts, and which are on. Fewer than two: no Chips. */
  filters?: { label: string; items: FindFilter[]; value: string[]; onChange: (v: string[]) => void }
  /** Beside the search: a view switch. */
  tools?: ReactNode
}) {
  return (
    <div data-slot="find-row" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={search.label}
            placeholder={search.label}
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
              <FieldAction aria-label={search.clear ?? "Clear search"} icon={<XIcon />} onClick={() => search.onChange("")} />
            </InputGroupAddon>
          )}
        </InputGroup>
        {tools}
      </div>
      {filters && filters.items.length > 1 && (
        <ChipGroup type="multiple" label={filters.label} value={filters.value} onValueChange={filters.onChange}>
          {filters.items.map((f) => (
            <Chip key={f.value} value={f.value} count={f.count}>
              {f.label}
            </Chip>
          ))}
        </ChipGroup>
      )}
    </div>
  )
}

export type FindRowProps = ComponentProps<typeof FindRow>
