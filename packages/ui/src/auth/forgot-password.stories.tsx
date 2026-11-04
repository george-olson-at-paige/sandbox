import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { Field, FieldError, FieldLabel } from "../forms/field"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Forgot password: one field, one button. The contract
   (`ForgotPasswordRequest {Email}`) answers the same whether the address is on file, so Sent
   says "if it's on file" and never confirms the account (journey J1's same-message rule). The
   link's life (30 minutes) is stated once, on Sent, where it matters. */
function ForgotPassword() {
  const [email, setEmail] = useState("")
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title="Forgot your password?"
      lede="Enter your email and we’ll send a link to set a new one."
      links={
        <Button asChild variant="link" size="inline">
          <StubLink href="#sign-in">Back to sign in</StubLink>
        </Button>
      }
      footer={<AuthLegalFooter />}
    >
      <Form values={{ email }} warnUnsaved={false} aria-label="Forgot your password" onSubmit={() => undefined}>
        <Stack gap={6}>
          <Field name="email">
            <FieldLabel>Email</FieldLabel>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FieldError />
          </Field>
          <FormFooter fill submitLabel="Send reset link" pendingLabel="Sending…" />
        </Stack>
      </Form>
    </AuthPage>
  )
}

function SentCard({ email }: { email: string }) {
  return (
    <AuthPage logo={<PaigeLogo />} title="Check your inbox" lede={`If ${email} is on file, a reset link is on its way.`} footer={<AuthLegalFooter />}>
      <Stack gap={6}>
        <p className="text-center text-sm text-body-muted">It’s good for 30 minutes. If it doesn’t arrive, check your spam folder or try again.</p>
        <Button asChild className="w-full">
          <StubLink href="#sign-in">Back to sign in</StubLink>
        </Button>
      </Stack>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-08"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** One field, one button; Back to sign in under the hairline. */
export const Default: Story = { render: () => <ForgotPassword />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** After the submit, on file or not: the same quiet note, the link's life, the way back. */
export const Sent: Story = { render: () => <SentCard email="maya@example.com" />, globals: { viewport: { value: "w1280", isRotated: false } } }
