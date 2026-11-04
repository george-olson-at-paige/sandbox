/* The one typing utility for story play functions (R5-08, GAPS #97). Every play that edits a
   field's text goes through these: typeKeys, pasteText, clearText, enter, leave. Field stories
   import them from here; FieldFrame (field-frame.tsx) is only the Field wrapper around a field.

   Why not userEvent.type: user-event keeps its own copy of the input's text and caret, and
   inside Storybook's act() wrapping it loses track when a controlled input rewrites its text on
   every key (the masked fields: "555123" stayed raw in the play though real typing showed
   "(555) 123"). These do what a browser does for one key or a paste instead: change the
   input's text and caret natively, then fire an `input` event with its inputType, which is
   exactly what the fields read. Re-try userEvent after the next Storybook / user-event upgrade.

   userEvent is still right for clicks and for keys that don't edit text (userEvent.click on a
   FieldAction, userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}") in the calendar).

   Not covered by any play: real-pointer behaviour the browser only shows on a trusted click
   (Chrome's caret reset on a password ↔ text switch, GAPS #99). That stays a by-hand check. */
type EditKind = "insertText" | "insertFromPaste" | "deleteContentBackward" | "deleteContentForward"

async function edit(el: HTMLInputElement, kind: EditKind, data = "") {
  const win = el.ownerDocument.defaultView!
  // The native setter of the element's own kind: a textarea's value isn't an input's (R12-10).
  const proto = el instanceof win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype
  const setValue = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  const v = el.value
  const s = el.selectionStart ?? v.length
  const e = el.selectionEnd ?? s
  let next: string
  let caret = s
  if (kind === "insertText" || kind === "insertFromPaste") {
    next = v.slice(0, s) + data + v.slice(e)
    caret = s + data.length
  } else if (s !== e) {
    next = v.slice(0, s) + v.slice(e)
  } else if (kind === "deleteContentBackward") {
    if (s === 0) return
    next = v.slice(0, s - 1) + v.slice(s)
    caret = s - 1
  } else {
    if (s >= v.length) return
    next = v.slice(0, s) + v.slice(s + 1)
  }
  setValue.call(el, next)
  el.setSelectionRange(caret, caret)
  el.dispatchEvent(new win.InputEvent("input", { bubbles: true, inputType: kind, data: data || null }))
  await new Promise((r) => setTimeout(r, 0))
}

/* Focus events only fire when the page has system focus. A play run in a background tab or an
   embedded preview pane still moves document.activeElement but fires no focus or blur, so the
   fields' blur checks would never run; these send the events by hand in that case only. */
function fireFocus(el: HTMLElement, kind: "focus" | "blur") {
  const doc = el.ownerDocument
  if (doc.hasFocus()) return
  const win = doc.defaultView!
  el.dispatchEvent(new win.FocusEvent(kind))
  el.dispatchEvent(new win.FocusEvent(kind === "focus" ? "focusin" : "focusout", { bubbles: true }))
}

/** Focuses the input (and sends focus events if the page has no system focus). */
export async function enter(el: HTMLElement) {
  if (el.ownerDocument.activeElement === el) return
  el.focus()
  fireFocus(el, "focus")
  await new Promise((r) => setTimeout(r, 0))
}

/** Leaves the input, as Tab does: blur (and the events if the page has no system focus). */
export async function leave(el: HTMLElement) {
  el.blur()
  fireFocus(el, "blur")
  await new Promise((r) => setTimeout(r, 0))
}

/** Focuses the input (caret at `at`, else the end) and types: characters, `{Backspace}`, `{Delete}`. */
export async function typeKeys(el: HTMLElement, text: string, at?: number) {
  const input = el as HTMLInputElement
  await enter(input)
  const start = at ?? input.value.length
  input.setSelectionRange(start, start)
  for (const key of text.match(/\{[^}]+\}|./gu) ?? []) {
    if (key === "{Backspace}") await edit(input, "deleteContentBackward")
    else if (key === "{Delete}") await edit(input, "deleteContentForward")
    else await edit(input, "insertText", key)
  }
}

/** Focuses the input and pastes over its whole text (or at the caret with `atCaret`). */
export async function pasteText(el: HTMLElement, text: string, atCaret = false) {
  const input = el as HTMLInputElement
  await enter(input)
  if (!atCaret) input.setSelectionRange(0, input.value.length)
  await edit(input, "insertFromPaste", text)
}

/** Selects everything and deletes it. */
export async function clearText(el: HTMLElement) {
  const input = el as HTMLInputElement
  await enter(input)
  input.setSelectionRange(0, input.value.length)
  await edit(input, "deleteContentBackward")
}
