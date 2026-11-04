import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"
import { Separator as UiSeparator } from "../../base/separator"

/* @archetype Frame (ARCHETYPES.md).
   Paige Separator over upstream Separator: always decorative. Its weight follows what it
   separates, the outer the boundary the stronger the line (George 2026-10-28):
   region (border: the bar from the page, a form from its actions) · group (divider-tint:
   sections within a form) · row (divider: items within a list). */
const LEVEL = { region: "", group: "bg-divider-tint", row: "bg-divider" } as const

/** A decorative horizontal or vertical rule. */
function Separator({
  orientation = "horizontal",
  level = "region",
  className,
}: {
  orientation?: "horizontal" | "vertical"
  /** What the line separates: region (default; parts of the page) · group (sections within one form or panel) · row (items in a list). */
  level?: keyof typeof LEVEL
  className?: string
}) {
  return <UiSeparator orientation={orientation} className={cn(LEVEL[level], className)} />
}

export { Separator }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SeparatorProps = ComponentProps<typeof Separator>
