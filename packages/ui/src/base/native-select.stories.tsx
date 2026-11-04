import type { Meta, StoryObj } from "@storybook/react-vite"

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/NativeSelect. */
const meta = {
  component: NativeSelect,
  args: { "aria-label": "Relationship", defaultValue: "" },
  argTypes: { size: { control: "select", options: ["default", "sm"] } },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="">Choose</NativeSelectOption>
      <NativeSelectOptGroup label="Family">
        <NativeSelectOption value="spouse">Spouse or partner</NativeSelectOption>
        <NativeSelectOption value="child">Child</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Small: Story = { args: { size: "sm", defaultValue: "child" } }
export const Invalid: Story = { args: { "aria-invalid": true } }
