import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { Grid } from "../primitives/grid"
import { Page } from "./page"

/* @archetype Frame (ARCHETYPES.md).
   HomePage: the Vault home. Page + intro · tile grid (1 column below sm, 2 from sm, 3 from
   lg, 16 apart) · footer (browse row). Tiles are passed as children of the grid, in order. */
/** The Vault home layout: intro, the Area tile grid and a footer. */
function HomePage({
  band,
  intro,
  tiles,
  footer,
}: {
  /** Full-bleed PageBand above the intro. */
  band?: ReactNode
  /** The page intro (PageIntro). */
  intro: ReactNode
  /** AreaTiles, in order: 1 column, 2 from sm, 3 from lg. */
  tiles: ReactNode
  /** Under the grid: the browse row. */
  footer?: ReactNode
}) {
  return (
    <Page band={band}>
      {intro}
      <Grid columns={{ base: 1, sm: 2, lg: 3 }} data-slot="tile-grid">
        {tiles}
      </Grid>
      {footer}
    </Page>
  )
}

export { HomePage }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type HomePageProps = ComponentProps<typeof HomePage>
