import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { fieldMessages } from "./messages"

/* @archetype Composite (ARCHETYPES.md).
   PasswordStrength (R20-20, from ReUI's c-input-22 rule list and c-input-23 strength bar): what a
   new password has to be, and how far the one being typed is from it, shown under the password
   Field. A Composite: it has no axes of its own; `display` is which of its two parts show
   (`bar`, `rules`, `both`), not a look.
   - The rules are the API's password policy. The API is ASP.NET Identity with `RequiredLength`
     (the real number comes from Key Vault, `IdentityOptions:PasswordLength`; the code's own
     default is 3), `RequireDigit` and `RequireNonAlphanumeric` (both true by default). It does
     not require upper or lower case, so neither do we. The policy is not served by any endpoint
     yet, so `PASSWORD_POLICY` below is a spike constant (`minLength: 8` is a guess) and the real
     one has to come from the API (API-NEEDS: expose the password policy so the client can show
     the rules before submit). A screen passes `policy` the day it has one; nothing else changes.
   - The score. `scorePassword` is a ladder, not a sum, so the verdict can never say Good about a
     password the API will refuse: under the minimum length is Weak (1 step); long enough but a
     digit or symbol rule is unmet is Fair (2); every rule met is Good (3); every rule met and at
     least four characters past the minimum is Strong (4). Empty is no step and no verdict. Length
     past the minimum is the only thing that lifts a verdict beyond the policy, since length is
     what makes a password hard to guess; mixing character classes beyond the policy adds nothing
     here, and there is no dictionary or entropy estimate (a guess meter belongs to the server).
   - The bar is four segments, not the Progress component: Progress draws one continuous bar in
     the area colour (success at 100) and has no steps or per-step tone. Each segment is a track
     (`bg-track`) that takes the verdict's tone when lit. Tones are the status ones, never red
     (red is for irreversible actions, R2-03): Weak attention, Fair warning, Good info, Strong
     success. The bar is decorative; the verdict word beside it says the same.
   - The verdict is the one live region (`aria-live="polite"`, always mounted so a change is
     announced): it says "Password strength: Good" for a screen reader. With `display="rules"` it
     stays in the page, visually hidden, so the rules-only form still announces it.
   - Empty is not an alarm (forms README: empty is not an error). The bar and the rules stay
     on screen together. An unmet rule, including an empty password, wears a muted cross; a met
     rule turns success. There is no verdict until there is text. The bar's tracks stay empty
     until there is text, and the verdict's slot stays one line tall so the word never moves it.
   - Never logs or stores the value; it only reads it. */

/** The rules a password has to meet (the API's ASP.NET Identity options). */
type PasswordPolicy = {
  /** Fewest characters allowed (`RequiredLength`). */
  minLength: number
  /** Needs a digit (`RequireDigit`). */
  digit: boolean
  /** Needs a character that is not a letter or digit (`RequireNonAlphanumeric`). */
  symbol: boolean
}

/** The spike's guess at the policy until the API serves it (API-NEEDS): 8 characters, a digit and a symbol. */
const PASSWORD_POLICY: PasswordPolicy = { minLength: 8, digit: true, symbol: true }

/** One rule and whether the password meets it. */
type PasswordRule = { id: "length" | "digit" | "symbol"; text: string; met: boolean }

/** What a password scores against a policy: its rules, how many of the four steps are lit (0 for empty), and the verdict word. */
type PasswordStrengthResult = {
  rules: PasswordRule[]
  /** 0 (empty) to 4. */
  steps: 0 | 1 | 2 | 3 | 4
  /** The word for the steps; undefined when there is no text. */
  verdict: "weak" | "fair" | "good" | "strong" | undefined
}

/** Characters past the minimum length that lift a password that meets every rule from Good to Strong. */
const STRONG_EXTRA = 4

const VERDICT = ["weak", "fair", "good", "strong"] as const
// Unicode like ASP.NET's char.IsDigit and char.IsLetterOrDigit, so what the bar accepts is what the API accepts.
const HAS_DIGIT = /\p{Nd}/u
const HAS_SYMBOL = /[^\p{L}\p{Nd}]/u

/** Scores a password against a policy: the rules it meets, the steps lit (a ladder: under the minimum is 1, a rule unmet is 2, all met is 3, four past the minimum is 4) and the verdict. */
function scorePassword(value: string, policy: Partial<PasswordPolicy> = PASSWORD_POLICY): PasswordStrengthResult {
  const minLength = policy.minLength ?? PASSWORD_POLICY.minLength
  const needDigit = policy.digit ?? PASSWORD_POLICY.digit
  const needSymbol = policy.symbol ?? PASSWORD_POLICY.symbol
  const length = [...value].length
  const rules: PasswordRule[] = [{ id: "length", text: fieldMessages.passwordStrength.rules.length(minLength), met: length >= minLength }]
  if (needDigit) rules.push({ id: "digit", text: fieldMessages.passwordStrength.rules.digit, met: HAS_DIGIT.test(value) })
  if (needSymbol) rules.push({ id: "symbol", text: fieldMessages.passwordStrength.rules.symbol, met: HAS_SYMBOL.test(value) })
  if (length === 0) return { rules, steps: 0, verdict: undefined }
  const lengthMet = rules[0].met
  const allMet = rules.every((r) => r.met)
  const steps = (!lengthMet ? 1 : !allMet ? 2 : length >= minLength + STRONG_EXTRA ? 4 : 3) as 1 | 2 | 3 | 4
  return { rules, steps, verdict: VERDICT[steps - 1] }
}

/* Status tones (theme.css layer 1), one per step: the lit segments and the verdict's ink. */
const TONE = {
  weak: { fill: "bg-attention", ink: "text-attention-foreground" },
  fair: { fill: "bg-warning", ink: "text-warning-foreground" },
  good: { fill: "bg-info", ink: "text-info-foreground" },
  strong: { fill: "bg-success", ink: "text-success-foreground" },
} as const

type PasswordStrengthProps = {
  /** The password as typed (controlled by the caller; read, never stored or logged). */
  value: string
  /** The rules; each key falls back to `PASSWORD_POLICY`. Pass the API's policy when it is served. */
  policy?: Partial<PasswordPolicy>
  /** What shows: the strength `bar` with its verdict, the `rules` list, or `both` (default). */
  display?: "bar" | "rules" | "both"
  className?: string
}

/** The password rules and a four-step strength bar for a new password, under its Field; the verdict is announced politely. */
function PasswordStrength({ value, policy, display = "both", className }: PasswordStrengthProps) {
  const { rules, steps, verdict } = scorePassword(value, policy)
  const tone = verdict ? TONE[verdict] : undefined
  const showBar = display !== "rules"
  const showRules = display !== "bar"
  const words = fieldMessages.passwordStrength
  return (
    <div data-slot="password-strength" data-steps={steps} data-verdict={verdict} className={cn("flex min-w-0 flex-col", className)}>
      {showBar ? (
        /* Always mounted so a change is announced. One line tall, so the verdict never moves the bar. */
        <div className={cn("flex h-4 min-w-0 items-center gap-3", showRules && "mb-2")}>
          <div aria-hidden data-slot="password-strength-bar" className="grid h-1 flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span key={step} data-lit={step <= steps ? "" : undefined} className={cn("rounded-full bg-track transition-colors", step <= steps && tone?.fill)} />
            ))}
          </div>
          <span aria-live="polite" data-slot="password-strength-verdict" className={cn("flex h-4 w-14 shrink-0 items-center justify-end text-xs font-semibold whitespace-nowrap", tone?.ink)}>
            {verdict && (
              <>
                <span className="sr-only">{words.verdictLead} </span>
                {words.verdicts[verdict]}
              </>
            )}
          </span>
        </div>
      ) : (
        <span aria-live="polite" data-slot="password-strength-verdict" className="sr-only">
          {verdict && (
            <>
              {words.verdictLead} {words.verdicts[verdict]}
            </>
          )}
        </span>
      )}
      {showRules && (
        <ul aria-label={words.rulesLabel} data-slot="password-strength-rules" className="flex min-w-0 flex-col gap-1">
          {rules.map((rule) => (
            <li key={rule.id} data-rule={rule.id} data-met={rule.met ? "" : undefined} className={cn("flex items-center gap-2 text-sm", rule.met ? "text-foreground" : "text-muted-foreground")}>
              {rule.met ? <CheckIcon aria-hidden className="size-icon-sm shrink-0 text-success" /> : <XIcon aria-hidden className="size-icon-sm shrink-0 text-muted-foreground" />}
              <span>
                {rule.text}
                <span className="sr-only">, {rule.met ? words.met : words.unmet}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

;(PasswordStrength as { fieldPart?: "adornment" }).fieldPart = "adornment"

export { PasswordStrength, PASSWORD_POLICY, scorePassword }
export type { PasswordPolicy, PasswordRule, PasswordStrengthProps, PasswordStrengthResult }
