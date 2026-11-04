import type { Meta, StoryObj } from "@storybook/react-vite"

import { RadioGroup, RadioGroupItem } from "./radio-group"

/* The Paige RadioGroup is used inside ChoiceCard (Composites); this shows it bare. */
const OPTIONS = [["married", "Married"], ["partner", "Living with a partner"], ["single", "Single"]] as const

const meta = {
  component: RadioGroup,
  args: { "aria-label": "Marital status" },
  render: (args) => (
    <RadioGroup {...args}>
      {OPTIONS.map(([v, l]) => (
        <label key={v} className="flex items-center gap-2 text-sm text-card-foreground">
          <RadioGroupItem value={v} />
          {l}
        </label>
      ))}
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Unselected: Story = {}
export const Selected: Story = { args: { defaultValue: "married" } }
export const Disabled: Story = { args: { defaultValue: "married", disabled: true } }
export const Invalid: Story = {
  name: "Error (aria-invalid)",
  render: () => (
    <RadioGroup aria-label="Marital status">
      {OPTIONS.slice(0, 2).map(([v, l]) => (
        <label key={v} className="flex items-center gap-2 text-sm text-card-foreground">
          <RadioGroupItem value={v} aria-invalid />
          {l}
        </label>
      ))}
    </RadioGroup>
  ),
}
