"use client"

import type { ElementType, MouseEvent, ReactNode } from "react"
import { useMemo, useState } from "react"

/* @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2: how a keep-and-compose view moves
   between its screens (the list, an item, its form) in labs, where there's no router. Every
   move is a link to one of the view's `href`s, so a page can deep-link them; `resolve` turns an
   href back into the view's route, and the returned `NavLink` changes the route in place
   (a modified click still opens the href). In the app the router does this and the view reads
   the route from the URL. Extracted on the third view (Passwords, Memories, Messages). */

/** A view's route in labs: the route, a setter, and a link that moves to one of the view's hrefs in place. */
export function useRoutes<R>(initial: R, resolve: (href: string) => R | undefined, linkAs: ElementType = "a") {
  const [route, setRoute] = useState<R>(initial)
  const NavLink = useMemo<ElementType>(
    () =>
      function NavLink({ href, children, ...rest }: { href: string; children: ReactNode }) {
        const Link = linkAs
        return (
          <Link
            href={href}
            {...rest}
            onClick={(e: MouseEvent) => {
              const to = resolve(href)
              if (e.metaKey || e.ctrlKey || e.shiftKey || to === undefined) return
              e.preventDefault()
              setRoute(to)
            }}
          >
            {children}
          </Link>
        )
      },
    // `resolve` is the view's; it changes when its items do.
    [linkAs, resolve],
  )
  return { route, setRoute, NavLink }
}
