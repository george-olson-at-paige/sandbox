"use client"

import { X } from "lucide-react"

import { describeRange } from "../lib/date-range"
import { rangeValue, type ListFilter } from "../lib/list-query"
import { Button } from "../components/actions/button"

/* @archetype Composite (ARCHETYPES.md).
   FilterChips (R13-04): the applied filters on their own row under a list's toolbar, so they never
   blend with the toolbar's controls. One removable chip per applied value ("Plan: Free ×"; a date
   range is one chip, "Last active: Last 30 days ×"), then "Clear all" at the row's end, which
   removes every filter (not the segment or the search). The row is absent while no filter is set.
   It mirrors FiltersPopover: the same state, one value at a time. */

type FilterChipsProps<Row> = {
  /** The page's filters (their labels and option names). */
  filters: readonly ListFilter<Row>[]
  /** What's applied, per filter id. */
  values: Readonly<Record<string, readonly string[]>>
  /** Called with every filter's values after a chip or Clear all removes some. */
  onChange: (next: Record<string, string[]>) => void
  /** Today (ISO), for naming a preset range. Required (R17-05). */
  today: string
}

/** The applied filters as removable chips on their own row, with Clear all; absent when none. */
function FilterChips<Row>({ filters, values, onChange, today }: FilterChipsProps<Row>) {
  const chips = filters.flatMap((f): Array<{ f: ListFilter<Row>; value: string; label: string }> => {
    const chosen = values[f.id] ?? []
    if (!chosen.length) return []
    if (f.kind === "date-range") return [{ f, value: chosen[0], label: describeRange(rangeValue(chosen), today) }]
    return chosen.map((v) => ({ f, value: v, label: f.options.find((o) => o.value === v)?.label ?? v }))
  })
  if (chips.length === 0) return null
  const remove = (id: string, value: string) => {
    const all: Record<string, string[]> = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, [...v]]))
    const left = (all[id] ?? []).filter((x) => x !== value)
    if (left.length) all[id] = left
    else delete all[id]
    onChange(all)
  }
  return (
    <div data-slot="filter-chips" role="group" aria-label="Applied filters" className="flex w-full flex-wrap items-center gap-2">
      {chips.map(({ f, value, label }) => (
        <Button
          key={`${f.id}:${value}`}
          data-slot="filter-chip"
          variant="secondary"
          size="sm"
          icon={<X aria-hidden />}
          iconPosition="end"
          aria-label={`Remove filter ${f.label}: ${label}`}
          onClick={() => remove(f.id, value)}
        >
          <span className="text-muted-foreground">{f.label}:</span> {label}
        </Button>
      ))}
      <Button variant="quiet" size="sm" onClick={() => onChange({})}>
        Clear all
      </Button>
    </div>
  )
}

export { FilterChips }
export type { FilterChipsProps }
