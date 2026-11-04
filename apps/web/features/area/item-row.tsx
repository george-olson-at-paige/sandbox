import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { FactField, FactFieldGrid } from "@paige/ui/vault/fact-field"
import { FactItem } from "@paige/ui/vault/fact-item"
import { ItemRow } from "@paige/ui/vault/item-row"
import { Badge } from "@paige/ui/components/display/badge"
import { Button } from "@paige/ui/components/actions/button"

import type { ItemRowView, RowAction } from "@/fixtures/types"

export const rowId = (key: string) => `item-${key.replace(/\./g, "-")}`

/** One item on an Area page: the ItemRow shell (R2-34) with this item's records as its body. */
export function AreaRow({ row }: { row: ItemRowView }) {
  const hasBody = !!(row.people?.length || row.docs?.length || row.fields?.length)
  return (
    <ItemRow
      id={rowId(row.key)}
      status={row.status}
      title={row.label}
      why={row.status === "declined" ? <>You told us: {row.declinedLabel}</> : row.why}
      highlight={row.first}
      eyebrow={row.first ? "Start here" : undefined}
      chip={row.partialLabel ? <Badge tone="neutral" appearance="outline">{row.partialLabel}</Badge> : undefined}
      actions={row.actions.length > 0 ? row.actions.map((a) => <RowActionButton key={a.label} action={a} />) : undefined}
    >
      {hasBody && (
        <>
          {row.people?.map((p) => (
            <FactItem
              key={p.name}
              kind={p.pet ? "pet" : "person"}
              name={p.name}
              detail={p.detail}
              href="/section/contacts"
              hrefLabel={`Open ${p.name} in Contacts`}
              linkAs={Link}
              tags={
                <>
                  {p.tags?.map((t) => <Badge key={t} tone="neutral" appearance="outline">{t}</Badge>)}
                  {p.fromContacts && <Badge tone="neutral">From Contacts</Badge>}
                </>
              }
            >
              {p.inline?.map((label) => (
                <Button key={label} variant="link" size="inline" icon={<PlusIcon />}>{label}</Button>
              ))}
            </FactItem>
          ))}
          {row.docs?.map((d) => (
            <FactItem
              key={d.name}
              kind="document"
              name={d.name}
              detail={d.detail}
              href="/section/documents"
              hrefLabel={`Open ${d.name} in Documents`}
              linkAs={Link}
              tags={<Badge tone={d.tag.tone}>{d.tag.label}</Badge>}
            />
          ))}
          {row.fields && row.fields.length > 0 && (
            <FactFieldGrid>
              {row.fields.map((f) => <FactField key={f.key} label={f.label} state={f.state} wide={f.wide} />)}
            </FactFieldGrid>
          )}
        </>
      )}
    </ItemRow>
  )
}

function RowActionButton({ action }: { action: RowAction }) {
  switch (action.kind) {
    case "first":
      return <Button size="sm">{action.label}</Button>
    case "add":
      return <Button variant="link" size="inline" icon={<PlusIcon />}>{action.label}</Button>
    case "decline":
      return <Button variant="quiet" size="inline" underline>{action.label}</Button>
    case "change":
      return <Button variant="link" size="inline">{action.label}</Button>
  }
}
