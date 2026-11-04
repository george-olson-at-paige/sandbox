import { emptyPostalAddress, type PostalAddress } from "../lib/postal-address"

/* Addresses for the AddressField stories and the setup stories: the Vue app's street book
   (features/vault/fixtures/addresses.ts), then three cities on their own, since a city alone is
   an answer in setup. Type "Ashcroft", "Willow" or "Portland". The app looks up Photon instead.
   Fixtures only: package code never imports this folder (check-layers). */
export const FIXTURE_ADDRESSES: PostalAddress[] = [
  emptyPostalAddress({ street: "1408 Ashcroft Lane", city: "Portland", state: "Oregon", postalCode: "97216" }),
  emptyPostalAddress({ street: "412 Willow Creek Dr", city: "Round Rock", state: "Texas", postalCode: "78664" }),
  emptyPostalAddress({ street: "418 Willow Creek Dr", unit: "Apt 2", city: "Round Rock", state: "Texas", postalCode: "78664" }),
  emptyPostalAddress({ street: "600 Congress Ave", city: "Austin", state: "Texas", postalCode: "78701" }),
  emptyPostalAddress({ street: "1100 S Lamar Blvd", city: "Austin", state: "Texas", postalCode: "78704" }),
  emptyPostalAddress({ city: "Portland", state: "Oregon" }),
  emptyPostalAddress({ city: "Round Rock", state: "Texas" }),
  emptyPostalAddress({ city: "Austin", state: "Texas" }),
]
