import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { Grid } from "../primitives/grid"

/* @archetype Composite (ARCHETYPES.md).
   KpiRow (R12-08): a row of KpiCards (or MetricCards) on an admin page. Two shapes, matching the
   card sizes:
   - 3: the headline row of `lg` cards, three across from md (768) up, one column below;
   - 5: the secondary row of `compact` cards, five across from xl (1280) up, three from lg, two
     on anything narrower (a compact card still reads at ~170px).
   Desktop-first like every admin piece: it works narrow, it's designed at 1280 and 1440.
   The row is a labelled region; `caption` says once what the cards share (the window), which a
   compact card doesn't repeat. The cards a person sees are chosen later (R12-08, not built). */
const COLUMNS = {
  3: { base: 1, md: 3 },
  5: { base: 2, lg: 3, xl: 5 },
} as const

/** A row of KPI cards: three large across, or five compact across; collapses on narrow screens. */
function KpiRow({
  columns,
  label,
  caption,
  children,
  className,
}: {
  /** 3: a row of `lg` cards · 5: a row of `compact` cards. */
  columns: 3 | 5
  /** The row's accessible name ("Headline numbers"). */
  label: string
  /** One short line above the row for what its cards share ("Last 30 days"); compact cards don't show their window. */
  caption?: ReactNode
  /** The cards, in reading order. */
  children: ReactNode
  /** Extra classes for placement, not restyling. */
  className?: string
}) {
  return (
    <section aria-label={label} data-slot="kpi-row" data-columns={columns} className={className}>
      {caption && <p className="mb-2 text-xs font-medium text-muted-foreground">{caption}</p>}
      <Grid columns={COLUMNS[columns]}>{children}</Grid>
    </section>
  )
}

export { KpiRow }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type KpiRowProps = ComponentProps<typeof KpiRow>
