"use client"

import type { ComponentProps } from "react"
import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "./button"

/* @archetype Action (ARCHETYPES.md).
   CopyButton (R13-22): copies a text (a signup link) and says so in place. The label turns to
   "Copied" with a tick for two seconds (announced: the label sits in a polite live region), or to
   "Couldn't copy" when the browser refuses; never a toast or a banner. The clipboard API needs a
   secure context and the document's focus; without it, the hidden-textarea fallback
   (`document.execCommand("copy")`, deprecated but still the one that works in an iframe or an
   http preview) is tried before giving up. `copyText` is exported for a menu item that copies
   (the result then shows in the list's status line). */

/** Copies text to the clipboard; resolves true when it got there. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Refused (no focus, no permission): try the fallback.
  }
  try {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.className = "sr-only"
    document.body.append(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** A small button that copies a text and says "Copied" in place for a moment. */
function CopyButton({
  text,
  label = "Copy",
  "aria-label": ariaLabel,
  size = "sm",
  variant = "secondary",
  className,
}: {
  /** What goes on the clipboard. */
  text: string
  /** The resting label ("Copy link"). */
  label?: string
  /** Names what it copies for screen readers when several sit together ("Copy Cedar Trust's signup link"); the visible label stays short. */
  "aria-label"?: string
  /** sm (default) or md; inline sits in a line of text (the parent's size, no padding). */
  size?: "sm" | "md" | "inline"
  variant?: "secondary" | "quiet"
  className?: string
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    const ok = await copyText(text)
    setState(ok ? "copied" : "failed")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2000)
  }
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      aria-label={ariaLabel}
      data-state={state}
      icon={state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
      onClick={() => void copy()}
    >
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : label}</span>
    </Button>
  )
}

type CopyButtonProps = ComponentProps<typeof CopyButton>

export { CopyButton, copyText }
export type { CopyButtonProps }
