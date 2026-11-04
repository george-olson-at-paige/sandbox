import type { ComponentProps, ReactNode } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { Avatar } from "../../../components/display/avatar"
import type { Person } from "../views/data"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/people/). The top of a person's record: their contact card, the part the owner shares
   (George 2026-11-02: kept although the stage bar names them too; it is the artifact, a
   résumé's head, where the digital record meets the card you'd hand someone).
   The avatar (a paw for a pet); the name in the display face; who they are to you and the aside
   ("Child · 9"); then how to reach them, phone and email as links. With neither, and when they
   need one, the to-do sits where the value would show: "Add a phone or email" (v0), which opens
   the reach form in place (`reach`, the caller's), never a trip to Edit. */

/** A person's contact card: avatar, name, who they are to you, how to reach them or the to-do where it would be. */
export function PersonLetterhead({
  person,
  addReach,
  onAddReach,
  reach,
}: {
  /** The person. */
  person: Person
  /** The to-do's words when they have no phone or email and need one ("Add a phone or email"). */
  addReach?: string
  /** Opens the reach form (the caller shows `reach`). Without it, no to-do. */
  onAddReach?: () => void
  /** The reach form, open in place of the to-do. */
  reach?: ReactNode
}) {
  const needsReach = person.needs.some((n) => n.kind === "reach")
  const lines = [person.phone && { text: person.phone, href: `tel:${person.phone.replace(/[^\d+]/g, "")}` }, person.email && { text: person.email, href: `mailto:${person.email}` }].filter(
    Boolean,
  ) as Array<{ text: string; href: string }>
  return (
    <header data-slot="person-letterhead" className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {person.pet ? <Avatar variant="pet" name={person.name} size="xl" /> : <Avatar name={person.name} src={person.photo} size="xl" />}
        <div className="flex min-w-0 flex-col gap-0.5 pt-1">
          <h3 className="font-display text-2xl leading-tight font-bold wrap-anywhere">{person.name}</h3>
          <p className="text-sm font-semibold text-muted-foreground">{[person.stated, person.aside].filter(Boolean).join(" · ")}</p>
          {lines.length > 0 && (
            <p data-slot="person-reach" className="mt-1 flex flex-wrap gap-x-2 text-sm font-medium">
              {lines.map((l, i) => (
                <span key={l.href} className="flex gap-2">
                  {i > 0 && <span aria-hidden className="text-muted-foreground">·</span>}
                  <a href={l.href} className="rounded-sm text-primary focus-ring hover:underline">
                    {l.text}
                  </a>
                </span>
              ))}
            </p>
          )}
          {lines.length === 0 && needsReach && addReach && onAddReach && !reach && (
            <Button variant="link" size="inline" icon={<PlusIcon />} onClick={onAddReach} className="mt-1 self-start text-sm">
              {addReach}
            </Button>
          )}
        </div>
      </div>
      {reach}
    </header>
  )
}

export type PersonLetterheadProps = ComponentProps<typeof PersonLetterhead>
