"use client"

import { createContext, useCallback, useContext, useState, type ComponentProps, type Dispatch, type ReactNode, type SetStateAction } from "react"

import { DropdownMenu as UiDropdownMenu } from "../../base/dropdown-menu"

/* One open popover at a time in a group (R11-10): the header. AppHeader (and AdminPage's global
   actions) wrap their actions in PopoverGroup; each popover in it (HeaderSearch's results,
   NotificationBell's panel, AccountMenu's menu) reads and sets the one open id through
   usePopoverGroup, so opening one closes the others, by mouse or keyboard. Radix already closes
   a popover on a click outside it; this covers the keyboard (Tab to the bell and Enter while
   the account menu is open) and keeps the rule in one place. Outside a group each popover keeps
   its own state.
   It lives under the controls (components/internal) so DropdownMenu can take part through its
   `group` prop while staying server-safe: GroupedDropdownRoot is the client piece that reads
   the group, and the menu's items (links drawn with the app's `linkAs`, a function) stay on
   the server side of the boundary. */
type Group = { openId: string | null; setOpenId: Dispatch<SetStateAction<string | null>> }
const PopoverGroupContext = createContext<Group | null>(null)

/** One open popover at a time among the popovers inside it. */
export function PopoverGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return <PopoverGroupContext.Provider value={{ openId, setOpenId }}>{children}</PopoverGroupContext.Provider>
}

/** Whether this popover is the group's open one, and a setter (true opens it and closes the rest). Outside a group: its own state. */
export function usePopoverGroup(id: string): [boolean, (open: boolean) => void] {
  const group = useContext(PopoverGroupContext)
  const [own, setOwn] = useState(false)
  const setGroup = useCallback(
    (open: boolean) => group?.setOpenId((current) => (open ? id : current === id ? null : current)),
    [group, id]
  )
  if (!group) return [own, setOwn]
  return [group.openId === id, setGroup]
}

/** DropdownMenu's root when it belongs to a PopoverGroup (`group`). */
export function GroupedDropdownRoot({
  group,
  ...props
}: Omit<ComponentProps<typeof UiDropdownMenu>, "open" | "onOpenChange" | "defaultOpen"> & { group: string }) {
  const [open, setOpen] = usePopoverGroup(group)
  return <UiDropdownMenu {...props} open={open} onOpenChange={setOpen} />
}
