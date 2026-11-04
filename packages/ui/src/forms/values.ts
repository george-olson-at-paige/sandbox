/* The value shapes the typed fields hand back (R4-12, R7-03), named so a domain form's values
   type says what each field holds. They are plain aliases (no brands), so an API type that says
   `string` still fits. Never a `Date` object across an API, never a float for money. */

/** An ISO calendar date, "YYYY-MM-DD", or "" (DateField, DateOfBirthField): the one in lib/dates.ts (R17-02). */
export type { IsoDate } from "../lib/dates"

/** An E.164 phone number, "+15551234567", or "" (PhoneField). */
export type E164 = string

/** A US ZIP or ZIP+4, "12345" or "12345-6789", or "" (PostalCodeField). */
export type PostalCode = string

/** Nine SSN digits, or "" (SsnField). Never logged, never in a URL or telemetry. */
export type SsnDigits = string

/** Money in integer minor units (cents), or null when empty (CurrencyField). */
export type Cents = number | null
