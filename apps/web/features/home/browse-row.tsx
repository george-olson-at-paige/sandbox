import Link from "next/link"
import { ViewGlyph, type ViewId } from "@paige/ui/icons/view-glyphs"
import { Inline } from "@paige/ui/primitives/inline"
import { Eyebrow } from "@paige/ui/components/display/eyebrow"
import { Separator } from "@paige/ui/components/display/separator"

// The five Views, with the prototype's filled View marks (@paige/ui/icons, R2-36).
export const VIEWS: Array<{ name: string; sub: string; href: string; view: ViewId }> = [
  { name: "Will", sub: "Your will", href: "/section/will", view: "will" },
  { name: "Documents", sub: "All your files", href: "/section/documents", view: "documents" },
  { name: "Contacts", sub: "Everyone you’ve named", href: "/section/contacts", view: "contacts" },
  { name: "Business", sub: "Your company", href: "/section/business", view: "business" },
  { name: "Passwords", sub: "All your logins", href: "/section/passwords", view: "passwords" },
]

/** Browse row: a row of links, deliberately not a second grid of cards. */
export function BrowseRow({ note }: { note: string }) {
  return (
    <nav aria-label="Browse everything">
      <Separator className="mb-4" />
      <Inline gap={3} align="baseline" className="mb-3">
        <Eyebrow>Browse everything</Eyebrow>
        <span className="text-sm font-medium text-muted-foreground">{note}</span>
      </Inline>
      <div className="flex flex-col overflow-hidden rounded-lg bg-muted sm:flex-row">
        {VIEWS.map(({ name, sub, href, view }) => (
          <Link
            key={name}
            href={href}
            className="group flex flex-1 items-center gap-2 border-divider-tint px-4 py-3 transition-colors focus-ring not-first:border-t hover:bg-background sm:not-first:border-t-0 sm:not-first:border-l"
          >
            <ViewGlyph view={view} className="size-icon shrink-0 text-muted-foreground group-hover:text-primary" />
            <span>
              <b className="block text-sm font-semibold text-foreground">{name}</b>
              <span className="block text-xs font-medium text-muted-foreground">{sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
