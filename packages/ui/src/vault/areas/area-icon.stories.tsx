import type { Meta, StoryObj } from "@storybook/react-vite"

import { AREA_ORDER } from "../../icons/area-glyphs"
import { AreaIcon } from "./area-icon"

const meta = {
  component: AreaIcon,
  args: { area: "family", size: "md", tone: "solid", tick: false },
  argTypes: {
    area: { control: "select", options: AREA_ORDER },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    tone: { control: "select", options: ["solid", "soft", "plain"] },
  },
} satisfies Meta<typeof AreaIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllAreas: Story = {
  name: "Every area · solid, soft, plain, tick",
  render: () => (
    <div className="grid w-fit grid-cols-5 items-center gap-x-8 gap-y-4">
      <span className="eyebrow">area</span>
      <span className="eyebrow">solid</span>
      <span className="eyebrow">soft</span>
      <span className="eyebrow">plain</span>
      <span className="eyebrow">tick</span>
      {AREA_ORDER.map((a) => (
        <div key={a} className="contents">
          <span className="text-sm font-semibold text-card-foreground capitalize">{a}</span>
          <AreaIcon area={a} size="lg" tone="solid" />
          <AreaIcon area={a} size="lg" tone="soft" />
          <AreaIcon area={a} size="lg" tone="plain" />
          <AreaIcon area={a} size="lg" tone="solid" tick />
        </div>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <AreaIcon area="health" size={s} />
          <span className="text-xs text-muted-foreground">{s}</span>
        </div>
      ))}
    </div>
  ),
}
