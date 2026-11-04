import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "./eyebrow"
import { Separator } from "./separator"

const meta = {
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/** The line's weight follows what it separates: the outer the boundary, the stronger the line. */
export const Levels: Story = {
  render: () => (
    <div className="max-w-md text-sm text-card-foreground">
      <p>level region: the bar from the page, a form from its actions</p>
      <Separator className="my-3" />
      <p>level group: sections within one form</p>
      <Separator level="group" className="my-3" />
      <p>level row: items in a list</p>
      <Separator level="row" className="my-3" />
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3 text-sm text-card-foreground">
      <span>Vault</span>
      <Separator orientation="vertical" />
      <span>Setup</span>
    </div>
  ),
}

/** Section label recipe (Eyebrow + Separator) */
export const SectionLabel: Story = {
  name: "Section label recipe",
  tags: ["gaps-50"],
  render: () => (
    <div className="flex max-w-md items-center gap-3">
      <Eyebrow className="shrink-0">Where you live</Eyebrow>
      <Separator level="group" className="flex-1" />
    </div>
  ),
}
