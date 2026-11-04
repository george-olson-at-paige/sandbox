import { useEffect, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Eyebrow } from "../components/display/eyebrow"
import { Placeholder } from "../stories/placeholder"
import { Stack } from "../primitives/stack"

/* Breakpoints (R1-05): the four named in theme.css (rem). Resize the canvas, or use the
   viewport toolbar, to see which one is active. */
const BREAKPOINTS = ["sm", "md", "lg", "xl"] as const

function useToken(name: string) {
  const [value, setValue] = useState("")
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
  }, [name])
  return value
}

function Row({ bp }: { bp: (typeof BREAKPOINTS)[number] }) {
  const value = useToken(`--breakpoint-${bp}`)
  const px = value.endsWith("rem") ? `${parseFloat(value) * 16}px` : ""
  return (
    <tr className="border-t border-divider">
      <td className="py-2 pr-6 text-sm font-semibold text-card-foreground">{bp}:</td>
      <td className="py-2 pr-6 text-sm text-muted-foreground">--breakpoint-{bp}</td>
      <td className="py-2 pr-6 text-sm text-card-foreground">{value}</td>
      <td className="py-2 text-sm text-muted-foreground">{px}</td>
    </tr>
  )
}

const meta = {
  tags: ["!autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Tokens: Story = {
  render: () => (
    <Stack gap={6}>
      <table className="w-fit">
        <tbody>
          {BREAKPOINTS.map((bp) => <Row key={bp} bp={bp} />)}
        </tbody>
      </table>
      <Stack gap={2}>
        <Eyebrow>Active now</Eyebrow>
        <p className="text-sm font-semibold text-card-foreground">
          <span className="sm:hidden">below sm (phone)</span>
          <span className="hidden sm:inline md:hidden">sm</span>
          <span className="hidden md:inline lg:hidden">md</span>
          <span className="hidden lg:inline xl:hidden">lg</span>
          <span className="hidden xl:inline">xl</span>
        </p>
      </Stack>
      <Stack gap={2}>
        <Eyebrow>The grid the Vault home uses: 1 · 2 from sm · 3 from lg</Eyebrow>
        <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Placeholder key={i} size="md" label={`Tile ${i + 1}`} />)}
        </div>
      </Stack>
    </Stack>
  ),
}
