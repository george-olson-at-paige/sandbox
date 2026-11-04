import type { Meta, StoryObj } from "@storybook/react-vite"

import { AREA_ORDER } from "../icons/area-glyphs"
import { StatusDot } from "./status-dot"

const ITEM = ["open", "partial", "present", "declined"] as const
const WORK = ["waiting", "working", "done", "attention"] as const

const meta = {
  tags: ["r4-05"],
  component: StatusDot,
  args: { status: "open", label: "Open" },
  argTypes: { status: { control: "select", options: [...ITEM, ...WORK] } },
  /* Area-toned stories sit in a Family context (R3-15: without one, area tone is neutral). */
  decorators: [(S) => <div data-area="family"><S /></div>],
} satisfies Meta<typeof StatusDot>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = { args: { status: "open", label: "Open" } }
export const Partial: Story = { args: { status: "partial", label: "Partly done" } }
export const Present: Story = { args: { status: "present", label: "Done" } }
export const Declined: Story = { args: { status: "declined", label: "Doesn’t apply" } }
export const Waiting: Story = { args: { status: "waiting", label: "Waiting" } }
export const Working: Story = { args: { status: "working", label: "Working" } }
export const Done: Story = { args: { status: "done", label: "Done" } }
export const Attention: Story = { args: { status: "attention", label: "Needs attention" } }

export const AllStatuses: Story = {
  name: "Every status (all 20px)",
  render: () => (
    <div className="flex flex-col gap-4">
      {[["item", ITEM], ["work", WORK]].map(([group, list]) => (
        <div key={group as string} className="flex items-center gap-6">
          <span className="eyebrow w-12">{group as string}</span>
          {(list as readonly (typeof ITEM[number] | typeof WORK[number])[]).map((s) => (
            <span key={s} className="flex items-center gap-2 text-sm text-card-foreground">
              <StatusDot status={s} label={s} />
              {s}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const PresentEveryArea: Story = {
  name: "Present · every Life Area",
  render: () => (
    <div className="flex flex-wrap gap-6">
      {AREA_ORDER.map((a) => (
        <span key={a} data-area={a} className="flex items-center gap-2 text-sm text-area-ink capitalize">
          <StatusDot status="present" label={`${a} done`} />
          {a}
        </span>
      ))}
    </div>
  ),
}
