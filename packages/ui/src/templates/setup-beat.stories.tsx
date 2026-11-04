import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { PaigeLogo, StoryAppHeader, StubLink } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { SetupBeat } from "./setup-beat"

/* SetupBeat: top bar · Page with one centred column (focused 768 / wide 960) · PageIntro ·
   body · FlowFooter. The top bar includes the StepRail by default (R4-06): logo, step, total
   and the exit link; `topBar` replaces the bar. */
const meta = {
  tags: ["r4-06", "r6-04", "gaps-88"],
  component: SetupBeat,
  parameters: { layout: "fullscreen" },
  args: {
    logo: <PaigeLogo />,
    step: 2,
    total: 7,
    exit: (
      <Button asChild variant="quiet" size="inline">
        <StubLink href="#vault">Save and finish later</StubLink>
      </Button>
    ),
    eyebrow: "Eyebrow",
    title: "The beat’s question goes here",
    lede: "One or two sentences that say why we ask.",
    children: <Placeholder size="xl" label="Body (fields or choice cards)" />,
    footer: <Placeholder size="md" label="FlowFooter" className="mt-8" />,
    width: "focused",
  },
  argTypes: { width: { control: "inline-radio", options: ["focused", "wide"] } },
} satisfies Meta<typeof SetupBeat>

export default meta
type Story = StoryObj<typeof meta>

export const Focused: Story = { name: "Focused (768)" }
export const Wide: Story = { name: "Wide (960)", args: { width: "wide" } }
export const FirstStep: Story = { name: "Step 1 of 7 (the step rail)", args: { step: 1 } }
export const LastStep: Story = { name: "Step 7 of 7", args: { step: 7 } }
export const CustomTopBar: Story = {
  name: "topBar replaces the bar",
  args: { logo: undefined, step: undefined, total: undefined, exit: undefined, topBar: <StoryAppHeader /> } as never,
}
export const Phone: Story = {
  name: "Phone (375): rail on its own row",
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375", isRotated: false } },
}
