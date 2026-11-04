import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Button } from "../actions/button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/* Popover (R11-10): a panel beside its trigger. Click outside or Escape closes it. */
const meta = {
  component: Popover,
  tags: ["r11-10"],
  decorators: [(S) => <div className="flex min-h-48 items-start justify-end p-4"><S /></div>],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

const panel = (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="secondary" size="sm">Open</Button>
    </PopoverTrigger>
    <PopoverContent aria-label="Example">
      <p className="px-2 py-1 text-sm font-medium">Anything that isn’t a menu.</p>
    </PopoverContent>
  </Popover>
)

export const Default: Story = { render: () => panel }

/** Click away and Escape close it. */
export const ClosesOnClickAwayAndEscape: Story = {
  name: "Click away and Escape",
  render: () => (
    <div className="flex w-full justify-between">
      <Button variant="ghost" size="sm">Elsewhere</Button>
      {panel}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(c.getByRole("button", { name: "Open" }))
    await body.findByRole("dialog", { name: "Example" })
    await userEvent.click(c.getByRole("button", { name: "Elsewhere" }))
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Example" })).toBeNull())
    await userEvent.click(c.getByRole("button", { name: "Open" }))
    await body.findByRole("dialog", { name: "Example" })
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Example" })).toBeNull())
    await expect(c.getByRole("button", { name: "Open" })).toHaveFocus()
  },
}
