import type { Meta, StoryObj } from "@storybook/react-vite"

import { Spinner } from "./spinner"

const meta = {
  component: Spinner,
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InContext: Story = {
  name: "Sizes and tones",
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner size="md" className="text-primary" />
      <Spinner size="lg" className="text-muted-foreground" />
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner label="Reading" />Reading your document…</span>
    </div>
  ),
}
