import { useEffect, useState, type ComponentProps } from "react"
import { FileTextIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Placeholder } from "./placeholder"
import { Button } from "../components/actions/button"
import { AppHeader } from "../shell/app-header"
import type { HeaderSearchGroup } from "../shell/header-search"
import { LegalFooter } from "../templates/auth-page"

/* Story-only helpers. StubLink stands in for the app's router link (composites take a
   `linkAs` prop, GAPS #42) and keeps the Storybook canvas from navigating. */
export function StubLink({ onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
      }}
    />
  )
}

/* The app's logo, served from apps/web/public via Storybook staticDirs. */
export function PaigeLogo() {
  return (
    <StubLink href="/" aria-label="Paige home" className="rounded-sm focus-ring">
      <img src="assets/paige-logo.png" alt="Paige" width={55} height={24} className="h-6 w-auto" />
    </StubLink>
  )
}

/* The auth pages' legal footer (REVIEW-18 R18-20): the three links every public page carries,
   over the copyright line; one copy for the nine auth stories. */
export function AuthLegalFooter() {
  return (
    <LegalFooter copyright="© 2026 Paige®. All rights reserved.">
      {[
        ["Privacy", "#privacy"],
        ["Terms", "#terms"],
        ["Security", "#security"],
      ].map(([label, href]) => (
        <Button key={href} asChild variant="quiet" size="inline">
          <StubLink href={href}>{label}</StubLink>
        </Button>
      ))}
    </LegalFooter>
  )
}

/* Stand-in account menu items (the prototype has none; GAPS #74). */
export const ACCOUNT_ITEMS = [
  { label: "Settings", href: "#settings", icon: <SettingsIcon /> },
  { label: "Sign out", href: "#sign-out", icon: <LogOutIcon /> },
]

/* A page's top: the real AppHeader (logo + placeholder actions), for layout stories (R1-23),
   so the logo's left edge can be compared with the content's. */
export function StoryAppHeader() {
  return <AppHeader logo={<PaigeLogo />} actions={<Placeholder size="sm" label="Actions" className="w-40" />} />
}

/* Prints the side gutter the browser resolved at this width. */
export function GutterReadout() {
  const [state, setState] = useState({ width: 0, gutter: "" })
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--gutter").trim()
      setState({ width: window.innerWidth, gutter: v.endsWith("rem") ? `${parseFloat(v) * 16}px` : v })
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])
  return (
    <p className="text-sm font-semibold text-card-foreground">
      Side gutter at {state.width}px: {state.gutter}
    </p>
  )
}

/* Stand-in search (R11-11): search doesn't exist yet (D17/D18), so stories filter this list.
   Relationships are the roles the owner stated (R3-19). */
const SEARCH_ITEMS: Array<{ group: "people" | "documents"; id: string; label: string; detail: string }> = [
  { group: "people", id: "daniel", label: "Daniel Reyes", detail: "Spouse" },
  { group: "people", id: "elena", label: "Elena Reyes", detail: "Child" },
  { group: "people", id: "rosa", label: "Rosa Martinez", detail: "Sibling · Executor" },
  { group: "documents", id: "will", label: "Last will and testament", detail: "Family · Will" },
  { group: "documents", id: "deed", label: "Deed to the house on Alder Street", detail: "Home · Document" },
  { group: "documents", id: "policy", label: "Life insurance policy", detail: "Money · Document" },
]

/** Stand-in results for a query: case-insensitive match on the name or the detail, grouped. */
export function standInSearch(query: string): HeaderSearchGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits = SEARCH_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q))
  return [
    { id: "people", label: "People", results: hits.filter((h) => h.group === "people").map((h) => ({ id: h.id, label: h.label, detail: h.detail, href: `#${h.id}`, icon: <UserIcon /> })) },
    { id: "documents", label: "Documents", results: hits.filter((h) => h.group === "documents").map((h) => ({ id: h.id, label: h.label, detail: h.detail, href: `#${h.id}`, icon: <FileTextIcon /> })) },
  ].filter((g) => g.results.length > 0)
}
