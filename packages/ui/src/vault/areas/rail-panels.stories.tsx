import type { Meta, StoryObj } from "@storybook/react-vite"

import { StubLink } from "../../stories/fixtures"
import { RailPanels, type RailPanel } from "./rail-panels"

/* RailPanels: the right rail as data (one list of Panels with rows or links). Shown at the
   rail's width (336). */
const PANELS: RailPanel[] = [
  {
    id: "left",
    title: "What’s left",
    count: "2",
    rows: [
      { kind: "status", status: "open", label: "A guardian for Elena", detail: "Who would raise Elena", href: "#guardian" },
      { kind: "status", status: "partial", label: "Life insurance", detail: "Policy found, beneficiary missing", href: "#life" },
    ],
  },
  {
    id: "people",
    title: "People",
    more: { label: "See all", href: "#people" },
    rows: [
      { kind: "person", name: "Daniel Reyes", detail: "Spouse", reach: { label: "(555) 555-0100", href: "#call" } },
      { kind: "person", name: "Dr. Priya Shah", detail: "Family doctor", note: "No number yet" },
    ],
  },
  {
    id: "docs",
    title: "Documents here",
    rows: [{ kind: "document", name: "Birth certificate (Elena)", detail: "Uploaded 3 Oct", tag: { label: "Read", tone: "success" }, href: "#doc" }],
  },
  {
    id: "links",
    title: "Also on",
    variant: "muted",
    links: [
      { label: "Health", href: "#health", area: "health" },
      { label: "Estate & Will", href: "#estate", area: "estate" },
    ],
  },
]

const meta = {
  component: RailPanels,
  args: { panels: PANELS, linkAs: StubLink },
  decorators: [(S) => <div data-area="family" className="flex w-rail flex-col gap-4"><S /></div>],
} satisfies Meta<typeof RailPanels>

export default meta
type Story = StoryObj<typeof meta>

export const Rail: Story = {}
