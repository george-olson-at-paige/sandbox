import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"
import { BellIcon, InfoIcon, SearchIcon } from "lucide-react"

import { Button } from "../actions/button"
import { Tooltip } from "./tooltip"
import { enter } from "../../stories/typing"

/* Tooltip (R4-07): short text on hover (500ms delay) and on keyboard focus; never the only
   place information lives; never shows on touch. Hover or Tab to a button. */
const meta = {
  component: Tooltip,
  tags: ["r4-07"],
  args: {
    content: "Search everything in your Vault",
    side: "top",
    align: "center",
    children: <Button variant="ghost" size="icon" icon={<SearchIcon />} aria-label="Search" />,
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    children: { control: false },
  },
  decorators: [(S) => <div className="flex min-h-40 items-center justify-center"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          "**Short text only, and never the only place the information lives.** A tooltip repeats or expands on something already visible or named (an icon button's `aria-label`); it never holds a link, a control or anything a phone user needs, because it doesn't show on touch. It opens after a 500ms hover and at once on keyboard focus.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const IconButton: Story = { name: "On an icon button" }
export const HeaderIcons: Story = {
  name: "Header icons",
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="Search">
        <Button variant="ghost" size="icon" icon={<SearchIcon />} aria-label="Search" />
      </Tooltip>
      <Tooltip content="Notifications">
        <Button variant="ghost" size="icon" icon={<BellIcon />} aria-label="Notifications" />
      </Tooltip>
    </div>
  ),
}
export const Expands: Story = {
  name: "Expands on a visible label",
  args: {
    content: "We read these from your licence photo; you can change any of them.",
    children: <Button variant="link" size="inline" icon={<InfoIcon />}>Where these came from</Button>,
  },
}
/* Open state: single-story view only (R3-17). */
export const Open: Story = {
  tags: ["!autodocs"],
  render: (args) => (
    <Tooltip {...args}>
      {args.children}
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    // R12-03: enter() sends the focus events itself when the page has no system focus.
    await enter(canvasElement.querySelector("button")!)
    // The state, not the event: the tooltip is there.
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("tooltip")).toBeInTheDocument())
  },
}
