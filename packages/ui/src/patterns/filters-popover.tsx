"use client"

import { useState } from "react"
import { ListFilter as ListFilterIcon } from "lucide-react"

import { rangeState, rangeValue, type ListFilter } from "../lib/list-query"
import { Button } from "../components/actions/button"
import { MultiSelect } from "../components/inputs/multi-select"
import { Select } from "../components/inputs/select"
import { Popover, PopoverContent, PopoverTrigger } from "../components/overlays/popover"
import { Field, FieldLabel } from "../forms/field"
import { DateRangeField } from "../forms/fields/date-range-field"

/* @archetype Overlay (ARCHETYPES.md).
   FiltersPopover (R13-06): a list page's Filters, one row per filter in a popover, applied
   together.
   - The trigger is the toolbar's Filters button with the number of applied filters.
   - Each filter is a labelled row, its control from its kind: options with `multiple` → MultiSelect
     (any of), options → Select (one, or "Any"), `date-range` → DateRangeField (presets or two
     dates). The rows edit a draft; nothing changes in the list until Apply.
   - Apply (primary) commits the draft and closes; Reset empties every row of the draft (Apply
     then clears the filters; closing without Apply keeps what was applied). Escape or a click
     outside closes without applying. Opening starts the draft from what's applied.
   - The chips under the toolbar (FilterChips) mirror the applied values and remove one at a time.
   Generic: a page passes its ListFilter list; the state is string lists per filter id
   (lib/list-query.ts; a date range is one `from..to` string). */

const ANY = "__any"

/** How many filters are applied (a multi-select's values each count; a date range counts once). */
function appliedCount<Row>(filters: readonly ListFilter<Row>[], values: Readonly<Record<string, readonly string[]>>): number {
  return filters.reduce((n, f) => {
    const v = values[f.id]?.length ?? 0
    return n + (f.kind === "date-range" ? Math.min(v, 1) : v)
  }, 0)
}

type FiltersPopoverProps<Row> = {
  /** The page's filters, in the order they show. */
  filters: readonly ListFilter<Row>[]
  /** What's applied, per filter id. */
  values: Readonly<Record<string, readonly string[]>>
  /** Called with every filter's values when Apply is pressed (empty filters left out). */
  onApply: (next: Record<string, string[]>) => void
  /** Today (ISO), for the date presets. Required (R17-05): the page passes it, never the local date. */
  today: string
  /** Open (controlled), for stories. */
  defaultOpen?: boolean
}

/** A list's Filters: a popover with one row per filter (multi-selects, selects, date ranges), Apply and Reset. */
function FiltersPopover<Row>({ filters, values, onApply, today, defaultOpen = false }: FiltersPopoverProps<Row>) {
  const copy = () => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, [...v]]))
  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState<Record<string, string[]>>(copy)
  const applied = appliedCount(filters, values)
  const set = (id: string, next: string[]) =>
    setDraft((d) => {
      const all = { ...d }
      if (next.length) all[id] = next
      else delete all[id]
      return all
    })
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(copy())
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" icon={<ListFilterIcon aria-hidden />}>
          Filters
          {applied > 0 && (
            <span data-slot="filter-count" className="-mr-1 ml-0.5 rounded-full bg-primary px-1.5 text-xs leading-5 font-semibold text-primary-foreground tabular-nums">
              {applied}
              <span className="sr-only"> applied</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Filters" className="w-dialog-sm p-0">
        <form
          data-slot="filters-popover"
          onSubmit={(e) => {
            e.preventDefault()
            onApply(draft)
            setOpen(false)
          }}
        >
          <div className="flex max-h-120 flex-col gap-4 overflow-auto p-4 scrollbar-thin">
            {filters.map((f) => (
              <Field key={f.id}>
                <FieldLabel>{f.label}</FieldLabel>
                {f.kind === "date-range" ? (
                  <DateRangeField today={today} value={rangeValue(draft[f.id])} onValueChange={(r) => set(f.id, rangeState(r))} />
                ) : f.multiple ? (
                  <MultiSelect options={f.options} value={draft[f.id] ?? []} onValueChange={(v) => set(f.id, v)} placeholder={f.placeholder ?? "Any"} aria-label={f.label} />
                ) : (
                  <Select
                    options={[{ value: ANY, label: f.placeholder ?? "Any" }, ...f.options]}
                    value={draft[f.id]?.[0] ?? ANY}
                    onValueChange={(v) => set(f.id, v === ANY ? [] : [v])}
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-divider px-4 py-3">
            <Button type="button" variant="quiet" size="sm" onClick={() => setDraft({})}>
              Reset
            </Button>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export { appliedCount, FiltersPopover }
export type { FiltersPopoverProps }
