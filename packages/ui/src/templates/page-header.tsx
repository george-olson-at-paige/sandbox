import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "../components/actions/button"
import type { Density } from "../lib/vocabulary"
import { cn } from "../lib/utils"
import { Split } from "../primitives/split"

/* @archetype Frame (ARCHETYPES.md).
   PageHeader: back link · icon · title · description · meta + actions · lead line.
   Replaces Area header + Back to Vault, Lead. The icon stays beside the title; meta and
   actions follow the title and move below it when the row is narrow (Split). */
/** The header of a content page: back link, icon, title, description, meta, page actions and a lead line. */
function PageHeader({
  back,
  icon,
  title,
  description,
  meta,
  actions,
  lead,
  density = "default",
  linkAs: Link = "a",
}: {
  /** Quiet back link above the header. */
  back?: { href: string; label: string }
  /** Beside the title, e.g. an AreaIcon. */
  icon?: ReactNode
  /** The page's h1. */
  title: ReactNode
  /** One line under the title, at reading width. */
  description?: ReactNode
  /** Short status text before the actions, e.g. "4 of 7". */
  meta?: ReactNode
  /** Actions for this page (add, edit, export). They follow the title and drop below it when the row is narrow. */
  actions?: ReactNode
  /** A larger line under the header rule that sets up the page. */
  lead?: ReactNode
  /** default: a page's header, its own rule under it. compact: a band's (WorkspacePage, VIEWS-PLAN.md §1a): no rule of its own (the band draws it), a smaller title, the row centred. */
  density?: Extract<Density, "default" | "compact">
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}) {
  const compact = density === "compact"
  return (
    <div data-slot="page-header">
      {back && (
        <div className="mb-4 text-sm">
          <Button asChild variant="quiet" size="inline" icon={<ArrowLeftIcon />}>
            <Link href={back.href}>{back.label}</Link>
          </Button>
        </div>
      )}
      <div className={cn("flex gap-4", compact ? "items-center gap-3" : "items-start border-b pb-5")}>
        {icon}
        <Split
          gap={4}
          align="start"
          className="min-w-0 flex-1"
          aside={
            (meta || actions) && (
              <>
                {meta && <span className="text-sm font-semibold text-muted-foreground">{meta}</span>}
                {actions}
              </>
            )
          }
        >
          <h1 className={cn("font-display leading-display font-bold tracking-display text-foreground-strong", compact ? "text-2xl" : "text-3xl")}>{title}</h1>
          {description && <p className={cn("mt-1 max-w-measure font-medium text-body-muted", compact ? "text-sm" : "text-base")}>{description}</p>}
        </Split>
      </div>
      {lead && <p className="mt-6 max-w-measure font-display text-xl leading-display font-bold tracking-display text-pretty text-foreground-strong">{lead}</p>}
    </div>
  )
}

export { PageHeader }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PageHeaderProps = ComponentProps<typeof PageHeader>
