import type { Meta, StoryObj } from "@storybook/react-vite"
import { InboxIcon } from "lucide-react"

import { Button } from "./button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./item"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Item (the list row). */
const meta = {
  component: Item,
  args: { variant: "default", size: "default" },
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "muted"] },
    size: { control: "select", options: ["default", "sm"] },
  },
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon"><InboxIcon /></ItemMedia>
      <ItemContent>
        <ItemTitle>Will, signed 2024</ItemTitle>
        <ItemDescription>Uploaded from your phone · 3 pages</ItemDescription>
      </ItemContent>
      <ItemActions><Button size="sm" variant="outline">Open</Button></ItemActions>
    </Item>
  ),
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { args: { variant: "outline" } }
export const Muted: Story = { args: { variant: "muted", size: "sm" } }
