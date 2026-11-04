import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryVaultShell } from "./story-shell"
import { people } from "./view-fixtures"
import type { WillDraft } from "./will-builder"
import { WillBuilder } from "./will-builder"

/* Will builder: six steps, people picked from the Vault. Continue unlocks once a step's
   required answers are in; done steps can be revisited from the list. */
const willPeople = people.filter((p) => p.relation !== "Pet").map(({ id, name, relation }) => ({ id, name, relation }))

const blank: WillDraft = { legalName: "", state: "", children: [], gifts: [] }
const filled: WillDraft = {
  legalName: "Samantha Jane Whitfield",
  state: "Oregon",
  status: "married",
  children: ["lila"],
  executor: "jordan",
  backupExecutor: "morgan",
  guardian: "alex",
  gifts: [{ item: "Grandpa's watch", to: "lila" }],
  residueTo: "jordan",
}

const meta = {
  component: WillBuilder,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell>
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { people: willPeople, initialDraft: blank, initialStep: 1 },
} satisfies Meta<typeof WillBuilder>

export default meta
type Story = StoryObj<typeof meta>

export const Start: Story = {}
export const Executor: Story = { args: { initialDraft: filled, initialStep: 3 } }
export const Gifts: Story = { args: { initialDraft: filled, initialStep: 5 } }
export const Review: Story = { args: { initialDraft: filled, initialStep: 6 } }
