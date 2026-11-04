import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Input. */
const meta = {
  component: Input,
  args: { "aria-label": "Full legal name", placeholder: "Your full legal name" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: "Maya Elena Reyes" } }
export const Invalid: Story = { args: { defaultValue: "31/02/1984", "aria-invalid": true } }
export const Disabled: Story = { args: { defaultValue: "maya@example.com", disabled: true } }
