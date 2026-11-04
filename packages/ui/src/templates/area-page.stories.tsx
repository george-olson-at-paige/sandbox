import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { AreaPage } from "./area-page"
import { PageBand } from "./page"

/* AreaPage: Page + header · main column · right rail (336, from lg) · footer. Built from
   placeholders; below lg (1024) the rail stacks under the main column. */
const meta = {
  component: AreaPage,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    area: "family",
    header: <Placeholder size="lg" label="Header (PageHeader)" />,
    main: (
      <>
        <Placeholder size="md" label="Callout (review)" />
        <Placeholder size="xl" label="Panel · The essentials" />
        <Placeholder size="lg" label="Panel · More that belongs here" />
      </>
    ),
    rail: (
      <>
        <Placeholder size="lg" label="Rail panel · What’s left" />
        <Placeholder size="md" label="Rail panel · People" />
        <Placeholder size="md" label="Rail panel · Documents here" />
      </>
    ),
    footer: <Placeholder size="md" label="Footer · LinkOut" />,
  },
} satisfies Meta<typeof AreaPage>

export default meta
type Story = StoryObj<typeof meta>

export const Slots: Story = { name: "Slots (placeholders)" }
export const NoRail: Story = { name: "No rail", args: { rail: undefined } }
export const WithBand: Story = {
  name: "With the Sections banner band",
  args: {
    band: (
      <PageBand label="Sections">
        <Placeholder size="sm" label="Sections banner" className="flex-1" />
      </PageBand>
    ),
  },
}
/** Below lg (640): the rail stacks under main. */
export const RailBelowLg: Story = {
  tags: ["!autodocs"],
  name: "Below lg · 640",
  globals: { viewport: { value: "w640", isRotated: false } },
}
export const RailFromLg: Story = {
  tags: ["!autodocs"],
  name: "From lg (1024): main + rail",
  globals: { viewport: { value: "w1024", isRotated: false } },
}
