import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CheckCircle2Icon, ClockIcon, InfoIcon, LightbulbIcon, StickyNoteIcon, TriangleAlertIcon } from "lucide-react"

import { Callout, CalloutAction } from "./callout"
import { Button } from "../actions/button"
import { StubLink } from "../../stories/fixtures"

const icons = {
  neutral: <StickyNoteIcon />,
  info: <InfoIcon />,
  success: <CheckCircle2Icon />,
  attention: <TriangleAlertIcon />,
} as const

const meta = {
  component: Callout,
  args: {
    tone: "info",
    icon: icons.info,
    title: "Three details need a look",
    children: "We found them in your uploaded documents. Check them before you share this Area.",
    actions: <CalloutAction>Review</CalloutAction>,
  },
  argTypes: {
    tone: { control: "select", options: ["neutral", "info", "success", "attention"] },
    icon: { control: false },
    actions: { control: false },
  },
  decorators: [(S) => <div className="max-w-3xl"><S /></div>],
  tags: ["r4-14", "gaps-22", "r2-35", "d-05", "d-19"],
  parameters: {
    docs: {
      description: {
        component:
          "**Callout** (D-05, D-19, George 2026-10-30): one surface for a note or a report, over the Alert base. It was Message (not Alert, R4-14: \"alert\" also means the browser's `alert()`, the confirm dialog and the assertive role) plus a separate tone-less Callout; \"Message\" is a Paige product noun and, on shadcn.io, a chat bubble, so the markdown word won. The live-region role follows the tone: `note` for neutral (not announced), `status` (polite) for info and success, `alert` (assertive) only for attention, the tone failures use. Not a toast and not a dialog.",
      },
    },
  },
} satisfies Meta<typeof Callout>

export default meta
type Story = StoryObj<typeof meta>

/** The note: neutral, no title — Welcome's "about ten minutes" line. role="note", so nothing is announced. */
export const Note: Story = {
  args: { tone: "neutral", icon: <ClockIcon />, title: undefined, children: "It takes about ten minutes over six short steps, and you can stop and come back any time.", actions: undefined },
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
}

/** A note with a heading and a link out. */
export const NoteWithTitle: Story = {
  name: "Note with title and action",
  args: {
    tone: "neutral",
    icon: <LightbulbIcon />,
    title: "Add a second executor",
    children: "If your first choice can’t act, a backup keeps things moving.",
    actions: (
      <Button asChild variant="link" size="inline">
        <StubLink href="#executor">Add one</StubLink>
      </Button>
    ),
  },
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
}

export const Neutral: Story = { args: { tone: "neutral", icon: icons.neutral } }
export const Info: Story = { args: { tone: "info", icon: icons.info } }
export const Success: Story = { args: { tone: "success", icon: icons.success } }
export const Attention: Story = { args: { tone: "attention", icon: icons.attention } }

/* CalloutAction: the white button, and muted for the outline. Both pass down to Button. */
export const ActionsOnEachTone: Story = {
  name: "Actions on each tone",
  tags: ["r3-06"],
  render: () => (
    <div className="flex flex-col gap-3">
      {(Object.keys(icons) as Array<keyof typeof icons>).map((tone) => (
        <Callout
          key={tone}
          tone={tone}
          icon={icons[tone]}
          title="Some of what you told us is in more than one place"
          actions={
            <>
              <CalloutAction>Compare</CalloutAction>
              <CalloutAction variant="muted">Not now</CalloutAction>
            </>
          }
        />
      ))}
    </div>
  ),
}

export const TitleOnly: Story = {
  name: "Title only",
  args: { tone: "success", icon: icons.success, title: "Family is set up", children: undefined, actions: undefined },
}

/** Long content: the actions follow the text, on their own line, at any width. */
export const LongContent: Story = {
  name: "Long content",
  tags: ["r1-06"],
  render: () => (
    <Callout
      tone="info"
      icon={icons.info}
      title="Some of what you told us is in more than one place"
      actions={
        <>
          <CalloutAction>Compare</CalloutAction>
          <Button size="sm" variant="quiet">Not now</Button>
        </>
      }
    >
      Your will and your insurance policy name different beneficiaries. That can be fine, but if it is not what you meant, the
      documents will not agree when someone needs them.
    </Callout>
  ),
}

function Dismissible() {
  const [open, setOpen] = useState(true)
  return open ? (
    <Callout tone="info" icon={icons.info} title="Three details read from your driver’s licence." onDismiss={() => setOpen(false)}>
      Have a look and correct anything we got wrong.
    </Callout>
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Show the callout again</Button>
  )
}

export const Dismiss: Story = {
  name: "Dismiss slot",
  render: () => <Dismissible />,
}

export const Unframed: Story = {
  name: "Unframed (inside a band)",
  render: () => (
    <div className="rounded-lg bg-muted p-4">
      <Callout framed={false} title="The sections you know are still here." onDismiss={() => {}}>
        Paige is now organised around areas of your life.
      </Callout>
    </div>
  ),
}
