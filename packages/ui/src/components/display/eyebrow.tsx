import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"

import { cn } from "../../lib/utils"

/* @archetype Text (ARCHETYPES.md).
   Eyebrow: the one labelling text style (12px, 600, uppercase, 0.05em; R1-17). A component
   over the `eyebrow` utility in theme.css: the utility holds the style, the component is
   what composites and the app use, with a tone (muted · area · primary; GAPS #44) and an
   element. A form field's label is FieldLabel, which carries the same style.
   tone="area" (R3-15) is CSS context, not React: text-area-ink reads --area-ink, which the
   nearest [data-area="…"] ancestor sets (AreaPage sets it on the page). With none above, it is
   the neutral body ink. */
const TONE = { muted: "", area: "text-area-ink", primary: "text-primary" } as const

/** The small uppercase label above a heading, field or section. */
function Eyebrow({
  as: Comp = "span",
  tone = "muted",
  className,
  children,
  id,
}: {
  as?: ElementType
  /** muted (default) · area (the nearest [data-area] ancestor's ink; neutral without one) · primary. */
  tone?: keyof typeof TONE
  className?: string
  children: ReactNode
  id?: string
}) {
  return (
    <Comp id={id} data-slot="eyebrow" className={cn("eyebrow", TONE[tone], className)}>
      {children}
    </Comp>
  )
}

export { Eyebrow }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type EyebrowProps = ComponentProps<typeof Eyebrow>
