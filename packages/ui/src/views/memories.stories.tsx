import type { Meta, StoryObj } from "@storybook/react-vite"

import { ModeBoard } from "./mode-board"
import { StoryVaultShell } from "./story-shell"
import { memories } from "./view-fixtures"

/* Memories mode: moments kept, just for the owner or shared. Same board as Messages, with a
   Share tool on each card. */
const meta = {
  component: ModeBoard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell mode="memories">
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { kind: "memories", entries: memories },
} satisfies Meta<typeof ModeBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const List: Story = { args: { initialLayout: "list" } }
export const Empty: Story = { args: { entries: [] } }
