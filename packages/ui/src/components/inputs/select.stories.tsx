import type { Meta, StoryObj } from "@storybook/react-vite"
import { BriefcaseIcon, ChevronDownIcon, HeartIcon, HomeIcon, PawPrintIcon, UsersIcon } from "lucide-react"

import { Button } from "../actions/button"
import { DropdownMenu } from "../actions/dropdown-menu"
import { Field, FieldLabel } from "../../forms/field"
import { Select } from "./select"

/* Select (R1-20, R1-25, R3-16): the one single-choice control, data-driven. With a mouse it
   is the styled popover: DropdownMenu's look, 8px below the trigger, start-aligned, never over
   it; the caret, the check on the selected option and the scroll buttons are upstream's. Group
   labels are eyebrows in ink; grouped options are indented. On touch it renders the browser's
   own <select> (the phone's picker) with the same props; `presentation` forces either form.
   Open states (R3-17) are tagged `!autodocs`: an open Radix Select locks page scroll, so they
   show in single-story view (the sidebar) and never on the docs page. */
const RELATIONSHIPS = [
  { label: "Family", options: [{ value: "spouse", label: "Spouse or partner" }, { value: "child", label: "Child" }, { value: "parent", label: "Parent" }] },
  { label: "Other", options: [{ value: "friend", label: "Friend" }, { value: "advisor", label: "Advisor", disabled: true }] },
]

const meta = {
  tags: ["r3-17", "r3-16"],
  component: Select,
  args: { "aria-label": "Relationship", placeholder: "Choose", groups: RELATIONSHIPS, side: "bottom", align: "start" },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
  },
  decorators: [(S) => <div className="max-w-sm min-h-96"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          "One Select for every single choice. A fine pointer (mouse, trackpad) gets the styled list; a coarse pointer (touch) gets the browser's own `<select>`, so phones open their OS picker. Same props either way; `presentation=\"native\"` or `\"popover\"` forces one. Open states are in the sidebar only (an open list locks page scroll, so docs pages never mount one open).\n\n**Options must make sense as text alone** (R4-16). On touch the native picker shows only each option's text: icons and any other rich content are dropped, and an element label falls back to its value. Icons are decoration on desktop; write every label so the choice is clear without them.",
      },
    },
  },
} satisfies Meta<typeof Select>

/* Open states live in single-story view only (R3-17): tagged "!autodocs" (tags must be
   literals; the indexer reads them statically). */

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {}
export const Selected: Story = { args: { defaultValue: "child" } }
/** Groups · open (bold label, indented options, check on the selected one) */
export const GroupsOpen: Story = {
  tags: ["!autodocs"],
  name: "Groups · open",
  args: { defaultValue: "child", defaultOpen: true },
}
export const FlatOptions: Story = {
  name: "Flat options",
  args: { groups: undefined, options: [{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }], placeholder: "Choose one" },
}
export const WithIcons: Story = {
  tags: ["!autodocs"],
  name: "Options with icons · open",
  args: {
    groups: undefined,
    defaultOpen: true,
    defaultValue: "family",
    options: [
      { value: "personal", label: "Personal", icon: <HeartIcon /> },
      { value: "family", label: "Family", icon: <UsersIcon /> },
      { value: "household", label: "Household", icon: <HomeIcon /> },
      { value: "pets", label: "Pets", icon: <PawPrintIcon /> },
      { value: "work", label: "Work", icon: <BriefcaseIcon /> },
    ],
  },
}
export const Error: Story = { name: "Error (aria-invalid)", args: { "aria-invalid": true } }
export const Disabled: Story = { args: { disabled: true, defaultValue: "spouse" } }

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
]

export const LongList: Story = {
  tags: ["!autodocs"],
  name: "Long list · open (scroll buttons)",
  args: {
    "aria-label": "State",
    groups: undefined,
    placeholder: "Choose a state",
    defaultOpen: true,
    options: STATES.map((s) => ({ value: s.toLowerCase().replace(/\s+/g, "-"), label: s })),
  },
}

export const SideTop: Story = {
  tags: ["!autodocs"],
  name: "Direction · side top, align end",
  args: { defaultOpen: true, side: "top", align: "end", defaultValue: "friend" },
  decorators: [(S) => <div className="pt-64"><S /></div>],
}
export const SideRight: Story = { tags: ["!autodocs"], name: "Direction · side right", args: { defaultOpen: true, side: "right", defaultValue: "parent" } }

/* The two popovers side by side: same gap, surface, padding, item rows, icons and check. */
export const MatchesDropdownMenu: Story = {
  tags: ["!autodocs"],
  name: "Matches DropdownMenu (both open)",
  render: () => (
    <div className="grid w-xl grid-cols-2 items-start gap-6">
      <Select
        aria-label="Area"
        defaultOpen
        defaultValue="family"
        options={[
          { value: "personal", label: "Personal", icon: <HeartIcon /> },
          { value: "family", label: "Family", icon: <UsersIcon /> },
          { value: "household", label: "Household", icon: <HomeIcon /> },
        ]}
      />
      <DropdownMenu
        defaultOpen
        modal={false}
        align="start"
        trigger={<Button variant="secondary" icon={<ChevronDownIcon />} iconPosition="end">Area</Button>}
        items={[
          {
            kind: "radio-group",
            value: "family",
            onValueChange: () => {},
            options: [
              { value: "personal", label: "Personal", icon: <HeartIcon /> },
              { value: "family", label: "Family", icon: <UsersIcon /> },
              { value: "household", label: "Household", icon: <HomeIcon /> },
            ],
          },
        ]}
      />
    </div>
  ),
}

export const Native: Story = {
  name: "Native form (what touch devices get)",
  args: { presentation: "native" },
}
export const NativeSelected: Story = { name: "Native form · selected", args: { presentation: "native", defaultValue: "child" } }
export const NativeError: Story = { name: "Native form · error", args: { presentation: "native", "aria-invalid": true } }
export const NativeLongList: Story = {
  name: "Native form · long list",
  args: {
    presentation: "native",
    "aria-label": "State",
    groups: undefined,
    placeholder: "Choose a state",
    options: STATES.map((s) => ({ value: s.toLowerCase().replace(/\s+/g, "-"), label: s })),
  },
}

export const SideBySide: Story = {
  name: "Popover and native forms side by side",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="s-select">
        <FieldLabel>Popover (fine pointer)</FieldLabel>
        <Select presentation="popover" placeholder="Choose one" options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]} />
      </Field>
      <Field id="s-native">
        <FieldLabel>Native (touch)</FieldLabel>
        <Select presentation="native" placeholder="Choose one" options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]} />
      </Field>
    </div>
  ),
}
