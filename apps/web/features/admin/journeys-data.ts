import type { JourneyRange, JourneyUsage } from "@paige/ui/admin/journey-rules"
import { journeyRecordings } from "@paige/ui/fixtures/journeys"

/* Where /admin/journeys gets its numbers (R21-21): `GET admin/usage/journeys` (journey, from,
   entry). Today it answers from the responses recorded from the local stack; when the app has
   its API module (Lane 4), this function's body becomes that call — `from` is
   `fromForRange(range, new Date())` from journey-rules — and nothing else changes: the page takes
   the response as is (`JourneyUsage` is a structural subset of it). Null is "not recorded" (a
   journey or entry the recordings don't cover), which the screen shows as its error state. */

/** One request: which journey, which window, which way in (null for everyone). */
export type JourneyQuery = { journey: string; range: JourneyRange; entry: string | null }

/** The journey's usage for the query, or null when it has no data. */
export async function loadJourneyUsage({ journey, range, entry }: JourneyQuery): Promise<JourneyUsage | null> {
  return journeyRecordings[`${journey}.${range}.${entry ?? "all"}`] ?? null
}

/** The page's freshness line: what the numbers are and when they're from (the API has no `asOf` yet, API-NEEDS A49). */
export const journeysSource = "Local stack · recorded 1 Nov 2026"
