import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { Checkbox } from "./checkbox"

/* Checkbox (R12-10): on, off and mixed (a header box over a partly selected page). The 16px box;
   the target is the caller's cell or label. */
const meta = {
  component: Checkbox,
  args: { checked: false, onCheckedChange: fn(), "aria-label": "Select Ada Park" },
  tags: ["r12-10"],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(false)
    return <Checkbox {...args} checked={on} onCheckedChange={setOn} />
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: "Select Ada Park" })
    await expect(box).not.toBeChecked()
    await userEvent.click(box)
    await expect(box).toBeChecked()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-sm">
      <label className="flex items-center gap-2">
        <Checkbox checked={false} onCheckedChange={() => {}} /> Off
      </label>
      <label className="flex items-center gap-2">
        <Checkbox checked onCheckedChange={() => {}} /> On
      </label>
      <label className="flex items-center gap-2">
        <Checkbox checked="mixed" onCheckedChange={() => {}} /> Mixed
      </label>
      <label className="flex items-center gap-2">
        <Checkbox checked disabled onCheckedChange={() => {}} /> Disabled
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const mixed = within(canvasElement).getByRole("checkbox", { name: "Mixed" })
    await expect(mixed).toHaveAttribute("aria-checked", "mixed")
    // R20-01: the 16px box has a 4px corner (rounded-xs). rounded-sm is 8px, which is a circle here.
    for (const name of ["Off", "On", "Mixed"]) {
      const box = within(canvasElement).getByRole("checkbox", { name })
      await expect(box.getBoundingClientRect().width).toBe(16)
      await expect(getComputedStyle(box).borderRadius).toBe("4px")
    }
  },
}
