import Link from "next/link"
import { CheckIcon, FileTextIcon } from "lucide-react"

import { AreaIcon } from "@paige/ui/vault/areas/area-icon"
import { LinkOut } from "@paige/ui/vault/areas/link-out"
import { Panel } from "@paige/ui/patterns/panel"
import { AreaPage } from "@paige/ui/templates/area-page"
import { PageHeader } from "@paige/ui/templates/page-header"
import { RailPanels } from "@paige/ui/vault/areas/rail-panels"
import { Callout } from "@paige/ui/components/feedback/callout"
import { Button } from "@paige/ui/components/actions/button"

import type { AreaView } from "@/fixtures/types"
import { DepthPanel } from "./depth-panel"
import { AreaRow } from "./item-row"

/** An Area page: PageHeader + AreaPage template, rows, right rail via RailPanels, link out. */
export function AreaScreen({ view }: { view: AreaView }) {
  return (
    <AreaPage
      area={view.area}
      header={
        <PageHeader
          linkAs={Link}
          back={{ href: "/", label: "Vault" }}
          icon={<AreaIcon area={view.area} size="xl" />}
          title={view.name}
          description={view.line}
          meta={view.count}
          actions={<Button variant="secondary" size="sm" icon={<FileTextIcon />}>Add a document</Button>}
          lead={view.lead}
        />
      }
      main={
        <>
          {view.review && (
            <Callout tone="success" icon={<CheckIcon />} title={view.review.title} actions={<Button size="sm">Confirm all</Button>}>
              {view.review.body}
            </Callout>
          )}
          <Panel
            id="essentials"
            title="The essentials"
            description={view.setUp ? `${view.name} is set up.` : "The handful of items someone else would need first."}
          >
            {view.essentials.map((r) => <AreaRow key={r.key} row={r} />)}
          </Panel>
          <DepthPanel rows={view.depth} setUp={view.setUp} />
        </>
      }
      rail={view.rail.length > 0 ? <RailPanels panels={view.rail} linkAs={Link} /> : undefined}
      footer={
        <LinkOut
          linkAs={Link}
          title="This is also on your existing pages."
          description="Anything you add on this page also lands in Documents or Contacts, filed under this area, on the same pages as before. Open them to see all your files and contacts."
          links={[
            { label: "Open Documents", href: "/section/documents" },
            { label: "Open Contacts", href: "/section/contacts" },
          ]}
        />
      }
    />
  )
}
