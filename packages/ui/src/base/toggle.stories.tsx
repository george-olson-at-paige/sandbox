import type { Meta, StoryObj } from "@storybook/react-vite"
import { StarIcon } from "lucide-react"

import { Toggle } from "./toggle"

const meta = {
  component: Toggle,
  args: { "aria-label": "Mark as important", children: <><StarIcon />Important</> },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { args: { variant: "outline" } }
export const Pressed: Story = { args: { defaultPressed: true } }
export const OutlinePressed: Story = { name: "Outline · pressed", args: { variant: "outline", defaultPressed: true } }
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle size="sm" variant="outline" aria-label="Small"><StarIcon /></Toggle>
      <Toggle size="default" variant="outline" aria-label="Default"><StarIcon /></Toggle>
      <Toggle size="lg" variant="outline" aria-label="Large"><StarIcon /></Toggle>
    </div>
  ),
}
export const Hover: Story = { parameters: { pseudo: { hover: true } } }
export const Disabled: Story = { args: { disabled: true } }
