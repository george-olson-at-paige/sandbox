import type { ComponentProps } from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

/* @archetype Frame (ARCHETYPES.md).
   TabsLine (R21-03): underline tabs, the sibling of TabsPill with the same list/trigger shape.
   TabsPill is the Mode switch (a pill on the blue tint); TabsLine is views of one page (the
   Journeys page's Sign-up | Essential Setup | First things in the Vault; Vue's `.rpt-tabs`, the
   person page's and SendGrid's tabs). Two ways to use it, as TabsPill:
   - route links (`as="nav"`, the default): each tab is a link wearing `tabsLineTriggerVariants()`
     with `aria-current="page"` on the current one, so the browser's back and deep links work;
   - Radix Tabs (panels on the same page): pass `<TabsLineList as="div">` as TabsList's
     `asChild` child and give the triggers the same classes; the current one is
     `data-state="active"`, and Radix gives the arrow keys.
   Look (the mock): 44px tall (`h-control`), 14/600 in the muted ink, the body ink on hover, the
   current tab 700 in the strong ink with a 3px brand bar along its foot. The list has no rule of
   its own: it sits on the rule of whatever holds it (AdminPage's `tabs` slot draws the header's
   region rule under it, R21-02), and the bar sits on that rule. Focus is `focus-ring` (a link or a
   tab is a button-like control, R15-17). The bar is a pseudo-element, so the label never moves
   when the current tab changes (no border swap, no layout shift). No state and no hooks:
   server-safe, the cva helper and the list in one file. */

/** The list: a row of tabs that wraps on a narrow screen. */
const tabsLineListClass = "flex flex-wrap items-end gap-1"

/** One tab: muted at rest, the current one strong with the 3px brand bar on its foot. */
const tabsLineTriggerVariants = cva(
  cn(
    "relative inline-flex h-control cursor-pointer items-center rounded-sm px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors focus-ring hover:text-card-foreground",
    // The bar: always there, transparent until current, so nothing shifts.
    "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b-3 after:border-transparent",
    "aria-[current=page]:font-bold aria-[current=page]:text-foreground-strong aria-[current=page]:after:border-primary",
    "data-[state=active]:font-bold data-[state=active]:text-foreground-strong data-[state=active]:after:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-disabled"
  )
)

/** Underline tabs: a nav of links (aria-current) or, `as="div"`, the list under Radix Tabs; give each tab `tabsLineTriggerVariants()`. */
function TabsLineList({
  as: Comp = "nav",
  className,
  ...props
}: Omit<ComponentProps<"nav">, "style" | "ref"> & {
  /** `nav` for route links (default); `div` under Radix TabsList (asChild). */
  as?: "nav" | "div"
  /** The list's name ("Journeys"): a page may have more than one nav. */
  "aria-label": string
}) {
  return <Comp data-slot="tabs-line" className={cn(tabsLineListClass, className)} {...props} />
}

export { TabsLineList, tabsLineTriggerVariants }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type TabsLineListProps = ComponentProps<typeof TabsLineList>
