"use client"

import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"
import { BellIcon } from "lucide-react"

import { Button } from "../components/actions/button"
import { Dot } from "../components/display/dot"
import { Popover, PopoverContent, PopoverTrigger } from "../components/overlays/popover"
import { usePopoverGroup } from "../components/internal/popover-group"

/* @archetype Composite (ARCHETYPES.md).
   NotificationBell (R1-19): the bell, with a dot when something is unread (a Dot, R4-09). The count is in
   the accessible name, not drawn. Reminders are bell notifications (keyed); the list itself
   is not built. It opens one of three things, and one is required (R2-30): a route (`href`), a
   handler (`onOpen`), or a panel (`panel`, R11-10). Until notifications exist, the app leaves
   the bell out of the header rather than render a dead button.
   The panel (R11-10) is a real Popover: a click outside or Escape closes it, focus returns to
   the bell, and inside AppHeader it shares one open state with the other header popovers, so
   opening the account menu or search closes it (and the reverse).
   States (R4-02, George 2026-10-19): a ghost icon Button, so a subtle hover for real pointers
   only (Tailwind's hover sits under @media (hover: hover); touch never shows a stuck hover),
   pressed a step stronger, and while its panel is open (aria-expanded) it keeps the pressed
   look, so it's clear what opened the panel. All from the relative overlay (R4-01). */
type BellTarget =
  | {
      /** The route it opens: renders a link. */
      href: string
      onOpen?: never
      panel?: never
      /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
      linkAs?: ElementType
    }
  | {
      /** Opens it in place by a handler: renders a button. */
      onOpen: () => void
      href?: never
      panel?: never
      linkAs?: never
    }
  | {
      /** The notifications panel: renders a button that opens it in a Popover under the bell (R11-10). */
      panel: ReactNode
      href?: never
      onOpen?: never
      linkAs?: never
    }

/** The header's notifications bell, with an unread dot; opens a route, a handler or a panel. */
function NotificationBell({
  unread = 0,
  href,
  onOpen,
  panel,
  linkAs: Link = "a",
  open: openProp,
}: BellTarget & {
  /** Unread count. Above 0 a dot shows and the count goes in the accessible name. */
  unread?: number
  /** With `onOpen`: the panel it opens is showing (aria-expanded, the pressed look). With `panel`: opens it from the start (a story). */
  open?: boolean
}) {
  const [shared, setShared] = usePopoverGroup("notifications")
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
  const dot = unread > 0 && (
    <Dot tone="primary" size="xs" ring className="absolute top-2 right-2" />
  )
  if (href !== undefined) {
    return (
      <Button asChild variant="ghost" size="icon" icon={<BellIcon />} className="relative">
        <Link href={href} aria-label={label}>{dot}</Link>
      </Button>
    )
  }
  if (panel !== undefined) {
    const open = shared || (openProp ?? false)
    return (
      <Popover open={open} onOpenChange={setShared}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" icon={<BellIcon />} aria-label={label} className="relative">
            {dot}
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Notifications">{panel}</PopoverContent>
      </Popover>
    )
  }
  return (
    <Button variant="ghost" size="icon" icon={<BellIcon />} aria-label={label} aria-expanded={openProp} onClick={onOpen} className="relative">
      {dot}
    </Button>
  )
}

export { NotificationBell }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type NotificationBellProps = ComponentProps<typeof NotificationBell>
