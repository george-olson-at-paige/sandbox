import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1; the Vue walk's "Accept an invite"). Someone shared a
   document or a memory, or asked the person to be a delegate (journeys 5 and 7). The email link
   usually arrives with no session, so the Gate comes first: who invited them and to what, then
   create an account or sign in, and the invite is picked up after. Signed in, the consent card
   says what accepting means in one sentence and offers Accept and Not now — the one card for
   all three kinds, with each kind's words (Document is the everyday one). Expired asks the
   sender for a new one; nothing else can be done from here. The inviter is the fixture Vault's
   Rosa Martinez (sibling, executor). */
const INVITER = "Rosa Martinez"

function Consent({ title, lede, children }: { title: string; lede: string; children: string }) {
  return (
    <AuthPage logo={<PaigeLogo />} title={title} lede={lede} footer={<AuthLegalFooter />}>
      <Stack gap={6}>
        <p className="text-center text-sm text-body-muted">{children}</p>
        <Stack gap={3}>
          <Button asChild className="w-full">
            <StubLink href="#accept">Accept</StubLink>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <StubLink href="#vault">Not now</StubLink>
          </Button>
        </Stack>
      </Stack>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** No session yet: who invited them and to what; create an account or sign in, and the invite follows. */
export const Gate: Story = {
  render: () => (
    <AuthPage logo={<PaigeLogo />} title="You’ve been invited" lede={`${INVITER} shared a document with you on Paige.`} footer={<AuthLegalFooter />}>
      <Stack gap={6}>
        <p className="text-center text-sm text-body-muted">Sign in or create an account to see it. We’ll bring you back here.</p>
        <Stack gap={3}>
          <Button asChild className="w-full">
            <StubLink href="#register">Create an account</StubLink>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <StubLink href="#sign-in">Sign in</StubLink>
          </Button>
        </Stack>
      </Stack>
    </AuthPage>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** Signed in: the everyday consent, a shared document. */
export const Document: Story = {
  render: () => (
    <Consent title="Accept document access" lede={`${INVITER} shared “Last will and testament” with you.`}>
      You’ll see it in your Vault, read-only. Rosa can change that at any time.
    </Consent>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** The same card for a delegate: what the role means, in one sentence. */
export const Delegate: Story = {
  render: () => (
    <Consent title="Help keep a legacy secure" lede={`${INVITER} asked you to be a delegate.`}>
      A delegate can reach what Rosa chose to share with you when the time comes. You can step back at any point.
    </Consent>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** The same card for a shared memory. */
export const Memory: Story = {
  render: () => (
    <Consent title="A memory for you" lede={`${INVITER} shared a memory with you.`}>
      You’ll find it in your Vault, where it stays as long as Rosa keeps it shared.
    </Consent>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** Past its date, or already used: only the sender can renew it. */
export const Expired: Story = {
  render: () => (
    <AuthPage logo={<PaigeLogo />} title="This invitation has expired" lede={`Ask ${INVITER} to send a new one.`} footer={<AuthLegalFooter />}>
      <Button asChild className="w-full">
        <StubLink href="#sign-in">Sign in</StubLink>
      </Button>
    </AuthPage>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

export const Phone: Story = {
  render: () => (
    <Consent title="Accept document access" lede={`${INVITER} shared “Last will and testament” with you.`}>
      You’ll see it in your Vault, read-only. Rosa can change that at any time.
    </Consent>
  ),
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375", isRotated: false } },
}
