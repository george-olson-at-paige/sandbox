import type { ComponentProps, ReactNode } from "react"

import { Card } from "../components/display/card"
import { AppHeader } from "../shell/app-header"
import { Page } from "./page"

/* @archetype Frame (ARCHETYPES.md).
   AuthPage (REVIEW-18 R18-17…R18-25, George 2026-10-30): the door — sign in, create an account,
   the phone and its code, forgot and set a password, the email links, the invite gate. One quiet
   page: a logo-only AppHeader (a `brand` slot beside the logo for a partner's mark, R18-03), one
   card of 448 (max-w-card, R18-18) centred in Page's focused width, the watercolor along the foot
   behind everything (R18-02, R18-21), and the page's small centred legal footer (LegalFooter,
   R18-20). The card holds the intro at the card's own gutters, centred (R18-23: the live site's
   placement; a card heading at 24px, not the 40px page title — the title is the card's, with
   nothing else on the page to match), the body, and under a hairline the ways out (R18-25).
   A fixed top, not vertical centring (R18-19; George: "fix top is better. it should just end up
   being about vertical center"): Page's roomy 48 on the phone, 128 from sm (48 + 80), so the
   card doesn't jump when an error appears and a short card and a tall one start at the same
   line. Measured at 1280×900 the sign-in card (457 tall) spans 193–650, its centre 29px above the
   viewport's, where a card reads as centred; a taller card runs lower and the page scrolls.
   The art is Paige's own (apps/web/public/assets/watercolor.png, 1440×379), decorative
   (aria-hidden, pointer-events none, opacity-art); it crops at the sides rather than squash.
   Server-safe: no state; the forms inside own theirs. */
const WATERCOLOR = "/assets/watercolor.png"

type AuthPageProps = {
  /** The product mark (usually a link home), at the left of the bar. */
  logo: ReactNode
  /** A partner's mark beside the logo (register with a partner slug); absent on every other page. */
  brand?: ReactNode
  /** The card's heading: what this page is for ("Welcome back", "Create your account"). */
  title: ReactNode
  /** One line under the heading. */
  lede?: ReactNode
  /** The card's body: a form, or a status and one button. */
  children: ReactNode
  /** The ways out, under a hairline at the foot of the card: "Forgot your password?", "New to Paige? Create an account". */
  links?: ReactNode
  /** The page's footer, after the card: a LegalFooter. */
  footer?: ReactNode
}

/** The auth page: logo bar, one centred card with its heading, body and links, the watercolor at the foot, the legal footer. */
function AuthPage({ logo, brand, title, lede, children, links, footer }: AuthPageProps) {
  return (
    <div data-slot="auth-page" className="relative flex min-h-screen flex-col bg-background">
      {/* First in the DOM so the positioned bar, page and footer paint over it. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden opacity-art sm:h-96" data-slot="auth-watercolor">
        <img src={WATERCOLOR} alt="" className="size-full object-cover object-top" />
      </div>
      <AppHeader
        logo={
          brand ? (
            <span className="flex items-center gap-3">
              {logo}
              {brand}
            </span>
          ) : (
            logo
          )
        }
      />
      <Page width="focused" top="roomy">
        <div className="relative flex flex-col items-center sm:pt-20">
          <Card className="w-full max-w-card gap-6 px-6" data-slot="auth-card">
            <hgroup className="flex flex-col gap-2 text-center" data-slot="auth-intro">
              <h1 className="font-display text-2xl font-bold tracking-display text-pretty text-foreground-strong">{title}</h1>
              {lede && <p className="text-sm font-medium text-pretty text-body-muted">{lede}</p>}
            </hgroup>
            {children}
            {links && (
              <div className="flex flex-col items-center gap-2 border-t border-divider-tint pt-6 text-center text-sm text-body-muted" data-slot="auth-links">
                {links}
              </div>
            )}
          </Card>
        </div>
      </Page>
      {footer}
    </div>
  )
}

/** The page's legal footer: small centred links (Privacy, Terms, Security) over the copyright line; in flow, never sticks. */
function LegalFooter({
  children,
  copyright,
}: {
  /** The links, as quiet inline Buttons (asChild over the app's Link). */
  children: ReactNode
  /** The copyright line under the links. */
  copyright?: ReactNode
}) {
  return (
    <footer data-slot="legal-footer" className="page-frame relative flex flex-col items-center gap-2 py-6 text-xs text-muted-foreground">
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-4">
        {children}
      </nav>
      {copyright && <p>{copyright}</p>}
    </footer>
  )
}

export { AuthPage, LegalFooter }
export type { AuthPageProps }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type LegalFooterProps = ComponentProps<typeof LegalFooter>
