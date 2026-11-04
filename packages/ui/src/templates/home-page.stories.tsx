import type { Meta, StoryObj } from "@storybook/react-vite"

import { StoryAppHeader } from "../stories/fixtures"
import { Placeholder } from "../stories/placeholder"
import { HomePage } from "./home-page"

/* HomePage: Page + intro · tile grid (1 column below sm, 2 from sm, 3 from lg; 16 apart) ·
   footer. The viewport stories show each column count. */
const meta = {
  component: HomePage,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <div className="flex min-h-screen flex-col bg-background">
        <StoryAppHeader />
        <S />
      </div>
    ),
  ],
  args: {
    intro: <Placeholder size="lg" label="Intro (hero)" />,
    tiles: Array.from({ length: 9 }, (_, i) => <Placeholder key={i} size="lg" label={`Area tile ${i + 1}`} />),
    footer: <Placeholder size="md" label="Footer (browse row)" />,
  },
} satisfies Meta<typeof HomePage>

export default meta
type Story = StoryObj<typeof meta>

export const Grid: Story = { name: "Grid (resize to see 1 · 2 · 3)" }
export const OneColumn: Story = { tags: ["!autodocs"], name: "1 column (375)", globals: { viewport: { value: "w375", isRotated: false } } }
export const TwoColumns: Story = { tags: ["!autodocs"], name: "2 columns (640)", globals: { viewport: { value: "w640", isRotated: false } } }
export const ThreeColumns: Story = { tags: ["!autodocs"], name: "3 columns (1024)", globals: { viewport: { value: "w1024", isRotated: false } } }
