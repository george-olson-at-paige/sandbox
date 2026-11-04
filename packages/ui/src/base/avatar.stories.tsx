import type { Meta, StoryObj } from "@storybook/react-vite"

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./avatar"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Avatar. Note the
   upstream badge sits inside the clipped root (R1-09). */
const meta = {
  component: Avatar,
  args: { size: "default" },
  argTypes: { size: { control: "select", options: ["sm", "default", "lg"] } },
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="assets/avatar-female-glasses.png" alt="" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Fallback: Story = { render: (args) => <Avatar {...args}><AvatarFallback>MR</AvatarFallback></Avatar> }

export const SizesAndBadge: Story = {
  name: "Sizes · badge",
  render: () => (
    <div className="flex items-center gap-4">
      {(["sm", "default", "lg"] as const).map((s) => (
        <Avatar key={s} size={s}><AvatarFallback>MR</AvatarFallback><AvatarBadge /></Avatar>
      ))}
    </div>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar><AvatarFallback>MR</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>DR</AvatarFallback></Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
}
