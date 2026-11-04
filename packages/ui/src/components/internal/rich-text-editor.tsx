"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { EditorContent, Extension, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../actions/button"
import { richTextArea, richTextShell, richTextToolbar } from "./control"
import { FieldContext, useFieldContext } from "./field-context"
import { Input } from "../inputs/input"
import { RichText, safeRichTextHref, type RichTextValue } from "../inputs/rich-text"
import type { RichTextareaProps } from "./rich-textarea"

/* The rich Textarea's editor (R1-27): all Tiptap setup lives here, behind a dynamic import
   (rich-textarea.tsx). Callers never import Tiptap.

   Schema: StarterKit cut down to paragraphs, hard breaks, bold, italic, bulleted and numbered
   lists, and links (plus undo/redo, list keys, cursors). Headings, quotes, code, strike,
   underline and rules are off. Pasted content is parsed against this schema, so anything else
   (styles, images, scripts, tables) is dropped on the way in and only allowed formatting
   survives. Links: autolinked while typing, made by pasting a URL over a selection, or with the
   toolbar / Ctrl+K; only http(s), mailto and tel are accepted, and clicking a link while
   editing doesn't follow it. Output is the JSON document (RichTextValue), never HTML.

   Shortcuts (StarterKit's, plus Ctrl+K): Ctrl+B bold, Ctrl+I italic, Ctrl+Shift+8 bulleted,
   Ctrl+Shift+7 numbered, Ctrl+K link, Ctrl+Z / Ctrl+Shift+Z undo / redo (Cmd on a Mac). */

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

function ToolButton({
  label,
  shortcut,
  icon,
  pressed,
  disabled,
  onClick,
}: {
  label: string
  shortcut: string
  icon: ReactNode
  pressed: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const mod = isMac() ? "⌘" : "Ctrl+"
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      icon={icon}
      aria-label={label}
      aria-pressed={pressed}
      title={`${label} (${shortcut.replace("Mod+", mod)})`}
      disabled={disabled}
      // Keep the editor's selection: a toolbar click must not blur the text first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-md aria-pressed:bg-accent aria-pressed:text-accent-foreground"
    />
  )
}

function LinkRow({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const current = editor.getAttributes("link").href as string | undefined
  const [draft, setDraft] = useState(current ?? "")
  const [invalid, setInvalid] = useState(false)
  const inputId = useId()

  const close = () => {
    onDone()
    editor.commands.focus()
  }
  const apply = () => {
    if (!draft.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      onDone()
      return
    }
    const href = safeRichTextHref(draft)
    if (!href) {
      setInvalid(true)
      return
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: draft.trim(), marks: [{ type: "link", attrs: { href } }] }).run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    onDone()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      apply()
    } else if (e.key === "Escape") {
      e.preventDefault()
      close()
    }
  }

  return (
    /* The link address is its own control, not the Field's: no Field ids or error on it. */
    <FieldContext.Provider value={null}>
    <div className="flex flex-wrap items-center gap-2 border-b border-divider p-2">
      <label htmlFor={inputId} className="sr-only">
        Link address
      </label>
      <Input
        id={inputId}
        autoFocus
        onFocus={(e) => e.currentTarget.select() /* typing replaces the current address */}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setInvalid(false)
        }}
        onKeyDown={onKeyDown}
        placeholder="https://"
        aria-invalid={invalid || undefined}
        className="h-control-sm min-w-0 flex-1"
      />
      <Button type="button" size="sm" onClick={apply}>
        {draft.trim() || !current ? "Apply" : "Remove link"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={close}>
        Cancel
      </Button>
    </div>
    </FieldContext.Provider>
  )
}

export default function RichTextEditor({
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled,
  id,
  className,
  ...aria
}: RichTextareaProps) {
  const fallbackId = useId()
  const editorId = id ?? fallbackId
  const [linkOpen, setLinkOpen] = useState(false)
  const openLink = useRef(() => {})
  openLink.current = () => setLinkOpen(true)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const attributes = {
    id: editorId,
    role: "textbox",
    "aria-multiline": "true",
    ...(aria["aria-label"] ? { "aria-label": aria["aria-label"] } : {}),
    ...(aria["aria-labelledby"] ? { "aria-labelledby": aria["aria-labelledby"] } : {}),
    ...(aria["aria-describedby"] ? { "aria-describedby": aria["aria-describedby"] } : {}),
    ...(aria["aria-invalid"] ? { "aria-invalid": "true" } : {}),
    ...(disabled ? { "aria-disabled": "true" } : {}),
    class: richTextArea,
  }

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: value ?? defaultValue ?? null,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && safeRichTextHref(url) !== null,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      Extension.create({
        name: "paigeLinkShortcut",
        addKeyboardShortcuts: () => ({
          "Mod-k": () => {
            openLink.current()
            return true
          },
        }),
      }),
    ],
    editorProps: { attributes },
    onUpdate: ({ editor }) => onChangeRef.current?.(editor.getJSON() as RichTextValue),
  })

  // Inside a Field, a click on the FieldLabel focuses the editor (a <label for> can't; R2-32).
  const field = useFieldContext()
  useEffect(() => {
    if (!editor || !field) return
    field.focusControl.current = () => editor.commands.focus()
    return () => {
      field.focusControl.current = null
    }
  }, [editor, field])

  // Keep the editor in step with props that change after it is created.
  const attributesKey = JSON.stringify(attributes)
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled, false)
    editor.setOptions({ editorProps: { attributes: JSON.parse(attributesKey) } })
  }, [editor, disabled, attributesKey])

  useEffect(() => {
    if (!editor || value === undefined) return
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            link: e.isActive("link"),
          }
        : null,
  })

  const off = disabled || !editor
  const run = (fn: (e: Editor) => void) => () => editor && fn(editor)

  return (
    <div
      data-slot="textarea"
      data-format="rich"
      data-invalid={aria["aria-invalid"] ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(richTextShell, className)}
    >
      <div role="toolbar" aria-label="Formatting" aria-controls={editorId} className={richTextToolbar}>
        <ToolButton label="Bold" shortcut="Mod+B" icon={<BoldIcon />} pressed={!!state?.bold} disabled={off} onClick={run((e) => e.chain().focus().toggleBold().run())} />
        <ToolButton label="Italic" shortcut="Mod+I" icon={<ItalicIcon />} pressed={!!state?.italic} disabled={off} onClick={run((e) => e.chain().focus().toggleItalic().run())} />
        <ToolButton label="Bulleted list" shortcut="Mod+Shift+8" icon={<ListIcon />} pressed={!!state?.bulletList} disabled={off} onClick={run((e) => e.chain().focus().toggleBulletList().run())} />
        <ToolButton label="Numbered list" shortcut="Mod+Shift+7" icon={<ListOrderedIcon />} pressed={!!state?.orderedList} disabled={off} onClick={run((e) => e.chain().focus().toggleOrderedList().run())} />
        <ToolButton label="Link" shortcut="Mod+K" icon={<LinkIcon />} pressed={!!state?.link || linkOpen} disabled={off} onClick={() => setLinkOpen((o) => !o)} />
      </div>
      {linkOpen && editor && <LinkRow editor={editor} onDone={() => setLinkOpen(false)} />}
      {editor ? (
        <EditorContent editor={editor} className="cursor-text" />
      ) : (
        // The editor is created after the first render (immediatelyRender: false); hold its place.
        <div className={richTextArea}>
          <RichText value={value ?? defaultValue} className="text-base md:text-sm" />
        </div>
      )}
    </div>
  )
}
