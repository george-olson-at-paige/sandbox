import type { ComponentProps, ReactNode } from "react"

import {
  Collapsible as UiCollapsible,
  CollapsibleContent as UiCollapsibleContent,
  CollapsibleTrigger as UiCollapsibleTrigger,
} from "../../base/collapsible"

/* @archetype Frame (ARCHETYPES.md).
   Paige Collapsible over upstream Collapsible. The trigger is always asChild: give it a
   DisclosureTrigger (or a Button). */
/** Show more / show less: content that opens under a trigger. */
function Collapsible(
  props: Pick<ComponentProps<typeof UiCollapsible>, "open" | "defaultOpen" | "onOpenChange" | "disabled" | "className" | "children">
) {
  return <UiCollapsible {...props} />
}

function CollapsibleTrigger({ children }: { children: ReactNode }) {
  return <UiCollapsibleTrigger asChild>{children}</UiCollapsibleTrigger>
}

function CollapsibleContent(props: Pick<ComponentProps<typeof UiCollapsibleContent>, "id" | "className" | "children">) {
  return <UiCollapsibleContent {...props} />
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type CollapsibleProps = ComponentProps<typeof Collapsible>
export type CollapsibleContentProps = ComponentProps<typeof CollapsibleContent>
export type CollapsibleTriggerProps = ComponentProps<typeof CollapsibleTrigger>
