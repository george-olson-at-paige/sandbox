import type { ElementType } from "react"

import { Avatar } from "../../../components/display/avatar"
import type { Person } from "../views/data"
import { AreaDots, StatusLine, ViewRow } from "../views/row-parts"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for vault/people/).
   PersonRow: a person in People's list, a link to their record. The avatar (a paw for a pet);
   the name; "Spouse · 3 roles" (the role the owner stated, never a derived kinship, then how much
   they do); the first thing they need, if anything ("No phone or email", "+1" for more); a dot
   per Area they are on. */

/** A person in People's list: avatar, name, stated role and how much they do, what they need, their Areas. */
export function PersonRow({
  person,
  href,
  current = false,
  linkAs,
}: {
  /** The person (labs/vault/views/data.ts). */
  person: Person
  /** Their record. */
  href: string
  /** Their record is the one open. */
  current?: boolean
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [first, ...more] = person.needs
  return (
    <ViewRow
      href={href}
      current={current}
      linkAs={linkAs}
      media={person.pet ? <Avatar variant="pet" name={person.name} size="md" /> : <Avatar name={person.name} src={person.photo} size="md" />}
      title={person.name}
      description={[person.stated, person.roles].filter(Boolean).join(" · ")}
      status={first && <StatusLine need={more.length ? `${first.text} · +${more.length}` : first.text} />}
      meta={<AreaDots areas={person.areas} />}
    />
  )
}
