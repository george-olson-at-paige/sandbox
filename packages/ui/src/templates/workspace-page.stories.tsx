import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { WorkspacePage } from "./workspace-page"

/* Level 1 (LEVELS.md): WorkspacePage's frame, built from placeholders (VIEWS-PLAN.md §1a, D-V1
   decided by George 2026-11-04). Each placeholder carries its region's job, so the Wireframe
   is also the map of what goes where. Below md (768) the frame is two screens: Phone · list and
   Phone · record. From md both columns show and each scrolls on its own. */
const meta = {
  component: WorkspacePage,
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "views-plan"],
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    listLabel: "People",
    stageLabel: "Pick someone",
    band: <Placeholder size="sm" label="Band" detail="Name the View and its one way in: icon, title, lead, count, Add" measure />,
    list: (
      <div className="flex flex-col gap-3 p-4">
        <Placeholder size="sm" label="Search + filter button" />
        <Placeholder size="xs" label="Area chips" />
        <Placeholder size="lg" label="List" detail="Find and choose: groups and rows. A row is a link, never a form." measure />
      </div>
    ),
    stage: <Placeholder size="xl" label="Pick panel" detail="Nothing open: what to choose" measure />,
  },
} satisfies Meta<typeof WorkspacePage>

export default meta
type Story = StoryObj<typeof meta>

/** Every region as a placeholder labelled with its job; a record open, so the stage bar shows. At xl. */
export const Wireframe: Story = {
  args: {
    open: true,
    stageLabel: "Jordan Lee",
    stageBar: <Placeholder size="sm" label="Stage bar" detail="Which record is open, and what can be done to all of it" measure />,
    stage: <Placeholder size="xl" label="Record card" detail="The record itself: what the owner shares (max 720, centred)" measure />,
    back: <Placeholder size="xs" label="Back (below md)" />,
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** Nothing open: no stage bar, the Pick panel on the stage. At lg (list 360). */
export const NothingOpen: Story = {
  name: "Nothing open",
  globals: { viewport: { value: "w1024", isRotated: false } },
}

/** At md (768): the list narrows to 300; the stage keeps the rest. */
export const AtMd: Story = {
  tags: ["!autodocs"],
  name: "At md · 768",
  args: Wireframe.args,
  globals: { viewport: { value: "w768", isRotated: false } },
}

/** Below md, nothing open: the band and the list are the screen; the stage waits. */
export const PhoneList: Story = {
  tags: ["!autodocs"],
  name: "Phone · list",
  globals: { viewport: { value: "w375", isRotated: false } },
}

/** Below md, a record open: the stage is the screen, Back over it, no band. */
export const PhoneRecord: Story = {
  tags: ["!autodocs"],
  name: "Phone · record",
  args: Wireframe.args,
  globals: { viewport: { value: "w375", isRotated: false } },
}

/** A long list and a long record: each column scrolls on its own; the stage bar stays at the top. */
export const LongContent: Story = {
  name: "Long list · long record",
  args: {
    ...Wireframe.args,
    list: (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 14 }, (_, i) => (
          <Placeholder key={i} size="sm" label={`Row ${i + 1}`} />
        ))}
      </div>
    ),
    stage: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Placeholder key={i} size="lg" label={`Record section ${i + 1}`} />
        ))}
      </div>
    ),
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
}
