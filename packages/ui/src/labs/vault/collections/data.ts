/* @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §1, D-V5: lands in labs.
   @from the API's external accounts (Paige.Application/DigitalVaults/ExternalAccounts:
   ExternalAccountItem, the 7 types of ADR 0039) and the Passwords worksheet
   (workbooks/passwords/worksheet). The shapes a screen hands the pieces; the pieces never fetch.
   One difference from the wire, on purpose: a credential carries `hasSecret`, not the secret.
   The secret is asked for when the owner wants it (SecretValue's `onReveal`), which is how the
   API should give it (COLLECTIONS-PLAN §4.3); today's get returns them all in plaintext. */

/** One of the 7 account types (ADR 0039). */
export type AccountType = { id: string; label: string }

/** A secret on an account: what it is ("PIN", "Recovery code"; empty is the password) and whether there is one. */
export type Credential = { id: string; label?: string; hasSecret: boolean }

/** A file on an account. */
export type AccountFile = { id: string; name: string }

/** An external account the family will need to get into. */
export type Account = {
  id: string
  title: string
  type: AccountType
  userName?: string
  webSite?: string
  notes?: string
  /** "Added Oct 2, 2026", in the View's words. */
  added: string
  credentials: Credential[]
  files: AccountFile[]
}

/** What the list needs: no secrets, no username (the wire's list is id, title and type). */
export type AccountSummary = Pick<Account, "id" | "title" | "type">

/** The per-type prompt: the types not done yet, in order (done: an account of it, or skipped). */
export type AccountsPrompt = { next: AccountType; done: number; of: number }
