import type { ReactNode } from "react"

/* What Menu and DropdownMenu share about their entries (R13-05, R13-21): which entries sit in a
   labelled group (indented), and how an off item shows its reason. Internal to components. */

/** An off item's look (R13-21): focusable, inert, the label and icon muted; the reason stays readable. */
const offItem = "cursor-default text-muted-foreground"

/** An item's label with its off reason under it (R13-21). */
function ItemLabel({ label, reason, reasonId }: { label: ReactNode; reason?: string; reasonId: string }) {
  if (!reason) return <>{label}</>
  return (
    <span className="flex flex-col">
      <span>{label}</span>
      <span id={reasonId} data-slot="action-reason" className="text-xs font-medium text-muted-foreground">
        {reason}
      </span>
    </span>
  )
}

/** Entries after a string label, up to the next separator or label, are that group's items: indented one step (R13-05, as Select's groups are, R1-25). */
function groupedFlags(items: ReadonlyArray<{ kind: string; label?: unknown }>): boolean[] {
  let inGroup = false
  return items.map((e) => {
    if (e.kind === "separator") inGroup = false
    else if (e.kind === "label") {
      inGroup = typeof e.label === "string"
      return false
    }
    return inGroup && e.kind !== "radio-group"
  })
}

export { groupedFlags, ItemLabel, offItem }
