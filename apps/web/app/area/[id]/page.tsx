import { notFound } from "next/navigation"

import { AreaScreen } from "@/features/area/area-screen"
import { VaultShell } from "@/features/shell/vault-shell"
import { graceFamily } from "@/fixtures/grace"
import { areas, home } from "@/fixtures/maya"

// Maya has fixtures for family, personal, insurance and household.
// /area/family?as=grace shows a set-up Family page with declined rows.
export default async function AreaRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ as?: string }>
}) {
  const { id } = await params
  const { as } = await searchParams
  const view = as === "grace" && id === "family" ? graceFamily : areas[id]
  if (!view) notFound()
  return (
    <VaultShell owner={home.owner}>
      <AreaScreen view={view} />
    </VaultShell>
  )
}
