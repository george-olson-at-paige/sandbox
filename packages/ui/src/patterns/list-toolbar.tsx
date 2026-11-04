"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { CircleCheck, Search, X } from "lucide-react"

import type { ListFilter } from "../lib/list-query"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/inputs/input-group"
import { FieldAction } from "../forms/fields/field-action"
import { FiltersPopover } from "./filters-popover"

/* @archetype Composite (ARCHETYPES.md).
   ListToolbar (R12-10, rationale in REVIEW-12; R13-04/06): a list page's controls, in DataTable's
   toolbar row (R10-09), left to right:
   - Search, first and widest: the text is local while typing and reaches the page 200ms after the
     last key (so counts and rows don't flicker per letter); Escape clears it; the clear button
     shows while there's text. The page decides what it matches (name or email).
   - Filters: FiltersPopover (R13-06), one row per filter (multi-selects, selects, date ranges),
     Apply and Reset; the button says how many are applied.
   - At the right: the status line (an action's result, in place, never a banner) and the result
     count ("143 people"), both polite live regions.
   The applied filters are not in this row: FilterChips draws them on their own row under it
   (R13-04), with Clear all, so a chip never reads as one of the toolbar's controls.
   Controls are `sm` (36), the height DataTable's Columns menu already has in this row. */

/** One filter group, as the toolbar shows it (the page's ListFilter). */
type ToolbarFilter<Row = unknown> = ListFilter<Row>

const DEBOUNCE_MS = 200

type ListToolbarProps<Row> = {
  /** The search text (the page's), its label, placeholder and change handler (called debounced). */
  search: { value: string; onChange: (q: string) => void; label: string; placeholder?: string }
  /** The page's filter groups. */
  filters?: readonly ListFilter<Row>[]
  /** Applied values per filter id. */
  values: Readonly<Record<string, readonly string[]>>
  /** Called with every filter's values when the Filters popover applies. */
  onFiltersChange: (next: Record<string, string[]>) => void
  /** The result count, already worded ("143 people"). */
  count: ReactNode
  /** An action's result, shown in place at the right ("Verification email sent to Ada Park."). */
  status?: ReactNode
  /** The search field's id (the page focuses it when a selection ends). */
  searchId?: string
  /** Today (ISO), for the date presets. Required (R17-05): the page passes it, never the local date. */
  today: string
}

/** A list page's toolbar: debounced search, a Filters popover, the status line and the result count. */
function ListToolbar<Row>({ search, filters = [], values, onFiltersChange, count, status, searchId, today }: ListToolbarProps<Row>) {
  const [text, setText] = useState(search.value)
  const sent = useRef(search.value)
  const onSearch = useRef(search.onChange)
  onSearch.current = search.onChange
  // The page's value changed from outside (Clear all, a restore): show it.
  useEffect(() => {
    if (search.value !== sent.current) {
      sent.current = search.value
      setText(search.value)
    }
  }, [search.value])
  useEffect(() => {
    if (text === sent.current) return
    const t = setTimeout(() => {
      sent.current = text
      onSearch.current(text)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [text])

  function sendNow(q: string) {
    setText(q)
    sent.current = q
    onSearch.current(q)
  }

  return (
    <div data-slot="list-toolbar" className="flex min-h-control-sm flex-1 flex-wrap items-center gap-2">
      {/* U-02: an InputGroup (sm) with the search glyph before the text and a clear action after it. */}
      <InputGroup size="sm" className="w-full max-w-sm min-w-48 flex-1">
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          id={searchId}
          type="search"
          aria-label={search.label}
          placeholder={search.placeholder}
          value={text}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && text) {
              e.preventDefault()
              sendNow("")
            }
            if (e.key === "Enter") sendNow(text)
          }}
          className="[&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <InputGroupAddon align="inline-end">
            <FieldAction aria-label="Clear search" icon={<X />} onClick={() => sendNow("")} />
          </InputGroupAddon>
        )}
      </InputGroup>
      {filters.length > 0 && <FiltersPopover filters={filters} values={values} onApply={onFiltersChange} today={today} />}
      <span className="ml-auto flex items-center gap-4">
        <span role="status" data-slot="list-status" className="flex items-center gap-1.5 text-sm font-medium text-success-foreground">
          {status && (
            <>
              <CircleCheck aria-hidden className="size-icon" />
              {status}
            </>
          )}
        </span>
        <span aria-live="polite" data-slot="list-count" className="text-sm font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      </span>
    </div>
  )
}

export { ListToolbar }
export type { ListToolbarProps, ToolbarFilter }
