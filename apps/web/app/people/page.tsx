import { PeopleScreen } from "@/features/people/people-screen"
import { VaultShell } from "@/features/shell/vault-shell"
import { areas, home } from "@/fixtures/maya"

// People (VIEWS-PLAN.md): Maya's people, gathered from her Areas' rows until the people-book
// fixture lands (step 3). `?id=` opens one.
const people = Object.values(areas)
  .flatMap((area) => [...area.essentials, ...area.depth])
  .flatMap((row) => row.people ?? [])
  .filter((person, i, all) => all.findIndex((other) => other.name === person.name) === i)
  .map((person) => ({ ...person, id: person.name.toLowerCase().replace(/[^a-z]+/g, "-") }))

export default async function PeopleRoute({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return (
    <VaultShell owner={home.owner}>
      <PeopleScreen people={people} openId={id} />
    </VaultShell>
  )
}
