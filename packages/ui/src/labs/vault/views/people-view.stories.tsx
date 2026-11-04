import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import { PEOPLE, PEOPLE_COPY } from "./fixtures"
import { PeopleView } from "./people-view"

/* Level 0 (D-V5): People on WorkspacePage, every piece from labs on Maya's book. One story per
   state of the screen (VIEWS-PLAN.md §1); the phone stories are the two screens. The writes
   resolve after a beat, so the save states show. Remove confirms in the library's dialog. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const meta = {
  component: PeopleView,
  parameters: { layout: "fullscreen" },
  tags: ["level-0", "views-plan"],
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader frame="workspace" />
        <S />
      </div>
    ),
  ],
  args: {
    people: PEOPLE,
    copy: PEOPLE_COPY,
    linkAs: StubLink,
    onSaveReach: async () => {
      await wait(600)
    },
    onAssign: () => {},
    onRemove: async () => {
      await wait(600)
    },
    onShare: () => {},
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof PeopleView>

export default meta
type Story = StoryObj<typeof meta>

/** Nobody open: Pick someone, and the people who need something first. */
export const Landing: Story = {}

/** David open: his contact card, who he is to Maya Area by Area, what he can see (owner only). */
export const Open: Story = { args: { initialOpenId: "david" } }

/** Ellen Hart has no phone or email: the to-do sits where they'd show. Press it to open the reach form in place. */
export const NoReach: Story = { name: "Open · no phone or email", args: { initialOpenId: "hart" } }

/** A pet: "What they're part of", no Share, no owner section. */
export const Pet: Story = { name: "Open · a pet", args: { initialOpenId: "pepper" } }

/** On nothing yet: the shared section's empty line. */
export const OnNothing: Story = { name: "Open · on nothing yet", args: { initialOpenId: "ortiz" } }

/** Nobody in the book: the list says so, the stage says what it will show. */
export const Empty: Story = { name: "Nobody yet", args: { people: [] } }

/** At md (768): the list narrows to 300. */
export const AtMd: Story = { tags: ["!autodocs"], name: "At md · 768", args: { initialOpenId: "david" }, globals: { viewport: { value: "w768", isRotated: false } } }

/** Phone, nobody open: the band and the list. */
export const PhoneList: Story = { tags: ["!autodocs"], name: "Phone · list", globals: { viewport: { value: "w375", isRotated: false } } }

/** Phone, David open: Back, the stage bar, his record. */
export const PhoneRecord: Story = { tags: ["!autodocs"], name: "Phone · record", args: { initialOpenId: "david" }, globals: { viewport: { value: "w375", isRotated: false } } }
