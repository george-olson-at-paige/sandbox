/* Shared classes for Paige form controls (Input, Textarea, Select, and Select's native form).
   Server-safe: plain strings, no "use client" (GAPS #19). */

/** Box: md radius, input border, card shadow. 16px text on phones, 14px from md (iOS zoom rule). */
export const controlBox =
  "rounded-md border-input bg-background px-3 text-base text-card-foreground shadow-card md:text-sm"

/** One control height: md 44 (`--spacing-control`, T-01; Button md and InlineEdit's row are the
    same token, so a typed control and the button beside it stay level). */
export const controlHeight = "h-control"

/** Value text at 500, placeholder at 400 in the placeholder colour (R3-01, George 2026-10-19;
    reverses R1-12's 400 for values only). Select's trigger adds the same pair for its
    data-placeholder state, since its placeholder is a span, not ::placeholder. */
export const controlValue = "font-medium placeholder:font-normal placeholder:text-placeholder"

/** Focus on things you type into (R15-17): the border turns brand blue with the soft 2px halo
    (`--focus-halo`, the ring at 50%; T-08). Upstream draws it at 3px; 2px since George
    2026-10-31 ("much more subtle"), and it was switched off for the gapped outline while R1-01
    waited. The halo composes with the card shadow (both are box-shadow layers); invalid keeps
    the error border. */
export const controlFocus = "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-focus-halo"

/** Focus on a card that opens or chooses (R15-13, R15-17: FilterCardRow, the interactive Card,
    ChoiceCard, Attachment with `onOpen`): no outline, the same halo as a typed control, outside
    the card's border. */
export const cardFocus = "outline-none focus-visible:ring-2 focus-visible:ring-focus-halo"

/** A press target that isn't a Button (U-07, R15-17): a raw <button> such as a picker pill, an
    in-field icon action, a chip. Pointer cursor, the gapped focus ring (the one buttons get),
    and the disabled look: not-allowed cursor, the disabled opacity, no hover layer. Compose the
    look on top; `check:reuse` fails a raw <button> in a file that uses none of the focus helpers. */
export const pressable = "cursor-pointer focus-ring disabled:cursor-not-allowed disabled:opacity-disabled disabled:hover:bg-none"

/** Invalid (aria-invalid): the error border (3:1 at rest); hover and focus darken it to the
    error colour (R1-02, R2-01). */
export const controlInvalid =
  "aria-invalid:border-error-border aria-invalid:hover:border-error aria-invalid:focus-visible:border-error"

/** The rich Textarea's frame (R1-27): the plain Textarea's box, border, focus ring, error and
    disabled states on a wrapper around the toolbar and the editable area. The ring shows when
    the editable area has focus, not when a toolbar button does (that has its own ring). */
export const richTextShell =
  "flex w-full flex-col rounded-md border border-input bg-background text-base text-card-foreground shadow-card md:text-sm has-[[contenteditable]:focus-visible]:border-ring has-[[contenteditable]:focus-visible]:ring-3 has-[[contenteditable]:focus-visible]:ring-focus-halo data-[invalid]:border-error-border data-[invalid]:hover:border-error data-[invalid]:has-[[contenteditable]:focus-visible]:border-error data-[disabled]:cursor-not-allowed data-[disabled]:opacity-disabled"

/** The rich Textarea's editable area: the plain Textarea's padding, the textarea floor (72,
    `--spacing-textarea`), value at 500 (R3-01; the empty-editor placeholder stays 400 in the
    rich-text utility). */
export const richTextArea = "rich-text min-h-textarea px-3 py-2 font-medium outline-none"

/** The rich Textarea's toolbar row (a control tall, 44: 36px icon buttons in 4px of padding). */
export const richTextToolbar = "flex min-h-control flex-wrap items-center gap-0.5 border-b border-divider p-1"
