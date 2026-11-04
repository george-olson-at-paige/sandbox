import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { StatusMark, type MarkStatus } from "./status-mark"

/* StatusMark (R10-12, GAPS #113): the one status vocabulary and mark. StatusDot (Vault) and the
   graph (Charts) both draw it. Present takes the area fill, so the stories sit in a Family
   context (R3-15). */
const ITEM: MarkStatus[] = ["open", "partial", "present", "declined"]
const WORK: MarkStatus[] = ["waiting", "working", "done", "attention", "skipped", "canceled"]

const meta = {
  component: StatusMark,
  args: { status: "done", label: "Done" },
  argTypes: { status: { control: "select", options: [...ITEM, ...WORK] } },
  decorators: [(S) => <div data-area="family"><S /></div>],
  tags: ["r10-12", "gaps-113"],
} satisfies Meta<typeof StatusMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Vocabulary: Story = {
  name: "Every status, two sizes",
  render: () => (
    <div className="flex flex-col gap-6 text-sm">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-col gap-3">
          {[ITEM, WORK].map((group, i) => (
            <div key={i} className="flex flex-wrap items-center gap-6">
              {group.map((s) => (
                <span key={s} className="flex items-center gap-2">
                  <StatusMark status={s} size={size} />
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="status-mark"]')).toHaveLength(20)
    // Decorative without a label.
    await expect(within(canvasElement).queryAllByRole("img")).toHaveLength(0)
  },
}
