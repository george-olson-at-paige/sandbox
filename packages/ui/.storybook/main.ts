import { existsSync, readFileSync } from "node:fs"
import type { StorybookConfig } from "@storybook/react-vite"
import type { Indexer } from "storybook/internal/types"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import remarkGfm from "remark-gfm"

/* Folder-driven nav (R1-30, R7-01): each folder is one Storybook section and stories carry no
   `title:`. A story's title is its section plus its path under the folder in PascalCase
   (src/components/inputs/select.stories.tsx → Components/Inputs/Select). Renaming a section is
   one line here; section order is `storySort` in preview.tsx. The list is the layer order of
   scripts/check-layers.mjs (lowest first), with the story-only folders around it: reading order
   for a screen builder. One folder is titled under another: src/charts is its own tier (its
   libraries load lazily) but reads as Components › Charts, where Sparkline and Stat's neighbours
   are (George 2026-10-30: a root is a kind of thing, not a bundle split). */
const SECTIONS = [
  { directory: "../src/docs", titlePrefix: "Overview" },
  { directory: "../src/foundations", titlePrefix: "Foundations" },
  { directory: "../src/primitives", titlePrefix: "Primitives" },
  { directory: "../src/components", titlePrefix: "Components" },
  { directory: "../src/charts", titlePrefix: "Components/Charts" },
  { directory: "../src/forms", titlePrefix: "Forms" },
  { directory: "../src/patterns", titlePrefix: "Patterns" },
  { directory: "../src/shell", titlePrefix: "Shell" },
  { directory: "../src/vault", titlePrefix: "Vault" },
  // The cross-area views and modes: People, Documents, Passwords, Messages, Memories, Will builder.
  { directory: "../src/views", titlePrefix: "Views" },
  { directory: "../src/admin", titlePrefix: "Admin" },
  // Essential Setup: its parts (StepRail, FlowFooter) and its composed steps (Welcome, About you).
  { directory: "../src/setup", titlePrefix: "Setup" },
  // The door (REVIEW-18): the auth pages, each state a story of the AuthPage template.
  { directory: "../src/auth", titlePrefix: "Auth" },
  { directory: "../src/templates", titlePrefix: "Templates" },
  // Level-0 sketches (LEVELS.md): their own section, so a reviewer always knows a sketch.
  { directory: "../src/labs", titlePrefix: "Labs" },
  { directory: "../src/base", titlePrefix: "Base" },
]

/** kebab-case path segments → PascalCase title segments, after the section prefix (subfolders too). */
const pascalSegments = (title: string) => {
  const [section, ...rest] = title.split("/")
  return [section, ...rest.map((seg) => seg.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase()))].join("/")
}

/** The `@archetype X` a story file's component declares in its header (ARCHETYPES.md §7.2), as a
    story tag `archetype-x`, so the sidebar can filter by it. Read from the component file beside the
    story (button.stories.tsx → button.tsx); a story with no such file (a docs page, a fixture) gets none. */
const archetypeTag = (storyFile: string) => {
  const component = storyFile.replace(/\.stories\.tsx?$/, ".tsx")
  if (!existsSync(component)) return null
  const m = /@archetype\s+([A-Z]\w*)/.exec(readFileSync(component, "utf8"))
  return m ? `archetype-${m[1].toLowerCase()}` : null
}

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: SECTIONS.map(({ directory, titlePrefix }) => ({
    directory,
    titlePrefix,
    files: "**/*.@(mdx|stories.@(ts|tsx))",
  })),
  // Wrap the CSF indexer so auto titles get PascalCase file and folder names (the ids stay as they were
  // when titles were written by hand), and every story carries its component's archetype as a tag.
  // MDX pages set their own <Meta title>.
  experimental_indexers: async (existing) =>
    (existing ?? []).map(
      (indexer): Indexer => ({
        ...indexer,
        createIndex: async (fileName, options) => {
          const entries = await indexer.createIndex(fileName, {
            ...options,
            makeTitle: (userTitle) => (userTitle ? options.makeTitle(userTitle) : pascalSegments(options.makeTitle(userTitle))),
          })
          const tag = archetypeTag(fileName)
          return tag ? entries.map((e) => ({ ...e, tags: [...(e.tags ?? []), tag] })) : entries
        },
      })
    ),
  addons: [
    // MDX is CommonMark only; the docs pages' tables (introduction.mdx, which-section.mdx) are
    // GitHub-flavoured markdown and rendered as pipe text without remark-gfm (George 2026-10-30).
    // Component docs drawn from story comments go through markdown-to-jsx, not this.
    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    "@storybook/addon-a11y",
    "storybook-addon-pseudo-states",
  ],
  core: { disableTelemetry: true },
  // The app's public assets (logo, avatar), so composites render as they do in apps/web.
  staticDirs: [{ from: "../../../apps/web/public", to: "/" }],
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), react(), tailwindcss()]
    return config
  },
}

export default config
