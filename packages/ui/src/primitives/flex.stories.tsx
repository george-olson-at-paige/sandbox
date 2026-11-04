import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "../components/display/eyebrow"
import { Flex } from "./flex"
import { Placeholder } from "../stories/placeholder"
import { Stack } from "./stack"

/* Flex (R4-10): the general row/column primitive. Prefer the named ones: Stack (a column),
   Inline (a wrapping row), Grid (equal columns), Split (content plus actions). Stack and Inline
   are presets of Flex. */
const meta = {
  component: Flex,
  tags: ["r4-10"],
  args: { direction: "row", gap: 3, align: "stretch", justify: "start", wrap: false },
  argTypes: {
    direction: { control: "inline-radio", options: ["row", "column"] },
    gap: { control: "select", options: [0, 1, 2, 3, 4, 6, 8, 12] },
    align: { control: "select", options: ["stretch", "start", "center", "end", "baseline"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "**Reach for the named primitives first.** Stack is a column, Inline a wrapping row, Grid equal columns, Split content plus actions that drop under it; they say what the layout is for, and Stack and Inline are presets of Flex. Use Flex for a row or column none of them covers.",
      },
    },
  },
  render: (args) => (
    <Flex {...args} className="rounded-lg border border-dashed p-3">
      <Placeholder size="sm" label="One" className="w-32" />
      <Placeholder size="md" label="Two" className="w-40" />
      <Placeholder size="sm" label="Three" className="w-24" />
    </Flex>
  ),
} satisfies Meta<typeof Flex>

export default meta
type Story = StoryObj<typeof meta>

export const Row: Story = {}
export const Column: Story = { args: { direction: "column", align: "start" } }
export const Between: Story = { name: "Row, justify between, centred", args: { justify: "between", align: "center" } }
export const CentredColumn: Story = {
  name: "Column centred on both axes",
  args: { direction: "column", align: "center", justify: "center" },
  render: (args) => (
    <Flex {...args} className="h-64 rounded-lg border border-dashed p-3">
      <Placeholder size="sm" label="Icon" className="w-16" />
      <Placeholder size="sm" label="A short message" className="w-56" />
    </Flex>
  ),
}
export const Presets: Story = {
  name: "Stack and Inline are presets",
  render: () => (
    <Stack gap={6}>
      <Stack gap={2}>
        <Eyebrow>Stack = Flex direction column, children stretch</Eyebrow>
        <Stack gap={2}>
          <Placeholder size="xs" label="One" />
          <Placeholder size="xs" label="Two" />
        </Stack>
      </Stack>
      <Stack gap={2}>
        <Eyebrow>Inline = Flex row, wrapping, centred</Eyebrow>
        <Flex direction="row" wrap align="center" gap={3}>
          {["One", "Two", "Three", "Four"].map((l) => <Placeholder key={l} size="xs" label={l} className="w-28" />)}
        </Flex>
      </Stack>
    </Stack>
  ),
}
