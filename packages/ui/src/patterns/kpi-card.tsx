import type { ComponentProps, ReactNode } from "react"
import { useId } from "react"
import { InfoIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Card } from "../components/display/card"
import { Stat } from "../components/display/stat"
import { pressable } from "../components/internal/control"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/overlays/hover-card"

/* @archetype Surface (ARCHETYPES.md).
   KpiCard (R8-08): a Stat on a Card, for a row of headline numbers (KpiRow on an admin page).
   Everything a card says is the Stat's: label, window, the number, one delta, the sparkline and,
   since R21-05 (George 2026-10-31), one caption line (the metric rule: number + sparkline + one
   delta over one window, plus at most one line saying what the number counts; no badge and no
   second number: a share goes in the caption). The card is a plain surface; a drill-in is a link in the page,
   not a clickable card, until a screen needs one. Loading and no-data come from Stat.
   Sizes (R12-08), the Stat's with the card's padding to match:
   - md (default): 18 × 16 padding, a 30px number;
   - lg: the admin home's first row, three across: 24 × 20, a 40px number, a 48px sparkline;
   - compact: the second row, five across: 18 × 16, a 24px number, the delta, a 24px sparkline,
     and no window line (the row's caption says the window once; screen readers still hear it).
   Which cards a person sees is chosen later (George, R12-08: noted, not built).

   Detail (R20-16, George: "the KPI cards in admin need to be able to show details without having
   them on the screen"). `detail` is the one slot the metric rule leaves open, because it does not
   put anything on the card: it is a HoverCard (the last three months, the previous window, the
   definition: Product chooses which). The card draws one small info button in its top-right
   corner and the HoverCard opens from it, by hover or by focus. Why the button and not the Stat
   wrapped in one: Stat is a `group` of block elements with its own tooltip on the delta and a
   sparkline with a text summary, none of which can sit inside a `<button>` (a button's children
   are flattened for assistive tech and may not hold other interactive content, and the delta's
   Tooltip trigger is one). The button's name is "Details for {label}"; its description is the
   card's content once open. Supplementary by rule (HoverCard): it does not open on touch, so
   whatever the detail says must be on the metric's own page too. With no `detail` there is no
   button and the card is exactly what it was. Server-safe (the HoverCard is its own client
   module). */
/* The card is the compact Card (R21-01: the admin's data card, 10px corner, the surface edge);
   md and compact take its 18 × 16 padding, lg keeps a hero row's 24 × 20. */
const PAD = { md: "px-4.5 py-4", lg: "px-6 py-5", compact: "px-4.5 py-4" } as const

type KpiCardProps = ComponentProps<typeof Stat> & {
  /** What the hover card shows (a small table, a definition): read-only, supplementary, and also reachable somewhere other than the card. Omit for a card with nothing more to say. */
  detail?: ReactNode
}

/** A headline number on a card: label and window, the value, one delta and a sparkline; md, lg (a row of three) or compact (a row of five); `detail` adds a hover card of more. */
function KpiCard({ className, size = "md", detail, ...stat }: KpiCardProps) {
  const detailId = useId()
  // A card still loading has nothing to detail yet.
  const hasDetail = Boolean(detail) && !stat.loading
  return (
    <Card density="compact" data-slot="kpi-card" data-size={size} className={cn("relative gap-0", PAD[size], className)}>
      {/* The label row leaves room for the button, so a long label truncates before it, not under it. */}
      <Stat size={size} className={hasDetail ? "[&>div:first-child]:pr-6" : undefined} {...stat} />
      {hasDetail && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              type="button"
              aria-label={`Details for ${stat.label}`}
              aria-describedby={detailId}
              data-slot="kpi-card-detail"
              className={cn(pressable, "absolute top-2 right-2 grid size-icon-xl place-items-center rounded-full text-muted-foreground hover:text-card-foreground")}
            >
              <InfoIcon aria-hidden className="size-icon" />
            </button>
          </HoverCardTrigger>
          {/* Beside the card, not over it: below the button the panel (w-popover) hid the very number it explains. Collision flips it when there is no room. */}
          <HoverCardContent id={detailId} side="right" align="start">
            {detail}
          </HoverCardContent>
        </HoverCard>
      )}
    </Card>
  )
}

export { KpiCard }
export type { KpiCardProps }
