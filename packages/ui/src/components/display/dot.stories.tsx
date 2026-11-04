import type { Meta, StoryObj } from "@storybook/react-vite"
import { BellIcon, CheckIcon } from "lucide-react"

import { Avatar } from "./avatar"
import { Dot } from "./dot"

/* Dot (R4-09): the generic small coloured circle. StatusDot, NotificationBell's unread dot and
   Avatar's badge are built on it. Decorative unless `label` is set. */
const TONES = ["neutral", "primary", "info", "success", "warning", "attention", "area"] as const
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const

const meta = {
  component: Dot,
  tags: ["r4-09"],
  args: { tone: "primary", size: "md", ring: false },
  argTypes: {
    tone: { control: "select", options: ["none", ...TONES] },
    size: { control: "select", options: SIZES },
  },
  decorators: [(S) => <div data-area="family"><S /></div>],
} satisfies Meta<typeof Dot>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {TONES.map((t) => (
        <span key={t} className="flex items-center gap-2 text-sm text-card-foreground">
          <Dot tone={t} size="md" />
          {t}
        </span>
      ))}
    </div>
  ),
}
export const Sizes: Story = {
  name: "Sizes (8 · 12 · 14 · 16 · 20)",
  render: () => (
    <div className="flex items-center gap-6">
      {SIZES.map((s) => (
        <span key={s} className="flex items-center gap-2 text-sm text-card-foreground">
          <Dot size={s} />
          {s}
        </span>
      ))}
    </div>
  ),
}
/** Built on it: unread dot, avatar badge, a mark with an icon. */
export const BuiltOnIt: Story = {
  name: "Built on Dot",
  render: () => (
    <div className="flex items-center gap-8">
      <span className="relative inline-flex size-9 items-center justify-center text-muted-foreground">
        <BellIcon className="size-4" aria-hidden />
        <Dot ring className="absolute top-2 right-2" />
      </span>
      <Avatar name="Maya Reyes" size="xl" badge="check" />
      <Dot tone="success" size="xl" label="Done" className="[&>svg]:size-3">
        <CheckIcon strokeWidth={3} />
      </Dot>
    </div>
  ),
}
