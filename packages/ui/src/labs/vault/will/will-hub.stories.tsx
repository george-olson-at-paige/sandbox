import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import { SIGNING_STEPS, STATES, WILL_COPY, WILL_PEOPLE } from "./fixtures"
import { MAYA_ANSWERS } from "./will-builder.stories"
import { WillHub } from "./will-hub"

/* Level 0 (WILL-PLAN.md §2): Your will, the hub. The will itself as one card in each state, so
   it never reads as an empty list: not started (the outline), a draft (how far, what's
   answered), finalized (open it, download, update; what it says; how to sign). */
const meta = {
  component: WillHub,
  tags: ["level-0", "will-plan"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    will: { kind: "none" },
    people: WILL_PEOPLE,
    states: STATES,
    signing: SIGNING_STEPS,
    copy: WILL_COPY,
    hrefs: { builder: "#builder", document: "#documents?id=will", download: "#download", update: "#builder?new" },
    linkAs: StubLink,
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof WillHub>

export default meta
type Story = StoryObj<typeof meta>

/** Not started: the outline is the content, and Start. */
export const NotStarted: Story = {}

/** A draft: how far, Continue, what's answered so far. */
export const Draft: Story = {
  args: {
    will: {
      kind: "draft",
      step: 5,
      total: 8,
      saved: "Oct 1",
      answers: { ...MAYA_ANSWERS, inherit: { plan: "", shares: [], backups: [] }, gifts: [], leftOut: { people: [] } },
    },
  },
}

/** Finalized, the only one: open it, download, update; what it says; how to sign. */
export const Finalized: Story = {
  args: {
    will: {
      kind: "final",
      answers: MAYA_ANSWERS,
      finalized: "Oct 2, 2026",
      state: "California",
      versions: [{ id: "v2", label: "Oct 2, 2026", href: "#v2" }],
    },
  },
}

/** Finalized, with an earlier version under it. */
export const WithVersions: Story = {
  name: "Finalized · earlier versions",
  args: {
    will: {
      kind: "final",
      answers: MAYA_ANSWERS,
      finalized: "Oct 2, 2026",
      state: "California",
      versions: [
        { id: "v2", label: "Oct 2, 2026", href: "#v2" },
        { id: "v1", label: "Finalized Mar 9, 2024", href: "#v1" },
      ],
    },
  },
}

/** Phone width. */
export const PhoneFinalized: Story = {
  tags: ["!autodocs"],
  name: "Phone · finalized",
  args: { will: { kind: "final", answers: MAYA_ANSWERS, finalized: "Oct 2, 2026", state: "California", versions: [] } },
  globals: { viewport: { value: "w375", isRotated: false } },
}
