import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "../components/display/badge"
import { Eyebrow } from "../components/display/eyebrow"
import { Inline } from "./inline"
import { Stack } from "./stack"

/* Inline (R1-05, R1-29): a horizontal row. Wraps by default; wrap={false} keeps one line. */
const ROLES = ["Guardian", "Executor", "Delegate", "Trustee", "Beneficiary", "Emergency contact"]

const meta = {
  component: Inline,
  tags: ["r1-05", "r1-29"],
  args: { gap: 3, align: "center", justify: "start", wrap: true },
  argTypes: {
    gap: { control: "select", options: [1, 2, 3, 4, 6, 8] },
    align: { control: "select", options: ["start", "center", "baseline", "end"] },
    justify: { control: "select", options: ["start", "between", "end"] },
  },
} satisfies Meta<typeof Inline>

export default meta
type Story = StoryObj<typeof meta>

export const WrappingRow: Story = {
  name: "Wrapping row",
  render: (args) => (
    <div className="max-w-md">
      <Inline {...args}>
        {ROLES.map((t) => (
          <Badge key={t} tone="neutral" appearance="outline">{t}</Badge>
        ))}
      </Inline>
    </div>
  ),
}

export const WrapAtNarrowWidths: Story = {
  name: "Wrap vs no wrap at narrow widths",
  render: (args) => (
    <Stack gap={8}>
      {[["Wide", "max-w-3xl"], ["Narrow (20rem): wraps onto a second line", "max-w-80"]].map(([label, w]) => (
        <Stack key={w} gap={2} className={w}>
          <Eyebrow>{label}</Eyebrow>
          <div className="rounded-lg border p-4">
            <Inline {...args}>
              {ROLES.map((t) => (
                <Badge key={t} tone="neutral" appearance="outline">{t}</Badge>
              ))}
            </Inline>
          </div>
        </Stack>
      ))}
      <Stack gap={2} className="max-w-80">
        <Eyebrow>Narrow, wrap=false: one line, overflow clipped</Eyebrow>
        <div className="overflow-hidden rounded-lg border p-4">
          <Inline {...args} wrap={false}>
            {ROLES.map((t) => (
              <Badge key={t} tone="neutral" appearance="outline">{t}</Badge>
            ))}
          </Inline>
        </div>
      </Stack>
    </Stack>
  ),
}

export const Baseline: Story = {
  name: "Baseline alignment",
  args: { align: "baseline" },
  render: (args) => (
    <Inline {...args}>
      <Eyebrow>Browse everything</Eyebrow>
      <span className="text-sm text-muted-foreground">Documents, people and passwords in one list</span>
    </Inline>
  ),
}
