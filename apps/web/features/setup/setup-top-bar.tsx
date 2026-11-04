import Link from "next/link"

import { Button } from "@paige/ui/components/actions/button"

/** The Essential Setup bar's way out: "Save and finish later" (no confirm modal). SetupBeat
    draws the bar itself (logo, StepRail, this link; R4-06). */
export function SetupExit() {
  return (
    <Button asChild variant="quiet" size="inline">
      <Link href="/">Save and finish later</Link>
    </Button>
  )
}
