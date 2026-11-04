import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "../components/actions/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { PasswordField } from "../forms/fields/password-field"
import { PasswordStrength } from "../forms/password-strength"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Set a new password: the reset link lands here with
   the email and code in the URL (`ResetPasswordRequest {Email, Code, Password}`), so the card
   asks for the one thing it needs. One password field (the register card's reasoning). Updated
   sends the person to sign in; Expired is the code's failure, stated as the link's. */
function SetNewPassword() {
  const [password, setPassword] = useState("")
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title="Set a new password"
      lede="Choose one you don’t use anywhere else."
      links={
        <Button asChild variant="link" size="inline">
          <StubLink href="#sign-in">Back to sign in</StubLink>
        </Button>
      }
      footer={<AuthLegalFooter />}
    >
      <Form values={{ password }} warnUnsaved={false} aria-label="Set a new password" onSubmit={() => undefined}>
        <Stack gap={6}>
          <Field name="password">
            <FieldLabel>New password</FieldLabel>
            <PasswordField autoComplete="new-password" value={password} onValueChange={setPassword} />
            <FieldDescription>At least 8 characters. Longer is stronger.</FieldDescription>
            <PasswordStrength value={password} />
            <FieldError />
          </Field>
          <FormFooter fill submitLabel="Set password" pendingLabel="Saving…" />
        </Stack>
      </Form>
    </AuthPage>
  )
}

function UpdatedCard() {
  return (
    <AuthPage logo={<PaigeLogo />} title="Password updated" lede="Sign in with your new password." footer={<AuthLegalFooter />}>
      <Button asChild className="w-full">
        <StubLink href="#sign-in">Sign in</StubLink>
      </Button>
    </AuthPage>
  )
}

function ExpiredCard() {
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title="This link has expired"
      lede="Reset links are good for 30 minutes."
      links={
        <Button asChild variant="link" size="inline">
          <StubLink href="#sign-in">Back to sign in</StubLink>
        </Button>
      }
      footer={<AuthLegalFooter />}
    >
      <Button asChild className="w-full">
        <StubLink href="#forgot-password">Request a new link</StubLink>
      </Button>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-08"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The one field the link needs. */
export const Default: Story = { render: () => <SetNewPassword />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** Saved: on to sign in. */
export const Updated: Story = { render: () => <UpdatedCard />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** The link's code is past its 30 minutes: ask for another. */
export const Expired: Story = { render: () => <ExpiredCard />, globals: { viewport: { value: "w1280", isRotated: false } } }
