import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { formatCents } from "../lib/format"

import { StubLink } from "../stories/fixtures"
import { partners, revShareFor, revShareUsage } from "../fixtures/partners"
import { clearText, typeKeys } from "../stories/typing"
import { REV_SHARE_DEFAULTS, type RevShareParams } from "./partner-rules"
import { PartnerRevShareSection, RevShareDefaultsSection, RevShareParamsView, type PartnerRevShareActions } from "./rev-share"
import type { PartnerRow } from "./partner-rules"

/* R15-11, R15-12 · rev share. The partner page's section: a switch per plan, the parameter set
   labelled Global defaults or Override (Override for this partner, Edit override, Use global
   defaults), each parameter in plain words with the rate's "Entered by hand — not connected to
   HubSpot", then the results (eligible people, qualifying revenue, share = revenue × rate, empty
   without a rate) and the statement link. The defaults section is the same form on the settings
   page; saving says how many partners use the defaults and that overrides are untouched. The
   results come from the API (a stand-in calculation here, stories/partners-data.ts). */
const byName = (name: string) => partners.find((p) => p.name === name)!
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* Each story keeps its own state (the shared fixture store isn't touched), so plays can run in any order. */
const actionsFor = (start: PartnerRow, fail = false): PartnerRevShareActions => {
  let override: RevShareParams | null = revShareFor(start).source === "override" ? revShareFor(start).params : null
  return {
    setPlanEnabled: async (p, planId, enabled) => {
      await wait(300)
      if (fail) return { error: "Rev share couldn't be changed. Try again in a moment." }
      const plans = p.plans.map((x) => (x.id === planId ? { ...x, revShare: enabled } : x))
      return { revShare: revShareFor({ ...p, plans }, override), plans }
    },
    saveOverride: async (p, params) => {
      await wait(300)
      if (fail) return { error: "The override couldn't be saved. Try again in a moment." }
      override = params
      return { revShare: revShareFor(p, override) }
    },
    useDefaults: async (p) => {
      await wait(300)
      override = null
      return { revShare: revShareFor(p, null) }
    },
  }
}

function Section({ partner, fail = false }: { partner: PartnerRow; fail?: boolean }) {
  return <PartnerRevShareSection partner={partner} revShare={revShareFor(partner)} actions={actionsFor(partner, fail)} statementHref={`/admin/reporting/rev-share?partner=${partner.key}`} linkAs={StubLink} />
}

const meta = {
  component: Section,
  args: { partner: byName("Northwind Financial") },
  decorators: [(S) => <div data-surface="page" className="max-w-4xl bg-surface-page p-6"><S /></div>],
  parameters: { layout: "fullscreen" },
  tags: ["r15-11"],
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const GlobalDefaults: Story = {
  name: "Global defaults: no rate, so no share",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(canvasElement.querySelector("[data-slot='rev-share-source']")).toHaveTextContent("Global defaults")
    await expect(c.getByText("Entered by hand — not connected to HubSpot.")).toBeInTheDocument()
    await expect(c.getByText(/count from their 4th paid month; the first 3 don't/)).toBeInTheDocument()
    await expect(canvasElement.querySelector("[data-slot='rev-share-share']")).toHaveTextContent("Not calculated")
    await expect(c.getByText("Needs a rate.")).toBeInTheDocument()
    await expect(c.getByRole("link", { name: "Rev share statement" })).toHaveAttribute("href", "/admin/reporting/rev-share?partner=northwind-financial")
    // A switch per plan: Customer on, VIP and Employee off.
    await expect(c.getByRole("switch", { name: "Customer plan" })).toHaveAttribute("data-state", "checked")
    await expect(c.getByRole("switch", { name: "VIP plan" })).toHaveAttribute("data-state", "unchecked")
  },
}

/** Override: the rate entered by hand, the share calculated. */
export const Override: Story = {
  name: "Override · rate by hand",
  args: { partner: byName("Lakeside Credit Union") },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(canvasElement.querySelector("[data-slot='rev-share-source']")).toHaveTextContent("Override")
    await expect(c.getByRole("button", { name: "Use global defaults" })).toBeInTheDocument()
    const share = revShareFor(byName("Lakeside Credit Union")).result.qualifyingRevenueCents / 10
    await expect(canvasElement.querySelector("[data-slot='rev-share-share']")).toHaveTextContent(formatCents(share))
    await expect(c.getByText("Qualifying revenue × 10%.")).toBeInTheDocument()
  },
}

/** Override for this partner: the form from the defaults, saved in place. */
export const OverrideForThisPartner: Story = {
  name: "Override · from the defaults",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Override for this partner" }))
    const form = c.getByRole("form", { name: "Rev share parameters" })
    const rate = within(form).getByRole("textbox", { name: /Rate/ })
    await expect(rate).toHaveAccessibleDescription(/Entered by hand — not connected to HubSpot/)
    await typeKeys(rate, "120")
    await userEvent.click(within(form).getByRole("button", { name: "Save override" }))
    await waitFor(() => expect(within(form).getAllByText("Enter a rate from 0 to 100, like 12.5.").length).toBeGreaterThan(0))
    await clearText(rate)
    await typeKeys(rate, "8")
    await userEvent.click(within(form).getByRole("button", { name: "Save override" }))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot='rev-share-status']")).toHaveTextContent("Northwind Financial's override is saved."))
    await expect(canvasElement.querySelector("[data-slot='rev-share-source']")).toHaveTextContent("Override")
    await expect(c.getByText("Qualifying revenue × 8%.")).toBeInTheDocument()
  },
}

/** Use global defaults: confirmed, the override dropped. */
export const UseGlobalDefaults: Story = {
  name: "Use global defaults",
  args: { partner: byName("Keystone Credit Union") },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(c.getByRole("button", { name: "Use global defaults" }))
    const confirm = await body.findByRole("alertdialog", { name: "Use the global defaults for Keystone Credit Union?" })
    await userEvent.click(within(confirm).getByRole("button", { name: "Use global defaults" }))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot='rev-share-source']")).toHaveTextContent("Global defaults"))
    await expect(canvasElement.querySelector("[data-slot='rev-share-status']")).toHaveTextContent("Keystone Credit Union uses the global defaults.")
  },
}

/** A plan's switch saves on the flip; a failure flips it back. */
export const PlanSwitch: Story = {
  name: "Plan switch · saves on the flip",
  args: { fail: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const vip = c.getByRole("switch", { name: "VIP plan" })
    await userEvent.click(vip)
    await waitFor(() => expect(c.getByText("Rev share couldn't be changed. Try again in a moment.")).toBeInTheDocument())
    await expect(vip).toHaveAttribute("data-state", "unchecked")
  },
}

export const NoPlans: Story = { name: "No plans yet", args: { partner: byName("Granite Peak Bank") } }

/** The parameter set read-only, a rate and a different month. */
export const ParamsView: StoryObj = {
  render: () => <RevShareParamsView params={{ ratePercent: 12.5, countFromPaidMonth: 3, willsCounted: 1, deductRefunds: false }} />,
}

/** The defaults on the settings page (R15-12): saving says who uses them. */
export const Defaults: StoryObj<typeof RevShareDefaultsSection> = {
  name: "Defaults · settings page",
  tags: ["r15-12"],
  render: () => (
    <RevShareDefaultsSection
      defaults={REV_SHARE_DEFAULTS}
      onSave={async (_params: RevShareParams) => {
        await wait(300)
        return revShareUsage()
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await typeKeys(c.getByRole("textbox", { name: /Rate/ }), "10")
    await userEvent.click(c.getByRole("button", { name: "Save defaults" }))
    const { usingDefaults, overrides } = revShareUsage()
    await waitFor(() => expect(canvasElement.querySelector("[data-slot='rev-share-status']")).toHaveTextContent(`Saved. ${usingDefaults} partners use the defaults; ${overrides} overrides are untouched.`))
  },
}
