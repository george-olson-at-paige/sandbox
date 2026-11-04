import type { Meta, StoryObj } from "@storybook/react-vite"

import { PeopleView } from "./people-view"
import { StoryVaultShell } from "./story-shell"
import { people } from "./view-fixtures"

/* People: everyone in the Vault and what each does for the owner. Click a row to select;
   search filters by name, relation or email. */
const meta = {
  component: PeopleView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell>
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { people, initialId: "jordan" },
} satisfies Meta<typeof PeopleView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** Someone who isn't on anything yet: the empty role and sharing lines. */
export const NotOnAnything: Story = { args: { initialId: "casey" } }
export const OnePerson: Story = { args: { people: people.slice(3, 4), initialId: "jordan" } }
