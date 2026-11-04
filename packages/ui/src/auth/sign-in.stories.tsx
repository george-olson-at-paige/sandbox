import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { Field, FieldError, FieldLabel } from "../forms/field"
import { PasswordField } from "../forms/fields/password-field"
import { Form, type FormResult } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1, George 2026-10-30: "let's finish that up by adding
   the rest of the auth views"). Sign in: email and password in the AuthPage card, the submit
   filling the width (FormFooter `fill`, R18-08), the ways out under the hairline. The contract
   (`LoginRequest {Email, Password}` → `{Token, HasPhone, Code}`): a failure is the Form's own
   form-level error (R18-09), one sentence in the ErrorSummary (R18-24), which takes focus; the
   same sentence whether the email or the password was wrong, so the card never says which
   exists. `HasPhone` false sends the person to Enroll phone, true to Verify code — the page's
   routing, not the card's. No unsaved-changes guard on a sign-in (`warnUnsaved` off): leaving
   is the point of the links.
   Copy is this spike's (George 2026-10-30: the live pages "don't hit the quality bar … the copy
   throws them out of balance. so we don't need these to be exactly the same"): a two-word
   heading, one short lede, labels that are the field's name. */
const INVALID = "The email and password didn’t match an account. Check both and try again."
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

type SignInValues = { email: string; password: string }

function SignIn({ initial, error, onSubmit }: { initial?: SignInValues; error?: string; onSubmit?: (v: SignInValues) => FormResult | Promise<FormResult> }) {
  const [v, setV] = useState<SignInValues>(initial ?? { email: "", password: "" })
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title="Welcome back"
      lede="Sign in to pick up where you left off."
      links={
        <>
          <Button asChild variant="link" size="inline">
            <StubLink href="#forgot-password">Forgot your password?</StubLink>
          </Button>
          <p>
            New to Paige?{" "}
            <Button asChild variant="link" size="inline">
              <StubLink href="#register">Create an account</StubLink>
            </Button>
          </p>
        </>
      }
      footer={<AuthLegalFooter />}
    >
      <Form values={v} error={error} warnUnsaved={false} aria-label="Sign in" summaryTitle="Couldn’t sign in" onSubmit={onSubmit ?? (async () => (await wait(600), { error: INVALID }))}>
        <Stack gap={6}>
          <Field name="email">
            <FieldLabel>Email</FieldLabel>
            <Input type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            <FieldError />
          </Field>
          <Field name="password">
            <FieldLabel>Password</FieldLabel>
            <PasswordField autoComplete="current-password" value={v.password} onValueChange={(password) => setV({ ...v, password })} />
            <FieldError />
          </Field>
          <FormFooter fill submitLabel="Sign in" pendingLabel="Signing in…" />
        </Stack>
      </Form>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-08", "r18-09", "r18-24"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Email and password; the submit fills the card. Submitting shows the credentials failure after a moment. */
export const Default: Story = { render: () => <SignIn />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** The credentials didn't match: one sentence in the ErrorSummary, the same whichever was wrong (R18-09, R18-24); the values stay. */
export const Invalid: Story = {
  render: () => <SignIn initial={{ email: "maya@example.com", password: "wrong-one" }} error={INVALID} />,
  globals: { viewport: { value: "w1280", isRotated: false } },
}

export const Phone: Story = { render: () => <SignIn />, tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }
