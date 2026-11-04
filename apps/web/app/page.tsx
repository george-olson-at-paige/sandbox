import { HomePage as HomeTemplate } from "@paige/ui/templates/home-page"

import { AreaTiles } from "@/features/home/area-tiles"
import { BrowseRow } from "@/features/home/browse-row"
import { Hero } from "@/features/home/hero"
import { SectionsBanner } from "@/features/shell/sections-banner"
import { VaultShell } from "@/features/shell/vault-shell"
import { establishedHome } from "@/fixtures/established"
import { home as maya } from "@/fixtures/maya"

// /?as=established shows an established account (used Paige before Areas): the Sections banner.
export default async function HomePage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams
  const home = as === "established" ? establishedHome : maya
  return (
    <VaultShell owner={home.owner}>
      <HomeTemplate
        band={home.established ? <SectionsBanner /> : undefined}
        intro={<Hero hero={home.hero} />}
        tiles={<AreaTiles tiles={home.tiles} />}
        footer={<BrowseRow note={home.browseNote} />}
      />
    </VaultShell>
  )
}
