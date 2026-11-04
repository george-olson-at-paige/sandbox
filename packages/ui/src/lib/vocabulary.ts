/* The vocabulary (ARCHETYPES.md §3, §7): one list of axis names, each with one meaning and one
   value set, as types every layer can import. A component narrows a set
   (`emphasis?: Extract<ActionEmphasis, "primary" | "secondary">`), never widens or renames it, so
   adding a word is a change to this file and fails typecheck in every component that maps the
   set. The arrays are the same lists at runtime, for `check:vocab` (scripts/check-vocab.mjs,
   which imports this file; Node strips the types) and for a story's controls.
   Status: the sets are ARCHETYPES.md's proposal, in place before George's pass on the words
   (§8 step 1) so the check can run in warn mode; a decided word changes here and nowhere else.
   No component imports these yet: §8 step 4 moves one archetype at a time onto them. */

export const ARCHETYPES = ["Action", "Control", "Surface", "Mark", "Media", "Text", "Overlay", "Frame", "Item", "Chart", "Composite"] as const
/** What shape a part's API has (§2). A file declares one in its header: `@archetype Action`. */
export type Archetype = (typeof ARCHETYPES)[number]

// ── Axes ──────────────────────────────────────────────────────────────────────────────────────

/** How loud an Action is, relative to what it sits on: filled · outlined · bare (shows its surface on hover) · text-like. */
export const ACTION_EMPHASIS = ["primary", "secondary", "tertiary", "quiet"] as const
export type ActionEmphasis = (typeof ACTION_EMPHASIS)[number]
/** How much a Surface stands off the page: level with it · lifted (shadow) · sunk (the muted fill). */
export const SURFACE_EMPHASIS = ["flat", "raised", "recessed"] as const
export type SurfaceEmphasis = (typeof SURFACE_EMPHASIS)[number]
export type Emphasis = ActionEmphasis | SurfaceEmphasis

/** Meaning, as a colour. One meaning each; an archetype takes a subset. `default` is the absent value everywhere. */
export const TONES = ["neutral", "muted", "strong", "brand", "info", "success", "warning", "attention", "destructive", "area"] as const
export type Tone = (typeof TONES)[number]

/** How a tone is applied: the tone fills · its subtle fill · border only · ink only · the area gradient. */
export const FILLS = ["solid", "soft", "outline", "plain", "wash"] as const
export type Fill = (typeof FILLS)[number]

/** Vertical rhythm. */
export const DENSITIES = ["compact", "default", "roomy"] as const
export type Density = (typeof DENSITIES)[number]

// `size` is a step on the archetype's own named scale (TOKENS.md §2): within one archetype `md` is one pixel value.
/** Control scale: 36 · 44 · 48 · the line's own height. */
export const CONTROL_SIZES = ["sm", "md", "lg", "inline"] as const
export type ControlSize = (typeof CONTROL_SIZES)[number]
/** Icon scale: 12 · 14 · 16 · 20 · 24. */
export const ICON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const
export type IconSize = (typeof ICON_SIZES)[number]
/** Mark scale: 8 · 12 · 16 · 20 · 24. */
export const MARK_SIZES = ["xs", "sm", "md", "lg", "xl"] as const
export type MarkSize = (typeof MARK_SIZES)[number]
/** Media scale: 24 · 32 · 40 · 48 · 72. */
export const MEDIA_SIZES = ["sm", "md", "lg", "xl", "2xl"] as const
export type MediaSize = (typeof MEDIA_SIZES)[number]
/** Overlay scale: 192 · 224 · 320 · 448 · 672 · 896. */
export const OVERLAY_SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"] as const
export type OverlaySize = (typeof OVERLAY_SIZES)[number]
/** Chart scale, plus the height the data asks for. */
export const CHART_HEIGHTS = ["sm", "md", "lg", "auto"] as const
export type ChartHeight = (typeof CHART_HEIGHTS)[number]

/** A content width: 768 · 960 · 1400. */
export const WIDTHS = ["focused", "wide", "page"] as const
export type Width = (typeof WIDTHS)[number]

/** Where an Item is in its life (S-22, S-24). */
export const ITEM_STATES = ["rest", "expanded", "new", "struck"] as const
export type ItemState = (typeof ITEM_STATES)[number]

/** How a Control shows its choices. */
export const PRESENTATIONS = ["auto", "panel", "native", "typed"] as const
export type Presentation = (typeof PRESENTATIONS)[number]

/** A layout's axis, in a Flex's words and in an ARIA widget's. */
export const DIRECTIONS = ["row", "column"] as const
export type Direction = (typeof DIRECTIONS)[number]
export const ORIENTATIONS = ["horizontal", "vertical"] as const
export type Orientation = (typeof ORIENTATIONS)[number]

/** Cross-axis and main-axis placement; a primitive narrows each. */
export const ALIGNS = ["start", "center", "end", "stretch", "baseline"] as const
export type Align = (typeof ALIGNS)[number]
export const JUSTIFIES = ["start", "center", "end", "between"] as const
export type Justify = (typeof JUSTIFIES)[number]

/** Where an overlay opens, and how it lines up on that side. */
export const SIDES = ["top", "right", "bottom", "left"] as const
export type Side = (typeof SIDES)[number]
export const OVERLAY_ALIGNS = ["start", "center", "end"] as const
export type OverlayAlign = (typeof OVERLAY_ALIGNS)[number]

/** A rank: a boundary's (Separator) or a heading's. */
export const BOUNDARY_LEVELS = ["region", "group", "row"] as const
export type BoundaryLevel = (typeof BOUNDARY_LEVELS)[number]
export const HEADING_LEVELS = ["h1", "h2", "h3", "h4"] as const
export type HeadingLevel = (typeof HEADING_LEVELS)[number]

/** Which way a number moved, and whether that is good. */
export const TRENDS = ["better", "worse", "neutral"] as const
export type Trend = (typeof TRENDS)[number]

/** The outline a part draws (D-V6, George 2026-11-04; VIEWS-PLAN.md): one word for one idea, each
    archetype narrowing it to the outlines it has. An Action: a pill (the page's call to action)
    or a rect (a tool beside it). A Mark: a Skeleton's form (text · number · block · circle). A
    Chart's swatch: a Legend's (block · line · dot). */
export const SHAPES = ["pill", "rect", "block", "line", "dot", "circle", "text", "number"] as const
export type Shape = (typeof SHAPES)[number]

/** A ring around Media. */
export const RINGS = ["none", "default", "brand"] as const
export type Ring = (typeof RINGS)[number]

// ── The grammar: which axes each archetype may expose (§2) ────────────────────────────────────

/** Axis name → its value set, for the check and for generated docs (§6 part 3). */
export const AXIS_VALUES = {
  emphasis: [...ACTION_EMPHASIS, ...SURFACE_EMPHASIS],
  tone: TONES,
  fill: FILLS,
  density: DENSITIES,
  size: [...new Set([...CONTROL_SIZES, ...ICON_SIZES, ...MARK_SIZES, ...MEDIA_SIZES, ...OVERLAY_SIZES])],
  height: CHART_HEIGHTS,
  width: WIDTHS,
  state: ITEM_STATES,
  presentation: PRESENTATIONS,
  direction: DIRECTIONS,
  orientation: ORIENTATIONS,
  align: [...new Set([...ALIGNS, ...OVERLAY_ALIGNS])],
  justify: JUSTIFIES,
  side: SIDES,
  level: [...BOUNDARY_LEVELS, ...HEADING_LEVELS],
  trend: TRENDS,
  ring: RINGS,
  shape: SHAPES,
} as const satisfies Record<string, readonly string[]>
export type Axis = keyof typeof AXIS_VALUES

/** The axes an archetype may expose. `kind` (a discriminant) and the one-job booleans
    (`interactive`, `underline`, `framed`, `dividers`) are allowed everywhere; a Composite has none
    of its own and passes its parts' through. */
export const ARCHETYPE_AXES: Record<Archetype, readonly Axis[]> = {
  Action: ["emphasis", "tone", "size", "shape"],
  Control: ["size", "presentation"],
  Surface: ["emphasis", "tone", "fill"],
  Mark: ["tone", "fill", "size", "shape"],
  Media: ["size", "fill", "ring"],
  Text: ["tone", "level"],
  Overlay: ["size", "tone", "side", "align"],
  Frame: ["density", "width", "direction", "orientation", "align", "justify", "level"],
  Item: ["density", "state"],
  Chart: ["height", "trend", "shape"],
  Composite: [],
}

/** Retired words (§3): a prop name nobody writes again, and a value that has a new home on a named axis. */
export const RETIRED_PROPS: Readonly<Record<string, string>> = {
  variant: "emphasis, kind, fill or tone: `variant` says nothing (§3)",
  appearance: "fill (Badge); labelStyle on Field (D-10)",
}
export const RETIRED_VALUES: readonly { word: string; onAxis: Axis | "variant" | "appearance"; use: string }[] = [
  { word: "ghost", onAxis: "variant", use: "emphasis: tertiary" },
  { word: "primary", onAxis: "tone", use: "tone: brand (primary stays an emphasis)" },
  { word: "muted", onAxis: "variant", use: "emphasis: recessed (muted stays a text tone)" },
  { word: "highlight", onAxis: "variant", use: "tone: area + fill: wash" },
  { word: "placeholder", onAxis: "variant", use: "a story helper (src/stories), not a surface look" },
  { word: "me", onAxis: "ring", use: "ring: brand" },
  { word: "row", onAxis: "density", use: "density: default" },
  { word: "default", onAxis: "width", use: "width: page" },
]
