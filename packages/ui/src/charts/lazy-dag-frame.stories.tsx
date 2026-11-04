import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"

import { LazyDagFrame } from "./lazy-dag-frame"

/* LazyDagFrame (R9-06): the entry pages use. dag-frame.tsx, React Flow and dagre load when
   the frame first renders; a frame-shaped skeleton holds the space meanwhile. */
const meta = {
  component: LazyDagFrame,
  args: {
    label: "Three steps",
    nodes: [
      { id: "a", label: "Extract", status: "succeeded", dependsOn: [], duration: "12s" },
      { id: "b", label: "Transform", status: "running", dependsOn: ["a"] },
      { id: "c", label: "Load", status: "queued", dependsOn: ["b"] },
    ],
  },
  decorators: [(S) => <div className="max-w-4xl"><S /></div>],
  tags: ["r9-06"],
} satisfies Meta<typeof LazyDagFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(3))
  },
}
