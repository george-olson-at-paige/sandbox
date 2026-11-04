import type { ComponentProps } from "react"
import { cn } from "../lib/utils"
import { Eyebrow } from "../components/display/eyebrow"

/* @archetype Composite (ARCHETYPES.md).
   StepRail: segmented, never a percentage. "Step n of N" or a beat label. */
/** Step progress as segments, with a "Step n of N" label. */
function StepRail({
  step,
  total,
  label,
  className,
}: {
  /** Current step, 1-based. Steps before it show as done. */
  step: number
  /** Number of steps. */
  total: number
  /** Text after the rail and its accessible name. Default "Step {step} of {total}". */
  label?: string
  className?: string
}) {
  const text = label ?? `Step ${step} of ${total}`
  return (
    <span data-slot="step-rail" role="img" aria-label={text} className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: total }, (_, i) => {
        const v = i + 1 < step ? "done" : i + 1 === step ? "on" : "off"
        return (
          <i
            key={i}
            data-v={v}
            className="block h-1 w-5 rounded-full bg-track transition-all data-[v=done]:bg-primary-subtle data-[v=on]:w-8 data-[v=on]:bg-primary"
          />
        )
      })}
      <Eyebrow className="ml-2">{text}</Eyebrow>
    </span>
  )
}

export { StepRail }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StepRailProps = ComponentProps<typeof StepRail>
