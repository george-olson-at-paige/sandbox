import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"

import { Avatar, initialsOf } from "../components/display/avatar"
import { DropdownMenu } from "../components/actions/dropdown-menu"

export type AccountMenuItem = { label: string; href: string; icon?: ReactNode }

/* @archetype Composite (ARCHETYPES.md).
   AccountMenu (R1-19): the owner's avatar opens a menu with their name, email and links.
   The items are data; the prototype has no account menu, so the app's items are stand-ins
   (GAPS #74). The trigger avatar is md 34 (the prototype's nav size); a photo has
   Avatar's own border (R13-13, which replaced R11-08's subtle ring here). The menu's heading (R12-01) is
   the layout most account menus use (Google's, Microsoft's): the 2xl 74 avatar centred above the
   name and the email, so the person sees whose account this is before the links. The rest of the
   menu's own parts stay with R2-02 (deferred).
   Accessible name (R9-04, GAPS #109; WCAG 2.5.3 label in name): the name starts with the text
   the trigger shows, the initials, then says what it is: "GO, account menu for George Olson",
   so a speech user who says what they see ("click GO") reaches it and axe's
   label-content-name-mismatch passes. aria-hidden on the avatar wouldn't do: axe compares the
   text visible on screen, not what is exposed. The initials lead even with a photo, because
   the fallback shows them while the photo loads or when it fails.
   Inside AppHeader it shares one open state with the other header popovers (R11-10, DropdownMenu's
   `group`): opening it closes search and notifications, and opening either of those closes it.
   It stays a server component, so the app's `linkAs` (Next's Link, a function) never crosses
   into a client component. */
/** The owner's avatar in the header, opening a menu with their name, email and links. */
function AccountMenu({
  name,
  email,
  avatar,
  items,
  linkAs = "a",
}: {
  /** The owner's full name: the avatar's initials, the menu's heading and the trigger's accessible name. */
  name: string
  /** Shown under the name in the menu heading. */
  email?: string
  /** Photo URL. Without it the avatar shows initials. */
  avatar?: string
  /** Menu links, in order, under a separator. */
  items: AccountMenuItem[]
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}) {
  return (
    <DropdownMenu
      group="account"
      modal={false}
      aria-label="Account"
      linkAs={linkAs}
      trigger={
        <button type="button" aria-label={`${initialsOf(name)}, account menu for ${name}`} className="inline-flex size-fit shrink-0 cursor-pointer self-center rounded-full focus-ring">
          <Avatar name={name} src={avatar} size="md" />
        </button>
      }
      items={[
        {
          kind: "label",
          label: (
            <span data-slot="account-menu-heading" className="flex min-w-menu-wide flex-col items-center gap-0.5 px-2 pt-2 pb-1 text-center">
              {/* The name follows in words, so the initials aren't read twice. */}
              <span aria-hidden className="mb-2 flex">
                <Avatar name={name} src={avatar} size="2xl" />
              </span>
              <span className="block max-w-full text-sm font-semibold break-words text-card-foreground">{name}</span>
              {email && <span className="block max-w-full text-xs font-medium break-all text-muted-foreground">{email}</span>}
            </span>
          ),
        },
        { kind: "separator" },
        ...items.map((i) => ({ kind: "link" as const, label: i.label, href: i.href, icon: i.icon })),
      ]}
    />
  )
}

export { AccountMenu }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AccountMenuProps = ComponentProps<typeof AccountMenu>
