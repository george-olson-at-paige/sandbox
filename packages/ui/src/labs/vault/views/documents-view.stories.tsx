import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import { DocumentsView } from "./documents-view"
import { DOCUMENTS, DOCUMENTS_COPY } from "./fixtures"

/* Level 0 (D-V5): Documents on WorkspacePage, every piece from labs on Maya's documents. One
   story per state of the screen (VIEWS-PLAN.md §1). Use this and Keep mine resolve after a beat;
   the licence's date of birth fails once, to show a refusal kept on its line. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let failedOnce = false

const meta = {
  component: DocumentsView,
  parameters: { layout: "fullscreen" },
  tags: ["level-0", "views-plan"],
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    documents: DOCUMENTS,
    copy: DOCUMENTS_COPY,
    linkAs: StubLink,
    onUse: async (_id: string, key: string) => {
      await wait(600)
      if (key === "dob" && !failedOnce) {
        failedOnce = true
        return { error: "That didn’t save. Try again in a moment." }
      }
    },
    onKeep: async () => {
      await wait(600)
    },
    onRemove: async () => {
      await wait(600)
    },
    onShare: () => {},
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof DocumentsView>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing open: Pick a document; the list grouped Needs you, then Ready. */
export const Landing: Story = {}

/** The licence: its facts beside the card's strip, what it's for, two values waiting (Use this · Keep mine), what it filled in. */
export const Open: Story = { args: { initialOpenId: "licence" } }

/** The insurance card: ready, filed in two Areas, shared with David (owner section). */
export const Shared: Story = { name: "Open · shared", args: { initialOpenId: "insurance" } }

/** The will Paige made: a page, its top in the strip with a fade; who it names. */
export const Will: Story = { name: "Open · a will Paige made", args: { initialOpenId: "will" } }

/** Recorded by name only: the strip's place says there is no file. */
export const NoFile: Story = { name: "Open · no file", args: { initialOpenId: "birth" } }

/** No type, no Area: the neutral tile, "Say what it is". */
export const Untyped: Story = { name: "Open · no type yet", args: { initialOpenId: "img2041" } }

/** Nothing filed: the list says so, the stage says what it will show. */
export const Empty: Story = { name: "Nothing yet", args: { documents: [] } }

/** Phone, nothing open: the band and the grouped list. */
export const PhoneList: Story = { tags: ["!autodocs"], name: "Phone · list", globals: { viewport: { value: "w375", isRotated: false } } }

/** Phone, the licence open: Back, the stage bar, the record with the strip over its text. */
export const PhoneRecord: Story = { tags: ["!autodocs"], name: "Phone · record", args: { initialOpenId: "licence" }, globals: { viewport: { value: "w375", isRotated: false } } }
