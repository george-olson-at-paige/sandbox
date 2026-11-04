import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "../components/display/eyebrow"
import { Grid } from "./grid"
import { Placeholder } from "../stories/placeholder"
import { Stack } from "./stack"

/* Grid (R1-29): equal columns, fixed per breakpoint or auto-fit by a minimum item width.
   Resize the canvas (or use the viewport toolbar) to see the columns change. */
const meta = {
  component: Grid,
  tags: ["r1-29"],
  args: { columns: { base: 1, sm: 2, lg: 3 }, gap: "grid" },
  argTypes: {
    gap: { control: "select", options: ["grid", "column", 2, 3, 4, 6, 8] },
  },
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const cells = (n: number) => Array.from({ length: n }, (_, i) => <Placeholder key={i} size="md" label={`Tile ${i + 1}`} />)

export const ColumnsPerBreakpoint: Story = {
  name: "Columns per breakpoint (1 · sm 2 · lg 3)",
  render: (args) => <Grid {...args}>{cells(6)}</Grid>,
}

export const FixedColumns: Story = {
  name: "Fixed column count",
  args: { columns: 2 },
  render: (args) => <Grid {...args}>{cells(4)}</Grid>,
}

export const AutoFit: Story = {
  name: "Auto-fit by minimum item width",
  render: () => (
    <Stack gap={8}>
      {(["xs", "sm", "md", "lg"] as const).map((m) => (
        <Stack key={m} gap={2}>
          <Eyebrow>minItemWidth {m}</Eyebrow>
          <Grid minItemWidth={m}>{cells(5)}</Grid>
        </Stack>
      ))}
    </Stack>
  ),
}

export const NarrowContainer: Story = {
  name: "Auto-fit in a narrow container",
  render: () => (
    <Stack gap={6}>
      {[["40rem", "max-w-2xl"], ["20rem: one column", "max-w-80"]].map(([label, w]) => (
        <Stack key={w} gap={2} className={w}>
          <Eyebrow>{label}</Eyebrow>
          <div className="rounded-lg border p-4">
            <Grid minItemWidth="sm">{cells(4)}</Grid>
          </div>
        </Stack>
      ))}
    </Stack>
  ),
}
