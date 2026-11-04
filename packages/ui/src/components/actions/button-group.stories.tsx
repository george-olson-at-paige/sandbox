import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  ArchiveIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  ForwardIcon,
  HeartIcon,
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  ReplyIcon,
  RotateCcwIcon,
  UsersIcon,
} from "lucide-react"

import { Tooltip } from "../overlays/tooltip"
import { Button } from "./button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group"
import { DropdownMenu } from "./dropdown-menu"

/* ButtonGroup (R20-10): Buttons joined side by side or stacked, for actions that belong
   together: an action and its count, an action and its menu, a column of icon tools. Nothing in
   it holds a state; a set of choices that stay pressed is ToggleGroup. `label` names the group
   for assistive tech and is required. */
const meta = {
  tags: ["r20-10"],
  component: ButtonGroup,
  args: { label: "Actions", children: null },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    children: { control: false },
  },
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

/** The like button: an action, then a count in a cell of its own. */
export const SplitActionAndCount: Story = {
  name: "Split · action and count",
  args: { label: "Like" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" size="sm" icon={<HeartIcon />}>
        Like
      </Button>
      <ButtonGroupText>1.2K</ButtonGroupText>
    </ButtonGroup>
  ),
}

/** The main action, and a button beside it that opens the others. Entries are actions, so each has an icon (R20-04). */
export const SplitActionAndMenu: Story = {
  name: "Split · action and menu",
  args: { label: "Save" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button size="sm">Save</Button>
      <ButtonGroupSeparator />
      <DropdownMenu
        modal={false}
        trigger={<Button size="icon" icon={<ChevronDownIcon />} aria-label="More save options" />}
        items={[
          { kind: "item", label: "Save as draft", icon: <FileTextIcon />, onSelect: () => {} },
          { kind: "item", label: "Save a copy", icon: <CopyIcon />, onSelect: () => {} },
          { kind: "item", label: "Save and share", icon: <UsersIcon />, onSelect: () => {} },
        ]}
      />
    </ButtonGroup>
  ),
  // The menu opens end-aligned under the chevron, so the group sits clear of the left edge.
  decorators: [(S) => <div className="flex min-h-48 items-start pl-60"><S /></div>],
}

/** A column of icon tools, each named by its aria-label and a Tooltip. Ghost Buttons draw no edge of their own, so the group is given a framed pill (className), as DagFrame's zoom controls are. */
export const VerticalIconToolbar: Story = {
  name: "Vertical · icon toolbar",
  args: { label: "Zoom", orientation: "vertical", className: "rounded-full border bg-card shadow-card" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Tooltip content="Zoom in" side="right">
        <Button variant="ghost" size="icon" aria-label="Zoom in" icon={<PlusIcon aria-hidden />} />
      </Tooltip>
      <Tooltip content="Zoom out" side="right">
        <Button variant="ghost" size="icon" aria-label="Zoom out" icon={<MinusIcon aria-hidden />} />
      </Tooltip>
      <Tooltip content="Fit to view" side="right">
        <Button variant="ghost" size="icon" aria-label="Fit" icon={<MaximizeIcon aria-hidden />} />
      </Tooltip>
      <Tooltip content="Reset the view" side="right">
        <Button variant="ghost" size="icon" aria-label="Reset" icon={<RotateCcwIcon aria-hidden />} />
      </Tooltip>
    </ButtonGroup>
  ),
}

/** Secondary Buttons joined: the shared border is drawn once, the inner corners are square. */
export const Variants: Story = {
  name: "Variants · secondary and ghost",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup label="Message actions">
        <Button variant="secondary" size="sm" icon={<ReplyIcon />}>Reply</Button>
        <Button variant="secondary" size="sm" icon={<ForwardIcon />}>Forward</Button>
        <Button variant="secondary" size="sm" icon={<ArchiveIcon />}>Archive</Button>
      </ButtonGroup>
      <ButtonGroup label="Message actions, bare">
        <Button variant="ghost" size="sm" icon={<ReplyIcon />}>Reply</Button>
        <Button variant="ghost" size="sm" icon={<ForwardIcon />}>Forward</Button>
        <Button variant="ghost" size="sm" icon={<ArchiveIcon />}>Archive</Button>
      </ButtonGroup>
    </div>
  ),
}

/** Tab to the second Button: its outline is solid and it sits above its neighbours, so the ring is whole. */
export const FocusRingStaysWhole: Story = {
  name: "Focus · ring stays whole",
  tags: ["play-fn"],
  args: { label: "Message actions" },
  render: (args) => (
    <div className="p-4">
      <ButtonGroup {...args}>
        <Button variant="secondary" size="sm" icon={<ReplyIcon />}>Reply</Button>
        <Button variant="secondary" size="sm" icon={<ForwardIcon />}>Forward</Button>
        <Button variant="secondary" size="sm" icon={<ArchiveIcon />}>Archive</Button>
      </ButtonGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("group", { name: "Message actions" })).toBeInTheDocument()
    await userEvent.tab()
    await userEvent.tab()
    const second = canvas.getByRole("button", { name: "Forward" })
    await expect(second).toHaveFocus()
    const style = getComputedStyle(second)
    await expect(style.outlineStyle).toBe("solid")
    await expect(style.zIndex).not.toBe("auto")
  },
}
