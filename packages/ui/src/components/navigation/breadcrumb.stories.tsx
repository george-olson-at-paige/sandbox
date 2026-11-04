import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { StubLink } from "../../stories/fixtures"
import { PageHeader } from "../../templates/page-header"
import { Breadcrumb } from "./breadcrumb"

/* Breadcrumb (R20-15): the trail from the top of a section to the page you are on. Earlier
   levels are muted links, the last is the page. A trail longer than `maxItems` keeps its first
   level and the last ones and puts the rest behind an ellipsis button, so no level is out of
   reach. */
const meta = {
  component: Breadcrumb,
  tags: ["r20-15"],
  args: {
    items: [{ label: "Vault", href: "/vault" }, { label: "Documents", href: "/vault/documents" }, { label: "Insurance" }],
    linkAs: StubLink,
  },
  argTypes: { linkAs: { control: false }, items: { control: "object" } },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

/** Two links and the page. The page is not a link; it carries `aria-current`. */
export const ThreeLevels: Story = {
  name: "Trail · three levels",
  tags: ["play-fn"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" })
    await expect(within(nav).getAllByRole("listitem").filter((li) => li.dataset.slot === "breadcrumb-item")).toHaveLength(3)
    await expect(within(nav).getByRole("link", { name: "Vault" })).toHaveAttribute("href", "/vault")
    await expect(within(nav).getByRole("link", { name: "Documents" })).toHaveAttribute("href", "/vault/documents")
    const page = within(nav).getByText("Insurance")
    await expect(page).toHaveAttribute("aria-current", "page")
    await expect(page).toHaveClass("font-medium")
    // Nothing is hidden, so there is no ellipsis button.
    await expect(within(nav).queryByRole("button")).toBeNull()
  },
}

/** Five levels: the first, an ellipsis, the last two. The ellipsis opens a menu of the hidden levels as links; Escape closes it and puts focus back on the button. */
export const Collapsed: Story = {
  name: "Trail · collapsed",
  tags: ["play-fn"],
  args: {
    items: [
      { label: "Vault", href: "/vault" },
      { label: "Documents", href: "/vault/documents" },
      { label: "Insurance", href: "/vault/documents/insurance" },
      { label: "Home policies", href: "/vault/documents/insurance/home" },
      { label: "2026 renewal" },
    ],
  },
  decorators: [(S) => <div className="min-h-48"><S /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" })
    // First level, the ellipsis, then the last two; the hidden two are not in the trail.
    await expect(within(nav).getByRole("link", { name: "Vault" })).toBeInTheDocument()
    await expect(within(nav).getByRole("link", { name: "Home policies" })).toBeInTheDocument()
    await expect(within(nav).getByText("2026 renewal")).toHaveAttribute("aria-current", "page")
    await expect(within(nav).queryByRole("link", { name: "Documents" })).toBeNull()
    await expect(within(nav).queryByRole("link", { name: "Insurance" })).toBeNull()

    const more = within(nav).getByRole("button", { name: "Show 2 hidden levels" })
    await userEvent.click(more)
    const documents = await body.findByRole("menuitem", { name: "Documents" })
    await expect(documents).toHaveAttribute("href", "/vault/documents")
    await expect(body.getByRole("menuitem", { name: "Insurance" })).toHaveAttribute("href", "/vault/documents/insurance")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Documents" })).toBeNull())
    await expect(more).toHaveFocus()
  },
}

/** `maxItems` is the caller's: here a narrow column asks for two, so a four-level trail keeps the first and the page. */
export const NarrowContainer: Story = {
  name: "Trail · maxItems for a narrow column",
  tags: ["play-fn"],
  args: {
    maxItems: 2,
    items: [
      { label: "Vault", href: "/vault" },
      { label: "People", href: "/vault/people" },
      { label: "Contacts", href: "/vault/people/contacts" },
      { label: "Dana Whitfield" },
    ],
  },
  decorators: [(S) => <div className="min-h-48 w-72"><S /></div>],
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Breadcrumb" })
    await expect(within(nav).getByRole("button", { name: "Show 2 hidden levels" })).toBeInTheDocument()
    await expect(within(nav).getByText("Dana Whitfield")).toHaveAttribute("aria-current", "page")
    await expect(within(nav).queryByRole("link", { name: "People" })).toBeNull()
  },
}

/** Above a PageHeader, as a page uses it: the trail names where the page sits, the title says what it is. The landmark gets its own name so a page with a second trail can tell them apart. */
export const InAPageHeader: Story = {
  name: "In a page header",
  tags: ["play-fn"],
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        {...args}
        label="You are here"
        items={[{ label: "Vault", href: "/vault" }, { label: "Passwords", href: "/vault/passwords" }, { label: "Streaming" }]}
      />
      <PageHeader title="Streaming" description="Logins for the shows and music you pay for." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole("navigation", { name: "You are here" })
    await expect(within(nav).getByRole("link", { name: "Passwords" })).toBeInTheDocument()
    await expect(within(nav).getByText("Streaming")).toHaveAttribute("aria-current", "page")
    await expect(canvas.getByRole("heading", { level: 1, name: "Streaming" })).toBeInTheDocument()
    // A link in the trail takes focus with the ring, in order: Vault first.
    await userEvent.tab()
    await expect(within(nav).getByRole("link", { name: "Vault" })).toHaveFocus()
  },
}
