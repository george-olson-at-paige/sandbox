import type { Meta, StoryObj } from "@storybook/react-vite"

import { GutterReadout, StoryAppHeader, StubLink } from "../stories/fixtures"
import { Callout, CalloutAction } from "../components/feedback/callout"
import { Button } from "../components/actions/button"
import { Inline } from "../primitives/inline"
import { Placeholder } from "../stories/placeholder"
import { Page, PageBand } from "./page"

/* Page (R1-23): the default layout. Max width 1400 with the side gutter inside it; the
   AppHeader row and any band use the same frame, so the logo, the band's content and the page
   content share one left edge. The gutter stories set the viewport: 375 · 640 · 1024 · 1280 · 1440. */
const meta = {
  tags: ["r2-04", "gaps-78", "r2-35", "gaps-77"],
  component: Page,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The default layout: max width 1400 with the side gutter inside it; the AppHeader row and any band share one left edge with the content.\n\n" +
          "**Header actions are global; page actions belong to the page.** The AppHeader holds only what applies on every page: search, notifications, account, the Mode switch. " +
          "Anything about the page you're on (add, edit, export, filter, a page's primary button) goes in that page's `PageHeader` actions, never in the top header.",
      },
    },
  },
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    width: "default",
    children: (
      <>
        <GutterReadout />
        <Placeholder size="md" label="Section · PageHeader" />
        <Placeholder size="lg" label="Section · content" />
        <Placeholder size="md" label="Section · footer" />
      </>
    ),
  },
  argTypes: { width: { control: "inline-radio", options: ["default", "focused", "wide"] } },
} satisfies Meta<typeof Page>

export default meta
type Story = StoryObj<typeof meta>

const band = (
  <PageBand label="Sections">
    <Placeholder size="sm" label="Band content (Sections banner)" className="flex-1" />
  </PageBand>
)

export const Default: Story = { name: "Default (1400, gutters inside)" }
export const Focused: Story = { name: "Focused (768)", args: { width: "focused" } }
export const Wide: Story = { name: "Wide (960)", args: { width: "wide" } }
export const RoomyTop: Story = { name: "Roomy top (48, setup beats)", args: { width: "focused", top: "roomy" } }
export const WithBand: Story = { name: "With a band (full bleed, same frame)", args: { band } }

/* The Sections banner as apps/web builds it (features/shell/sections-banner.tsx, R2-35): an
   unframed Callout with a dismiss button in a PageBand. Shown to established accounts only. */
const sectionsBanner = (
  <PageBand label="Your sections are still here">
    <Callout
      framed={false}
      title="The sections you know are still here."
      onDismiss={() => {}}
      className="min-w-0 flex-1"
      actions={
        <>
          <Inline as="nav" gap={3} aria-label="Your sections" className="text-sm">
            {["Will", "Documents", "Contacts", "Business", "Passwords"].map((v) => (
              <Button key={v} asChild variant="link" size="inline">
                <StubLink href={`#${v.toLowerCase()}`}>{v}</StubLink>
              </Button>
            ))}
          </Inline>
          <CalloutAction>Got it</CalloutAction>
        </>
      }
    >
      Paige is now organised around areas of your life. The pages you used before are unchanged — nothing has moved or been deleted.
    </Callout>
  </PageBand>
)
/** Band: the Sections banner (established accounts) */
export const SectionsBanner: Story = {
  name: "Band · Sections banner",
  tags: ["!autodocs"],
  args: { band: sectionsBanner },
}

const at = (w: number) => ({ args: { band }, globals: { viewport: { value: `w${w}`, isRotated: false } } })
export const Gutter375: Story = { name: "Gutter at 375: 16", ...at(375) }
export const Gutter640: Story = { name: "Gutter at 640: 24", ...at(640) }
export const Gutter1024: Story = { name: "Gutter at 1024: 32", ...at(1024) }
export const Gutter1280: Story = { name: "Gutter at 1280: 48", ...at(1280) }
export const Gutter1440: Story = { name: "Gutter at 1440: 48, frame capped at 1400", ...at(1440) }
