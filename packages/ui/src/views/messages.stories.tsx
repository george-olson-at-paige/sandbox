import type { Meta, StoryObj } from "@storybook/react-vite"

import { ModeBoard } from "./mode-board"
import { StoryVaultShell } from "./story-shell"
import { messages } from "./view-fixtures"

/* Messages mode: words delivered to someone, now or later. Cards or list; search filters by
   title, text, kind or recipient. */
const meta = {
  component: ModeBoard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell mode="messages">
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { kind: "messages", entries: messages },
} satisfies Meta<typeof ModeBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const List: Story = { args: { initialLayout: "list" } }
export const Empty: Story = { args: { entries: [] } }
