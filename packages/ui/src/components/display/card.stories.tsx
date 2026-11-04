import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../actions/button"
import { Card } from "./card"
import { Placeholder } from "../../stories/placeholder"

const meta = {
  component: Card,
  argTypes: {
    variant: { control: "select", options: ["default", "muted", "highlight", "placeholder"] },
    interactive: { control: "boolean" },
  },
  args: { variant: "default", interactive: false },
  render: (args) => (
    <Card {...args} className="max-w-sm gap-3 px-6">
      <Placeholder label="Card header" size="sm" />
      <Placeholder label="Card body" size="md" />
      <div className="flex justify-end"><Button size="sm" variant="secondary">Action</Button></div>
    </Card>
  ),
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Muted: Story = { args: { variant: "muted" } }
export const Highlight: Story = {
  name: "Highlight (area tone)",
  args: { variant: "highlight" },
  decorators: [(S) => <div data-area="family"><S /></div>],
}
export const Placeholder_: Story = { args: { variant: "placeholder" } }
export const Interactive: Story = { args: { interactive: true, tabIndex: 0 } }
export const InteractiveHover: Story = {
  name: "Interactive · hover",
  args: { interactive: true, tabIndex: 0 },
  parameters: { pseudo: { hover: true } },
}
