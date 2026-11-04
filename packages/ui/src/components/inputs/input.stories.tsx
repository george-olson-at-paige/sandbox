import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

const meta = {
  component: Input,
  args: { "aria-label": "Full legal name", placeholder: "Your full legal name" },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { name: "Empty (placeholder)" }
export const Filled: Story = { name: "Filled (value at 400)", tags: ["r1-12"], args: { defaultValue: "Maya Elena Reyes" } }
export const Hover: Story = { args: { defaultValue: "Maya Elena Reyes" }, parameters: { pseudo: { hover: true } } }
export const Error: Story = { name: "Error (aria-invalid)", tags: ["r1-02"], args: { defaultValue: "31/02/1984", "aria-invalid": true } }
export const ErrorHover: Story = {
  name: "Error · hover",
  args: { defaultValue: "31/02/1984", "aria-invalid": true },
  parameters: { pseudo: { hover: true } },
}
export const Disabled: Story = { args: { defaultValue: "maya@example.com", disabled: true } }
export const Compact: Story = {
  name: "Compact (not built)",
  tags: ["gaps-61"],
  render: () => <p className="text-sm text-muted-foreground">The collapse names Input <code>compact</code>; the spike has one size (44). See GAPS.md #61.</p>,
}
