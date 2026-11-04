import type { Meta, StoryObj } from "@storybook/react-vite"

import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

const meta = {
  component: ToggleGroup,
  args: { type: "single", defaultValue: "all", "aria-label": "Show" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="people">People</ToggleGroupItem>
      <ToggleGroupItem value="pets">Pets</ToggleGroupItem>
      <ToggleGroupItem value="orgs" disabled>Organisations</ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { args: { variant: "outline" } }
export const OutlineSpaced: Story = { name: "Outline · spaced", args: { variant: "outline", spacing: 2 } }
export const Small: Story = { args: { variant: "outline", size: "sm" } }
export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" variant="outline" defaultValue={["people", "pets"]} aria-label="Show">
      <ToggleGroupItem value="people">People</ToggleGroupItem>
      <ToggleGroupItem value="pets">Pets</ToggleGroupItem>
      <ToggleGroupItem value="orgs">Organisations</ToggleGroupItem>
    </ToggleGroup>
  ),
}
export const Chip: Story = {
  name: "Chip (not built)",
  tags: ["gaps-62"],
  render: () => <p className="text-sm text-muted-foreground">The collapse keeps a ToggleGroup <code>chip</code> variant (person picker); the spike has only upstream default and outline. See GAPS.md #62.</p>,
}
