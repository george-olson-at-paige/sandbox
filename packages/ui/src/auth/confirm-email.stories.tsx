import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { Spinner } from "../components/feedback/spinner"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Confirm email: from Account, a change-email link
   applies the new address. The same three-state shape as Verify email (checking · done ·
   invalid), with the change's words: the address is now the sign-in. The invalid case points
   back to Account for a new link rather than to a form the page doesn't have. */
function ApplyingCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="Updating your email" lede="Applying the new address from your link." footer={<AuthLegalFooter />}>
      <p role="status" className="flex items-center justify-center gap-2 text-sm text-body-muted">
        <Spinner label="Applying" /> Applying…
      </p>
    </AuthPage>
  )
}

function UpdatedCard({ email }: { email: string }) {
  return (
    <AuthPage logo={<PaigeLogo />} title="Email updated" lede={`From now on, sign in as ${email}.`} footer={<AuthLegalFooter />}>
      <Button asChild className="w-full">
        <StubLink href="#sign-in">Sign in</StubLink>
      </Button>
    </AuthPage>
  )
}

function InvalidCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="This link isn’t valid" lede="It may have expired or been used already. Ask for a new one from your account." footer={<AuthLegalFooter />}>
      <Button asChild className="w-full">
        <StubLink href="#sign-in">Sign in</StubLink>
      </Button>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The new address is being applied: a status line. */
export const Applying: Story = { render: () => <ApplyingCard />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** Done: the new address is the sign-in. */
export const Updated: Story = { render: () => <UpdatedCard email="maya@example.com" />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** Expired or used: back through Account for a new link. */
export const Invalid: Story = { render: () => <InvalidCard />, globals: { viewport: { value: "w1280", isRotated: false } } }
