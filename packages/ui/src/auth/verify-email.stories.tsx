import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { Spinner } from "../components/feedback/spinner"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Verify email: the link from the welcome note lands
   here and the page confirms the address on its own — no form, three states as the call runs.
   Checking is a status line (role="status", so it's announced once); Confirmed and Invalid are
   the heading and lede, with one button. The failure says what a person can do, not what went
   wrong in the code: sign in, and a fresh link follows if the address still needs confirming. */
function CheckingCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="Confirming your email" lede="One moment while we check the link." footer={<AuthLegalFooter />}>
      <p role="status" className="flex items-center justify-center gap-2 text-sm text-body-muted">
        <Spinner label="Checking" /> Checking the link…
      </p>
    </AuthPage>
  )
}

function ConfirmedCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="Email confirmed" lede="Your account is ready." footer={<AuthLegalFooter />}>
      <Button asChild className="w-full">
        <StubLink href="#sign-in">Sign in</StubLink>
      </Button>
    </AuthPage>
  )
}

function InvalidCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="This link isn’t valid" lede="It may have been used already, or copied incompletely." footer={<AuthLegalFooter />}>
      <Stack gap={6}>
        <p className="text-center text-sm text-body-muted">Sign in and, if your address still needs confirming, we’ll send a fresh link.</p>
        <Button asChild className="w-full">
          <StubLink href="#sign-in">Sign in</StubLink>
        </Button>
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

/** The link is being checked: a status line, nothing to do. */
export const Checking: Story = { render: () => <CheckingCard />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** Confirmed: on to sign in. */
export const Confirmed: Story = { render: () => <ConfirmedCard />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** Used, expired or incomplete: what to do next, not what went wrong. */
export const Invalid: Story = { render: () => <InvalidCard />, globals: { viewport: { value: "w1280", isRotated: false } } }
