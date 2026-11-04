import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"

/* Base = upstream shadcn, unedited (R1-22). Not wrapped yet: the Sidebar base uses it for its phone form. */
const meta = { component: Sheet } satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>The sidebar's phone form.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}
