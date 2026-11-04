import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"

import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Verify code: after credentials, the six digits we
   texted. A plain Input first (R18-07: `inputMode="numeric"`, `autoComplete="one-time-code"` so
   the phone offers the code from the text, six characters, centred and spaced); shadcn's
   `input-otp` is the upgrade if the one box isn't enough. Six digits is the Form's `validate`
   rule, shown after the first try. The lede names the number with only its last digits. Resend
   waits (30 seconds, counted down in the link's own label) so a slow text isn't doubled; then it
   is a link. Incorrect is the server's answer as the Form's one-sentence error (R18-24). */
const INCORRECT = "That code didn’t match the one we sent. Check it, or send a new one."
const RESEND_WAIT = 30

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) return
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [left])
  return left
}

function VerifyCode({ initial = "", error }: { initial?: string; error?: string }) {
  const [code, setCode] = useState(initial)
  const left = useCountdown(RESEND_WAIT)
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title="Enter your code"
      lede="We texted a 6-digit code to the number ending in 0142."
      links={
        <>
          {left > 0 ? (
            <p>
              Resend code in 0:{String(left).padStart(2, "0")}
            </p>
          ) : (
            <Button asChild variant="link" size="inline">
              <StubLink href="#resend">Resend code</StubLink>
            </Button>
          )}
          <Button asChild variant="link" size="inline">
            <StubLink href="#enroll-phone">Use a different number</StubLink>
          </Button>
        </>
      }
      footer={<AuthLegalFooter />}
    >
      <Form
        values={{ code }}
        error={error}
        warnUnsaved={false}
        aria-label="Enter your code"
        summaryTitle="Couldn’t verify"
        validate={(v) => (/^\d{6}$/.test(v.code) ? undefined : { code: "Enter the 6-digit code from the text." })}
        onSubmit={() => undefined}
      >
        <Stack gap={6}>
          <Field name="code">
            <FieldLabel>Code</FieldLabel>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-semibold tracking-widest"
            />
            <FieldDescription>Six digits.</FieldDescription>
            <FieldError />
          </Field>
          <FormFooter fill submitLabel="Verify" pendingLabel="Verifying…" />
        </Stack>
      </Form>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-07", "r18-08", "r18-24"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The six digits; Resend counts down from 30 seconds, then is a link; a different number is the other way out. */
export const Default: Story = { render: () => <VerifyCode />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** The server said no: one sentence, the code stays to be checked. */
export const Incorrect: Story = { render: () => <VerifyCode initial="416203" error={INCORRECT} />, globals: { viewport: { value: "w1280", isRotated: false } } }

export const Phone: Story = { render: () => <VerifyCode />, tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }
