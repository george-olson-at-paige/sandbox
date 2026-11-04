/* A US postal address (AddressField): one shape everywhere, as the Vue app's utils/postalAddress.ts
   and the API's home address. Every key is always present; "" means not set, so a partial
   address is the same type, not another one. Pure: no React, tested in postal-address.test.ts. */

export type PostalAddress = {
  street: string
  unit: string
  city: string
  state: string
  postalCode: string
  country: string
}

/** Where street suggestions come from: a list (filtered here) or a lookup (which filters itself; Photon in the app). */
export type PostalAddressSource = readonly PostalAddress[] | ((query: string) => PostalAddress[] | Promise<PostalAddress[]>)

/** A lookup needs this many characters before it runs. */
export const MIN_ADDRESS_QUERY = 2

/** An address with every key present: the overrides trimmed, the rest "" (country "US"). */
export function emptyPostalAddress(overrides: Partial<PostalAddress> = {}): PostalAddress {
  const address: PostalAddress = { street: "", unit: "", city: "", state: "", postalCode: "", country: "US" }
  for (const key of Object.keys(overrides) as (keyof PostalAddress)[]) {
    const raw = overrides[key]
    if (raw != null) address[key] = String(raw).trim()
  }
  return address
}

/** Any part after the street (unit, city, state, ZIP) is set. */
export function hasAddressParts(address: PostalAddress): boolean {
  return Boolean(address.unit.trim() || address.city.trim() || address.state.trim() || address.postalCode.trim())
}

/** The street line: "418 Willow Creek Dr, Apt 2". */
export function formatStreetLine(address: PostalAddress): string {
  return [address.street, address.unit].filter(Boolean).join(", ")
}

/** The line after the street: "Round Rock, Texas 78664". */
export function formatLocality(address: PostalAddress): string {
  const stateZip = [address.state, address.postalCode].filter(Boolean).join(" ")
  return [address.city, stateZip].filter(Boolean).join(", ")
}

/** The whole address on one line, for reading: "418 Willow Creek Dr, Apt 2, Round Rock, Texas 78664". Not the API's stored line (the Vue app's formatPostalAddress puts " — " between the street and the locality). */
export function formatPostalAddress(address: PostalAddress): string {
  return [formatStreetLine(address), formatLocality(address)].filter(Boolean).join(", ")
}

/** A list entry matches when its street or its whole line contains the query (case-insensitive, 2+ characters). */
export function postalAddressMatches(address: PostalAddress, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q.length < MIN_ADDRESS_QUERY) return false
  return address.street.toLowerCase().includes(q) || formatPostalAddress(address).toLowerCase().includes(q)
}

/** Suggestions for a query: none under 2 characters; a list filtered here, a lookup asked; at most `limit`, each with every key. */
export async function queryPostalAddresses(source: PostalAddressSource, query: string, limit = 6): Promise<PostalAddress[]> {
  const q = query.trim()
  if (q.length < MIN_ADDRESS_QUERY) return []
  const rows = typeof source === "function" ? await source(q) : source.filter((a) => postalAddressMatches(a, q))
  return rows.slice(0, limit).map((a) => emptyPostalAddress(a))
}
