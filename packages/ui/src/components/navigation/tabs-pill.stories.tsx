import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Tabs as TabsPrimitive } from "radix-ui"

import { StubLink } from "../../stories/fixtures"
import { Button } from "../actions/button"
import { tabsPillTriggerVariants } from "./tabs-pill-styles"
import { TabsPillList } from "./tabs-pill"

/* TabsPill: the Mode switch. TabsPillList (R1-26) draws one active background that slides to
   the current pill (200ms ease-out; a jump under reduced motion). The Mode switch is route
   navigation with aria-current (GAPS #24). In Storybook the links are stubbed: a click moves
   the current pill instead of navigating away (R1-15). */
const MODES = [["vault", "Vault"], ["messages", "Messages"], ["memories", "Memories"]] as const
type Mode = (typeof MODES)[number][0]

function ModeSwitch({ current: initial }: { current: Mode }) {
  const [current, setCurrent] = useState<Mode>(initial)
  return (
    <TabsPillList aria-label="Modes">
      {MODES.map(([key, label]) => (
        <StubLink
          key={key}
          href={`#${key}`}
          aria-current={current === key ? "page" : undefined}
          onClick={() => setCurrent(key)}
          className={tabsPillTriggerVariants()}
        >
          {label}
        </StubLink>
      ))}
    </TabsPillList>
  )
}

const meta = {
  component: ModeSwitch,
  args: { current: "vault" },
  argTypes: { current: { control: "select", options: MODES.map(([k]) => k) } },
} satisfies Meta<typeof ModeSwitch>

export default meta
type Story = StoryObj<typeof meta>

/** Mode switch · Vault current (click to slide) */
export const VaultCurrent: Story = { name: "Mode switch · Vault current" }
export const MessagesCurrent: Story = { name: "Mode switch · Messages current", args: { current: "messages" } }
export const Hover: Story = { parameters: { pseudo: { hover: true } } }

/* The thumb follows a pill whose label changes width (re-measured by a ResizeObserver). */
function ChangingLabels() {
  const [long, setLong] = useState(false)
  const [current, setCurrent] = useState<Mode>("messages")
  return (
    <div className="flex flex-col items-start gap-4">
      <TabsPillList aria-label="Modes">
        {MODES.map(([key, label]) => (
          <StubLink
            key={key}
            href={`#${key}`}
            aria-current={current === key ? "page" : undefined}
            onClick={() => setCurrent(key)}
            className={tabsPillTriggerVariants()}
          >
            {key === "vault" && long ? "Vault and everything in it" : label}
          </StubLink>
        ))}
      </TabsPillList>
      <Button variant="secondary" size="sm" onClick={() => setLong((l) => !l)}>
        {long ? "Shorten" : "Lengthen"} the Vault label
      </Button>
    </div>
  )
}

export const LabelChangesWidth: Story = {
  name: "Label changes width (thumb re-measures)",
  render: () => <ChangingLabels />,
}

/* Radix Tabs triggers (data-state="active"): focus a pill and use the arrow keys; Radix
   selects on focus, and the thumb follows. */
export const KeyboardArrows: Story = {
  name: "Radix Tabs · arrow keys move the thumb",
  render: () => (
    <TabsPrimitive.Root defaultValue="people" className="flex flex-col items-start gap-4">
      <TabsPrimitive.List asChild aria-label="Family sections">
        <TabsPillList as="div">
          {[["people", "People"], ["pets", "Pets"], ["guardians", "Guardians"]].map(([value, label]) => (
            <TabsPrimitive.Trigger key={value} value={value} className={tabsPillTriggerVariants()}>
              {label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPillList>
      </TabsPrimitive.List>
      {[["people", "Daniel and Elena"], ["pets", "Biscuit"], ["guardians", "Rosa Alvarez"]].map(([value, text]) => (
        <TabsPrimitive.Content key={value} value={value} className="text-sm text-card-foreground">
          {text}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  ),
}

/* R12-07: pills as toggle buttons (DagFrame's Graph/List): every pill shows the pointer, the
   pressed one too, because the cursor comes from the shared trigger style. */
function Toggles({ size = "md" }: { size?: "md" | "sm" }) {
  const [view, setView] = useState<"graph" | "list">("graph")
  return (
    <TabsPillList as="div" size={size} role="group" aria-label="Show as">
      {(["graph", "list"] as const).map((v) => (
        <button key={v} type="button" aria-pressed={view === v} data-state={view === v ? "active" : "inactive"} className={tabsPillTriggerVariants({ size })} onClick={() => setView(v)}>
          {v === "graph" ? "Graph" : "List"}
        </button>
      ))}
    </TabsPillList>
  )
}
/** As toggle buttons (pointer cursor on every pill) */
export const ToggleButtons: Story = {
  name: "As toggle buttons",
  tags: ["r12-07"],
  render: () => <Toggles />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    for (const name of ["Graph", "List"]) await expect(getComputedStyle(c.getByRole("button", { name })).cursor).toBe("pointer")
    await userEvent.click(c.getByRole("button", { name: "List" }))
    await expect(c.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true")
  },
}

/** Small (in a 32px row, as DagFrame's Graph/List) */
export const Small: Story = {
  name: "Small · 32px row",
  tags: ["r13-10"],
  render: () => (
    <div className="flex h-8 items-center gap-3 rounded-md border px-3">
      <span className="text-sm font-semibold">Nightly report</span>
      <Toggles size="sm" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: "Show as" })
    // The whole pill fits the 32px row with room: 28px.
    await expect(group.getBoundingClientRect().height).toBeLessThanOrEqual(28)
    await expect(getComputedStyle(within(group).getByRole("button", { name: "List" })).fontSize).toBe("12px")
  },
}
