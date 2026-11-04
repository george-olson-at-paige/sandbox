import { cn } from "../../lib/utils"
import { Progress as UiProgress } from "../../base/progress"

/* @archetype Mark (ARCHETYPES.md).
   Paige Progress over upstream Progress: 4px track, the area colour (success at 100%), and
   `indeterminate` (R1-13): a 40% bar that slides across; under reduced motion it holds still
   and pulses. Upstream exposes only the root's className, so the indicator is styled with a
   child selector from the root. */
type ProgressProps = {
  /** 0–100. Ignored when indeterminate. */
  value?: number
  /** Work is happening but its length is unknown. */
  indeterminate?: boolean
  className?: string
  "aria-label"?: string
  "aria-hidden"?: boolean
}

/** A progress bar in the area colour, or an indeterminate one. */
function Progress({ value = 0, indeterminate, className, ...aria }: ProgressProps) {
  return (
    <UiProgress
      value={indeterminate ? null : value}
      data-complete={!indeterminate && value >= 100 ? "" : undefined}
      /* Our own flag: upstream shadcn never passes `value` to the Radix root, so Radix's
         data-state is always "indeterminate" and can't be used to tell the two apart. */
      data-indeterminate={indeterminate ? "" : undefined}
      className={cn(
        "h-1 bg-track",
        "*:data-[slot=progress-indicator]:bg-area data-complete:*:data-[slot=progress-indicator]:bg-success",
        "data-indeterminate:*:data-[slot=progress-indicator]:w-2/5 data-indeterminate:*:data-[slot=progress-indicator]:rounded-full",
        "data-indeterminate:*:data-[slot=progress-indicator]:animate-progress-slide",
        "motion-reduce:data-indeterminate:*:data-[slot=progress-indicator]:animate-progress-pulse",
        className
      )}
      {...aria}
    />
  )
}

export { Progress }
export type { ProgressProps }
