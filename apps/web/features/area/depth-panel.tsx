"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Panel } from "@paige/ui/patterns/panel"
import { Button } from "@paige/ui/components/actions/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@paige/ui/components/display/collapsible"

import type { ItemRowView } from "@/fixtures/types"
import { AreaRow } from "./item-row"

/** Open depth rows shown before "Show more" (prototype Area.tsx:27). */
const INVITATIONS = 3

/** More that belongs here: settled rows in full, open rows a few at a time. */
export function DepthPanel({ rows, setUp }: { rows: ItemRowView[]; setUp: boolean }) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null
  const settled = rows.filter((r) => r.status !== "open")
  const invitations = rows.filter((r) => r.status === "open")
  const shown = setUp ? invitations : invitations.slice(0, INVITATIONS)
  const hidden = setUp ? [] : invitations.slice(INVITATIONS)
  return (
    <Panel
      id="depth"
      variant="quiet"
      title="More that belongs here"
      description={
        setUp
          ? "The essentials are here. This is what else your family would look for."
          : "What else your family would look for here. None of it is waiting on you."
      }
    >
      {settled.map((r) => <AreaRow key={r.key} row={r} />)}
      {shown.map((r) => <AreaRow key={r.key} row={r} />)}
      {hidden.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent>{hidden.map((r) => <AreaRow key={r.key} row={r} />)}</CollapsibleContent>
          <div className="mt-3 text-sm">
            <CollapsibleTrigger>
              <Button variant="link" size="inline" icon={open ? undefined : <PlusIcon />}>
                {open ? "Show less" : "Show more"}
              </Button>
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      )}
    </Panel>
  )
}
