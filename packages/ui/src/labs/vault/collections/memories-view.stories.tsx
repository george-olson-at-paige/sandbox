import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import { MEMORIES, MEMORIES_COPY, MEMORY_CATEGORIES } from "./memories-fixtures"
import { MemoriesView } from "./memories-view"

/* Level 0 (COLLECTIONS-PLAN.md §2): Memories on the keep-and-compose shape, on Maya's memories.
   One story per screen and state. Saving resolves after a beat and opens the memory. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const meta = {
  component: MemoriesView,
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
    memories: MEMORIES,
    categories: MEMORY_CATEGORIES,
    copy: MEMORIES_COPY,
    linkAs: StubLink,
    onSave: async (_draft, id) => {
      await wait(700)
      return id ?? "wallowa"
    },
    onRemove: async () => {
      await wait(600)
    },
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof MemoriesView>

export default meta
type Story = StoryObj<typeof meta>

/** The list: by the year it happened, newest first; picture-led cards. */
export const List: Story = {}

/** The alternating timeline: the cards take turns either side of the rail, the years on it. */
export const Timeline: Story = { args: { initialView: "timeline" } }

/** The timeline at phone width: one column, the rail at the start. */
export const PhoneTimeline: Story = { tags: ["!autodocs"], name: "Phone · timeline", args: { initialView: "timeline" }, globals: { viewport: { value: "w375", isRotated: false } } }

/** No memories yet. */
export const Empty: Story = { args: { memories: [] } }

/** A memory with a picture and a story in parts. */
export const Memory: Story = { args: { initialRoute: { name: "view", id: "wallowa" } } }

/** A memory whose file isn't a picture: the letter, as an Attachment. */
export const WithAFile: Story = { name: "Memory · a file", args: { initialRoute: { name: "view", id: "letter" } } }

/** Editing: the story's parts with ↑ ↓ ×, the category's prompts offered, the one photo. */
export const Edit: Story = { args: { initialRoute: { name: "edit", id: "wallowa" } } }

/** Adding: nothing yet; choosing a category offers its prompts. */
export const Add: Story = { args: { initialRoute: { name: "add" } } }

/** The list at phone width: one card across. */
export const PhoneList: Story = { tags: ["!autodocs"], name: "Phone · list", globals: { viewport: { value: "w375", isRotated: false } } }

/** A memory at phone width. */
export const PhoneMemory: Story = {
  tags: ["!autodocs"],
  name: "Phone · memory",
  args: { initialRoute: { name: "view", id: "wallowa" } },
  globals: { viewport: { value: "w375", isRotated: false } },
}
