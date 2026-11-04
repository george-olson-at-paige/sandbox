import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../components/actions/button"
import { PageIntro } from "./page-intro"

const meta = {
  component: PageIntro,
  args: {
    eyebrow: "Good morning, Maya",
    title: "Here’s where your Vault stands",
    lede: "Three Areas are set up. Family is next: a guardian for Elena would close the biggest gap.",
  },
} satisfies Meta<typeof PageIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const PrimaryEyebrow: Story = {
  name: "Eyebrow tone primary",
  args: { eyebrowTone: "primary", eyebrow: "Step 1 of 6 · About you", title: "First, a little about you." },
}
export const WithActions: Story = {
  name: "With actions",
  args: { actions: <><Button variant="secondary">Browse</Button><Button>Continue setup</Button></> },
}
export const TitleOnly: Story = { name: "Title only", args: { eyebrow: undefined, lede: undefined } }
export const Question: Story = {
  name: "Setup beat question",
  args: { eyebrow: "Step 2 of 6", title: "Which of these are true for you?", lede: "Pick as many as fit. This decides what we ask next." },
}
