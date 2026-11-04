import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "../../components/actions/button"
import { Card } from "../../components/display/card"
import { Split } from "../../primitives/split"

export type LinkOutLink = { label: string; href: string }

/* @archetype Composite (ARCHETYPES.md; §2 listed it as an Action: it is a Card of text with Buttons in it).
   LinkOut (R2-24, GAPS #45): the last thing on an Area page, full width under both columns,
   telling the owner that what they add here also lands on the pages they know. Text on the
   left, the links as buttons on the right (prototype AreaParts.tsx:328-345, vault.css:226-233);
   a Split, so on a narrow row the buttons drop under the text. It goes in AreaPage's `footer`;
   RailPanels is for the rail only. */
/** The full-width "this is also on your existing pages" strip at the foot of an Area page. */
function LinkOut({
  title,
  description,
  links,
  linkAs: Link = "a",
}: {
  /** One line, the slab title. */
  title: ReactNode
  /** A sentence or two under the title. */
  description?: ReactNode
  /** The existing pages, as buttons at the end of the row. */
  links: LinkOutLink[]
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}) {
  return (
    <Card variant="muted" className="gap-0 px-5 py-4" data-slot="link-out">
      <Split
        gap={4}
        contentMin="md"
        aside={links.map((l) => (
          <Button key={l.href} asChild variant="secondary" size="sm" icon={<ArrowRightIcon />} iconPosition="end">
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      >
        <p className="font-display text-sm font-bold text-card-foreground">{title}</p>
        {description && <p className="mt-0.5 max-w-measure text-xs font-medium text-muted-foreground">{description}</p>}
      </Split>
    </Card>
  )
}

export { LinkOut }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type LinkOutProps = ComponentProps<typeof LinkOut>
