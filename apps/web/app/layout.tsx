import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"

// Brand fonts as the prototype uses them (tokens.css:3-14): Montserrat for UI,
// Roboto Slab as the stand-in for the licensed Museo Slab. The theme reads the
// two CSS variables these set.
const sans = Montserrat({ subsets: ["latin"], variable: "--font-brand-sans", display: "swap" })
const display = localFont({
  src: "./fonts/RobotoSlab-VariableFont_wght.ttf",
  variable: "--font-brand-display",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Paige UI test pass",
  description: "Spike: @paige/ui collapse iteration 1 against three prototype screens",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  )
}
