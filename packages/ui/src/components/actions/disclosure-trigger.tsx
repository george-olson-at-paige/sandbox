import type { ComponentProps } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"

/* @archetype Action (ARCHETYPES.md).
   DisclosureTrigger (R1-18; kept in R3-14, George 2026-10-19): a real <button> styled as text
   with a chevron that turns with open/closed. It is the trigger for anything that opens below
   it, which is why it is its own component rather than part of Collapsible:
   - Collapsible: "Show 3 more", "Show details" (CollapsibleTrigger wraps it).
   - DropdownMenu: "Browse everything", "Sort: most recent" (pass it as `trigger`).
   Keyboard and screen readers get a button; Radix adds aria-expanded and data-state, and the
   chevron turns on data-state="open". The alternative, a `variant="text"` trigger inside each
   of Collapsible and DropdownMenu, would be two copies of one look. */
/** Text with a turning chevron that opens what's below it: the trigger for a Collapsible or a DropdownMenu. */
function DisclosureTrigger({
  tone = "primary",
  chevron = true,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "style"> & {
  tone?: "primary" | "muted" | "strong"
  /** Hide the chevron (e.g. when the text already says "Show less"). */
  chevron?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="disclosure-trigger"
      className={cn(
        "group/disclosure inline-flex cursor-pointer items-center gap-1 rounded-sm text-sm font-semibold transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-disabled",
        tone === "primary" && "text-primary hover:text-primary-hover",
        tone === "muted" && "text-muted-foreground hover:text-card-foreground",
        tone === "strong" && "text-card-foreground hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
      {chevron && (
        <ChevronDownIcon
          aria-hidden
          className="size-icon shrink-0 transition-transform group-data-[state=open]/disclosure:rotate-180 motion-reduce:transition-none"
        />
      )}
    </button>
  )
}

export { DisclosureTrigger }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type DisclosureTriggerProps = ComponentProps<typeof DisclosureTrigger>
