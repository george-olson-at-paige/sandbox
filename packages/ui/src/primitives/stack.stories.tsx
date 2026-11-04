import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "../components/display/eyebrow"
import { Placeholder } from "../stories/placeholder"
import { Stack } from "./stack"

/* Stack (R1-05): vertical rhythm with gaps from the spacing scale. */
const GAPS = [1, 2, 3, 4, 6, 8, 12] as const

const meta = {
  component: Stack,
  args: { gap: 4, align: "stretch" },
  argTypes: {
    gap: { control: "select", options: [0, ...GAPS] },
    align: { control: "select", options: ["stretch", "start", "center"] },
  },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
  render: (args) => (
    <Stack {...args}>
      <Placeholder size="sm" label="One" className={args.align === "stretch" ? undefined : "w-40"} />
      <Placeholder size="sm" label="Two" className={args.align === "stretch" ? undefined : "w-56"} />
      <Placeholder size="sm" label="Three" className={args.align === "stretch" ? undefined : "w-32"} />
    </Stack>
  ),
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Gap scale (4 · 8 · 12 · 16 · 24 · 32 · 48) */
export const GapScale: Story = {
  name: "Gap scale",
  render: () => (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
      {GAPS.map((g) => (
        <Stack key={g} gap={2}>
          <Eyebrow>gap {g} · {g * 4}px</Eyebrow>
          <Stack gap={g}>
            <Placeholder size="xs" />
            <Placeholder size="xs" />
            <Placeholder size="xs" />
          </Stack>
        </Stack>
      ))}
    </div>
  ),
}

export const Align: Story = { args: { align: "start" } }
