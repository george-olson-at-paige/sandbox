import type { Meta, StoryObj } from "@storybook/react-vite"

import { Label } from "./label"
import { RadioGroup, RadioGroupItem } from "./radio-group"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/RadioGroup. */
const meta = {
  component: RadioGroup,
  args: { "aria-label": "Marital status", defaultValue: "married" },
  render: (args) => (
    <RadioGroup {...args}>
      {[["married", "Married"], ["single", "Single"]].map(([v, l]) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem value={v} id={`brg-${v}`} />
          <Label htmlFor={`brg-${v}`}>{l}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
