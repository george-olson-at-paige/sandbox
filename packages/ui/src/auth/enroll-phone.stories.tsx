import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "../components/actions/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { PhoneField } from "../forms/fields/phone-field"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { AuthPage } from "../templates/auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Step 1). Enroll phone: the first sign-in with no mobile on
   file (`HasPhone` false) lands here before any code can be sent. PhoneField (US, 10 digits —
   its own rule and message). The one way out is Sign out: the person is half in, and the card
   says what the number is for so the ask is fair. Change number is the same card from Account
   (Vue: "the same card without the abandon link"): a new lede, no link. */
function EnrollPhone({ change = false }: { change?: boolean }) {
  const [phone, setPhone] = useState("")
  return (
    <AuthPage
      logo={<PaigeLogo />}
      title={change ? "Change your mobile number" : "Add your mobile number"}
      lede={change ? "We’ll text a code to the new number to confirm it." : "We’ll text you a code each time you sign in, so only you can get in."}
      links={
        change ? undefined : (
          <Button asChild variant="link" size="inline">
            <StubLink href="#sign-out">Sign out</StubLink>
          </Button>
        )
      }
      footer={<AuthLegalFooter />}
    >
      <Form values={{ phone }} warnUnsaved={false} aria-label={change ? "Change your mobile number" : "Add your mobile number"} onSubmit={() => undefined}>
        <Stack gap={6}>
          <Field name="phone">
            <FieldLabel>Mobile number</FieldLabel>
            <PhoneField value={phone} onValueChange={setPhone} />
            <FieldDescription>Standard text rates apply.</FieldDescription>
            <FieldError />
          </Field>
          <FormFooter fill submitLabel="Send code" pendingLabel="Sending…" />
        </Stack>
      </Form>
    </AuthPage>
  )
}

const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-01", "r18-08"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** First sign-in, no mobile on file: the number, what it's for, and Sign out as the one way out. */
export const Default: Story = { render: () => <EnrollPhone />, globals: { viewport: { value: "w1280", isRotated: false } } }

/** From Account: the same card for a new number, without the way out. */
export const ChangeNumber: Story = { render: () => <EnrollPhone change />, globals: { viewport: { value: "w1280", isRotated: false } } }
