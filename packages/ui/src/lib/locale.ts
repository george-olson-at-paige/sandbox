/* The locale the fields format and parse in (R5-01, George 2026-10-19): en-US is the only locale
   built and tested. The plumbing stays (every field takes `locale`, every format comes from
   `Intl`), so another locale is a prop away, but only en-US is promised to be right; the gaps for
   others are GAPS #95 and #96 (deferred with R5-05). A fixed default, not the browser's, also
   keeps the server render and the client's first render the same text. Pure, no "use client". */

/** The default locale for every field and lib/dates.ts / lib/mask.ts formatter. */
export const DEFAULT_LOCALE = "en-US"
