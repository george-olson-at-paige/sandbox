// Rewrites the imports shadcn writes into what a package consumed by Next can resolve (R2-39,
// GAPS #18). The registry ships `import { cn } from "cn"` and the CLI writes `@/…` aliases from
// components.json; packages/ui uses relative paths, because `@/` means the app's own src when
// Next transpiles the package. Used by ui-add.mjs (after `shadcn add`) and diff-base.mjs
// (to compare a fresh registry copy with src/base on equal terms). components.json points both
// the `ui` and `hooks` aliases at `@/base`, so a hook the registry ships (`use-mobile`) sits beside
// the component that imports it and the import is `./use-mobile`, however the registry spells it
// (`@/hooks/…` from the CLI, `@/registry/<style>/hooks/…` in the raw registry JSON).
export function rewriteShadcnImports(source) {
  return source
    .replace(/from\s+["']cn["']/g, 'from "../lib/utils"')
    .replace(/from\s+["']@\/lib\/utils["']/g, 'from "../lib/utils"')
    .replace(/from\s+["']@\/(?:base|components\/ui|hooks|registry\/[\w-]+\/(?:ui|hooks))\/([\w-]+)["']/g, 'from "./$1"')
    .replace(/from\s+["']@\/lib\/([\w-]+)["']/g, 'from "../lib/$1"')
}
