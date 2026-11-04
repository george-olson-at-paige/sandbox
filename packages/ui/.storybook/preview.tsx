import type { Preview } from "@storybook/react-vite"

import "./preview.css"

/* Viewports at the layout's breakpoints (R1-23): phone, sm, lg, xl and a wide desktop. */
const VIEWPORTS = Object.fromEntries(
  ([[375, "Phone"], [640, "sm"], [768, "md"], [1024, "lg"], [1280, "xl"], [1440, "Desktop"]] as const).map(([w, n]) => [
    `w${w}`,
    { name: `${n} (${w})`, styles: { width: `${w}px`, height: "900px" }, type: w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop" },
  ])
)

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "todo" },
    viewport: { options: VIEWPORTS },
    options: {
      // Sections are folders (main.ts): Overview, then the layers in reading order (ORGANIZATION.md §6, §12; R7-01).
      // Docs first among a component's entries (George 2026-10-29). A function, because the object
      // form can't say that at every level; it keeps the object form's rule otherwise: listed names in
      // this order, unlisted ones after them in file order. Self-contained and plain JavaScript: Storybook evaluates it on the server, so no type annotations inside.
      storySort: (a, b) => {
        const order = [
          "Overview", ["Introduction", "Which section do I use?"],
          "Foundations", ["Theme", "Layout", "Focus", "Icons", "Breakpoints"],
          "Primitives",
          "Components", ["Actions", "Inputs", "Display", "Feedback", "Navigation", "Overlays", "Charts"],
          "Forms", ["Field", "FieldGroup", "FieldSet", "Form", "FormSection", "FormFooter", "ErrorSummary", "InlineEdit", "Fields"],
          "Patterns",
          "Shell",
          "Vault", ["ItemRow", "FactItem", "FactField", "StatusDot", "CaptureCard", "ChoiceCard", "RemoveDialog", "Areas", "People", "Documents"],
          "Admin", ["AdminSidebar", "MetricCard", "PipelineGraph", "PartnerOffers", "RevShare", "Pages", ["Pulse", "People", "Partners", "Plans", "Subscriptions", "PromotionCodes"]],
          // The flow's parts, then its steps in the order a person meets them.
          "Setup", ["StepRail", "FlowFooter", "Welcome", "AboutYou"],
          "Templates", ["Page", "PageHeader", "HomePage", "AreaPage", "SetupBeat", "AdminPage", "ListPage"],
          "Labs",
          "Base",
        ]
        const pathA = a.title.split("/").map((s) => s.trim())
        const pathB = b.title.split("/").map((s) => s.trim())
        let level = order
        for (let depth = 0; pathA[depth] || pathB[depth]; depth++) {
          if (!pathA[depth]) return -1
          if (!pathB[depth]) return 1
          if (pathA[depth] !== pathB[depth]) {
            const ia = level.indexOf(pathA[depth])
            const ib = level.indexOf(pathB[depth])
            if (ia === -1 && ib === -1) return 0
            return (ia === -1 ? level.length : ia) - (ib === -1 ? level.length : ib)
          }
          const i = level.indexOf(pathA[depth])
          const next = i === -1 ? undefined : level[i + 1]
          level = Array.isArray(next) ? next : []
        }
        return (a.type === "docs" ? 0 : 1) - (b.type === "docs" ? 0 : 1)
      },
    },
  },
  tags: ["autodocs"],
}

export default preview
