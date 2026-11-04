"use client"

import { cn } from "../../lib/utils"
import { DATE_RANGE_PRESETS, matchPreset, presetRange, type DateRange, type DateRangePresetId } from "../../lib/date-range"
import { todayIso, type IsoDate } from "../../lib/dates"
import { DEFAULT_LOCALE } from "../../lib/locale"
import { FieldContext, useFieldContext } from "../../components/internal/field-context"
import { DateField } from "./date-field"

/* @archetype Control (ARCHETYPES.md).
   DateRangeField (R13-06): a span of calendar days, as two ISO dates.
   - Value: `{ from, to }` (DateRange, lib/date-range.ts), both inclusive ISO dates ("2026-03-04")
     or "" for an open side; `{ from: "", to: "" }` is no range. Never JS Dates (DateField's rule).
   - Presets first, as pressed-or-not pills (Last 7 / 30 / 90 days, This year): one press sets both
     dates to the preset's fixed dates for today; the pill shows pressed while the dates are that
     preset. `presets={false}` drops them.
   - Then two DateFields, From and To, each typed or picked from its calendar on a fine pointer and
     the browser's own date input on touch (R3-16, through DateField). To can't be before From and
     From can't be after To (each is the other's min/max), so DateField's own range message says
     so; a half-typed side is just open.
   - Inside a Field the label names the group (aria-labelledby) and the description joins each
     input's; the inner DateFields don't take the Field's id (one id, two inputs). */

type DateRangeFieldProps = {
  value: DateRange
  onValueChange: (value: DateRange) => void
  /** Earliest allowed day (inclusive). */
  min?: IsoDate
  /** Latest allowed day (inclusive); presets end today regardless. */
  max?: IsoDate
  /** Show the preset pills (default true). */
  presets?: boolean
  /** Today, for the presets (default the local date); stories pin it. */
  today?: IsoDate
  /** Names the group when there's no Field label ("Last active"). */
  "aria-label"?: string
  disabled?: boolean
  locale?: string
  /** Placement, not restyling. */
  className?: string
}

/** A range of calendar days: presets (last 7, 30, 90 days, this year) or two dates; its value is { from, to } in "YYYY-MM-DD". */
function DateRangeField({ value, onValueChange, min, max, presets = true, today = todayIso(), disabled, locale = DEFAULT_LOCALE, className, "aria-label": ariaLabel }: DateRangeFieldProps) {
  const field = useFieldContext()
  const pressed = matchPreset(value, today)
  const choose = (id: DateRangePresetId) => onValueChange(pressed === id ? { from: "", to: "" } : presetRange(id, today))
  const name = ariaLabel ?? "Dates"
  return (
    <div
      role="group"
      data-slot="date-range-field"
      aria-labelledby={field ? field.labelId : undefined}
      aria-label={field ? undefined : name}
      aria-describedby={field?.describedBy}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      {presets && (
        <div data-slot="date-range-presets" className="flex flex-wrap gap-1.5">
          {DATE_RANGE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={pressed === p.id}
              disabled={disabled}
              onClick={() => choose(p.id)}
              className="h-8 cursor-pointer rounded-full border border-input px-3 text-xs font-semibold text-card-foreground focus-ring hover:layer-hover disabled:cursor-not-allowed disabled:opacity-disabled aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {/* The inner fields are not the Field's control: no shared id, their own names. */}
      <FieldContext.Provider value={null}>
        <div className="grid grid-cols-2 gap-2">
          <DateField
            aria-label={field ? "From" : `${name} from`}
            value={value.from}
            max={value.to || max}
            min={min}
            disabled={disabled ?? field?.disabled}
            locale={locale}
            placeholder="From"
            aria-describedby={field?.describedBy}
            onValueChange={(from) => onValueChange({ from, to: value.to })}
          />
          <DateField
            aria-label={field ? "To" : `${name} to`}
            value={value.to}
            min={value.from || min}
            max={max}
            disabled={disabled ?? field?.disabled}
            locale={locale}
            placeholder="To"
            aria-describedby={field?.describedBy}
            onValueChange={(to) => onValueChange({ from: value.from, to })}
          />
        </div>
      </FieldContext.Provider>
    </div>
  )
}

export { DateRangeField }
export type { DateRangeFieldProps }
export type { DateRange } from "../../lib/date-range"
