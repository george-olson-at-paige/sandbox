import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { StatusMark } from "../components/display/status-mark"
import { DagLegend, dagMark, dagStatusLabel, type DagStatus } from "./dag-status"

/* Graph status (R9-06, R10-12): the legend that names a graph's six states, and the StatusMark
   each one draws (the same marks as the Vault's StatusDot). Separate from the frame so a page can
   use them without loading React Flow. */
const ALL: DagStatus[] = ["queued", "running", "succeeded", "failed", "skipped", "canceled"]

const meta = {
  component: DagLegend,
  tags: ["r9-06", "r10-12", "gaps-113"],
} satisfies Meta<typeof DagLegend>

export default meta
type Story = StoryObj<typeof meta>

export const Legend: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Status key" })
    await expect(within(list).getAllByRole("listitem")).toHaveLength(6)
    await expect(list).toHaveTextContent("Canceled")
    // The legend draws StatusMark: queued is its waiting ring.
    await expect(list.querySelector('[data-slot="status-mark"][data-status="waiting"]')).not.toBeNull()
  },
}

export const Marks: Story = {
  name: "The six marks, two sizes",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-6 text-sm">
          {ALL.map((s) => (
            <span key={s} className="flex items-center gap-2">
              <StatusMark status={dagMark(s)} size={size} />
              {dagStatusLabel(s)}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
}
