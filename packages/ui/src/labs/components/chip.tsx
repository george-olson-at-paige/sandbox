"use client"

import type { ComponentProps, ReactNode } from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { ToggleGroup } from "../../components/inputs/toggle-group"
import { cn } from "../../lib/utils"

/* @archetype Control (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). D-V4 (George 2026-11-04; VIEWS-PLAN.md): the Chip archetype
   first, the Area chips after, once it holds up in several jobs.

   A Chip is a small choice you press to turn on and press again to turn off: a filter, a tag
   to pick. It holds a state, so it is a Control (as ToggleGroup is), never an Action. Parts:
   - a label;
   - an optional leading mark (`mark`): a Dot, an icon or an Avatar, whatever says which kind
     of thing it is (an Area's colour, a status);
   - an optional count (`count`): how many there are, so a person sees what a press will show;
   - states: off · on (`aria-pressed`, the brand ink and its subtle fill) · disabled.
   Chips live in a ChipGroup: `type="multiple"` (several at once, a filter) or `"single"` (one
   at a time). The group is one tab stop; arrow keys move between chips (Radix roving focus), and
   Space or Enter presses. The group wraps onto as many lines as it needs.

   Not a Badge (a Badge says something, it doesn't take a press) and not FilterChips (applied
   filters you remove with ×). A Chip is how you choose; FilterChips are what you chose, shown
   elsewhere. */

/** A set of chips: several on at once (`multiple`) or one at a time (`single`). One tab stop; arrow keys move. */
function ChipGroup({
  label,
  className,
  children,
  ...props
}: (
  | {
      type: "multiple"
      value: string[]
      onValueChange: (value: string[]) => void
    }
  | { type: "single"; value: string; onValueChange: (value: string) => void }
) & {
  /** The group's accessible name ("Filter by Area"). */
  label: string
  className?: string
  /** The Chips. */
  children: ReactNode
}) {
  return (
    // ToggleGroup's `card` variant: Radix's roving focus and pressed state on plain buttons,
    // nothing joined. Each Chip is Radix's Item on its own button.
    <ToggleGroup variant="card" data-slot="chip-group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {children}
    </ToggleGroup>
  )
}

/** One choice in a ChipGroup: a label, an optional leading mark and an optional count; pressed turns it on. */
function Chip({
  value,
  mark,
  count,
  disabled = false,
  children,
}: {
  /** What the group's value holds when this chip is on. */
  value: string
  /** Leading mark: a Dot (an Area's colour, a status), an icon, an Avatar. Decorative; the label names the chip. */
  mark?: ReactNode
  /** How many there are. Omitted, the chip shows no count. */
  count?: number
  disabled?: boolean
  /** The label. */
  children: ReactNode
}) {
  return (
    // Radix's Item on a plain button (as ToggleGroup's `card` item; PRIMITIVE_OK in check-layers).
    <ToggleGroupPrimitive.Item asChild value={value} disabled={disabled}>
      <button
        type="button"
        data-slot="chip"
        className={cn(
          "inline-flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground focus-ring",
          "hover:layer-hover active:layer-press",
          "data-[state=on]:border-primary data-[state=on]:bg-primary-subtle data-[state=on]:text-primary",
          "disabled:cursor-not-allowed disabled:opacity-disabled",
        )}
      >
        {mark && (
          <span data-slot="chip-mark" aria-hidden className="inline-flex shrink-0 items-center">
            {mark}
          </span>
        )}
        <span data-slot="chip-label">{children}</span>
        {count !== undefined && (
          <span data-slot="chip-count" className="font-bold tabular-nums opacity-quiet">
            {count}
          </span>
        )}
      </button>
    </ToggleGroupPrimitive.Item>
  )
}

export { Chip, ChipGroup }

export type ChipProps = ComponentProps<typeof Chip>
export type ChipGroupProps = ComponentProps<typeof ChipGroup>
