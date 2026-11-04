import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { partners } from "../fixtures/partners"
import { PartnerLogo } from "./partner-logo"

// todo: this doesn't belong here. there should be a logo and then see why this is needed

/* PartnerLogo (R13-22; its own story since 2026-10-30, from Admin › Pages › Partners' "Logos"):
   the partner's logo contained on white, or its initials when there's none yet; sm for a strip,
   lg for the dialog and the partner page. The fixtures' first six partners mix both. */
const byName = (name: string) => partners.find((p) => p.name === name)!

const meta = {
  component: PartnerLogo,
  args: { partner: byName("Cedar Trust") },
  tags: ["r13-22"],
} satisfies Meta<typeof PartnerLogo>

export default meta
type Story = StoryObj<typeof meta>

/** sm, the default: a 32 × 64 box, the image decorative (its row says the name). */
export const Small: Story = {
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img")!
    await expect(img).toHaveAttribute("alt", "")
    await expect(img).toHaveAttribute("src", byName("Cedar Trust").logoUrl!)
  },
}

/** lg: 80 tall and the full width, as the Update logo dialog and the partner page show it; the image names the partner. */
export const Large: Story = {
  args: { size: "lg" },
  decorators: [(S) => <div className="max-w-xs"><S /></div>],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "Cedar Trust logo" })).toBeInTheDocument()
  },
}

/** No logo yet: the partner's initials on the muted fill, hidden from assistive tech. */
export const Initials: Story = {
  args: { partner: byName("Brightpath Benefits") },
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="partner-logo"]')!
    await expect(box).toHaveAttribute("data-empty")
    await expect(box).toHaveAttribute("aria-hidden")
    await expect(box).toHaveTextContent("BB")
    await expect(canvasElement.querySelector("img")).toBeNull()
  },
}

/** The first six partners in a row: logos and initials side by side, all one height. */
export const Row: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {partners.slice(0, 6).map((p) => (
        <PartnerLogo key={p.id} partner={p} />
      ))}
    </div>
  ),
}
