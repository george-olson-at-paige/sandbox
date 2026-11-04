import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { PartnerLogo } from "../admin/partner-logo"
import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { partners } from "../fixtures/partners"
import { Field, FieldError, FieldLabel } from "../forms/field"
import { Form } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { Stack } from "../primitives/stack"
import { AuthLegalFooter, PaigeLogo, StubLink } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { AuthPage } from "./auth-page"

/* Level 1 (LEVELS.md; REVIEW-18 Checkpoint 2, George 2026-10-30): the door's frame. One frame,
   two fillings: the Wireframe fills the card's slots with placeholders, Desktop and Phone with a
   one-field form — the proof that Form, Field and FormFooter `fill` sit in the card; the real
   pages are the Auth section's stories. WithPartner shows the `brand` slot (R18-03): a partner's
   mark beside the logo on a co-branded register. */
const meta = {
  parameters: { layout: "fullscreen" },
  tags: ["level-1", "r18-17", "r18-18", "r18-19", "r18-20", "r18-21", "r18-23", "r18-25"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The card's slots as measured placeholders: title and lede, body, links; the footer and the watercolor are the frame's. */
export const Wireframe: Story = {
  render: () => (
    <AuthPage
      logo={<PaigeLogo />}
      title={<Placeholder as="span" size="sm" label="Title" className="block" />}
      lede={<Placeholder as="span" size="xs" label="Lede" className="block" />}
      links={<Placeholder size="sm" label="Links" measure className="w-full" />}
      footer={<AuthLegalFooter />}
    >
      <Placeholder size="xl" label="Body · message, fields, submit" measure />
    </AuthPage>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}

function Proof() {
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
      <Form values={{ email }} aria-label="Forgot your password" onSubmit={() => undefined}>
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

/** The frame proven with real parts: a one-field form whose submit fills the card (FormFooter `fill`). */
export const Desktop: Story = { render: () => <Proof />, globals: { viewport: { value: "w1280", isRotated: false } } }

export const Phone: Story = { render: () => <Proof />, tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }

/** A partner's mark beside the logo (`brand`, R18-03): the co-branded register a partner link opens. */
export const WithPartner: Story = {
  render: () => (
    <AuthPage
      logo={<PaigeLogo />}
      brand={<PartnerLogo partner={partners.find((p) => p.logoUrl) ?? partners[0]} />}
      title={<Placeholder as="span" size="sm" label="Title" className="block" />}
      footer={<AuthLegalFooter />}
    >
      <Placeholder size="xl" label="Body" measure />
    </AuthPage>
  ),
  globals: { viewport: { value: "w1280", isRotated: false } },
}
