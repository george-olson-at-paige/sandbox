import type { Meta, StoryObj } from "@storybook/react-vite"

import { Checkbox } from "./checkbox"
import { Label } from "./label"

/* Base = upstream shadcn, unedited (R1-22). Label is base only (R1-17): Paige code never uses
   it directly. A form field's label is FieldLabel (Components/Field), which is built on it;
   labelling text that is not a form label is Eyebrow (Components/Eyebrow). The upstream
   pairing, a checkbox, is shown for reference only. */
const meta = {
  component: Label,
  args: { children: "Full legal name" },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const UpstreamPairing: Story = {
  name: "Upstream pairing (checkbox)",
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="bl-terms" />
      <Label htmlFor="bl-terms">Elena lives with me</Label>
    </div>
  ),
}
