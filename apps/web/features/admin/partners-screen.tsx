"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { ManageOffersDialog, type PartnerOfferActions } from "@paige/ui/admin/partner-offers"
import { copySignupLink, partnerActions, PartnerLogoDialog, partnersPage, type PartnerRow } from "@paige/ui/admin/pages/partners"
import { PARTNERS_TODAY, reorderOffers, saveOffer, setOfferEnabled } from "@paige/ui/fixtures/partners"
import { ListPage } from "@paige/ui/templates/list-page"

import { AdminScreen } from "./admin-screen"
import { useListUrlState } from "./use-list-url-state"

/* /admin/partners (R13-22, REVIEW-15): the list page pattern for partners. The page's fixed parts
   are `partnersPage` from @paige/ui/admin/partners (the story uses the same, R17-06); the state is
   in the URL (useListUrlState: all but the search). The rows and the actions are fixtures: Update
   logo and Manage offers open their dialogs and change the row in place, Copy signup link copies a
   plan's link; each says what it did in the toolbar's status line (Manage offers in its own
   dialog), never a banner. View people (and the People count) opens People filtered by the
   partner; Rev share statement opens the statement stand-in (/admin/reporting/rev-share?partner=);
   a row click opens the partner page stand-in (/admin/partners/[slug]). */

const href = (p: PartnerRow) => `${adminHref("partners")}/${p.key}`
const peopleHref = (p: PartnerRow) => `${adminHref("people")}?partner=${encodeURIComponent(p.key)}`
const statementHref = (p: PartnerRow) => `${adminHref("reporting")}/rev-share?partner=${encodeURIComponent(p.key)}`
const page = partnersPage({ href, peopleHref, linkAs: Link, today: PARTNERS_TODAY })
const offerActions: PartnerOfferActions = { save: saveOffer, setEnabled: setOfferEnabled, reorder: reorderOffers }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PartnersScreen({ initial }: { initial: PartnerRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [state, setState] = useListUrlState(page.config, "partners")
  const [status, setStatus] = useState<string>()
  const [logoFor, setLogoFor] = useState<PartnerRow | null>(null)
  const [offersFor, setOffersFor] = useState<string | null>(null)
  const update = (id: string, patch: (p: PartnerRow) => Partial<PartnerRow>) => setRows((all) => all.map((p) => (p.id === id ? { ...p, ...patch(p) } : p)))
  const offersPartner = rows.find((p) => p.id === offersFor) ?? null

  async function uploadLogo(p: PartnerRow, file: File) {
    await wait(600)
    // The API would answer with the stored logo's URL; the fixture keeps the file in the page.
    const logoUrl = URL.createObjectURL(file)
    update(p.id, () => ({ logoUrl }))
    setStatus(page.logoUpdated(p))
  }

  return (
    <AdminScreen current="partners" title={page.title} description={page.description}>
      <ListPage
        {...page.list}
        rows={rows}
        state={state}
        onStateChange={(next) => {
          setStatus(undefined)
          setState(next)
        }}
        onRowClick={(p) => router.push(href(p))}
        rowActions={(p) =>
          partnerActions(p, {
            onUpdateLogo: (row) => setLogoFor(row),
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
      <PartnerLogoDialog partner={logoFor} open={logoFor !== null} onOpenChange={(open) => !open && setLogoFor(null)} onUpload={(p, file) => uploadLogo(p, file)} />
      <ManageOffersDialog
        partner={offersPartner}
        open={offersPartner !== null}
        onOpenChange={(open) => !open && setOffersFor(null)}
        actions={offerActions}
        onChange={(p, offers) => update(p.id, () => ({ offers }))}
      />
    </AdminScreen>
  )
}
