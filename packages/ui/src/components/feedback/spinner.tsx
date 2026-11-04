import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"
import { Spinner as UiSpinner } from "../../base/spinner"

/* @archetype Mark (ARCHETYPES.md).
   Paige Spinner over upstream Spinner: sizes sm 16 · md 20 · lg 24; announces `label`. */
const SIZE = { sm: "size-icon", md: "size-icon-lg", lg: "size-icon-xl" } as const

/** An inline loading spinner with an accessible label. */
function Spinner({
  size = "sm",
  label = "Loading",
  className,
}: {
  size?: keyof typeof SIZE
  label?: string
  className?: string
}) {
  return <UiSpinner aria-label={label} className={cn(SIZE[size], className)} />
}

export { Spinner }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SpinnerProps = ComponentProps<typeof Spinner>
