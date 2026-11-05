import type { Meta, StoryObj } from "@storybook/react-vite"

import { PaigeLogo, StubLink } from "../../../stories/fixtures"
import { SIGNING_STEPS, STATES, WILL_COPY, WILL_PEOPLE } from "./fixtures"
import { WillBuilder, type WillAnswers } from "./will-builder"

/* Level 0 (WILL-PLAN.md §2): the Will Builder on SetupBeat, on Maya's Vault. One story per step,
   started where a returning owner would land, plus Review and Finalize and sign. Saving and
   finalizing resolve after a beat. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const EMPTY: WillAnswers = {
  you: { legalName: "", dob: "", marital: "", state: "", county: "" },
  spouse: { name: "", dob: "" },
  children: { list: [] },
  executors: [],
  digitalToo: true,
  inherit: { plan: "", shares: [], backups: [] },
  gifts: [],
  leftOut: { people: [] },
}

const MAYA: WillAnswers = {
  you: { legalName: "Maya Elena Reyes", dob: "1958-03-14", marital: "married", state: "CA", county: "Alameda" },
  spouse: { name: "David Reyes", dob: "1956-11-02" },
  children: {
    has: true,
    list: [
      { id: "c1", name: "Elena Reyes", dob: "2008-03-02", guardians: [{ id: "g1", personId: "rosa", name: "Rosa Delgado", relationship: "Sister" }] },
      { id: "c2", name: "Tomás Reyes", dob: "2011-09-12", guardians: [{ id: "g2", personId: "rosa", name: "Rosa Delgado", relationship: "Sister" }] },
    ],
  },
  executors: [
    { id: "e1", personId: "david", name: "David Reyes", relationship: "Spouse" },
    { id: "e2", personId: "rosa", name: "Rosa Delgado", relationship: "Sister" },
  ],
  digitalToo: true,
  inherit: {
    plan: "spouseThenChildren",
    shares: [],
    backups: [
      { id: "elena", name: "Elena Reyes", detail: "Child", share: 50 },
      { id: "tomas", name: "Tomás Reyes", detail: "Child", share: 50 },
    ],
  },
  gifts: [{ id: "g1", to: "elena", what: "Grandma’s wedding ring" }],
  leftOut: { any: false, people: [] },
}

const meta = {
  component: WillBuilder,
  tags: ["level-0", "will-plan"],
  parameters: { layout: "fullscreen" },
  args: {
    start: EMPTY,
    people: WILL_PEOPLE,
    states: STATES,
    signing: SIGNING_STEPS,
    copy: WILL_COPY,
    paid: true,
    logo: <PaigeLogo />,
    linkAs: StubLink,
    onSave: async () => {
      await wait(400)
    },
    checkoutHref: "#checkout",
    onFinalize: async () => {
      await wait(900)
    },
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof WillBuilder>

export default meta
type Story = StoryObj<typeof meta>

/** The first step, empty: who you are and where you live. */
export const You: Story = {}

/** Your spouse (married only), filled from the Vault. */
export const Spouse: Story = { args: { start: MAYA, initialStep: "spouse" } }

/** Children and who would raise them. */
export const Children: Story = { args: { start: MAYA, initialStep: "children" } }

/** Who carries it out: executors in order, from your people. */
export const Executors: Story = { args: { start: MAYA, initialStep: "executors" } }

/** Who inherits: the choice that fits the family, then optional backups as shares. */
export const Inherit: Story = { name: "Who inherits", args: { start: MAYA, initialStep: "inherit" } }

/** Who inherits, your own split: shares that must total 100. */
export const InheritOwn: Story = {
  name: "Who inherits · own split",
  args: {
    start: {
      ...MAYA,
      inherit: {
        plan: "own",
        backups: [],
        shares: [
          { id: "david", name: "David Reyes", detail: "Spouse", share: 50 },
          { id: "elena", name: "Elena Reyes", detail: "Child", share: 30 },
        ],
      },
    },
    initialStep: "inherit",
  },
}

/** Specific gifts (optional). */
export const Gifts: Story = { name: "Specific gifts", args: { start: MAYA, initialStep: "gifts" } }

/** Anyone left out (optional). */
export const LeftOut: Story = { name: "Anyone left out", args: { start: MAYA, initialStep: "leftOut" } }

/** Review: every answer with Edit, the draft, Finalize. */
export const Review: Story = { args: { start: MAYA, initialStep: "review" } }

/** Review when the will isn't paid for: Pay and finalize. */
export const ReviewUnpaid: Story = { name: "Review · not paid", args: { start: MAYA, initialStep: "review", paid: false } }

/** Finalize, then download the clean copy, then sign. */
export const Sign: Story = { name: "Finalize and sign", args: { start: MAYA, initialStep: "sign" } }

/** A step at phone width. */
export const PhoneInherit: Story = {
  tags: ["!autodocs"],
  name: "Phone · who inherits",
  args: { start: MAYA, initialStep: "inherit" },
  globals: { viewport: { value: "w375", isRotated: false } },
}
