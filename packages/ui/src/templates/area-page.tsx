import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import type { AreaId } from "../icons/area-glyphs"
import { Stack } from "../primitives/stack"
import { Page } from "./page"

/* @archetype Frame (ARCHETYPES.md).
   AreaPage: one template for all nine Areas. Page + header · main column · right rail ·
   footer (link out). Sets the area tone for everything inside. One column below lg (1024),
   the rail stacking under the main column; main + 336px rail from lg, 24 apart. */
/** The page layout for every Life Area: header, main column and rail, in the area's tone. */
function AreaPage({
  area,
  band,
  header,
  main,
  rail,
  footer,
}: {
  /** Which Life Area: sets the area tone for everything inside. */
  area: AreaId
  /** Full-bleed PageBand above the header. */
  band?: ReactNode
  /** A PageHeader. */
  header: ReactNode
  /** The main column: the Area's rows. */
  main: ReactNode
  /** Right rail (RailPanels) from lg; below lg it stacks under main. */
  rail?: ReactNode
  /** A LinkOut, full width under both columns (R2-24). */
  footer?: ReactNode
}) {
  return (
    <Page band={band}>
      <div data-slot="area-page" data-area={area} className="contents">
        {header}
        <div className="grid items-start gap-column lg:grid-cols-area-page">
          <Stack gap={4}>{main}</Stack>
          {rail && <Stack as="aside" gap={4} aria-label="On this page">{rail}</Stack>}
        </div>
        {footer}
      </div>
    </Page>
  )
}

export { AreaPage }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AreaPageProps = ComponentProps<typeof AreaPage>
