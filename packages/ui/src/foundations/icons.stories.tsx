import type { ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Description, Stories, Title } from "@storybook/addon-docs/blocks"
import {
  Activity,
  ArrowDown,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUp,
  ArrowUpRight,
  BadgeDollarSign,
  BellIcon,
  BoldIcon,
  Building2,
  CalendarIcon,
  CalendarPlus,
  CameraIcon,
  ChartLine,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleGauge,
  CircleIcon,
  ClockIcon,
  Columns3,
  CornerUpLeftIcon,
  CreditCard,
  GripVerticalIcon,
  IdCardIcon,
  ImageUp,
  InfoIcon,
  ItalicIcon,
  KeyRound,
  Link2,
  LightbulbIcon,
  LinkIcon,
  ListChecks,
  ListFilter,
  ListIcon,
  ListOrderedIcon,
  Loader2Icon,
  LockOpen,
  Mail,
  Maximize2Icon,
  Megaphone,
  Minimize2Icon,
  MoreHorizontal,
  OctagonXIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PanelLeftOpenIcon,
  PawPrintIcon,
  PlusIcon,
  Power,
  PowerOff,
  RotateCcwIcon,
  RotateCw,
  Route,
  ScanIcon,
  SearchIcon,
  Settings,
  StickyNoteIcon,
  Tags,
  TicketPercent,
  TrendingDown,
  TrendingUp,
  TriangleAlertIcon,
  UserRound,
  Users,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"

import { Attachment } from "../components/display/attachment"
import { Avatar } from "../components/display/avatar"
import { FileIcon } from "../components/display/file-icon"
import { Item, ItemContent, ItemMedia, ItemTitle } from "../components/display/item"
import { StatusMark, type MarkStatus } from "../components/display/status-mark"
import { ACTION_ICONS } from "../labs/icons/action-icons"
import { FILE_KINDS, fileLine, type FileKind, type FileLike } from "../lib/file-kind"
import { AREA_ORDER, AreaGlyph } from "../icons/area-glyphs"
import { VIEW_ORDER, ViewGlyph } from "../icons/view-glyphs"
import { AreaIcon } from "../vault/areas/area-icon"

/* Foundations › Icons. The docs page is the sets, not one of them: area glyphs (stroke),
   view marks (fill), the area glyph on its colour, one lucide icon per action, one outline
   per file kind, the status marks, the callout and alert icons with when to use each,
   and the other lucide icons the package imports.
   Interface omits the icons already shown under Actions, Files and Status. */

function IconsDocs() {
  return (
    <>
      <Title />
      <Description />
      <Stories includePrimary />
    </>
  )
}

const meta = {
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Area glyphs are stroke and view marks are fills, both drawn for a 24px grid. Everything else is lucide: one icon per action, one outline per file kind, the status marks, the callout and alert icons with when to use each, and the interface icons this package uses. Stroke, fill and interface glyphs are shown at 24px. An interface icon in the product is 16px (size-icon).",
      },
      canvas: { sourceState: "none" },
      page: IconsDocs,
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function words(name: string) {
  return name
    .replace(/Icon$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
}

function Cell({ label, children, tile = true }: { label: string; children: ReactNode; tile?: boolean }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 text-center">
      <span
        className={
          tile
            ? "flex size-12 items-center justify-center rounded-lg bg-muted text-foreground [&>svg]:size-icon-xl"
            : "flex min-h-16 items-center justify-center"
        }
      >
        {children}
      </span>
      <span className="text-xs font-medium text-muted-foreground capitalize">{label}</span>
    </div>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8">{children}</div>
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  )
}

/** Stroke, on a 24px grid, in the current colour. One per Life Area. */
export const AreaGlyphs: Story = {
  name: "Area glyphs",
  render: () => (
    <Row>
      {AREA_ORDER.map((area) => (
        <Cell key={area} label={area}>
          <AreaGlyph area={area} />
        </Cell>
      ))}
    </Row>
  ),
}

/** Filled. Will, Documents, Contacts, Business and Passwords. */
export const ViewGlyphs: Story = {
  name: "View marks",
  render: () => (
    <Row>
      {VIEW_ORDER.map((view) => (
        <Cell key={view} label={view}>
          <ViewGlyph view={view} />
        </Cell>
      ))}
    </Row>
  ),
}

/** The area glyph on its Life Area colour. Solid is the fill with a light glyph, soft is the tint, plain is the glyph alone. A tick means the area is set up. Sizes are 20, 32, 44 and 56. */
export const AreaColour: Story = {
  name: "Area colour",
  render: () => (
    <Rows>
      <Row label="Every area, solid">
        {AREA_ORDER.map((area) => (
          <Cell key={area} label={area} tile={false}>
            <AreaIcon area={area} />
          </Cell>
        ))}
      </Row>
      <Row label="Solid, soft, plain, tick">
        {(["solid", "soft", "plain"] as const).map((tone) => (
          <Cell key={tone} label={tone} tile={false}>
            <AreaIcon area="family" tone={tone} />
          </Cell>
        ))}
        <Cell label="tick" tile={false}>
          <AreaIcon area="family" tick />
        </Cell>
      </Row>
      <Row label="Sizes">
        {(
          [
            ["sm", "20"],
            ["md", "32"],
            ["lg", "44"],
            ["xl", "56"],
          ] as const
        ).map(([size, px]) => (
          <Cell key={size} label={px} tile={false}>
            <AreaIcon area="family" size={size} />
          </Cell>
        ))}
      </Row>
    </Rows>
  ),
}

function Use({ icon, when, how }: { icon: ReactNode; when: string; how: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted [&>svg]:size-icon-xl">{icon}</span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-foreground">{when}</p>
        <p className="text-sm font-medium text-muted-foreground">{how}</p>
      </div>
    </div>
  )
}

function UseGroup({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="max-w-prose text-sm font-medium text-muted-foreground">{note}</p>
      </div>
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

/** A callout stays in the page: pass tone and icon, and the tone colours the icon and decides the announcement. A toast arrives and leaves: call toast.info, toast.success, toast.warning, toast.error or toast.loading, and the toaster draws the icon. Loading spins. The page still shows the same state. */
export const Callouts: Story = {
  name: "Callouts and alerts",
  render: () => (
    <Rows>
      <UseGroup title="Stays on the page" note="Pass tone and icon. The tone colours the icon and decides the announcement.">
        <Use when="A note beside the content" how="Pass tone neutral. Nothing is announced." icon={<StickyNoteIcon className="text-muted-foreground" />} />
        <Use when="Something they should know" how="Pass tone info. Announced politely." icon={<InfoIcon className="text-info" />} />
        <Use when="It worked, and the page should keep it" how="Pass tone success. Announced politely." icon={<CheckCircle2Icon className="text-success" />} />
        <Use when="Something to check before they continue" how="Pass tone attention. Announced as an alert." icon={<TriangleAlertIcon className="text-attention" />} />
        <Use when="How long it takes" how="A neutral note, with no heading." icon={<ClockIcon className="text-muted-foreground" />} />
        <Use when="A suggestion" how="A neutral note, with a heading and a link." icon={<LightbulbIcon className="text-muted-foreground" />} />
        <Use when="The form failed" how="Pass tone attention, with a heading and the problems." icon={<CircleAlertIcon className="text-attention" />} />
        <Use when="The message is the failure, and it stays in red" how="Use the destructive alert." icon={<CircleAlertIcon className="text-destructive" />} />
      </UseGroup>
      <UseGroup title="Arrives and leaves" note="Call the toast with its type. The toaster draws the icon. A plain toast has none. The page shows the same state on the thing it is about.">
        <Use when="Something they should know, and it can leave" how="Call toast.info." icon={<InfoIcon className="text-info" />} />
        <Use when="It worked, and it can leave" how="Call toast.success." icon={<CircleCheckIcon className="text-success" />} />
        <Use when="Time is short" how="Call toast.warning." icon={<TriangleAlertIcon className="text-attention" />} />
        <Use when="It failed, and it can leave" how="Call toast.error." icon={<OctagonXIcon className="text-destructive" />} />
        <Use when="Work is in progress" how="Call toast.loading. The icon spins, and the toast has no close button." icon={<Loader2Icon className="animate-spin text-muted-foreground" />} />
      </UseGroup>
    </Rows>
  ),
}

/** One lucide icon per action. A caller names the action. */
export const Actions: Story = {
  render: () => (
    <Row>
      {(Object.entries(ACTION_ICONS) as [string, LucideIcon][]).map(([action, Icon]) => (
        <Cell key={action} label={action}>
          <Icon />
        </Cell>
      ))}
    </Row>
  ),
}

const FILE_SAMPLE: Record<FileKind, FileLike> = {
  image: { name: "IMG_4821.jpg" },
  pdf: { name: "will-2026.pdf" },
  document: { name: "letter.docx" },
  spreadsheet: { name: "accounts.xlsx" },
  archive: { name: "scans.zip" },
  text: { name: "notes.txt" },
  other: { name: "walkthrough.mp4" },
}

/** One outline per kind, in that kind's colour. From 32px, a file with a format shows that word on a band. */
export const Files: Story = {
  render: () => (
    <Rows>
      <Row label="24px, the kind's outline">
        {FILE_KINDS.map((kind) => (
          <Cell key={kind} label={kind} tile={false}>
            <FileIcon kind={kind} className="size-icon-xl" />
          </Cell>
        ))}
      </Row>
      <Row label="40px, the format on a band">
        {FILE_KINDS.map((kind) => (
          <Cell key={kind} label={kind} tile={false}>
            <FileIcon kind={kind} file={FILE_SAMPLE[kind]} className="size-10" />
          </Cell>
        ))}
      </Row>
    </Rows>
  ),
}

const ITEM: MarkStatus[] = ["open", "partial", "present", "declined"]
const WORK: MarkStatus[] = ["waiting", "working", "done", "attention", "skipped", "canceled"]

/** Item statuses, then work statuses. Present takes the Life Area colour of its context. */
export const Status: Story = {
  render: () => (
    <div data-area="family">
      <Rows>
        <Row label="Item">
          {ITEM.map((status) => (
            <Cell key={status} label={status} tile={false}>
              <StatusMark status={status} />
            </Cell>
          ))}
        </Row>
        <Row label="Work">
          {WORK.map((status) => (
            <Cell key={status} label={status} tile={false}>
              <StatusMark status={status} />
            </Cell>
          ))}
        </Row>
      </Rows>
    </div>
  ),
}

/* Lucide icons the package imports, other than the action, file and status glyphs above. */
const INTERFACE: [string, LucideIcon][] = [
  ["Activity", Activity],
  ["ArrowDown", ArrowDown],
  ["ArrowLeftIcon", ArrowLeftIcon],
  ["ArrowRightIcon", ArrowRightIcon],
  ["ArrowUp", ArrowUp],
  ["ArrowUpRight", ArrowUpRight],
  ["BadgeDollarSign", BadgeDollarSign],
  ["BellIcon", BellIcon],
  ["BoldIcon", BoldIcon],
  ["Building2", Building2],
  ["CalendarIcon", CalendarIcon],
  ["CalendarPlus", CalendarPlus],
  ["CameraIcon", CameraIcon],
  ["ChartLine", ChartLine],
  ["ChevronDownIcon", ChevronDownIcon],
  ["ChevronLeftIcon", ChevronLeftIcon],
  ["ChevronRightIcon", ChevronRightIcon],
  ["ChevronUpIcon", ChevronUpIcon],
  ["ChevronsUpDown", ChevronsUpDown],
  ["CircleIcon", CircleIcon],
  ["CircleAlertIcon", CircleAlertIcon],
  ["CircleCheckIcon", CircleCheckIcon],
  ["CircleGauge", CircleGauge],
  ["Columns3", Columns3],
  ["CornerUpLeftIcon", CornerUpLeftIcon],
  ["CreditCard", CreditCard],
  ["GripVerticalIcon", GripVerticalIcon],
  ["IdCardIcon", IdCardIcon],
  ["ImageUp", ImageUp],
  ["InfoIcon", InfoIcon],
  ["ItalicIcon", ItalicIcon],
  ["KeyRound", KeyRound],
  ["LinkIcon", LinkIcon],
  ["Link2", Link2],
  ["ListIcon", ListIcon],
  ["ListChecks", ListChecks],
  ["ListFilter", ListFilter],
  ["ListOrderedIcon", ListOrderedIcon],
  ["Loader2Icon", Loader2Icon],
  ["LockOpen", LockOpen],
  ["Mail", Mail],
  ["Maximize2Icon", Maximize2Icon],
  ["Megaphone", Megaphone],
  ["Minimize2Icon", Minimize2Icon],
  ["MoreHorizontal", MoreHorizontal],
  ["OctagonXIcon", OctagonXIcon],
  ["PanelLeftIcon", PanelLeftIcon],
  ["PanelLeftCloseIcon", PanelLeftCloseIcon],
  ["PanelLeftOpenIcon", PanelLeftOpenIcon],
  ["PawPrintIcon", PawPrintIcon],
  ["PlusIcon", PlusIcon],
  ["Power", Power],
  ["PowerOff", PowerOff],
  ["RotateCcwIcon", RotateCcwIcon],
  ["RotateCw", RotateCw],
  ["Route", Route],
  ["ScanIcon", ScanIcon],
  ["SearchIcon", SearchIcon],
  ["Settings", Settings],
  ["Tags", Tags],
  ["TicketPercent", TicketPercent],
  ["TrendingDown", TrendingDown],
  ["TrendingUp", TrendingUp],
  ["TriangleAlertIcon", TriangleAlertIcon],
  ["UserRound", UserRound],
  ["Users", Users],
  ["WorkflowIcon", WorkflowIcon],
]

/** The other lucide icons this package uses. In the product these are 16px. */
export const Interface: Story = {
  render: () => (
    <Row>
      {INTERFACE.map(([name, Icon]) => (
        <Cell key={name} label={words(name)}>
          <Icon />
        </Cell>
      ))}
    </Row>
  ),
}

/** Show a person as an avatar beside their name, and a document as its file icon beside its name. The name is the text. */
export const Usage: Story = {
  name: "With a person or a document",
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">A person goes in a row as an avatar beside their name. Pass the name; initials stand in until there is a photo.</p>
        <Item>
          <ItemMedia variant="avatar">
            <Avatar name="Maya Reyes" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Maya Reyes</ItemTitle>
          </ItemContent>
        </Item>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">A document goes beside its name as its file icon. From 32px the format sits on the icon.</p>
        <Attachment name="will-2026.pdf" file={{ type: "application/pdf", size: 2_516_582 }} framed={false} />
      </div>
    </div>
  ),
}

function StackedFile({ file, dense = false }: { file: FileLike; dense?: boolean }) {
  return (
    <div className={dense ? "flex w-24 flex-col items-center gap-1 text-center" : "flex w-24 flex-col items-center gap-2 text-center"}>
      <FileIcon file={file} className={dense ? "size-8" : "size-14"} />
      <span className="w-full">
        <span className="block truncate text-xs font-semibold text-card-foreground">{file.name}</span>
        <span className="block truncate text-xs font-medium text-muted-foreground">{fileLine(file)}</span>
      </span>
    </div>
  )
}

/** Not a component yet. The file icon, then the name under it, then what the file is. The denser row is 32px, the smallest size that still carries the format. */
export const StackedDocument: Story = {
  name: "Name underneath",
  render: () => {
    const files: FileLike[] = [
      { name: "will-2026.pdf", type: "application/pdf", size: 2_516_582 },
      { name: "letter.docx", size: 49_152 },
      { name: "IMG_4821.jpg", type: "image/jpeg", size: 1_887_436 },
    ]
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap gap-6">
          {files.map((file) => (
            <StackedFile key={file.name} file={file} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Denser. 32px, so the format still sits on the icon.</p>
          <div className="flex flex-wrap gap-4">
            {files.map((file) => (
              <StackedFile key={file.name} file={file} dense />
            ))}
          </div>
        </div>
      </div>
    )
  },
}
