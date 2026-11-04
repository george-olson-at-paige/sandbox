import type { Meta, StoryObj } from "@storybook/react-vite"

import { DocumentsView } from "./documents-view"
import { StoryVaultShell } from "./story-shell"
import { documents } from "./view-fixtures"

/* Documents: everything in the Vault and what each is for. Rows flag what needs the owner
   (no type yet, no file yet, values to check). */
const meta = {
  component: DocumentsView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell>
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { documents, initialId: "license" },
} satisfies Meta<typeof DocumentsView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** A scan nobody has named: the "Say what it is" prompt. */
export const NoTypeYet: Story = { args: { initialId: "scan" } }
/** A record with no file attached: the upload prompt in the preview. */
export const NoFileYet: Story = { args: { initialId: "deed" } }
