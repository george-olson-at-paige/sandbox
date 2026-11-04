import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { Eyebrow } from "../components/display/eyebrow"
import { Placeholder } from "../stories/placeholder"
import { Split } from "./split"
import { Stack } from "./stack"

/* Split (R1-06, R1-29): content plus an aside (actions). The aside follows the content and
   drops under it when the row is narrower than the content's minimum plus the aside. */
const meta = {
  component: Split,
  tags: ["r1-06", "r1-29", "r2-15", "gaps-86"],
  args: { gap: 3, align: "center", contentMin: "md", aside: null, children: null },
  argTypes: {
    gap: { control: "select", options: [2, 3, 4, 6, 8] },
    align: { control: "select", options: ["start", "center", "end"] },
    contentMin: { control: "select", options: ["sm", "md", "lg"] },
    aside: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Split>

export default meta
type Story = StoryObj<typeof meta>

const actions = (
  <>
    <Button size="sm">Primary</Button>
    <Button size="sm" variant="secondary">Secondary</Button>
  </>
)

export const WideAndNarrow: Story = {
  name: "Content + actions, wide and narrow",
  render: (args) => (
    <Stack gap={8}>
      {[["Wide: one row", "max-w-3xl"], ["Narrow: the actions drop under the content", "max-w-sm"]].map(([label, w]) => (
        <Stack key={w} gap={2} className={w}>
          <Eyebrow>{label}</Eyebrow>
          <div className="rounded-lg border p-4">
            <Split {...args} aside={actions}>
              <Placeholder size="sm" label="Content" />
            </Split>
          </div>
        </Stack>
      ))}
    </Stack>
  ),
}

const longActions = (
  <>
    <Button size="sm">Name a guardian for Elena</Button>
    <Button size="sm" variant="secondary">Add a document for them</Button>
    <Button size="sm" variant="quiet" underline>Not applicable</Button>
  </>
)

/** AsideMax half: long actions wrap within half the row. */
export const AsideMaxHalf: Story = {
  name: "asideMax half",
  render: (args) => (
    <Stack gap={6} className="max-w-3xl">
      {(["none", "half"] as const).map((m) => (
        <Stack key={m} gap={2}>
          <Eyebrow>asideMax {m}</Eyebrow>
          <div className="rounded-lg border p-4">
            <Split {...args} asideMax={m} align="start" aside={longActions}>
              <Placeholder size="sm" label="Row text" />
            </Split>
          </div>
        </Stack>
      ))}
    </Stack>
  ),
}

export const ContentMin: Story = {
  name: "contentMin: where the aside drops",
  render: (args) => (
    <Stack gap={6} className="max-w-lg">
      {(["sm", "md", "lg"] as const).map((m) => (
        <Stack key={m} gap={2}>
          <Eyebrow>contentMin {m}</Eyebrow>
          <div className="rounded-lg border p-4">
            <Split {...args} contentMin={m} aside={actions}>
              <Placeholder size="sm" label="Content" />
            </Split>
          </div>
        </Stack>
      ))}
    </Stack>
  ),
}

export const NoAside: Story = {
  name: "Without an aside",
  render: (args) => (
    <div className="max-w-md rounded-lg border p-4">
      <Split {...args} aside={undefined}>
        <Placeholder size="sm" label="Content only" />
      </Split>
    </div>
  ),
}
