import type { ComponentProps } from "react"
import type { ElementType } from "react"
import { ArrowRightIcon } from "lucide-react"

import type { AreaId } from "../../icons/area-glyphs"
import { Badge } from "../../components/display/badge"
import { Button } from "../../components/actions/button"
import { Inline } from "../../primitives/inline"
import { AreaIcon } from "./area-icon"
import { FactItem } from "../fact-item"
import { Panel } from "../../patterns/panel"
import { StatusDot } from "../status-dot"

export type RailRow =
  | { kind: "status"; status: "open" | "partial"; label: string; detail?: string; href: string }
  | { kind: "person"; name: string; detail: string; pet?: boolean; reach?: { label: string; href: string }; note?: string }
  | { kind: "document"; name: string; detail: string; tag: { label: string; tone: "success" | "warning" | "info" }; href: string }

export type RailLink = { label: string; href: string; area?: AreaId }

export type RailPanel = {
  id: string
  title: string
  count?: string
  more?: { label: string; href: string }
  description?: string
  variant?: "default" | "muted"
  rows?: RailRow[]
  links?: RailLink[]
}

/* @archetype Composite (ARCHETYPES.md).
   RailPanels: the right rail as data. What's left, people, provenance, Documents here,
   cross-link: one list of Panels with rows or links, not six components. */
/** An Area page's right rail, rendered from data as Panels. */
function RailPanels({
  panels,
  linkAs: Link = "a",
}: {
  /** The rail's panels, in order. Each renders as a Panel; rows by kind (status, person, document), then links. */
  panels: RailPanel[]
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}) {
  return (
    <>
      {panels.map((p) => (
        <Panel
          key={p.id}
          id={p.id}
          title={p.title}
          count={p.count}
          variant={p.variant}
          description={p.description}
          more={
            p.more && (
              <Button asChild variant="link" size="inline">
                <Link href={p.more.href}>{p.more.label}</Link>
              </Button>
            )
          }
        >
          {p.rows && p.rows.length > 0 && (
            <div>
              {p.rows.map((r, i) =>
                r.kind === "status" ? (
                  <div key={i} className="flex items-start gap-3 border-t border-divider-tint py-3 first:border-t-0">
                    <StatusDot status={r.status} />
                    <div className="min-w-0 flex-1 text-sm">
                      <Button asChild variant="quiet" size="inline" icon={<ArrowRightIcon />} iconPosition="end" className="text-foreground">
                        <Link href={r.href}>{r.label}</Link>
                      </Button>
                      {r.detail && <p className="mt-1 text-xs font-medium text-muted-foreground">{r.detail}</p>}
                    </div>
                  </div>
                ) : r.kind === "person" ? (
                  <FactItem
                    key={i}
                    kind={r.pet ? "pet" : "person"}
                    density="compact"
                    name={r.name}
                    detail={r.detail}
                    secondary={r.reach ? { kind: "link", ...r.reach } : r.note ? { kind: "note", text: r.note } : undefined}
                    linkAs={Link}
                  />
                ) : (
                  <FactItem
                    key={i}
                    kind="document"
                    density="compact"
                    name={r.name}
                    detail={r.detail}
                    href={r.href}
                    tags={<Badge tone={r.tag.tone}>{r.tag.label}</Badge>}
                  />
                )
              )}
            </div>
          )}
          {p.links && p.links.length > 0 && (
            <Inline gap={2}>
              {p.links.map((l) => (
                <Button key={l.href} asChild variant="secondary" size="sm" icon={<ArrowRightIcon />} iconPosition="end">
                  <Link href={l.href}>
                    {l.area && <AreaIcon area={l.area} size="sm" />}
                    {l.label}
                  </Link>
                </Button>
              ))}
            </Inline>
          )}
        </Panel>
      ))}
    </>
  )
}

export { RailPanels }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type RailPanelsProps = ComponentProps<typeof RailPanels>
