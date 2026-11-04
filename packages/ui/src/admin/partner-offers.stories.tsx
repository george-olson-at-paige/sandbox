import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Button } from "../components/actions/button"
import { partners, reorderOffers, saveOffer, setOfferEnabled } from "../fixtures/partners"
import { clearText, typeKeys } from "../stories/typing"
import { ManageOffersDialog, OfferPreview, type PartnerOfferActions } from "./partner-offers"
import type { PartnerRow } from "./partner-rules"

/* R15-04, R15-15 · Manage offers: a partner's ad strip offers (`PartnerOffer`), from the contract
   only. The list (Move up / Move down, Edit, Turn off with a confirm, Turn on, Add offer), and the
   editor (title, description, button label, link, the logo or an image address, where it shows)
   beside a live preview, below it at narrow widths. Each change goes to the API at once (fixtures
   here); a failure keeps the list and offers Try again. Opens from a row's ⋯ menu on Admin ›
   PartnersPage; here from a button. */
const byName = (name: string) => partners.find((p) => p.name === name)!
const working: PartnerOfferActions = { save: saveOffer, setEnabled: setOfferEnabled, reorder: reorderOffers }
const failing: PartnerOfferActions = {
  save: async () => ({ error: "The offer couldn't be saved. Try again in a moment." }),
  setEnabled: async () => ({ error: "The offer couldn't be changed. Try again in a moment." }),
  reorder: async () => ({ error: "The order couldn't be saved. Try again in a moment." }),
}

function Manage({ partner, actions = working, startOpen = true }: { partner: PartnerRow; actions?: PartnerOfferActions; startOpen?: boolean }) {
  const [row, setRow] = useState(partner)
  const [open, setOpen] = useState(startOpen)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Manage offers…
      </Button>
      <ManageOffersDialog partner={row} open={open} onOpenChange={setOpen} actions={actions} onChange={(_, offers) => setRow((r) => ({ ...r, offers }))} />
    </>
  )
}

const meta = {
  component: Manage,
  args: { partner: byName("Northwind Financial") },
  tags: ["r15-04", "r15-15"],
} satisfies Meta<typeof Manage>

export default meta
type Story = StoryObj<typeof meta>

const dialogOf = (canvas: HTMLElement, name: string) => within(canvas.ownerDocument.body).findByRole("dialog", { name: `Manage ${name} offers` })
const titles = (dialog: HTMLElement) => within(within(dialog).getByRole("list", { name: "Offers" })).getAllByRole("listitem").map((li) => li.querySelector("span span")?.textContent)

/** The trigger, closed: the docs page's story (the open dialog stays off the docs page, R3-17). */
export const Closed: Story = {
  args: { startOpen: false },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Manage offers…" }))
    await expect(await dialogOf(canvasElement, "Northwind Financial's")).toBeInTheDocument()
  },
}

export const List: Story = {
  tags: ["!autodocs"],
  name: "The list: reorder, in place",
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, "Northwind Financial's")
    await expect(titles(dialog)).toEqual(["Northwind members save on a will", "Questions about estate planning?", "Keep your documents in one place"])
    // The first can't move up, the last can't move down.
    await expect(within(dialog).getByRole("button", { name: "Move Northwind members save on a will up" })).toBeDisabled()
    await expect(within(dialog).getByRole("button", { name: "Move Keep your documents in one place down" })).toBeDisabled()
    await userEvent.click(within(dialog).getByRole("button", { name: "Move Keep your documents in one place up" }))
    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Keep your documents in one place moved up."))
    await expect(titles(dialog)).toEqual(["Northwind members save on a will", "Keep your documents in one place", "Questions about estate planning?"])
  },
}

/** Turn off: confirmed, then shown as Off; Turn on puts it back. */
export const TurnOff: Story = {
  tags: ["!autodocs"],
  name: "Turn off · then on",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await dialogOf(canvasElement, "Northwind Financial's")
    await userEvent.click(within(dialog).getByRole("button", { name: "Turn off Questions about estate planning?" }))
    const confirm = await body.findByRole("alertdialog", { name: "Turn off this offer?" })
    await expect(confirm).toHaveTextContent(`"Questions about estate planning?" stops showing in the app for Northwind Financial's people.`)
    await userEvent.click(within(confirm).getByRole("button", { name: "Turn off" }))
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    const row = within(within(dialog).getByRole("list", { name: "Offers" })).getAllByRole("listitem")[1]
    await expect(row).toHaveAttribute("data-enabled", "false")
    await expect(row).toHaveTextContent("Off")
    await userEvent.click(within(dialog).getByRole("button", { name: "Turn on Questions about estate planning?" }))
    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("turned on."))
  },
}

/** Edit: the fields beside a live preview, saved in place. */
export const Edit: Story = {
  tags: ["!autodocs"],
  name: "Edit · live preview",
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, "Northwind Financial's")
    await userEvent.click(within(dialog).getByRole("button", { name: "Edit Northwind members save on a will" }))
    const form = within(dialog).getByRole("form", { name: "Edit Northwind members save on a will" })
    const preview = within(form).getByRole("region", { name: "Preview" })
    await expect(preview).toHaveTextContent("Northwind members save on a will")
    await expect(preview).toHaveTextContent("See your plan")
    const title = within(form).getByRole("textbox", { name: "Title" })
    await clearText(title)
    await typeKeys(title, "A will is included with your membership")
    await expect(preview).toHaveTextContent("A will is included with your membership")
    // A link that isn't a web address is refused on Save, the input kept.
    const link = within(form).getByRole("textbox", { name: /Link/ })
    await clearText(link)
    await typeKeys(link, "northwind.example.com")
    await userEvent.click(within(form).getByRole("button", { name: "Save offer" }))
    await waitFor(() => expect(within(form).getAllByText("Enter a web address starting with https://.").length).toBeGreaterThan(0))
    await expect(link).toHaveValue("northwind.example.com")
    await clearText(link)
    await typeKeys(link, "https://northwind.example.com/will")
    await userEvent.click(within(form).getByRole("button", { name: "Save offer" }))
    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Northwind members save on a will saved."))
    await expect(titles(dialog)[0]).toBe("A will is included with your membership")
  },
}

/** Add: none yet, a title is needed, then it's in the list. */
export const Add: Story = {
  tags: ["!autodocs"],
  name: "Add · a title is needed",
  args: { partner: byName("Summit Wealth Partners") },
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, "Summit Wealth Partners'")
    await expect(dialog).toHaveTextContent("No offers yet.")
    await userEvent.click(within(dialog).getByRole("button", { name: "Add offer" }))
    const form = within(dialog).getByRole("form", { name: "New offer" })
    await userEvent.click(within(form).getByRole("button", { name: "Add offer" }))
    await waitFor(() => expect(within(form).getAllByText("Enter a title.").length).toBeGreaterThan(0))
    await typeKeys(within(form).getByRole("textbox", { name: "Title" }), "Plan ahead with Summit")
    // The partner's logo is the image by default; an image address replaces it.
    await expect(within(form).getByRole("checkbox", { name: /Use the partner's logo/ })).toHaveAttribute("data-state", "checked")
    await userEvent.click(within(form).getByRole("button", { name: "Add offer" }))
    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("Offer added."))
    await expect(titles(dialog)).toEqual(["Plan ahead with Summit"])
  },
}

/** A change that fails: the list kept, the message and Try again. */
export const Failure: Story = {
  tags: ["!autodocs"],
  name: "Failure · Try again",
  args: { actions: failing },
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, "Northwind Financial's")
    await userEvent.click(within(dialog).getByRole("button", { name: "Move Questions about estate planning? up" }))
    const alert = await within(dialog).findByRole("alert")
    await expect(alert).toHaveTextContent("The order couldn't be saved.")
    await expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument()
    await expect(titles(dialog)[1]).toBe("Questions about estate planning?")
  },
}

/** At phone width: the preview under the fields. */
export const Narrow: Story = {
  tags: ["!autodocs"],
  name: "Phone width",
  globals: { viewport: { value: "w375" } },
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, "Northwind Financial's")
    await userEvent.click(within(dialog).getByRole("button", { name: "Edit Northwind members save on a will" }))
    const form = within(dialog).getByRole("form")
    const title = within(form).getByRole("textbox", { name: "Title" }).getBoundingClientRect()
    const preview = within(form).getByRole("region", { name: "Preview" }).getBoundingClientRect()
    await expect(preview.top).toBeGreaterThan(title.bottom)
  },
}

/** The preview on its own: logo, an image address, no image; the button only with a label. */
export const Previews: StoryObj = {
  render: () => {
    const p = byName("Cedar Trust")
    const base = { adContext: "dashboard_ad", url: null, imageUrl: null, description: "Most people finish their will in about 20 minutes.", buttonLabel: "Start my will" }
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <OfferPreview partner={p} draft={{ ...base, title: "With the partner's logo", useLogoAsImage: true }} />
        <OfferPreview partner={p} draft={{ ...base, title: "No image, no button", buttonLabel: null, useLogoAsImage: false }} />
        <OfferPreview partner={byName("Brightpath Benefits")} draft={{ ...base, title: "Logo asked for, none uploaded: the initials", useLogoAsImage: true }} />
      </div>
    )
  },
}
