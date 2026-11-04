import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileTextIcon, PlusIcon } from "lucide-react"

import { StubLink } from "../stories/fixtures"
import { Button } from "../components/actions/button"
import { Placeholder } from "../stories/placeholder"
import { AreaIcon } from "../vault/areas/area-icon"
import { Page } from "./page"
import { PageHeader } from "./page-header"

const meta = {
  component: PageHeader,
  args: { linkAs: StubLink },
  parameters: { layout: "fullscreen" },
  /* Shown inside Page (R1-23): the header takes the page frame and its gutter. */
  decorators: [(S) => <Page><S /></Page>],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Slots: Story = {
  name: "Slots (placeholders)",
  args: {
    back: { href: "#vault", label: "Back" },
    icon: <Placeholder size="fill" label="Icon" className="size-14 px-0" />,
    title: "Title",
    description: <Placeholder size="xs" label="Description" className="mt-1 max-w-md" />,
    meta: "Meta",
    actions: <Placeholder size="sm" label="Actions" className="w-32" />,
    lead: <Placeholder size="sm" label="Lead line" className="max-w-2xl" />,
  },
}

export const Example: Story = {
  args: {
    back: { href: "#vault", label: "Vault" },
    icon: <span data-area="family"><AreaIcon area="family" size="xl" /></span>,
    title: "Family",
    description: "The people who depend on you, and who you’d want to step in.",
    meta: "4 saved",
    actions: <Button variant="secondary" size="sm" icon={<FileTextIcon />}>Add a document</Button>,
    lead: "Elena still needs a guardian. Everything else here can wait.",
  },
}

/** Phone (375): meta and actions move below the title. */
export const Narrow: Story = {
  tags: ["!autodocs"],
  name: "Phone · 375",
  globals: { viewport: { value: "w375", isRotated: false } },
  args: Example.args,
}

/** Compact (VIEWS-PLAN.md §1a): a WorkspacePage band's header. No rule of its own (the band draws it), a smaller title, the row centred. */
export const Compact: Story = {
  args: {
    density: "compact",
    icon: <span data-area="family"><AreaIcon area="family" size="lg" /></span>,
    title: "People",
    description: "Everyone in your Vault, and what each of them does for you.",
    meta: "7 people",
    actions: <Button size="sm" icon={<PlusIcon />}>Add someone</Button>,
  },
}
