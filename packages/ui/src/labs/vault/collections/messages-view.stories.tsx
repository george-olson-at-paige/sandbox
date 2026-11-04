import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import { MESSAGE_TYPES, MESSAGES, MESSAGES_COPY } from "./messages-fixtures"
import { MessagesView } from "./messages-view"

/* Level 0 (COLLECTIONS-PLAN.md §2): Messages on the keep-and-compose shape, on Maya's letters.
   One story per screen and state. Saving resolves after a beat and opens the letter. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const meta = {
  component: MessagesView,
  tags: ["level-0", "collections-plan"],
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
    messages: MESSAGES,
    types: MESSAGE_TYPES,
    copy: MESSAGES_COPY,
    linkAs: StubLink,
    onSave: async (_draft, id) => {
      await wait(700)
      return id ?? "elena-wedding"
    },
    onRemove: async () => {
      await wait(600)
    },
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof MessagesView>

export default meta
type Story = StoryObj<typeof meta>

/** The list: the letters by when they go, each with its status. */
export const List: Story = {}

/** No letters yet. */
export const Empty: Story = { args: { messages: [] } }

/** A letter: when it goes (and that nothing sends yet), the letter, its file. */
export const Message: Story = { args: { initialRoute: { name: "view", id: "elena-wedding" } } }

/** Editing: When it goes shows only the chosen choice's inputs (every year: month and day). */
export const Edit: Story = { args: { initialRoute: { name: "edit", id: "tomas-birthday" } } }

/** Writing a new one: nothing chosen yet. */
export const Add: Story = { args: { initialRoute: { name: "add" } } }

/** The list at phone width. */
export const PhoneList: Story = { tags: ["!autodocs"], name: "Phone · list", globals: { viewport: { value: "w375", isRotated: false } } }

/** A letter at phone width. */
export const PhoneMessage: Story = {
  tags: ["!autodocs"],
  name: "Phone · message",
  args: { initialRoute: { name: "view", id: "david" } },
  globals: { viewport: { value: "w375", isRotated: false } },
}
