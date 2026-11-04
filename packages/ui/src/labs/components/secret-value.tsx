"use client"

import type { ComponentProps } from "react"
import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { copyText } from "../../components/actions/copy-button"
import { IconButton } from "../../components/actions/icon-button"
import { Spinner } from "../../components/feedback/spinner"
import { cn } from "../../lib/utils"

/* @archetype Display (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §3 (George 2026-11-04): a secret, read —
   an account's password, a PIN, a recovery code — on its item page, never in a list.
   - Hidden by default, always as the same eight dots, so the mask says nothing about its length.
   - Show reveals it; it hides itself again after `hideAfter` (30s) and when the page loses it.
   - Copy puts it on the clipboard without showing it; the button says "Copied" for a moment.
   - It can be given the secret (`value`) or ask for it (`onReveal`), so a page can fetch one
     secret when the owner asks rather than load them all (the API returns every secret on the
     item's get today: COLLECTIONS-PLAN §4.3). While it asks, its buttons are off and it says
     so; a refusal shows its reason under the value and nothing is revealed.
   - The value is monospace (a secret is characters, not words: 0 and O, 1 and l). */

type Revealed = string | { error: string }

/** A secret, read: hidden as eight dots; Show (hides itself again) and Copy (without showing). Given the value, or asks for it. */
export function SecretValue({
  name,
  value,
  onReveal,
  hideAfter = 30,
  copy = { show: "Show", hide: "Hide", copy: "Copy", copied: "Copied", revealing: "Getting it…" },
  className,
}: {
  /** What it is, for the buttons' names ("Show the password for Chase"). */
  name: string
  /** The secret, when the page already has it. */
  value?: string
  /** Asks for the secret when it's first needed (Show or Copy). Resolve the secret, or `{ error }`. */
  onReveal?: () => Promise<Revealed>
  /** Seconds it stays shown before hiding itself. */
  hideAfter?: number
  /** The words: the buttons' verbs and the pending line. */
  copy?: { show: string; hide: string; copy: string; copied: string; revealing: string }
  className?: string
}) {
  const [secret, setSecret] = useState(value)
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => setSecret(value), [value])
  useEffect(
    () => () => {
      clearTimeout(hideTimer.current)
      clearTimeout(copiedTimer.current)
    },
    [],
  )
  // Leaving the tab hides it.
  useEffect(() => {
    const onHide = () => document.hidden && setShown(false)
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [])

  async function get(): Promise<string | undefined> {
    if (secret !== undefined) return secret
    if (!onReveal) return undefined
    setBusy(true)
    setError("")
    const result = await onReveal()
    setBusy(false)
    if (typeof result !== "string") {
      setError(result.error)
      return undefined
    }
    setSecret(result)
    return result
  }
  async function toggle() {
    if (shown) {
      setShown(false)
      return
    }
    if ((await get()) === undefined) return
    setShown(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShown(false), hideAfter * 1000)
  }
  async function copyIt() {
    const text = await get()
    if (text === undefined) return
    const ok = await copyText(text)
    if (!ok) return
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span data-slot="secret-value" className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="flex min-w-0 items-center gap-1">
        <span
          data-slot="secret-value-text"
          className={cn("min-w-0 flex-1 font-mono text-sm font-semibold wrap-anywhere", shown ? "" : "tracking-widest text-muted-foreground")}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2 font-sans font-medium tracking-normal">
              <Spinner size="sm" label={copy.revealing} />
              {copy.revealing}
            </span>
          ) : shown ? (
            secret
          ) : (
            <span aria-label={`${name}, hidden`}>••••••••</span>
          )}
        </span>
        <IconButton
          variant="ghost"
          shape="rect"
          icon={shown ? <EyeOffIcon /> : <EyeIcon />}
          aria-label={`${shown ? copy.hide : copy.show} ${name}`}
          aria-pressed={shown}
          disabled={busy}
          onClick={() => void toggle()}
        />
        <IconButton
          variant="ghost"
          shape="rect"
          icon={copied ? <CheckIcon /> : <CopyIcon />}
          aria-label={`${copied ? copy.copied : copy.copy} ${name}`}
          disabled={busy}
          onClick={() => void copyIt()}
        />
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? copy.copied : ""}
      </span>
      {error && (
        <span role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </span>
      )}
    </span>
  )
}

export type SecretValueProps = ComponentProps<typeof SecretValue>
