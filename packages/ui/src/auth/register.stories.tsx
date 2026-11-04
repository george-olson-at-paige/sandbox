import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { PartnerLogo } from "../admin/partner-logo"
import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { partners } from "../fixtures/partners"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { PasswordField } from "../forms/fields/password-field"
import { PasswordStrength } from "../forms/password-strength"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Create an account: email and one password (no confirm
   field — it catches few real mistakes and adds friction; the person can reset later), the
   legal line under the submit, Sign in among the ways out. The contract (`RegisterRequest
   {Email, Password, AcquisitionSource?, PartnerSlug?}` → `{}`) answers the same empty 200 for
   a new address and a taken one, so the card says the same thing either way (journey J1: the
   same-message rule): CheckInbox never confirms whether the account existed. A partner link
   (`partner_slug`) co-brands the bar (R18-03, `brand`). Password rules are the server's; the
   description states the one we know (API-NEEDS: the real minimum). */
type RegisterValues = { email: string; password: string }

function Register({ brand }: { brand?: boolean }) {
  const [v, setV] = useState<RegisterValues>({ email: "", password: "" })
  const partner = partners.find((p) => p.logoUrl) ?? partners[0]
  return (
    <AuthPage
      logo={<PaigeLogo />}
      brand={brand ? <PartnerLogo partner={partner} /> : undefined}
      title="Create your account"
      lede={brand ? `Paige, with ${partner.name}.` : "A few details and you’re in."}
      links={
        <p>
          Already a member?{" "}
          <Button asChild variant="link" size="inline">
            <StubLink href="#sign-in">Sign in</StubLink>
          </Button>
        </p>
      }
      footer={<AuthLegalFooter />}
    >
      <Form values={v} warnUnsaved={false} aria-label="Create your account" onSubmit={() => undefined}>
        <Stack gap={6}>
          <Field name="email">
            <FieldLabel>Email</FieldLabel>
            <Input type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            <FieldError />
          </Field>
          <Field name="password">
            <FieldLabel>Password</FieldLabel>
            <PasswordField autoComplete="new-password" value={v.password} onValueChange={(password) => setV({ ...v, password })} />
            <FieldDescription>At least 8 characters. Longer is stronger.</FieldDescription>
            <PasswordStrength value={v.password} />
            <FieldError />
          </Field>
          <Stack gap={3}>
            <FormFooter fill submitLabel="Create account" pendingLabel="Creating…" />
            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to Paige’s{" "}
              <Button asChild variant="link" size="inline">
                <StubLink href="#terms">Terms</StubLink>
              </Button>{" "}
              and{" "}
              <Button asChild variant="link" size="inline">
                <StubLink href="#privacy">Privacy Policy</StubLink>
              </Button>
              .
            </p>
          </Stack>
        </Stack>
      </Form>
    </AuthPage>
  )
}

/* After the submit: the same card for a new address and a taken one. */
function CheckInboxCard({ email }: { email: string }) {
  return (
    <AuthPage logo={<PaigeLogo />} title="Check your inbox" lede={`We sent a note to ${email}.`} footer={<AuthLegalFooter />}>
      <Stack gap={6}>
        <p className="text-center text-sm text-body-muted">Open the link in it to confirm your address, then sign in. It’s good for 24 hours.</p>
        <Button asChild className="w-full">
          <StubLink href="#sign-in">Continue to sign in</StubLink>
        </Button>
      </Stack>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-03", "r18-08"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Email and one password; the legal line under the submit; Sign in among the ways out. */
export const Default: Story = { render: () => <Register />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** After the submit, for a new address and a taken one alike: check the inbox, then sign in. */
export const CheckInbox: Story = {
  render: () => <CheckInboxCard email="maya@example.com" />,
  globals: { viewport: { value: "w1280", isRotated: false } },
}

/** Opened from a partner's link: the partner's mark beside the logo and in the lede (R18-03). */
export const WithPartner: Story = { render: () => <Register brand />, globals: { viewport: { value: "w1280", isRotated: false } } }

export const Phone: Story = { render: () => <Register />, tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }
