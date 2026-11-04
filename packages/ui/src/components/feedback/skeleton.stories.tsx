import type { Meta, StoryObj } from "@storybook/react-vite"

import { Skeleton } from "./skeleton"

/* Skeleton (R8-08): placeholders in the shape of what's loading, so nothing shifts when it lands. */
const meta = { component: Skeleton, tags: ["r8-08"] } satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = { args: { shape: "text", width: "3/4" } }
export const NumberShape: Story = { name: "Number", args: { shape: "number", width: "1/3" } }
export const Shapes: Story = {
  render: () => (
    <div aria-busy className="flex max-w-sm flex-col gap-2 rounded-xl border p-5">
      <Skeleton width="1/2" />
      <Skeleton shape="number" width="1/3" />
      <Skeleton width="3/4" />
      <div className="mt-2 h-8"><Skeleton shape="block" /></div>
    </div>
  ),
}
