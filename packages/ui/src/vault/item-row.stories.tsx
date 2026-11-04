import type { Meta, StoryObj } from "@storybook/react-vite"
import { PlusIcon } from "lucide-react"

import { StubLink } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { Badge } from "../components/display/badge"
import { Button } from "../components/actions/button"
import { FactItem } from "./fact-item"
import { ItemRow } from "./item-row"
import { Panel } from "../patterns/panel"

/* ItemRow (R2-34): the Row shell of every Area item. Bodies are the caller's. It is a row, not
   the panel (R3-18): every story sits inside a Panel, the container, as on the Area page. */
const meta = {
  component: ItemRow,
  tags: ["r2-34", "gaps-43", "r2-15", "gaps-86"],
  args: {
    status: "open",
    title: "A guardian for Elena",
    why: "If something happened to you both, a court would decide who raises Elena.",
    actions: <Button variant="link" size="inline" icon={<PlusIcon />}>Name a guardian</Button>,
  },
  argTypes: { status: { control: "select", options: ["open", "partial", "present", "declined"] } },
  parameters: {
    docs: {
      description: {
        component:
          "**A row, not a container.** The first story, *Anatomy*, names its parts. One item on an Area page: its status, title, why, a chip, actions, and its records below. Rows sit inside a Panel (the container, with the title and the dividers between rows); each story here renders one row in a Panel, and *Rows in a Panel* shows several together as the Area page does.",
      },
    },
  },
  decorators: [(S, { parameters }) => (
    <div className="max-w-3xl" data-area="family">
      {parameters.quiet ? (
        <Panel variant="quiet" title="More that belongs here" description="What else your family would look for here. None of it is waiting on you.">
          <S />
        </Panel>
      ) : (
        <Panel title="The essentials"><S /></Panel>
      )}
    </div>
  )],
} satisfies Meta<typeof ItemRow>

export default meta
type Story = StoryObj<typeof meta>

/* First on the docs page (R4-04): what a row is, before its states. A Panel with three rows,
   each part a labelled Placeholder. The status mark is not a slot (it comes from `status`), so
   it shows as the real StatusDot, one per item status. */
const part = (label: string, className = "") => <Placeholder as="span" size="xs" label={label} className={className} />
export const Anatomy: Story = {
  name: "Anatomy: rows in a Panel",
  tags: ["r4-04"],
  render: () => (
    <>
      {(["open", "partial", "present"] as const).map((status) => (
        <ItemRow
          key={status}
          status={status}
          title={part(`Title (status: ${status})`, "w-64")}
          why={part("Why", "mt-1 w-80")}
          chip={part("Chip", "w-24")}
          actions={part("Actions", "w-28")}
        >
          {status === "present" && <Placeholder size="sm" label="Records (FactItems, a FactFieldGrid)" />}
        </ItemRow>
      ))}
    </>
  ),
}

export const Open: Story = {}
export const RowsInPanel: Story = {
  name: "Rows in a Panel (the Area page)",
  tags: ["r3-18"],
  render: () => (
    <>
      <ItemRow
        status="present"
        title="The people who depend on you"
        why="Who would need looking after."
        actions={<Button variant="link" size="inline">Change</Button>}
      >
        <FactItem kind="person" name="Elena Reyes" detail="Child · 9" href="#elena" linkAs={StubLink} />
        <FactItem kind="pet" name="Pepper" detail="Dog" href="#pepper" linkAs={StubLink} />
      </ItemRow>
      <ItemRow
        status="open"
        title="A guardian for Elena"
        why="If something happened to you both, a court would decide who raises Elena."
        actions={<Button variant="link" size="inline" icon={<PlusIcon />}>Name a guardian</Button>}
      />
      <ItemRow
        status="partial"
        title="Life insurance"
        why="Your family would look here first."
        chip={<Badge tone="neutral" appearance="outline">1 of 2 policies</Badge>}
        actions={<Button variant="link" size="inline" icon={<PlusIcon />}>Add a policy</Button>}
      />
    </>
  ),
}
export const First: Story = {
  name: "First step (highlight + eyebrow)",
  args: { highlight: true, eyebrow: "Start here", actions: <Button size="sm">Name a guardian</Button> },
}
export const Partial: Story = {
  args: {
    status: "partial",
    title: "Life insurance",
    why: "Your family would look here first.",
    chip: <Badge tone="neutral" appearance="outline">1 of 2 policies</Badge>,
    actions: <Button variant="link" size="inline" icon={<PlusIcon />}>Add a policy</Button>,
  },
}
export const Present: Story = {
  name: "Present, with records",
  args: {
    status: "present",
    title: "The people who depend on you",
    why: "Who would need looking after.",
    actions: <Button variant="link" size="inline">Change</Button>,
    children: (
      <>
        <FactItem kind="person" name="Elena Reyes" detail="Child · 9" href="#elena" linkAs={StubLink} />
        <FactItem kind="pet" name="Pepper" detail="Dog" href="#pepper" linkAs={StubLink} />
      </>
    ),
  },
}
export const Declined: Story = {
  args: {
    status: "declined",
    title: "A guardian for your children",
    why: "You told us: No children under 18",
    actions: <Button variant="link" size="inline">Change</Button>,
  },
}
export const LongActions: Story = {
  name: "Long actions wrap within half the row",
  args: {
    actions: (
      <>
        <Button variant="link" size="inline" icon={<PlusIcon />}>Name a guardian for Elena</Button>
        <Button variant="quiet" size="inline" underline>Not applicable</Button>
      </>
    ),
  },
}
export const InQuietPanel: Story = {
  name: "Open rows in a quiet panel are lighter",
  tags: ["r2-13"],
  parameters: { quiet: true },
}
