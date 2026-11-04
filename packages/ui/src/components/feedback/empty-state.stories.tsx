import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { FileSearchIcon, FolderOpenIcon, TriangleAlertIcon, WorkflowIcon } from "lucide-react"

import { Button } from "../actions/button"
import { EmptyState } from "./empty-state"

/* EmptyState (U-03, R20-07): the one "nothing here" DataTable, ListPage and DagFrame show; `kind`
   says why. `size` is the place: sm in a table, md in a pane, lg on a page. */
const meta = {
  component: EmptyState,
  args: { title: "Nothing to show yet." },
  decorators: [(S) => <div className="rounded-lg border bg-card"><S /></div>],
  tags: ["u-03", "r20-07"],
  parameters: {
    docs: {
      description: {
        component: [
          "The one “nothing here”. `kind` says why it is empty (nothing yet, no results, error); `size` says where it sits.",
          "",
          "- **In a table** (`sm`, the default): one muted line in a table's body, with an action only when there is a next step (Clear all, Try again).",
          "- **In a pane** (`md`): a card or side panel; the base's 18px title and a description, with room around it.",
          "- **A page** (`lg`): the whole page has nothing to show; an icon in a 48px disc, a 20px title, one line of description, up to two actions side by side.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/* ---------- In a table (sm) ---------- */

export const NothingYet: Story = {
  name: "In a table · nothing yet",
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="empty-state"]')!
    await expect(root).toHaveAttribute("data-kind", "nothing-yet")
    await expect(root).toHaveAttribute("data-size", "sm")
    await expect(root).not.toHaveAttribute("role")
    await expect(within(root).getByText("Nothing to show yet.")).toBeInTheDocument()
  },
}

export const NoResults: Story = {
  name: "In a table · no results, with Clear all",
  args: {
    kind: "no-results",
    title: "No people match “smith” in Trial.",
    actions: (
      <Button variant="secondary" size="sm">
        Clear all
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("button", { name: "Clear all" })).toBeInTheDocument()
    await expect(canvasElement.querySelector('[data-slot="empty-state"]')).toHaveAttribute("data-kind", "no-results")
  },
}

export const Failed: Story = {
  name: "In a table · error, with Try again",
  args: {
    kind: "error",
    title: "We couldn’t load the runs.",
    actions: (
      <Button variant="secondary" size="sm">
        Try again
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // An error is assertive, and its title takes the attention ink.
    await expect(c.getByRole("alert")).toHaveTextContent("We couldn’t load the runs.")
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="empty-title"]')!
    await expect(getComputedStyle(title).color).not.toBe(getComputedStyle(canvasElement.querySelector<HTMLElement>('[data-slot="empty-state"]')!).color)
  },
}

export const WithIcon: Story = {
  name: "In a table · with a glyph (DagFrame's)",
  args: { icon: <WorkflowIcon />, title: "Nothing has run yet" },
  play: async ({ canvasElement }) => {
    const disc = canvasElement.querySelector<HTMLElement>('[data-slot="empty-icon"]')!
    const { width, height } = disc.getBoundingClientRect()
    // A 40px round disc with a 20px glyph.
    await expect(width).toBe(40)
    await expect(height).toBe(40)
    await expect(getComputedStyle(disc).borderRadius).not.toBe("0px")
    await expect(disc.querySelector("svg")!.getBoundingClientRect().width).toBe(20)
  },
}

/* ---------- In a pane (md) ---------- */

const documentActions = (
  <>
    <Button size="sm">Upload a document</Button>
    <Button variant="secondary" size="sm">
      Scan with your phone
    </Button>
  </>
)

export const PaneNothingYet: Story = {
  name: "In a pane · nothing yet",
  args: {
    size: "md",
    icon: <FolderOpenIcon />,
    title: "No documents yet",
    description: "Wills, deeds and policies you add show here.",
    actions: documentActions,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="empty-state"]')).toHaveAttribute("data-size", "md")
    const disc = canvasElement.querySelector<HTMLElement>('[data-slot="empty-icon"]')!
    await expect(disc.getBoundingClientRect().width).toBe(40)
  },
}

export const PaneNoResults: Story = {
  name: "In a pane · no results",
  args: {
    size: "md",
    kind: "no-results",
    icon: <FileSearchIcon />,
    title: "No documents match “deed”",
    description: "Try another word, or clear the search.",
    actions: (
      <Button variant="secondary" size="sm">
        Clear all
      </Button>
    ),
  },
}

export const PaneFailed: Story = {
  name: "In a pane · error",
  args: {
    size: "md",
    kind: "error",
    icon: <TriangleAlertIcon />,
    title: "We couldn’t load your documents",
    description: "Check your connection and try again.",
    actions: (
      <Button variant="secondary" size="sm">
        Try again
      </Button>
    ),
  },
}

/* ---------- A page (lg) ---------- */

export const PageNothingYet: Story = {
  name: "A page · nothing yet",
  args: {
    size: "lg",
    icon: <FolderOpenIcon />,
    title: "No documents yet",
    description: "Wills, deeds and policies you add show here.",
    actions: (
      <>
        <Button>Upload a document</Button>
        <Button variant="secondary">Scan with your phone</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="empty-state"]')!
    await expect(root).toHaveAttribute("data-size", "lg")
    // A 48px round disc with a 24px glyph.
    const disc = canvasElement.querySelector<HTMLElement>('[data-slot="empty-icon"]')!
    await expect(disc.getBoundingClientRect().width).toBe(48)
    await expect(disc.getBoundingClientRect().height).toBe(48)
    await expect(getComputedStyle(disc).borderRadius).not.toBe("0px")
    await expect(disc.querySelector("svg")!.getBoundingClientRect().width).toBe(24)
    // The title is 20px, larger than the pane's 18px.
    await expect(getComputedStyle(canvasElement.querySelector('[data-slot="empty-title"]')!).fontSize).toBe("20px")
    // Two actions side by side, centred under the text.
    const upload = c.getByRole("button", { name: "Upload a document" }).getBoundingClientRect()
    const scan = c.getByRole("button", { name: "Scan with your phone" }).getBoundingClientRect()
    await expect(Math.abs(upload.top - scan.top)).toBeLessThanOrEqual(1)
    await expect(scan.left).toBeGreaterThan(upload.right)
  },
}

export const PageNoResults: Story = {
  name: "A page · no results",
  args: {
    size: "lg",
    kind: "no-results",
    icon: <FileSearchIcon />,
    title: "No documents match “deed”",
    description: "Try another word, or clear the search.",
    actions: <Button variant="secondary">Clear all</Button>,
  },
}

export const PageFailed: Story = {
  name: "A page · error",
  args: {
    size: "lg",
    kind: "error",
    icon: <TriangleAlertIcon />,
    title: "We couldn’t load your documents",
    description: "Check your connection and try again.",
    actions: <Button variant="secondary">Try again</Button>,
  },
}
