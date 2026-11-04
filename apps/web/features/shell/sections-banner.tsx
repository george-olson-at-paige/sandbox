"use client"

import { useState } from "react"
import Link from "next/link"

import { PageBand } from "@paige/ui/templates/page"
import { Inline } from "@paige/ui/primitives/inline"
import { Callout, CalloutAction } from "@paige/ui/components/feedback/callout"
import { Button } from "@paige/ui/components/actions/button"

import { VIEWS } from "@/features/home/browse-row"

/** The Sections banner (R2-35): under the nav for established accounts only, saying the pages
    they know are unchanged, with links to them. "Got it" and the dismiss button both hide it.
    Copy from the prototype's SectionsBanner.tsx:20-31, as ported in the Vue app
    (VaultSectionsBanner.vue). Dismissal lasts for the page view here; the real one is saved
    per account (an API field, not in this spike). */
export function SectionsBanner() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <PageBand label="Your sections are still here">
      <Callout
        framed={false}
        title="The sections you know are still here."
        onDismiss={() => setOpen(false)}
        className="min-w-0 flex-1"
        actions={
          <>
            <Inline as="nav" gap={3} aria-label="Your sections" className="text-sm">
              {VIEWS.map((v) => (
                <Button key={v.view} asChild variant="link" size="inline">
                  <Link href={v.href}>{v.name}</Link>
                </Button>
              ))}
            </Inline>
            <CalloutAction onClick={() => setOpen(false)}>Got it</CalloutAction>
          </>
        }
      >
        Paige is now organised around areas of your life. The pages you used before are unchanged — nothing has moved or been
        deleted.
      </Callout>
    </PageBand>
  )
}
