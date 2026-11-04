import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/* tailwind-merge has to know Paige's own utilities and token names, or it files a class under
   a guessed group (or none) and keeps or drops one of two classes by guesswork: `border-dot`
   read as a border colour, `bg-wash-corner` read as a background colour (dropping `bg-card`),
   `eyebrow` not known to set a font size (so Label's `text-sm` survived next to it; GAPS #28,
   #70). Every custom utility in theme.css is registered here, and each has a case in
   utils.test.ts (R2-21). A new utility gets an entry and a test. */
const twMerge = extendTailwindMerge<"eyebrow" | "page-frame" | "rich-text" | "focus-ring" | "icon-stroke-small" | "scrollbar-thin" | "scrollbar-stable" | "header-rule" | "shimmer" | "scroll-fade">({
  extend: {
    theme: {
      tracking: ["eyebrow", "display"],
      leading: ["display"],
      // Named layout tokens (theme.css layer 4): pt-page-top, gap-section, w-rail, max-w-display…
      spacing: [
        "gutter", "column", "grid", "section", "page-top", "page-top-roomy", "page-bottom", "rail",
        // Control scale (T-01): h-control, size-control-sm, min-h-textarea, pl-control-sm.
        "control-sm", "control", "control-lg", "textarea",
        // Icon scale (T-02): size-icon, [&_svg]:size-icon-lg.
        "icon-xs", "icon-sm", "icon", "icon-lg", "icon-xl",
        // Chart scale (T-05): h-chart, h-dag-lg, max-h-table, h-spark.
        "chart-sm", "chart", "chart-lg", "dag", "dag-lg", "table", "table-lg", "spark-sm", "spark", "spark-lg",
        // Row and bar scale (T-06): h-row-header, h-bar, h-app-header.
        "row-header", "bar", "app-header",
        // WorkspacePage: h-workspace, the list column's two widths.
        "workspace", "workspace-list-md", "workspace-list",
      ],
      container: [
        // max-w-card: one card alone on a page (the auth card, R18-18).
        "page", "focused", "wide", "card", "measure", "display",
        // max-w-record: a record card on a WorkspacePage's stage.
        "record",
        // Overlay scale (T-04): min-w-menu, w-popover, max-w-dialog.
        "menu", "menu-wide", "popover", "popover-wide", "dialog-sm", "dialog", "dialog-lg",
      ],
    },
    classGroups: {
      "border-w": ["border-dot"],
      shadow: [{ shadow: ["card", "lift", "pop", "avatar"] }],
      "grid-cols": [{ "grid-cols": ["fit-xs", "fit-sm", "fit-md", "fit-lg", "area-page", "street-unit", "workspace", "workspace-wide", "record-line"] }],
      // Named stacking steps (T-12): the same group as z-10, so a later z-* replaces one.
      z: [{ z: ["raised", "sticky", "overlay"] }],
      // State opacities (T-07) and the decorative-art opacity (R18-02): the same group as opacity-50.
      opacity: [{ opacity: ["disabled", "quiet", "dim", "art"] }],
      "bg-image": ["bg-wash-corner", "layer-hover", "layer-press"],
      // Font size and line height from the parent (Button size inline); beats an earlier text-sm.
      "font-size": ["text-size-inherit"],
      // Multi-property utilities: their own groups, so nothing is dropped by guesswork.
      eyebrow: ["eyebrow"],
      "page-frame": ["page-frame"],
      "rich-text": ["rich-text"],
      "focus-ring": ["focus-ring"],
      "icon-stroke-small": ["icon-stroke-small"],
      // Scrollbar width and colour; the gutter is its own concern (R10-08). scrollbar-none (R19-01)
      // sets the same width property, so a later one replaces an earlier.
      "scrollbar-thin": ["scrollbar-thin", "scrollbar-below-header", "scrollbar-none"],
      "header-rule": ["header-rule"],
      "scrollbar-stable": ["scrollbar-stable"],
      // In flight (R19-01): the shimmer clips the text over a moving background; the edge fade
      // on a scroll box is a mask. Each its own group, so neither is filed as a background.
      shimmer: ["shimmer"],
      "scroll-fade": ["scroll-fade-x"],
    },
    conflictingClassGroups: {
      // The eyebrow sets size, line height, weight, case, tracking and colour: an earlier class
      // for any of those (Label's text-sm font-medium) gives way to it.
      eyebrow: ["font-size", "leading", "font-weight", "text-transform", "tracking", "text-color"],
      // Sets the stroke width and the non-scaling rule: an earlier stroke-* gives way.
      "icon-stroke-small": ["stroke-w"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
