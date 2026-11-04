import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader, StubLink } from "../../../stories/fixtures"
import type { AccountSummary } from "./data"
import { ACCOUNT_TYPES, ACCOUNTS, PASSWORDS_COPY, SECRETS } from "./fixtures"
import { PasswordsView } from "./passwords-view"

/* Level 0 (COLLECTIONS-PLAN.md §2): Passwords, the first keep-and-compose page, on Maya's
   accounts. One story per screen and state. A secret is asked for when shown (after a beat);
   Gmail's recovery codes are refused once, to show a refusal in place. Saving resolves after a
   beat and opens the account. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let refusedOnce = false
const summaries: AccountSummary[] = ACCOUNTS.map(({ id, title, type }) => ({ id, title, type }))

const meta = {
  component: PasswordsView,
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
    accounts: summaries,
    types: ACCOUNT_TYPES,
    prompt: { next: ACCOUNT_TYPES[4]!, done: 4, of: 6 },
    copy: PASSWORDS_COPY,
    linkAs: StubLink,
    getAccount: (id: string) => ACCOUNTS.find((a) => a.id === id),
    onReveal: async (accountId: string, credentialId: string) => {
      await wait(500)
      if (accountId === "gmail" && credentialId === "c2" && !refusedOnce) {
        refusedOnce = true
        return { error: "We couldn’t get that just now. Try again." }
      }
      return SECRETS[`${accountId}/${credentialId}`] ?? { error: "There’s no secret saved for this one." }
    },
    onSave: async (_draft, id) => {
      await wait(700)
      return id ?? "chase"
    },
    onRemove: async () => {
      await wait(600)
    },
    onSkip: async () => {
      await wait(300)
    },
  },
  globals: { viewport: { value: "w1280", isRotated: false } },
} satisfies Meta<typeof PasswordsView>

export default meta
type Story = StoryObj<typeof meta>

/** The list: the next-kind prompt, the find row, the accounts grouped by type. */
export const List: Story = {}

/** No accounts yet. */
export const Empty: Story = { args: { accounts: [], prompt: { next: ACCOUNT_TYPES[0]!, done: 0, of: 6 } } }

/** Every kind covered: no prompt. */
export const AllCovered: Story = { name: "List · every kind covered", args: { prompt: undefined } }

/** An account: Signing in (website, username, password and PIN, each asked for), Notes, Files. */
export const Account: Story = { args: { initialRoute: { name: "view", id: "chase" } } }

/** A device: a passcode and a note, no website or username. */
export const Device: Story = { name: "Account · a device", args: { initialRoute: { name: "view", id: "iphone" } } }

/** Editing: the saved secrets aren't in the form; blank keeps them. */
export const Edit: Story = { args: { initialRoute: { name: "edit", id: "chase" } } }

/** Adding, from the prompt: the type is set. */
export const Add: Story = { args: { initialRoute: { name: "add", typeId: "loan" } } }

/** The list at phone width. */
export const PhoneList: Story = { tags: ["!autodocs"], name: "Phone · list", globals: { viewport: { value: "w375", isRotated: false } } }

/** An account at phone width. */
export const PhoneAccount: Story = {
  tags: ["!autodocs"],
  name: "Phone · account",
  args: { initialRoute: { name: "view", id: "gmail" } },
  globals: { viewport: { value: "w375", isRotated: false } },
}
