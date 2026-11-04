"use client"

import { Fragment, useState, type ChangeEvent, type ReactNode } from "react"

import { cn } from "../../lib/utils"
import {
  NativeSelect as UiNativeSelect,
  NativeSelectOptGroup as UiNativeSelectOptGroup,
  NativeSelectOption as UiNativeSelectOption,
} from "../../base/native-select"
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectGroup as UiSelectGroup,
  SelectItem as UiSelectItem,
  SelectLabel as UiSelectLabel,
  SelectSeparator as UiSelectSeparator,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from "../../base/select"
import { controlBox, controlFocus, controlHeight, controlInvalid, controlValue } from "../internal/control"
import {
  POPOVER_SIDE_OFFSET,
  popoverContent,
  popoverGroupedItem,
  popoverItem,
  popoverItemWithIndicator,
  popoverLabel,
  popoverSeparator,
  type PopoverAlign,
  type PopoverSide,
} from "../internal/popover-surface"
import { useCoarsePointer } from "../internal/pointer"
import { useFieldControl } from "../internal/field-context"

/* @archetype Control (ARCHETYPES.md).
   Paige Select: the one single-choice control (R3-16, George 2026-10-19). Data-driven: pass
   `options` or `groups`, not item markup. One API, two renderings:
   - fine pointer (mouse, trackpad): the styled popover over upstream Select (Radix listbox;
     R1-20, R1-25). The trigger matches Input (44, value at 500, placeholder at 400) and keeps
     upstream's caret. The list shares DropdownMenu's popover look (popover-surface.ts): it opens
     beside the trigger, never over it (`position="popper"`), 8px away, below and start-aligned
     unless `side`/`align` say otherwise. Upstream's check indicator and scroll buttons are kept.
     Group labels use the eyebrow style in ink and grouped options are indented.
   - coarse pointer (touch): the browser's own <select> over upstream NativeSelect, in the same
     Input look, so a phone opens its OS picker (the reason NativeSelect existed). Groups become
     <optgroup>s; option icons and side/align/open don't apply there.
   `presentation` forces one rendering ("native" also suits a very long list on any device).
   The server renders the popover form; a touch device switches to the native form on hydration.
   NativeSelect is no longer exported; its base stays in src/base. */
/* Options must make sense as text alone (R4-16, GAPS #90): the native form shows only the text,
   so an icon is decoration on desktop and a label is a string wherever a phone can see it. */
type SelectOption = {
  value: string
  /** Text the choice is clear from on its own (the native picker shows only this; an element label falls back to `value` there). */
  label: ReactNode
  /** Decoration in the popover form only; dropped by the native picker on touch. */
  icon?: ReactNode
  disabled?: boolean
}
type SelectGroupData = { label: string; options: SelectOption[] }

type SelectProps = {
  options?: SelectOption[]
  groups?: SelectGroupData[]
  /** Shown while nothing is chosen (400, the placeholder colour). In the native form it is a disabled first option. */
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** "auto" (default): popover on a fine pointer, native on touch. "popover" or "native" forces one. */
  presentation?: "auto" | "popover" | "native"
  /** Side of the trigger the list opens on (default bottom; flips when there is no room). Popover only. */
  side?: PopoverSide
  /** How the list lines up with the trigger (default start). Popover only. */
  align?: PopoverAlign
  /** Popover only. */
  open?: boolean
  /** Popover only. */
  defaultOpen?: boolean
  /** Popover only. */
  onOpenChange?: (open: boolean) => void
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  "aria-label"?: string
  /** Joined with the enclosing Field's description and error ids. */
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  className?: string
}

/* Upstream's indicator sits at right-2 (14px box); move it onto the shared indicator spot. */
const selectIndicator =
  "*:data-[slot=select-item-indicator]:right-2.5 *:data-[slot=select-item-indicator]:size-icon"

function Option({ option, grouped }: { option: SelectOption; grouped?: boolean }) {
  return (
    <UiSelectItem
      value={option.value}
      disabled={option.disabled}
      className={cn(popoverItem, popoverItemWithIndicator, selectIndicator, grouped && popoverGroupedItem)}
    >
      {option.icon}
      {option.label}
    </UiSelectItem>
  )
}

/** Option labels must be text for the native form; an element label falls back to its value. */
const textOf = (o: SelectOption) => (typeof o.label === "string" || typeof o.label === "number" ? String(o.label) : o.value)

function NativeForm({
  options,
  groups,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  id,
  name,
  disabled,
  required,
  autoFocus,
  className,
  ...aria
}: Omit<SelectProps, "presentation" | "side" | "align" | "open" | "defaultOpen" | "onOpenChange">) {
  const [inner, setInner] = useState(defaultValue ?? "")
  const current = value ?? inner
  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (value === undefined) setInner(e.target.value)
    onValueChange?.(e.target.value)
  }
  return (
    <div className="w-full *:data-[slot=native-select-wrapper]:w-full">
      <UiNativeSelect
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={current}
        onChange={onChange}
        data-placeholder={current === "" ? "" : undefined}
        {...aria}
        className={cn(
          controlBox,
          controlHeight,
          "cursor-pointer pr-control-sm",
          controlValue,
          "data-[placeholder]:font-normal data-[placeholder]:text-placeholder",
          controlFocus,
          controlInvalid,
          className
        )}
      >
        {(placeholder !== undefined || current === "") && (
          <UiNativeSelectOption value="" disabled>
            {placeholder ?? ""}
          </UiNativeSelectOption>
        )}
        {options?.map((o) => (
          <UiNativeSelectOption key={o.value} value={o.value} disabled={o.disabled}>
            {textOf(o)}
          </UiNativeSelectOption>
        ))}
        {groups?.map((g) => (
          <UiNativeSelectOptGroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <UiNativeSelectOption key={o.value} value={o.value} disabled={o.disabled}>
                {textOf(o)}
              </UiNativeSelectOption>
            ))}
          </UiNativeSelectOptGroup>
        ))}
      </UiNativeSelect>
    </div>
  )
}

/** One single-choice control from data: a styled list with a mouse, the phone's own picker on touch. */
function Select({ presentation = "auto", ...own }: SelectProps) {
  // Inside a Field: its id, description ids and error state (R7-03).
  const props = useFieldControl(own)
  const coarse = useCoarsePointer()
  const native = presentation === "native" || (presentation === "auto" && coarse)
  if (native) {
    const { side: _s, align: _a, open: _o, defaultOpen: _d, onOpenChange: _c, ...rest } = props
    return <NativeForm {...rest} />
  }
  return <PopoverForm {...props} />
}

function PopoverForm({
  options,
  groups,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  side = "bottom",
  align = "start",
  open,
  defaultOpen,
  onOpenChange,
  id,
  name,
  disabled,
  required,
  autoFocus,
  className,
  ...aria
}: Omit<SelectProps, "presentation">) {
  return (
    <UiSelect
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      name={name}
      disabled={disabled}
      required={required}
    >
      <UiSelectTrigger
        id={id}
        autoFocus={autoFocus}
        {...aria}
        className={cn(
          "w-full cursor-pointer data-[size=default]:h-control",
          controlBox,
          controlHeight,
          controlValue,
          "data-[placeholder]:font-normal data-[placeholder]:text-placeholder",
          /* The caret: full strength in the muted colour (upstream draws it at 50% opacity). */
          "[&>svg]:opacity-100",
          controlFocus,
          controlInvalid,
          className
        )}
      >
        <UiSelectValue placeholder={placeholder} />
      </UiSelectTrigger>
      <UiSelectContent
        position="popper"
        side={side}
        align={align}
        sideOffset={POPOVER_SIDE_OFFSET}
        className={cn(
          popoverContent,
          /* Upstream nudges popper content 4px with a translate; the gap is sideOffset alone. */
          "data-[side=bottom]:translate-y-0 data-[side=left]:translate-x-0 data-[side=right]:translate-x-0 data-[side=top]:translate-y-0",
          /* Upstream pads the viewport; the shared surface pads the content instead. */
          "[&_[data-radix-select-viewport]]:p-0"
        )}
      >
        {options?.map((o) => <Option key={o.value} option={o} />)}
        {groups?.map((g, i) => (
          <Fragment key={g.label}>
            {i > 0 && <UiSelectSeparator className={popoverSeparator} />}
            <UiSelectGroup>
              <UiSelectLabel className={popoverLabel}>{g.label}</UiSelectLabel>
              {g.options.map((o) => <Option key={o.value} option={o} grouped />)}
            </UiSelectGroup>
          </Fragment>
        ))}
      </UiSelectContent>
    </UiSelect>
  )
}

export { Select }
export type { SelectOption, SelectGroupData, SelectProps }
