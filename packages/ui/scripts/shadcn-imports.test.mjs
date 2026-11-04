// The import rewrite ui:add and diff-base share (R2-39, R17-04): every form the shadcn registry and
// CLI write becomes a relative path the package can resolve when Next transpiles it. Hooks land in
// src/base too (components.json's `hooks` alias is `@/base`), so they rewrite to `./`.
import { test } from "node:test"
import assert from "node:assert/strict"

import { rewriteShadcnImports } from "./shadcn-imports.mjs"

test("the registry's cn package and the @/ aliases become relative paths", () => {
  const source = [
    `import { cn } from "cn"`,
    `import { cn as cx } from "@/lib/utils"`,
    `import { Button } from "@/components/ui/button"`,
    `import { Label } from "@/base/label"`,
    `import { Toggle } from "@/registry/new-york-v4/ui/toggle"`,
    `import { useIsMobile } from "@/hooks/use-mobile"`,
    `import { useIsMobile as mobile } from "@/registry/new-york-v4/hooks/use-mobile"`,
    `import { format } from '@/lib/format'`,
  ].join("\n")
  assert.equal(
    rewriteShadcnImports(source),
    [
      `import { cn } from "../lib/utils"`,
      `import { cn as cx } from "../lib/utils"`,
      `import { Button } from "./button"`,
      `import { Label } from "./label"`,
      `import { Toggle } from "./toggle"`,
      `import { useIsMobile } from "./use-mobile"`,
      `import { useIsMobile as mobile } from "./use-mobile"`,
      `import { format } from "../lib/format"`,
    ].join("\n")
  )
})

test("package imports and relative paths are left alone", () => {
  const source = `import * as React from "react"\nimport { Slot } from "radix-ui"\nimport { Button } from "./button"`
  assert.equal(rewriteShadcnImports(source), source)
})
