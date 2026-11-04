// npm run lint -w packages/ui   (GAPS #146)
// Code-quality rules only. The layer order and token rules stay in check:layers / check:tokens
// until they move into ESLint in @paige/guardrails (R2-42). src/base is upstream shadcn, never
// edited (ui:diff-base is its check), so it isn't linted.
import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import storybook from "eslint-plugin-storybook"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["storybook-static/**", "node_modules/**", "src/base/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  storybook.configs["flat/recommended"],
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      // The two classic hooks rules only. v7's recommended set adds the React Compiler rules
      // (refs, set-state-in-effect, immutability, purity); the package doesn't use the compiler,
      // and meeting them means reworking DagFrame, Form and InlineEdit (GAPS #149).
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // `_`-prefixed names are deliberately unused (destructured-away props, ignored args).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
)
