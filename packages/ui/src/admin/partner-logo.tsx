import type { MediaSize } from "../lib/vocabulary"
import type { PartnerRow } from "./partner-rules"

// todo: this shouldn't be here

/* @archetype Media (ARCHETYPES.md).
   The partner's logo as the admin site shows it: the partner page, the Update logo dialog's
   Current side and the offer preview's header (R13-22, R15-15). Its own file since 2026-10-30
   (from pages/partners.tsx): a part the root and the pages share belongs at the admin root, never
   in a page module (`check:layers` GROUP). A fixed box, the image contained on white inside the
   theme's border; when there's no logo yet, the partner's initials on the muted fill.
   size sm (32 tall, 64 wide: a preview strip; the list has no logo column, R16-06) · lg (80 tall,
   full width: the dialog and the partner page). At lg the image names the partner ("Acme logo");
   at sm it is decorative (alt ""), because whatever shows it already says the name. */

type PartnerLogoProps = {
  /** The partner (its name for the initials and the image's name; its logo, or null for none yet). */
  partner: Pick<PartnerRow, "name" | "logoUrl">
  /** The media scale's two ends: sm for a strip, lg for the dialog and the partner page. */
  size?: Extract<MediaSize, "sm" | "lg">
}

/** The partner's logo in a fixed box (contained, on white), or its initials when there's none. */
function PartnerLogo({ partner, size = "sm" }: PartnerLogoProps) {
  const box = size === "lg" ? "h-20 w-full p-3" : "h-8 w-16 p-1"
  if (!partner.logoUrl)
    return (
      <span aria-hidden data-slot="partner-logo" data-empty="" className={`grid shrink-0 place-items-center rounded-sm bg-muted text-xs font-semibold text-muted-foreground ${box}`}>
        {partner.name
          .split(/\s+/)
          .filter((w) => /^[A-Za-z]/.test(w))
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
    )
  return (
    <span data-slot="partner-logo" className={`grid shrink-0 place-items-center rounded-sm border border-border bg-card ${box}`}>
      <img src={partner.logoUrl} alt={size === "lg" ? `${partner.name} logo` : ""} className="max-h-full max-w-full object-contain" />
    </span>
  )
}

export { PartnerLogo }
export type { PartnerLogoProps }
