import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"
import { ArrowRightIcon, ClockIcon, FileTextIcon, KeyRoundIcon, UsersIcon } from "lucide-react"

import { Button } from "../components/actions/button"
import { Callout } from "../components/feedback/callout"
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "../components/display/item"
import { PageIntro } from "../patterns/page-intro"
import { Grid } from "../primitives/grid"
import { Stack } from "../primitives/stack"
import { PaigeLogo, StubLink } from "../stories/fixtures"
import { Placeholder, PlaceholderImage } from "../stories/placeholder"
import { Page } from "../templates/page"
import { SetupBar } from "../templates/setup-beat"

/* Welcome: the Essential Setup page before About you. It has no step and no question, so it
   is not a SetupBeat, but it shares the beats' bar (SetupBar, without the StepRail) and their
   roomy wide page. The page is split into two equal columns, the column gap (24) apart: the
   content (intro, what we'll do, callout, actions) and the illustration. Below lg they stack
   in source order, content first; nothing inside them is reordered.
   One frame, two fillings: the Wireframe fills the slots with placeholders, Desktop and Phone
   with the page's content, so the wireframe can't drift from the page. The first Wireframe
   drawn as a plan (Placeholder's default since REVIEW-18 § Guides, George 2026-10-30). */
type WelcomeSlots = {
  intro: ReactNode
  steps: ReactNode
  callout: ReactNode
  actions: ReactNode
  illustration: ReactNode
}

function WelcomeFrame({ intro, steps, callout, actions, illustration }: WelcomeSlots) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SetupBar
        logo={<PaigeLogo />}
        exit={
          <Button asChild variant="quiet" size="inline">
            <StubLink href="#vault">Save and finish later</StubLink>
          </Button>
        }
      />
      <Page width="wide" top="roomy">
        <Grid columns={{ base: 1, lg: 2 }} gap="column">
          <Stack gap={6}>
            {intro}
            {steps}
            {callout}
            {actions}
          </Stack>
          {illustration}
        </Grid>
      </Page>
    </div>
  )
}

const wireframe: WelcomeSlots = {
  intro: <Placeholder size="lg" label="Intro · eyebrow, title, lede" measure />,
  steps: <Placeholder size="lg" label="What we’ll do · three items" measure />,
  callout: <Placeholder label="Callout" measure />,
  actions: <Placeholder label="Actions · get started, will path" measure />,
  illustration: <PlaceholderImage label="Illustration" measure />,
}

const steps = [
  { icon: <UsersIcon />, title: "Tell us who counts on you." },
  { icon: <FileTextIcon />, title: "Add what they’d need to find." },
  { icon: <KeyRoundIcon />, title: "Choose who can open it when the time comes." },
]

const content: WelcomeSlots = {
  intro: (
    <PageIntro
      eyebrow="Welcome to Paige"
      title="Let’s start with you and your loved ones"
      lede="A few quick questions will help us build your plan around the people who count on you. We’ll start with what they’ll need first."
    />
  ),
  steps: (
    <ItemGroup dividers={false} label="What we’ll do together">
      {steps.map((s) => (
        <Item key={s.title} density="compact">
          <ItemMedia variant="icon">{s.icon}</ItemMedia>
          <ItemContent>
            <ItemTitle>{s.title}</ItemTitle>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
  callout: (
    <Callout icon={<ClockIcon />}>
      It takes about ten minutes over six short steps, and you can stop and come back any time.
    </Callout>
  ),
  actions: (
    <Stack gap={4} align="start">
      <Button asChild icon={<ArrowRightIcon />} iconPosition="end">
        <StubLink href="#about-you">Let’s get started</StubLink>
      </Button>
      <p className="text-sm text-body-muted">
        Need to make a will first?{" "}
        <Button asChild variant="link" size="inline">
          <StubLink href="#will">Start your will</StubLink>
        </Button>
        . We’ll bring you back here afterward.
      </p>
    </Stack>
  ),
  illustration: <PlaceholderImage label="Illustration" measure />,
}

const meta = {
  parameters: { layout: "fullscreen" },
  render: () => <WelcomeFrame {...content} />,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The page's blocks as measured placeholders: what goes where, and how big each slot is. */
export const Wireframe: Story = {
  render: () => <WelcomeFrame {...wireframe} />,
  globals: { viewport: { value: "w1280", isRotated: false } },
}

export const Desktop: Story = { globals: { viewport: { value: "w1280", isRotated: false } } }

export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w375", isRotated: false } } }
