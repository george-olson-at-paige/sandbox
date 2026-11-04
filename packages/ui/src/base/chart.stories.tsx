import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./chart"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Charts/Chart (through LazyChart). */
const meta = { component: ChartContainer } satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

const config = { signups: { label: "Signups", color: "var(--chart-1)" } } satisfies ChartConfig
const data = [
  { month: "Jan", signups: 120 },
  { month: "Feb", signups: 164 },
  { month: "Mar", signups: 141 },
  { month: "Apr", signups: 190 },
]

export const Default: Story = {
  args: { config, children: <></> },
  render: () => (
    <ChartContainer config={config} className="h-64 w-full max-w-xl aspect-auto">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
}
