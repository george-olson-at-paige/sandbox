import type { Meta, StoryObj } from "@storybook/react-vite"
import { MapPinIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "../components/actions/button"
import { Badge } from "../components/display/badge"
import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { FIXTURE_ADDRESSES } from "../fixtures/addresses"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { FieldGroup } from "../forms/field-group"
import { AddressField } from "../forms/fields/address-field"
import { PhoneField } from "../forms/fields/phone-field"
import { FlowFooter } from "./flow-footer"
import { FormSection } from "../forms/form-section"
import { PaigeLogo, StubLink } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { SetupBeat } from "../templates/setup-beat"

/* About you: Essential Setup step 1 of 6. A SetupBeat at the focused width: the intro, then two
   blocks of fields. The first has no heading; the second sits under a FormSection heading
   ("Where you live", with its rule and a pin). FlowFooter: Back to Welcome, Continue.
   One frame, two fillings: the Wireframe fills the blocks with placeholders, Desktop and Phone
   with the fields. Copy from the prototype; structure as the Vue app's VaultAboutYouStep. The
   home address is an AddressField on the fixture street book (type "Ashcroft" or "Willow"). */
type AboutYouSlots = {
  details: ReactNode
  residence: ReactNode
}

function AboutYouFrame({ details, residence }: AboutYouSlots) {
  return (
    <SetupBeat
      logo={<PaigeLogo />}
      step={1}
      total={6}
      density="roomy"
      exit={
        <Button asChild variant="quiet" size="inline">
          <StubLink href="#vault">Save and finish later</StubLink>
        </Button>
      }
      eyebrow="About you"
      eyebrowTone="primary"
      title="First, a little about you."
      lede="Let’s start with your name as it appears on your ID, and where you live."
      footer={<FlowFooter linkAs={StubLink} backHref="#welcome" ctaLabel="Continue" ctaHref="#roles" ctaDisabled />}
    >
      {details}
      <FormSection title="Where you live" icon={<MapPinIcon />} density="roomy">
        {residence}
      </FormSection>
    </SetupBeat>
  )
}

const wireframe: AboutYouSlots = {
  details: <Placeholder size="lg" label="Fields · legal name, what to call you, mobile" measure />,
  residence: <Placeholder size="lg" label="Fields · home address, own or rent" measure />,
}

const content: AboutYouSlots = {
  details: (
    <FieldGroup density="roomy">
      <Field name="legalName">
        <FieldLabel>Legal name</FieldLabel>
        <Input placeholder="First, middle, and last name" autoComplete="name" />
        <FieldDescription>As it appears on your ID.</FieldDescription>
      </Field>
      <Field name="preferredName" span={6}>
        <FieldLabel>
          What should we call you?
          <Badge tone="neutral" size="xs" className="ml-auto normal-case">Optional</Badge>
        </FieldLabel>
        <Input placeholder="The name you go by" />
      </Field>
      <Field name="mobile" span={6}>
        <FieldLabel>Mobile number</FieldLabel>
        <PhoneField />
        <FieldDescription>This is the number we and the people you name will use to reach you.</FieldDescription>
        <FieldError />
      </Field>
    </FieldGroup>
  ),
  residence: (
    <FieldGroup density="roomy">
      <Field name="address">
        <FieldLabel>Your home address</FieldLabel>
        <AddressField source={FIXTURE_ADDRESSES} />
      </Field>
      <Field name="ownOrRent" span={6}>
        <FieldLabel>Do you own or rent your home?</FieldLabel>
        <Select
          placeholder="Choose one"
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
      </Field>
    </FieldGroup>
  ),
}

const meta = {
  parameters: { layout: "fullscreen" },
  render: () => <AboutYouFrame {...content} />,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The page's blocks as measured placeholders: what goes where, and how big each slot is. */
export const Wireframe: Story = {
  render: () => <AboutYouFrame {...wireframe} />,
  globals: { viewport: { value: "w1280", isRotated: false } },
}

export const Desktop: Story = { globals: { viewport: { value: "w1280", isRotated: false } } }

export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }
