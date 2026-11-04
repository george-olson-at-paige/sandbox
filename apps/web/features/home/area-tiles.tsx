import Link from "next/link"

import { AreaTile } from "@paige/ui/vault/areas/area-tile"

import type { TileView } from "@/fixtures/types"

/** The Grid: nine AreaTiles, fixed order, never re-sorted. HomePage lays them out (1/2/3). */
export function AreaTiles({ tiles }: { tiles: TileView[] }) {
  return tiles.map((t) => <AreaTile key={t.area} {...t} href={`/area/${t.area}`} linkAs={Link} />)
}
