import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Switch } from "./switch"
import { enter } from "../../stories/typing"

/* Switch (R11-04): on/off that takes effect at once. Label it with the visible text next to it
   (aria-labelledby) or `aria-label`; inside a Field the Field names it. */
const meta = {
  component: Switch,
  args: { "aria-label": "Share with my executor" },
  tags: ["r11-04"],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}
export const On: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledOn: Story = { name: "Disabled · on", args: { disabled: true, defaultChecked: true } }

function Labelled() {
  const [on, setOn] = useState(false)
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Switch aria-labelledby="sw-label" checked={on} onCheckedChange={setOn} />
      <span id="sw-label" className="text-sm font-medium text-card-foreground">Share with my executor</span>
    </div>
  )
}

export const WithVisibleLabel: Story = {
  name: "With a visible label (Space toggles)",
  render: () => <Labelled />,
  play: async ({ canvasElement }) => {
    const sw = within(canvasElement).getByRole("switch", { name: "Share with my executor" })
    await expect(sw).toHaveAttribute("aria-checked", "false")
    await enter(sw)
    await userEvent.keyboard(" ")
    await expect(sw).toHaveAttribute("aria-checked", "true")
  },
}
