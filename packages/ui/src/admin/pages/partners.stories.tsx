import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { defaultListState, type ListState } from "../../lib/list-query"
import { Button } from "../../components/actions/button"
import { Card } from "../../components/display/card"
import { AdminPage } from "../../templates/admin-page"
import { ListPage } from "../../templates/list-page"
import { AdminFrame, expectCollapseInView } from "../../stories/admin-frame"
import { StubLink } from "../../stories/fixtures"
import { partners, PARTNERS_TODAY, reorderOffers, saveOffer, setOfferEnabled } from "../../fixtures/partners"
import { typeKeys } from "../../stories/typing"
import { ManageOffersDialog, type PartnerOfferActions } from "../partner-offers"
import { copySignupLink, partnerActions, PartnerLogoDialog, partnersPage, partnerStatus, type PartnerRow } from "./partners"

/* R13-22, REVIEW-15 · the admin Partners page: `partnersPage` (the page's fixed parts, the same the
   app's /admin/partners uses, R17-06) on ListPage in AdminPage. Filter cards (All, Live, Launching
   soon, Needs setup, Inactive); search by name or signup slug; Filters (type, setup issue); columns
   Partner · Customer · VIP · Employee (people on the plan, its status, a Rev share mark, the price
   on hover) · People (the total, "+1 other plan", the count a link to People) · Status. Each row's
   ⋯ menu: Partner (Update logo…, Manage offers…, Copy signup link ▸ a plan), Go to (View people,
   Rev share statement). A row click opens the partner (a stand-in here). The Update logo dialog on
   its own is the last story (from the old PartnerDialogs, R17-06; the logo itself is Admin ›
   PartnerLogo since 2026-10-30). Loading and error are ListPage's own (Templates › ListPage). 20
   invented partners (fixtures/partners.ts). */
const page = partnersPage({ href: (p) => `/admin/partners/${p.key}`, peopleHref: (p) => `/admin/people?partner=${p.key}`, linkAs: StubLink, today: PARTNERS_TODAY })
const statementHref = (p: PartnerRow) => `/admin/reporting/rev-share?partner=${p.key}`
const peopleHref = (p: PartnerRow) => `/admin/people?partner=${p.key}`
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const byName = (name: string) => partners.find((p) => p.name === name)!

function PartnersPage({ initialRows = partners }: { initialRows?: PartnerRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [state, setState] = useState<ListState>(() => defaultListState(page.config))
  const [status, setStatus] = useState<string>()
  const [opened, setOpened] = useState<PartnerRow | null>(null)
  const [logoFor, setLogoFor] = useState<PartnerRow | null>(null)
  const [offersFor, setOffersFor] = useState<string | null>(null)
  const update = (id: string, patch: (p: PartnerRow) => Partial<PartnerRow>) => setRows((all) => all.map((p) => (p.id === id ? { ...p, ...patch(p) } : p)))
  const offersPartner = rows.find((p) => p.id === offersFor) ?? null
  const offerActions: PartnerOfferActions = { save: saveOffer, setEnabled: setOfferEnabled, reorder: reorderOffers }

  async function upload(p: PartnerRow, file: File) {
    await wait(300)
    update(p.id, () => ({ logoUrl: URL.createObjectURL(file) }))
    setStatus(page.logoUpdated(p))
  }

  return (
    <AdminFrame>
      <AdminPage current="partners" linkAs={StubLink} title={page.title} description={page.description}>
        {opened && (
          <Card className="flex-row items-center justify-between gap-4 px-5 py-4" data-testid="partner-stand-in">
            <span className="text-sm font-medium">
              Partner page (stand-in): <strong>{opened.name}</strong>
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOpened(null)}>
              Back to Partners
            </Button>
          </Card>
        )}
        <ListPage
          {...page.list}
          rows={rows}
          state={state}
          onStateChange={(next) => {
            setStatus(undefined)
            setState(next)
          }}
          onRowClick={setOpened}
          rowActions={(p) =>
            partnerActions(p, {
              onUpdateLogo: setLogoFor,
              onManageOffers: (row) => setOffersFor(row.id),
              onCopySignupLink: async (row, plan) => {
                const result = await copySignupLink(plan.signupUrl ?? "")
                setStatus(result ? result.error : page.signupCopied(row, plan))
                return result
              },
              peopleHref,
              statementHref,
            })
          }
          status={status}
        />
        <PartnerLogoDialog partner={logoFor} open={logoFor !== null} onOpenChange={(open) => !open && setLogoFor(null)} onUpload={(p, file) => upload(p, file)} />
        <ManageOffersDialog
          partner={offersPartner}
          open={offersPartner !== null}
          onOpenChange={(open) => !open && setOffersFor(null)}
          actions={offerActions}
          onChange={(p, offers) => update(p.id, () => ({ offers }))}
        />
      </AdminPage>
    </AdminFrame>
  )
}

/** The Update logo dialog on its own, opened from a button (on the page it opens from a row's ⋯ menu). */
function LogoDialog({ partner }: { partner: PartnerRow }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Update logo…
      </Button>
      <PartnerLogoDialog partner={partner} open={open} onOpenChange={setOpen} onUpload={fn()} />
    </>
  )
}

const meta = {
  component: PartnersPage,
  parameters: { layout: "fullscreen" },
  tags: ["r13-22", "r15-01", "r15-02", "r15-03", "r15-06", "r15-07", "r15-08", "r15-14", "r15-04", "r15-15"],
} satisfies Meta<typeof PartnersPage>

export default meta
type Story = StoryObj<typeof meta>

const count = (pred: (p: PartnerRow) => boolean) => partners.filter(pred).length
const rowOf = (canvas: HTMLElement, name: string) => within(within(canvas).getByRole("table", { name: "Partners" })).getAllByRole("row").find((r) => within(r).queryByRole("link", { name }))!

async function openMenu(canvas: HTMLElement, name: string) {
  await userEvent.click(within(rowOf(canvas, name)).getByRole("button", { name: `Actions for ${name}` }))
  return within(canvas.ownerDocument.body).findByRole("menu", { name: `Actions for ${name}` })
}

/** Filter cards, plan columns, search and the row menu. */
export const Default: Story = {
  name: "Filter, find and the row menu",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expectCollapseInView(canvasElement)
    const table = c.getByRole("table", { name: "Partners" })
    // R15-01, R15-02, R15-03: Customer, VIP and Employee columns; no Main offer, no Rev share column.
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent?.trim())
    for (const h of ["Partner", "Customer", "VIP", "Employee", "People", "Status"]) await expect(headers).toContain(h)
    await expect(headers.join(" ")).not.toMatch(/Main offer|Rev share/)
    // A plan cell: the count and its status; "—" without such a plan; "Starts Nov 3" when scheduled.
    const cedar = rowOf(canvasElement, "Cedar Trust")
    const cells = within(cedar).getAllByRole("cell")
    await expect(cedar.querySelector("[data-slot='plan-cell'][data-status='live']")).toHaveTextContent("586Live")
    await expect(cedar.querySelector("[data-slot='plan-cell'][data-status='scheduled']")).toHaveTextContent("Starts Nov 3")
    await expect(within(rowOf(canvasElement, "Lakeside Credit Union")).getByText("No VIP plan")).toHaveClass("sr-only")
    await expect(rowOf(canvasElement, "Lakeside Credit Union").querySelector("[data-slot='plan-rev-share']")).toHaveTextContent("Rev share")
    // R15-06, R16-06: People keeps the total; the count is the link to People filtered by the partner.
    await expect(within(cedar).getByRole("link", { name: "View Cedar Trust's people" })).toHaveAttribute("href", "/admin/people?partner=cedar-trust")
    await expect(cells.some((cell) => cell.textContent?.includes("627"))).toBe(true)
    // A plan outside the three: "+1 other plan" next to People.
    await expect(rowOf(canvasElement, "Riverbend University").querySelector("[data-slot='other-plans']")).toHaveTextContent("+1 other plan")
    // R15-08: the filter cards.
    const cards = c.getByRole("radiogroup", { name: "Partners: segments" })
    await expect(within(cards).getAllByRole("radio").map((r) => r.querySelector("span")?.textContent)).toEqual(["All", "Live", "Launching soon", "Needs setup", "Inactive"])
    const setup = count((p) => partnerStatus(p) === "needs-setup")
    await userEvent.click(within(cards).getByRole("radio", { name: /Needs setup/ }))
    await expect(c.getByText(`${setup} partners`)).toBeInTheDocument()
    await userEvent.click(within(cards).getByRole("radio", { name: /Launching soon/ }))
    await expect(c.getByText("3 partners")).toBeInTheDocument()
    await userEvent.click(within(cards).getByRole("radio", { name: /^All/ }))
    // Search by a signup slug.
    await typeKeys(c.getByRole("searchbox", { name: "Search partners" }), "northwind-vip")
    await waitFor(() => expect(c.getByText("1 partner")).toBeInTheDocument())
    await userEvent.click(c.getByRole("button", { name: "Clear search" }))
    // The row menu (R15-07, R15-14): Partner, then Go to.
    const menu = await openMenu(canvasElement, "Northwind Financial")
    await expect(within(menu).getAllByRole("menuitem").map((i) => i.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "Update logo…",
      "Manage offers…",
      "Copy signup link",
      "View people",
      "Rev share statement",
    ])
    await expect(within(menu).getByRole("menuitem", { name: "Rev share statement" })).toHaveAttribute("href", "/admin/reporting/rev-share?partner=northwind-financial")
    await expect(within(menu).getByRole("menuitem", { name: "View people" })).toHaveAttribute("href", "/admin/people?partner=northwind-financial")
    await userEvent.keyboard("{Escape}")
  },
}

/** Copy signup link: a submenu of the partner's plans. */
export const CopySignupLink: Story = {
  name: "Copy signup link · a submenu",
  tags: ["r15-07"],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const menu = await openMenu(canvasElement, "Northwind Financial")
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Copy signup link" }))
    const sub = await waitFor(() => {
      const menus = body.getAllByRole("menu")
      if (menus.length < 2) throw new Error("submenu not open")
      return menus[menus.length - 1]
    })
    await expect(within(sub).getAllByRole("menuitem").map((i) => i.textContent?.trim())).toEqual(["Customer", "VIP", "Employee"])
    await userEvent.click(within(sub).getByRole("menuitem", { name: "VIP" }))
    // A headless browser may refuse the clipboard: either result is said in place.
    await waitFor(() => expect(c.getByRole("status")).toHaveTextContent(/Northwind Financial's VIP signup link is copied\.|didn't allow copying/))
  },
}

/** An action that can't apply is off, with its reason. */
export const OffWithReason: Story = {
  name: "Off with a reason",
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement, "Granite Peak Bank")
    await expect(within(menu).getByRole("menuitem", { name: /Copy signup link/ })).toHaveAccessibleDescription("No plan has a signup link")
    await expect(within(menu).getByRole("menuitem", { name: /Rev share statement/ })).toHaveAccessibleDescription("Rev share isn't on for any plan")
    await userEvent.keyboard("{Escape}")
  },
}

/** Update logo: current and new side by side, the file checked, the row changes in place. */
export const UpdateLogo: Story = {
  name: "Update logo · from the row",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const menu = await openMenu(canvasElement, "Lakeside Credit Union")
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Update logo…" }))
    const dialog = await body.findByRole("alertdialog", { name: "Update Lakeside Credit Union's logo" })
    await expect(within(dialog).getByRole("img", { name: "Lakeside Credit Union logo" })).toBeInTheDocument()
    const upload = within(dialog).getByRole("button", { name: "Upload logo" })
    await expect(upload).toHaveAttribute("aria-disabled", "true")
    const file = within(dialog).getByLabelText("Logo image file")
    await userEvent.upload(file, new File([new Uint8Array(1_300_000)], "huge.png", { type: "image/png" }))
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("a logo can be 1 MB at most")
    await userEvent.upload(file, new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "lakeside-2026.svg", { type: "image/svg+xml" }))
    await expect(within(dialog).getByRole("img", { name: "New Lakeside Credit Union logo" })).toBeInTheDocument()
    await expect(upload).not.toHaveAttribute("aria-disabled")
    await userEvent.click(upload)
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    await expect(c.getByRole("status")).toHaveTextContent("Lakeside Credit Union's logo is updated.")
  },
}

/** Manage offers: opens from the row menu on the partner's ad strip offers. */
export const ManageOffers: Story = {
  name: "Manage offers · from the row",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const menu = await openMenu(canvasElement, "Cedar Trust")
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Manage offers…" }))
    const dialog = await body.findByRole("dialog", { name: "Manage Cedar Trust's offers" })
    const list = within(dialog).getByRole("list", { name: "Offers" })
    await expect(within(list).getAllByRole("listitem")).toHaveLength(2)
    await expect(within(list).getAllByRole("listitem")[1]).toHaveTextContent("Off")
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull())
  },
}

export const RowClick: Story = {
  name: "A row click opens the partner",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(within(rowOf(canvasElement, "Tidewater Bank & Trust")).getAllByRole("cell")[3])
    await expect(c.getByTestId("partner-stand-in")).toHaveTextContent("Tidewater Bank & Trust")
  },
}

export const Empty: Story = { name: "Empty (no partners yet)", args: { initialRows: [] } }
export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } } }
export const At1440: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1440" } } }

/** Update logo dialog: the current one shown. */
export const UpdateLogoDialog: Story = {
  name: "Logo dialog · update",
  tags: ["!autodocs"],
  render: () => <LogoDialog partner={byName("Cedar Trust")} />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("alertdialog", { name: "Update Cedar Trust's logo" })
    await expect(within(dialog).getByRole("img", { name: "Cedar Trust logo" })).toBeInTheDocument()
    await expect(dialog).toHaveTextContent("PNG, SVG, JPG or WebP, 1 MB at most")
    await expect(within(dialog).getByRole("button", { name: "Upload logo" })).toHaveAttribute("aria-disabled", "true")
  },
}

/** Add logo dialog: the wrong kind of file refused. */
export const AddLogoDialog: Story = {
  name: "Logo dialog · wrong file refused",
  tags: ["!autodocs"],
  render: () => <LogoDialog partner={byName("Brightpath Benefits")} />,
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("alertdialog", { name: "Add Brightpath Benefits' logo" })
    await expect(dialog).toHaveTextContent("No logo yet")
    await userEvent.upload(within(dialog).getByLabelText("Logo image file"), new File(["%PDF"], "logo.pdf", { type: "application/pdf" }), { applyAccept: false })
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("Choose a PNG, SVG, JPG or WebP image.")
    await expect(within(dialog).getByRole("button", { name: "Upload logo" })).toHaveAttribute("aria-disabled", "true")
  },
}
