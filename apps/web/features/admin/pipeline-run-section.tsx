"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { adminHref } from "@paige/ui/admin/admin-nav"
import { PipelineGraph, type PipelineRun } from "@paige/ui/admin/pipeline-graph"

/* The run graph on /admin (R9-07): PipelineGraph with the selected step in the URL
   (/admin?step=sendgrid-contacts), so a step's details deep-link and back/forward walk the
   selections. useSearchParams needs a Suspense boundary for the static build; its fallback is
   the graph's own loading state, so nothing shifts. */
function RunGraph({ run, now, title }: { run: PipelineRun; now?: number; title: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const step = params.get("step")
  const select = (next: string | null) => {
    const q = new URLSearchParams(params.toString())
    if (next) q.set("step", next)
    else q.delete("step")
    const query = q.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
  return (
    <PipelineGraph
      run={run}
      title={title}
      now={now}
      selectedStep={step}
      onSelectStep={select}
      linkAs={Link}
      // The logs route is provisional, like the rest of the admin route map (GAPS #108).
      logsHref={(s) => (s.jobId ? `${adminHref("jobs")}/${s.jobId}/logs` : undefined)}
    />
  )
}

/** The run graph; its title is the frame's own heading (R10-01), so the page adds none above it. */
export function PipelineRunSection({ run, now }: { run: PipelineRun; now?: number }) {
  const title = `${run.pipelineTitle ?? run.pipeline}: this morning’s run`
  return (
    <Suspense fallback={<PipelineGraph run={run} title={title} loading />}>
      <RunGraph run={run} now={now} title={title} />
    </Suspense>
  )
}
