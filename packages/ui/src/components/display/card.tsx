import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Card as UiCard } from "../../base/card"
import { cardFocus } from "../internal/control"

/* @archetype Surface (ARCHETYPES.md).
   Paige Card over upstream Card: variant default · muted · highlight (area tone inside
   [data-area]) · placeholder; interactive is the one card hover (R15-13, the filter cards' too:
   the border to the stronger neutral and shadow card → lift, never blue, since blue means chosen)
   and its focus is the halo outside the border, no outline (R15-17, `cardFocus`). `cardVariants` is complete on its own (it repeats the upstream base)
   so a link or row can wear the card look without the Card element. Server-safe.
   The edge (R21-01): the border is `--surface-edge`, the surface model's context variable
   (TOKENS.md §4): `--border` on white, the hairline tint on the admin page (AdminPage's
   `data-surface="page"`), so a white card on the off-white page reads by its fill.
   Density (R21-01): `compact` is the admin's data card (KpiCard, FilterCardRow, InsightCard, a
   section of a report): a 10px corner (`rounded-md`), 18 × 16 padding (`px-4.5 py-4`, the mock's)
   and 4px between its lines; `default` keeps the customer card's 16px corner and 24px rhythm. */
const cardVariants = cva("flex flex-col gap-6 rounded-xl border border-surface-edge py-6 text-card-foreground", {
  variants: {
    variant: {
      default: "bg-card",
      muted: "border-divider-tint bg-muted",
      highlight: "border-area-tint bg-linear-to-b from-area-tint to-card",
      placeholder: "border-dashed bg-surface-warm",
    },
    interactive: {
      true: `cursor-pointer shadow-card transition-shadow hover:border-border-strong hover:shadow-lift ${cardFocus}`,
      /* Static surfaces are flat: upstream Card's shadow-sm casts a real shadow since R2-18. */
      false: "shadow-none",
    },
    density: {
      default: "",
      compact: "gap-1 rounded-md px-4.5 py-4",
    },
  },
  defaultVariants: { variant: "default", interactive: false, density: "default" },
})

type CardProps = VariantProps<typeof cardVariants> &
  Pick<ComponentProps<"div">, "id" | "children" | "className" | "tabIndex" | "role" | "aria-label" | "aria-labelledby"> & {
    [key: `data-${string}`]: string | undefined
  }

/** A bordered surface for grouped content; the interactive variant makes the whole card a link. */
function Card({ variant, interactive, density, className, ...props }: CardProps) {
  return (
    <UiCard
      data-variant={variant ?? "default"}
      data-density={density ?? "default"}
      className={cn(cardVariants({ variant, interactive, density }), className)}
      {...props}
    />
  )
}

export { Card, cardVariants }
export type { CardProps }
