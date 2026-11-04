import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   Page (R1-23): the default layout every template sits in. The page frame (max width 1400,
   the side gutter inside it: 16 · 24 from sm · 32 from lg · 48 from xl), page top 24 and
   bottom 48, sections 24 apart. `width` centres a narrower column inside the frame (focused
   768, wide 960). Bands (the Sections banner) span the viewport above the content; their
   inner row uses the same frame, so their content lines up with the logo and the page.
   `top="roomy"` (48) is for a page that holds one question on an otherwise empty screen, the
   setup beats (R2-04; the prototype's setup body starts 44 below the bar). */
const TOP = { default: "pt-page-top", roomy: "pt-page-top-roomy" } as const
const WIDTH = {
  default: "",
  focused: "mx-auto w-full max-w-focused",
  wide: "mx-auto w-full max-w-wide",
} as const

/** The page frame every layout sits in: width, gutters, page spacing and an optional band. */
function Page({
  width = "default",
  top = "default",
  band,
  children,
}: {
  /** default (the full page frame) · focused (768, one column) · wide (960). */
  width?: keyof typeof WIDTH
  /** Space above the content: default 24 · roomy 48 (setup beats). */
  top?: keyof typeof TOP
  /** Full-bleed bands above the content, e.g. <PageBand>. */
  band?: ReactNode
  /** The page sections, 24px apart. */
  children: ReactNode
}) {
  return (
    <>
      {band}
      <main data-slot="page" data-top={top} className={cn("page-frame flex-1 pb-page-bottom", TOP[top])}>
        <div data-slot="page-content" className={cn("flex flex-col gap-section", WIDTH[width])}>
          {children}
        </div>
      </main>
    </>
  )
}

/* PageBand: a full-bleed band (tinted, edge to edge) whose content sits in the page frame. */
function PageBand({
  label,
  children,
}: {
  /** Accessible name of the band's region. */
  label: string
  /** The band's content, inside the page frame. */
  children: ReactNode
}) {
  return (
    <section data-slot="page-band" aria-label={label} className="border-b border-divider bg-muted">
      <div className="page-frame flex flex-wrap items-center gap-3 py-3">{children}</div>
    </section>
  )
}

export { Page, PageBand }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PageProps = ComponentProps<typeof Page>
export type PageBandProps = ComponentProps<typeof PageBand>
