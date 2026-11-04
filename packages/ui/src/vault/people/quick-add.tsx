import type { ComponentProps } from "react"
import { useId, type ReactNode } from "react"
import { PlusIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Eyebrow } from "../../components/display/eyebrow"
import { Inline } from "../../primitives/inline"
import { personPill, personPillIcon } from "./person-picker"
import type { QuickAddOption } from "../stack-rules"

export type { QuickAddOption }

/* @archetype Composite (ARCHETYPES.md).
   QuickAdd (ADR 0076 amendment rule 3): pills by kinship or role that open the add form with it
   set ("Spouse or partner", "Child", "Pet"). The second step of a stack's Add region, after pick
   and before someone new; also shown at rest as shortcuts (StackAdd `quickAtRest`).
   - Who is offered is the caller's: pass `quickAddFor(options, occupants, context)` so a capped
     kinship's pill is gone once used and back when that person comes off (rule 4). With no
     options it renders nothing.
   - A pill is an action (it opens a form), not a selection: plain buttons, PersonPicker's pill
     look with a plus, never in the active colour (rule 2: blue is the open thing).
   - A group named by its label; `label` false hides the eyebrow (at rest, beside "Add someone")
     and the group keeps its name for screen readers. */
/** Pills by kinship that open the add form with it set: the quick add of a stack's Add region. */
function QuickAdd({
  options,
  onSelect,
  label = "Quick add",
  showLabel = true,
  disabled = false,
  className,
}: {
  /** The kinships to offer, in order (already filtered for caps). */
  options: readonly QuickAddOption[]
  /** Called with the chosen kinship; the caller opens the add form with it set. */
  onSelect: (kinship: string) => void
  /** The group's name, and the eyebrow over the pills. Default "Quick add". */
  label?: ReactNode
  /** Show the eyebrow. Default true; false keeps the name for screen readers only. */
  showLabel?: boolean
  /** Disable every pill (something else is saving). */
  disabled?: boolean
  /** Placement (margins), not restyling. */
  className?: string
}) {
  const labelId = useId()
  if (!options.length) return null
  return (
    <div role="group" aria-labelledby={labelId} data-slot="quick-add" className={cn("flex flex-col gap-2", className)}>
      <Eyebrow id={labelId} className={cn(!showLabel && "sr-only")}>
        {label}
      </Eyebrow>
      <Inline gap={2}>
        {options.map((o) => (
          <button
            key={o.kinship}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(o.kinship)}
            className={cn(personPill, personPillIcon)}
          >
            <PlusIcon aria-hidden strokeWidth={2.6} />
            {o.label}
          </button>
        ))}
      </Inline>
    </div>
  )
}

export { QuickAdd }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type QuickAddProps = ComponentProps<typeof QuickAdd>
