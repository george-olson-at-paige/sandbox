import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { FileTextIcon, MailIcon, UsersIcon } from "lucide-react"

import { Button } from "../actions/button"
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTime,
  TimelineTitle,
  type TimelineEntry,
  type TimelineOpen,
} from "./timeline"

/* Timeline (R20-18): a vertical rail of events (ReUI's `timeline`, MIT) with groups that fold
   (the shape George asked for, from the description of Rocket UI's). `items` is the data form;
   the parts (TimelineItem, TimelineIndicator, …) compose the same thing by hand. */
const meta = {
  tags: ["r20-18"],
  component: Timeline,
  decorators: [(S) => <div className="max-w-md"><S /></div>],
  argTypes: {
    rail: { control: "inline-radio", options: ["start", "end"] },
    items: { control: false },
    open: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

const ORDER: TimelineEntry[] = [
  { id: "placed", title: "Order placed", description: "We got your order.", time: "2026-10-28", status: "done" },
  { id: "paid", title: "Payment confirmed", description: "Charged to the card ending 4242.", time: "2026-10-28", status: "done" },
  { id: "packing", title: "Being packed", description: "It leaves the warehouse tomorrow.", time: "2026-10-30", status: "working" },
  { id: "delivery", title: "Delivery", description: "Expected the week of November 2.", status: "waiting" },
]

const STEPS: TimelineEntry[] = [
  { id: "welcome", title: "Welcome", description: "You made an account.", time: "2026-10-20", status: "done" },
  {
    id: "getting-started",
    title: "Getting started",
    description: "Three things to do first.",
    defaultOpen: true,
    children: [
      { id: "contact", title: "Add a contact", time: "2026-10-21", status: "done" },
      { id: "document", title: "Upload a document", time: "2026-10-22", status: "done" },
      { id: "letter", title: "Write a letter", status: "working" },
    ],
  },
  {
    id: "later",
    title: "When you are ready",
    description: "Nothing here is urgent.",
    children: [
      { id: "trusted", title: "Choose who can open your Vault", status: "waiting" },
      { id: "review", title: "Review everything once a year", status: "waiting" },
    ],
  },
]

/** The history of an order: four steps, the third is the current one. Each dot is a status mark and says its word to a screen reader. */
export const OrderStatus: Story = {
  name: "Order status",
  args: { items: ORDER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("list")).toBeInTheDocument()
    await expect(canvas.getAllByRole("listitem")).toHaveLength(ORDER.length)
    // One current step: the one that is being worked on.
    const current = canvasElement.querySelectorAll('[aria-current="step"]')
    await expect(current).toHaveLength(1)
    await expect(current[0]).toHaveTextContent("Being packed")
    // Each status mark is named; the dated steps have a machine-readable time.
    await expect(canvas.getAllByRole("img", { name: "Done" })).toHaveLength(2)
    await expect(canvas.getByRole("img", { name: "In progress" })).toBeInTheDocument()
    const times = canvasElement.querySelectorAll("time")
    await expect(times).toHaveLength(3)
    await expect(times[0]).toHaveAttribute("datetime", "2026-10-28")
    await expect(times[0]).toHaveTextContent("Oct 28, 2026")
    // No groups, so nothing to toggle.
    await expect(canvas.queryAllByRole("button")).toHaveLength(0)
  },
}

/** Two groups under their own toggles: one starts open, the other folded. A toggle shows and hides its events and says which with `aria-expanded`. */
export const WithGroups: Story = {
  name: "With groups",
  args: { items: STEPS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const started = canvas.getByRole("button", { name: "Getting started" })
    const later = canvas.getByRole("button", { name: "When you are ready" })
    await expect(started).toHaveAttribute("aria-expanded", "true")
    await expect(later).toHaveAttribute("aria-expanded", "false")
    await expect(started).toHaveAttribute("aria-controls")
    await expect(canvas.getByText("Add a contact")).toBeVisible()
    await expect(canvas.queryByText("Choose who can open your Vault")).not.toBeInTheDocument()
    // The group's own line stays when it is folded.
    await expect(canvas.getByText("Nothing here is urgent.")).toBeVisible()

    await userEvent.click(later)
    await expect(later).toHaveAttribute("aria-expanded", "true")
    await expect(await canvas.findByText("Choose who can open your Vault")).toBeVisible()

    await userEvent.click(started)
    await expect(started).toHaveAttribute("aria-expanded", "false")
    await waitFor(() => expect(canvas.queryByText("Add a contact")).not.toBeInTheDocument())

    // A group nests its events in a list of their own.
    await expect(canvas.getAllByRole("list").length).toBeGreaterThan(1)
  },
}

function ControlledDemo({ onOpenChange }: { onOpenChange?: (id: string, open: boolean) => void }) {
  const [open, setOpen] = useState<TimelineOpen>({ "getting-started": true, later: false })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setOpen({ "getting-started": true, later: true })}>Open all</Button>
        <Button size="sm" onClick={() => setOpen({ "getting-started": false, later: false })}>Close all</Button>
      </div>
      <Timeline
        items={STEPS}
        open={open}
        onOpenChange={(id, next) => {
          setOpen((prev) => ({ ...prev, [id]: next }))
          onOpenChange?.(id, next)
        }}
      />
      <p data-testid="open-readout" className="text-xs text-muted-foreground">
        Open: {Object.keys(open).filter((id) => open[id]).join(", ") || "none"}
      </p>
    </div>
  )
}

/** The caller holds the open state: `open` by group id and `onOpenChange(id, open)`. The buttons above the list open and close the groups from outside. */
export const Controlled: Story = {
  args: { onOpenChange: fn() },
  render: (args) => <ControlledDemo onOpenChange={args.onOpenChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const readout = canvas.getByTestId("open-readout")
    await expect(readout).toHaveTextContent("Open: getting-started")

    await userEvent.click(canvas.getByRole("button", { name: "When you are ready" }))
    await expect(args.onOpenChange).toHaveBeenCalledWith("later", true)
    await expect(readout).toHaveTextContent("Open: getting-started, later")
    await expect(canvas.getByRole("button", { name: "When you are ready" })).toHaveAttribute("aria-expanded", "true")

    // From outside: the callback is for the timeline's own toggles, so it is not called.
    const calls = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length
    await userEvent.click(canvas.getByRole("button", { name: "Close all" }))
    await expect(canvas.getByRole("button", { name: "Getting started" })).toHaveAttribute("aria-expanded", "false")
    await expect(canvas.getByRole("button", { name: "When you are ready" })).toHaveAttribute("aria-expanded", "false")
    await expect((args.onOpenChange as ReturnType<typeof fn>).mock.calls.length).toBe(calls)

    await userEvent.click(canvas.getByRole("button", { name: "Getting started" }))
    await expect(args.onOpenChange).toHaveBeenLastCalledWith("getting-started", true)
    await expect(readout).toHaveTextContent("Open: getting-started")
  },
}

/** `collapsible={false}`: every group is open, its title is plain text, and nothing can be toggled. For a printout or a short list. */
export const NotCollapsible: Story = {
  name: "Not collapsible",
  args: { items: STEPS, collapsible: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole("button")).toHaveLength(0)
    await expect(canvas.getByText("Getting started")).toBeVisible()
    await expect(canvas.getByText("Add a contact")).toBeVisible()
    await expect(canvas.getByText("Choose who can open your Vault")).toBeVisible()
  },
}

/** `rail="end"`: the rail and dots on the right, the text aligned to them. */
export const RightSide: Story = {
  name: "Right side",
  args: { items: STEPS, rail: "end" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="timeline"]')!
    await expect(root).toHaveAttribute("data-rail", "end")
    const dot = canvasElement.querySelector('[data-slot="timeline-indicator"]')!
    await expect(Math.round(dot.getBoundingClientRect().right)).toBe(Math.round(root.getBoundingClientRect().right))
  },
}

/** At 375px the text takes the width the rail leaves; long titles and details wrap, they never push the rail. */
export const Phone: Story = {
  args: { items: STEPS },
  globals: { viewport: { value: "w375" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole("listitem").length).toBeGreaterThan(0)
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** The parts by hand: a plain dot, an icon and a status mark, a time with your own words, and a content block with no description. */
export const Composed: Story = {
  render: () => (
    <Timeline aria-label="Activity">
      <TimelineItem>
        <TimelineIndicator />
        <TimelineSeparator />
        <TimelineContent>
          <TimelineTitle>Plain dot</TimelineTitle>
          <TimelineTime value="2026-10-24" />
          <TimelineDescription>No status and no icon.</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineIndicator icon={<MailIcon aria-hidden />} />
        <TimelineSeparator />
        <TimelineContent>
          <TimelineTitle>Letter sent to Ana Torres</TimelineTitle>
          <TimelineTime>Yesterday</TimelineTime>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineIndicator icon={<UsersIcon aria-hidden />} />
        <TimelineSeparator />
        <TimelineContent>
          <TimelineTitle>Daniel Reyes can now open your Vault</TimelineTitle>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem current>
        <TimelineIndicator status="working" />
        <TimelineSeparator />
        <TimelineContent>
          <TimelineTitle>Reading your document</TimelineTitle>
          <TimelineDescription>
            <span className="inline-flex items-center gap-1"><FileTextIcon aria-hidden className="size-icon-sm" />Insurance policy.pdf</span>
          </TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("list", { name: "Activity" })).toBeInTheDocument()
    await expect(canvas.getAllByRole("listitem")).toHaveLength(4)
    // The last item draws no rail below it.
    const items = canvasElement.querySelectorAll('[data-slot="timeline-item"]')
    const lastRail = items[items.length - 1].querySelector('[data-slot="timeline-separator"]')!
    await expect(getComputedStyle(lastRail).display).toBe("none")
    await expect(canvasElement.querySelectorAll('[data-slot="timeline-indicator"]')).toHaveLength(4)
  },
}
