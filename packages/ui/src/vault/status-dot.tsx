import type { ComponentProps } from "react"
import { StatusMark, type ItemStatus, type WorkStatus } from "../components/display/status-mark"

export type { ItemStatus, WorkStatus }

/* @archetype Mark (ARCHETYPES.md).
   StatusDot: the Vault's name for the status mark on its rows and rail (ItemRow, RailPanels),
   always 20px (R4-05). The marks themselves, their vocabulary and their decisions (strokes,
   tick size, the working ring) live in StatusMark (components/display, R10-12), which the
   graph uses too, so one change moves both. */

/** The status mark for an item (open, partial, present, declined) or a piece of work. */
function StatusDot({
  status,
  label,
  className,
}: {
  /** Item: open (dashed) · partial (half) · present (area fill + tick) · declined (grey). Work: waiting · working (spinner) · done · attention · skipped · canceled. */
  status: ItemStatus | WorkStatus
  /** Accessible name. Without it the dot is decorative (the row's text carries the status). */
  label?: string
  className?: string
}) {
  return <StatusMark status={status} label={label} className={className} />
}

export { StatusDot }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StatusDotProps = ComponentProps<typeof StatusDot>
