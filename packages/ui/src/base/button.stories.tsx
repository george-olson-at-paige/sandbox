import type { Meta, StoryObj } from "@storybook/react-vite"
import { PlusIcon } from "lucide-react"

import { Button } from "./button"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Button. Upstream
   shadow-xs compiles to nothing under the Paige theme (GAPS #4). */
const meta = {
  component: Button,
  args: { children: "Button" },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    size: { control: "select", options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["default", "destructive", "outline", "secondary", "ghost", "link"] as const).map((v) => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "default", "lg"] as const).map((s) => (
        <Button key={s} size={s}>{s}</Button>
      ))}
      <Button size="icon" aria-label="Add"><PlusIcon /></Button>
    </div>
  ),
}

export const Disabled: Story = { args: { disabled: true } }
