/* Every word the typed fields and the form say (R5-04, R7-03, GAPS #94): their error messages, the screen-reader
   format hints and their in-field action labels, one map per field, in one module. Product
   writes or approves this copy (none of it comes from a source doc yet); when it lands, it lands
   here, in one edit, and no field file changes. The wording below is the spike's own and stays
   until then.
   Server-safe (no "use client"): plain strings and functions. Values passed in (dates, ages,
   currency names) are already formatted for the locale by the field. A caller can still
   override a field's errors per use (`messages` / `invalidMessage` props); this map is the
   default every field falls back to.
   Labels for toggles stay fixed whatever the state (GAPS #98, R6-01): the state is aria-pressed,
   never a changed label. */

export const fieldMessages = {
  date: {
    /** `example`: today, in the locale's format. */
    invalid: (example: string) => `Enter a real date, like ${example}.`,
    beforeMin: (min: string) => `Enter a date on or after ${min}.`,
    afterMax: (max: string) => `Enter a date on or before ${max}.`,
    /** Hint parts. `range` is one of the three range phrases below, or "". */
    rangeBetween: (min: string, max: string) => `, from ${min} to ${max}`,
    rangeFrom: (min: string) => `, ${min} or later`,
    rangeTo: (max: string) => `, ${max} or earlier`,
    hint: (pattern: string, range: string) => `Format: ${pattern}${range}. Alt plus Down Arrow opens a calendar.`,
    /** The native (touch) form has no typed format. */
    nativeHint: (range: string) => `Date${range}.`,
    /** The calendar FieldAction. */
    choose: "Choose date",
    change: (date: string) => `Change date, ${date}`,
  },
  dateOfBirth: {
    /** `example`: a sample date of birth, in the locale's format. */
    invalid: (example: string) => `Enter a real date, like ${example}.`,
    future: "A date of birth can’t be in the future.",
    tooYoung: (minAge: number) => `Enter a date of birth for someone ${minAge} or older.`,
    tooOld: (maxAge: number) => `Enter a date of birth for someone ${maxAge} or younger.`,
    /** No `maxAge` given: more than 130 years ago reads as a mistyped year. */
    tooOldDefault: "Check the year: that’s more than 130 years ago.",
    agesBetween: (minAge: number, maxAge: number) => ` Age ${minAge} to ${maxAge}.`,
    agesFrom: (minAge: number) => ` Age ${minAge} or older.`,
    agesTo: (maxAge: number) => ` Age ${maxAge} or younger.`,
    hint: (pattern: string, ages: string) => `Format: ${pattern}.${ages}`,
  },
  phone: {
    invalid: "Enter a 10-digit US phone number.",
    hint: "US phone number, 10 digits.",
  },
  postalCode: {
    invalid: "Enter a 5-digit ZIP code, or ZIP+4.",
    hint: "US ZIP code, 5 digits, or 9 for ZIP+4.",
  },
  ssn: {
    incomplete: "Enter all 9 digits of the Social Security number.",
    invalid: "That isn’t a valid Social Security number. Check the digits.",
    hintRevealOnFocus: "Social Security number, 9 digits. Only the last four show when you leave the field.",
    hintToggle: "Social Security number, 9 digits. Only the last four show; Show SSN shows them all until you leave the field.",
    hintMasked: "Social Security number, 9 digits. Only the last four show.",
    /** The reveal toggle: one label, pressed or not. */
    reveal: "Show SSN",
  },
  currency: {
    hint: (currencyName: string, allowNegative: boolean) =>
      `Amount in ${currencyName}${allowNegative ? "; a minus sign for a negative amount" : ""}.`,
  },
  password: {
    /** The reveal toggle: one label, pressed or not. */
    reveal: "Show password",
  },
  /* PasswordStrength (R20-20): the rules the API's password policy asks for, the verdict, and what a
     screen reader hears beside each. The rules follow the policy (length, a digit, a symbol); the
     wording is the spike's own until Product's lands. */
  passwordStrength: {
    rules: {
      /** `min`: the policy's minimum length. */
      length: (min: number) => `At least ${min} characters`,
      digit: "A number",
      symbol: "A symbol, like ! or ?",
    },
    /** The rules list's accessible name. */
    rulesLabel: "Password rules",
    /** Said after a rule's text for screen readers (the icon is decorative). */
    met: "done",
    unmet: "not yet",
    /** The verdict's lead-in, said for screen readers before the word. */
    verdictLead: "Password strength:",
    verdicts: { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" },
  },
} as const

/* What Form, ErrorSummary and the footers say (R7-03). Same status as the field copy above: the
   spike's own wording until Product's lands (GAPS #94). */
export const formMessages = {
  /** Field `required`: the message under the control. */
  required: "Enter a value.",
  /** ErrorSummary's heading. */
  summaryTitle: "Check these and try again",
  /** ErrorSummary's heading over one problem (R18-24). */
  summaryTitleOne: "Check this and try again",
  /** onSubmit threw and gave no message of its own. */
  failed: "We couldn’t save that. Your answers are still here; try again.",
  /** The submit button while the form is saving. */
  pending: "Saving…",
  /** FormFooter's submit label when none is given. */
  submit: "Save",
  /** Leaving a form with unsaved changes (R8-01): the link-click confirm. Browsers use their own words for a tab close or reload. */
  unsaved: "You have changes that aren’t saved. Leave this page and lose them?",
  /** The API answered 401 (R8-02): the session ended while the form was open. */
  signedOut: "You’ve been signed out. Sign in again, then save; your answers are still here.",
  /** The API answered 403 (R8-02). */
  forbidden: "You don’t have permission to save this.",
  /** The API answered 429 (R8-02). */
  tooMany: "Too many tries in a row. Wait a minute, then save again; your answers are still here.",
  /** InlineEdit (R11-04). */
  inlineEdit: {
    save: "Save",
    cancel: "Cancel",
    /** The read state of a value that isn't there yet. */
    empty: "Nothing here yet",
    /** The read state's hidden suffix: the button's name is the value, then this. */
    edit: (label: string) => `Edit ${label}`,
    /** Shown in place for a moment after a save, and announced. */
    saved: "Saved",
    /** The switch's visible state, beside it (aria-checked carries it for screen readers). */
    on: "On",
    off: "Off",
    /** onSave threw or rejected and gave no message of its own. */
    failed: "We couldn’t save that. Try again.",
  },
} as const
