import type { Meta, StoryObj } from "@storybook/react-vite"

import { PasswordsView } from "./passwords-view"
import { StoryVaultShell } from "./story-shell"
import { logins } from "./view-fixtures"

/* Passwords: logins kept private, and who gets each one. The password stays masked until
   Show; Copy works on both username and password. */
const meta = {
  component: PasswordsView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <StoryVaultShell>
        <S />
      </StoryVaultShell>
    ),
  ],
  args: { logins, initialId: "google" },
} satisfies Meta<typeof PasswordsView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** A short, old password: the change-it note. */
export const WeakPassword: Story = { args: { initialId: "fidelity" } }
