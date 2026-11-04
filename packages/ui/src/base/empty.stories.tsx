import type { Meta, StoryObj } from "@storybook/react-vite"
import { FolderOpenIcon } from "lucide-react"

import { Button } from "./button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty"

/* Upstream Empty as the registry ships it (U-03); the Paige EmptyState (Components › Feedback) sits on it. */
const meta = {
  component: Empty,
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpenIcon />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>You haven&apos;t created any projects yet. Get started by creating your first project.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create project</Button>
          <Button variant="outline">Import project</Button>
        </div>
      </EmptyContent>
    </Empty>
  ),
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { render: () => <Empty className="border"><EmptyHeader><EmptyTitle>Nothing here</EmptyTitle><EmptyDescription>The dashed border is the base&apos;s own, shown with a width.</EmptyDescription></EmptyHeader></Empty> }
