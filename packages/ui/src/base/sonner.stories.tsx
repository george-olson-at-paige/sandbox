import type { Meta, StoryObj } from "@storybook/react-vite"
import { toast } from "sonner"

import { Toaster } from "./sonner"
import { Button } from "./button"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Feedback/Toast. The
   upstream Toaster reads the theme from next-themes; with no provider that is "system". */
const meta = {
  component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast("Event has been created", { description: "Sunday, December 03, 2023 at 9:00 AM", action: { label: "Undo", onClick: () => {} } })}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success("Saved")}>Success</Button>
        <Button variant="outline" onClick={() => toast.info("Heads up")}>Info</Button>
        <Button variant="outline" onClick={() => toast.warning("Check this")}>Warning</Button>
        <Button variant="outline" onClick={() => toast.error("That didn’t work")}>Error</Button>
        <Button variant="outline" onClick={() => toast.loading("Working…")}>Loading</Button>
      </div>
      <Toaster />
    </>
  ),
}
