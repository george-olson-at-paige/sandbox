// cn() knows every Paige utility (R2-21). One case per custom utility in theme.css.
// Run: npm test -w packages/ui (node --test; Node strips the types).
import { test } from "node:test"
import assert from "node:assert/strict"

import { cn } from "./utils.ts"

test("later standard classes still win", () => {
  assert.equal(cn("px-2 py-1", "px-4"), "py-1 px-4")
})

test("eyebrow replaces an earlier size, leading, weight and colour", () => {
  assert.equal(cn("text-sm leading-none font-medium text-foreground", "eyebrow"), "eyebrow")
  assert.equal(cn("eyebrow", "text-area-ink"), "eyebrow text-area-ink")
})

test("border-dot is a border width, not a colour", () => {
  assert.equal(cn("border-dot border-muted-foreground"), "border-dot border-muted-foreground")
  assert.equal(cn("border-2", "border-dot"), "border-dot")
})

test("Paige shadows replace each other and the upstream aliases", () => {
  assert.equal(cn("shadow-card", "shadow-pop"), "shadow-pop")
  assert.equal(cn("shadow-xs", "shadow-lift"), "shadow-lift")
  assert.equal(cn("shadow-card", "shadow-avatar"), "shadow-avatar")
  assert.equal(cn("shadow-avatar ring-3 ring-white"), "shadow-avatar ring-3 ring-white")
})

test("grid-cols-fit-*, grid-cols-area-page, grid-cols-street-unit and grid-cols-workspace* are column templates", () => {
  for (const c of ["grid-cols-fit-xs", "grid-cols-fit-sm", "grid-cols-fit-md", "grid-cols-fit-lg", "grid-cols-area-page", "grid-cols-street-unit", "grid-cols-workspace", "grid-cols-workspace-wide", "grid-cols-record-line", "grid-cols-record-said", "grid-cols-timeline", "grid-cols-view-row"]) {
    assert.equal(cn("grid-cols-2", c), c)
  }
})

test("opacity-disabled, opacity-quiet, opacity-dim and opacity-art are opacities (T-07, R18-02)", () => {
  assert.equal(cn("opacity-50", "opacity-dim"), "opacity-dim")
  assert.equal(cn("opacity-art", "opacity-100"), "opacity-100")
  assert.equal(cn("disabled:opacity-50", "disabled:opacity-disabled"), "disabled:opacity-disabled")
  assert.equal(cn("opacity-quiet hover:opacity-100"), "opacity-quiet hover:opacity-100")
})

test("the alpha and on-tone colours merge as colours (T-08, T-09)", () => {
  assert.equal(cn("focus-visible:ring-ring/50", "focus-visible:ring-focus-halo"), "focus-visible:ring-focus-halo")
  assert.equal(cn("bg-overlay/8", "bg-overlay-hover"), "bg-overlay-hover")
  assert.equal(cn("bg-destructive hover:bg-destructive-hover"), "bg-destructive hover:bg-destructive-hover")
  assert.equal(cn("text-white", "text-on-tone"), "text-on-tone")
  assert.equal(cn("ring-2 ring-on-tone"), "ring-2 ring-on-tone")
})

test("z-raised, z-sticky and z-overlay are z-indexes (T-12)", () => {
  assert.equal(cn("z-10", "z-raised"), "z-raised")
  assert.equal(cn("z-raised", "z-overlay"), "z-overlay")
  assert.equal(cn("sticky top-0 z-sticky"), "sticky top-0 z-sticky")
})

test("bg-wash-corner is a background image, so the card colour survives", () => {
  assert.equal(cn("bg-card", "bg-wash-corner"), "bg-card bg-wash-corner")
  assert.equal(cn("bg-linear-to-b", "bg-wash-corner"), "bg-wash-corner")
})

test("page-frame, rich-text and focus-ring are kept beside the classes they overlap", () => {
  assert.equal(cn("page-frame", "flex"), "page-frame flex")
  assert.equal(cn("gutter-workspace", "flex"), "gutter-workspace flex")
  assert.equal(cn("rich-text text-sm text-card-foreground"), "rich-text text-sm text-card-foreground")
  assert.equal(cn("outline-none", "focus-ring"), "outline-none focus-ring")
})

test("display tracking and leading replace the defaults", () => {
  assert.equal(cn("tracking-tight", "tracking-display"), "tracking-display")
  assert.equal(cn("tracking-normal", "tracking-eyebrow"), "tracking-eyebrow")
  assert.equal(cn("leading-none", "leading-display"), "leading-display")
})

test("named layout tokens merge with the scale they extend", () => {
  assert.equal(cn("pt-page-top", "pt-page-top-roomy"), "pt-page-top-roomy")
  assert.equal(cn("gap-4", "gap-section"), "gap-section")
  assert.equal(cn("max-w-xl", "max-w-display"), "max-w-display")
  assert.equal(cn("max-w-measure", "max-w-focused"), "max-w-focused")
  assert.equal(cn("max-w-md", "max-w-card"), "max-w-card")
})

test("the control scale merges with heights, sizes and insets (T-01)", () => {
  assert.equal(cn("h-11", "h-control"), "h-control")
  assert.equal(cn("h-control", "h-control-sm"), "h-control-sm")
  assert.equal(cn("size-9", "size-control-sm"), "size-control-sm")
  assert.equal(cn("min-h-18", "min-h-textarea"), "min-h-textarea")
  assert.equal(cn("pl-3", "pl-control-sm"), "pl-control-sm")
  // A caller's h-auto still wins over a variant's h-control (RemoveDialog's wrapping button).
  assert.equal(cn("h-control", "h-auto"), "h-auto")
})

test("the icon scale merges with sizes, through an svg variant too (T-02)", () => {
  assert.equal(cn("size-4", "size-icon"), "size-icon")
  assert.equal(cn("size-icon", "size-icon-lg"), "size-icon-lg")
  assert.equal(cn("[&_svg]:size-4", "[&_svg]:size-icon"), "[&_svg]:size-icon")
  assert.equal(cn("[&_svg:not([class*='size-'])]:size-4", "[&_svg:not([class*='size-'])]:size-icon"), "[&_svg:not([class*='size-'])]:size-icon")
  // A different variant is a different target; both stay.
  assert.equal(cn("size-icon [&>svg]:size-icon-xs"), "size-icon [&>svg]:size-icon-xs")
})

test("the overlay scale merges with widths (T-04)", () => {
  assert.equal(cn("w-80", "w-popover"), "w-popover")
  assert.equal(cn("w-popover", "sm:w-popover-wide"), "w-popover sm:w-popover-wide")
  assert.equal(cn("min-w-56", "min-w-menu-wide"), "min-w-menu-wide")
  assert.equal(cn("max-w-md", "max-w-dialog-lg"), "max-w-dialog-lg")
  // Popover's caller may widen it (its documented use of className).
  assert.equal(cn("w-popover", "w-96"), "w-96")
})

test("the chart and row scales merge with heights (T-05, T-06)", () => {
  assert.equal(cn("h-64", "h-chart"), "h-chart")
  assert.equal(cn("h-chart", "h-chart-lg"), "h-chart-lg")
  assert.equal(cn("max-h-96", "max-h-table"), "max-h-table")
  assert.equal(cn("h-8", "h-spark"), "h-spark")
  assert.equal(cn("h-10", "h-row-header"), "h-row-header")
  assert.equal(cn("h-14", "h-bar"), "h-bar")
  assert.equal(cn("h-bar", "h-app-header"), "h-app-header")
})

test("text-size-inherit is a font size (and drops an earlier leading)", () => {
  assert.equal(cn("text-sm leading-none", "text-size-inherit"), "text-size-inherit")
  assert.equal(cn("text-size-inherit", "text-primary"), "text-size-inherit text-primary")
})

test("text-2xs is a font size: it replaces the badge's text-xs (R3-02)", () => {
  assert.equal(cn("text-xs font-medium", "text-2xs"), "font-medium text-2xs")
  assert.equal(cn("text-2xs", "text-sm"), "text-sm")
})

test("icon-stroke-small sets the stroke: it replaces an earlier stroke width (R5-07)", () => {
  assert.equal(cn("[&>svg]:size-3 [&>svg]:icon-stroke-small"), "[&>svg]:size-3 [&>svg]:icon-stroke-small")
  assert.equal(cn("stroke-2", "icon-stroke-small"), "icon-stroke-small")
})

test("layer-hover and layer-press are background images: the background colour survives (R4-01)", () => {
  assert.equal(cn("bg-secondary hover:layer-hover"), "bg-secondary hover:layer-hover")
  assert.equal(cn("hover:layer-hover", "hover:layer-press"), "hover:layer-press")
  assert.equal(cn("bg-overlay/8 active:layer-press"), "bg-overlay/8 active:layer-press")
})

test("scrollbar-below-header replaces scrollbar-thin; header-rule is its own group, not a shadow", () => {
  assert.equal(cn("overflow-auto scrollbar-thin", "scrollbar-below-header scrollbar-stable"), "overflow-auto scrollbar-below-header scrollbar-stable")
  assert.equal(cn("shadow-card header-rule"), "shadow-card header-rule")
})

test("scrollbar-thin and scrollbar-stable are kept together and beside overflow", () => {
  assert.equal(cn("overflow-auto scrollbar-thin", "scrollbar-stable"), "overflow-auto scrollbar-thin scrollbar-stable")
  assert.equal(cn("scrollbar-thin", "scrollbar-thin"), "scrollbar-thin")
})

test("scrollbar-none replaces scrollbar-thin; shimmer and scroll-fade-x are not backgrounds (R19-01)", () => {
  assert.equal(cn("scrollbar-thin", "scrollbar-none"), "scrollbar-none")
  assert.equal(cn("scrollbar-none", "scrollbar-stable"), "scrollbar-none scrollbar-stable")
  // The shimmer clips the title over a moving background; a background colour or image beside it stays.
  assert.equal(cn("bg-card shimmer", "bg-muted"), "shimmer bg-muted")
  assert.equal(cn("shimmer", "bg-wash-corner"), "shimmer bg-wash-corner")
  // The edge fade is a mask on the scroll box; overflow and the scrollbar keep their own groups.
  assert.equal(cn("overflow-x-auto scroll-fade-x scrollbar-none", "scroll-fade-x"), "overflow-x-auto scrollbar-none scroll-fade-x")
})

test("border-border-strong is a border colour (R15-13), and the halo and inner ring compose", () => {
  assert.equal(cn("border-border", "hover:border-border-strong"), "border-border hover:border-border-strong")
  assert.equal(cn("hover:border-ring", "hover:border-border-strong"), "hover:border-border-strong")
  // The chosen filter card: an inner 1px ring (inset-ring) and the focus halo (ring) are separate shadows.
  assert.equal(cn("inset-ring-1 inset-ring-primary focus-visible:ring-3 focus-visible:ring-ring/50"), "inset-ring-1 inset-ring-primary focus-visible:ring-3 focus-visible:ring-ring/50")
  // The typed controls' halo width replaces an earlier ring width.
  assert.equal(cn("focus-visible:ring-0", "focus-visible:ring-3"), "focus-visible:ring-3")
})

test("WorkspacePage's tokens are named sizes: h-workspace, w-workspace-list*, max-w-record", () => {
  assert.equal(cn("h-bar", "h-workspace"), "h-workspace")
  assert.equal(cn("w-rail", "w-workspace-list"), "w-workspace-list")
  assert.equal(cn("w-workspace-list-md", "w-workspace-list"), "w-workspace-list")
  assert.equal(cn("max-w-wide", "max-w-record"), "max-w-record")
})
