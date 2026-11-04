import { useEffect, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { GutterReadout } from "../stories/fixtures"

/* Layout tokens (R1-23), named once in theme.css. Templates (Page, AreaPage, SetupBeat,
   HomePage) and AppHeader's row are the only places that use the frame and page-level
   tokens; `npm run check:tokens` flags page wrappers anywhere else. */
const TOKENS: Array<[string, string, string]> = [
  ["page-frame", "--container-page + --gutter", "The frame: max width 1400, side gutter inside, centred (Page, PageBand, AppHeader row)"],
  ["max-w-page", "--container-page", "Page max width (1400)"],
  ["px-gutter", "--gutter", "Side gutter: 16 · 24 from sm · 32 from lg · 48 from xl"],
  ["gap-column", "--spacing-column", "Two columns (main and rail)"],
  ["gap-grid", "--spacing-grid", "Tiles and card grids"],
  ["gap-section", "--spacing-section", "Page sections (Page's own stack)"],
  ["pt-page-top", "--spacing-page-top", "Page top"],
  ["pt-page-top-roomy", "--spacing-page-top-roomy", "Roomy page top (Page top=\"roomy\", setup beats; R2-04)"],
  ["pb-page-bottom", "--spacing-page-bottom", "Page bottom"],
  ["w-rail", "--spacing-rail", "The rail; stacks under the main column below lg"],
  ["max-w-focused", "--container-focused", "Focused column (setup), centred"],
  ["max-w-wide", "--container-wide", "Wide column (setup choice grids), centred"],
  ["max-w-measure", "--container-measure", "Prose measure (PageIntro lede, PageHeader description and lead)"],
  ["max-w-display", "--container-display", "Display title measure, 20ch (PageIntro title; R2-23)"],
]

/* Resolve a token by measuring an element with the utility applied (works for @theme inline
   tokens, which are not emitted as variables). */
function Measured({ utility }: { utility: string }) {
  const [value, setValue] = useState("")
  useEffect(() => {
    const el = document.createElement("div")
    el.className = utility
    el.style.position = "absolute"
    el.style.visibility = "hidden"
    document.body.appendChild(el)
    const cs = getComputedStyle(el)
    const v =
      utility.startsWith("max-w") ? cs.maxWidth
      : utility.startsWith("w-") ? cs.width
      : utility.startsWith("gap") ? cs.rowGap
      : utility.startsWith("pt") ? cs.paddingTop
      : utility.startsWith("pb") ? cs.paddingBottom
      : cs.paddingLeft
    setValue(v)
    el.remove()
  }, [utility])
  return <>{value}</>
}

const meta = {
  tags: ["!autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Tokens: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <GutterReadout />
      <table className="w-fit">
        <thead>
          <tr className="text-left">
            {["Utility", "Token", "Now", "Use"].map((h) => <th key={h} className="eyebrow pr-6 pb-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {TOKENS.map(([utility, token, use]) => (
            <tr key={utility} className="border-t border-divider">
              <td className="py-2 pr-6 text-sm font-semibold text-card-foreground">{utility}</td>
              <td className="py-2 pr-6 text-sm text-muted-foreground">{token}</td>
              <td className="py-2 pr-6 text-sm text-card-foreground"><Measured utility={utility} /></td>
              <td className="py-2 text-sm text-muted-foreground">{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="max-w-measure text-sm text-muted-foreground">
        Tile grid: 1 column below sm, 2 from sm, 3 from lg (HomePage). Rail: main + 336 from lg, stacked below.
      </p>
    </div>
  ),
}
