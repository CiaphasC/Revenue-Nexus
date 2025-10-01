import type React from "react"
import type { Metadata } from "next"

import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

import { Header } from "@/components/header"
import { LightEffectsProvider } from "@/components/lights/light-effects-provider"
import { LightSettingsProvider } from "@/contexts/light-settings-context"

export const metadata: Metadata = {
  title: "Revenue Nexus - Interfaces de nivel profesional. Pulido motion impecable.",
  description: "Demo avanzada que destaca React 19, Tailwind v4 y efectos de luz para el cursor en español",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`h-full font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <LightSettingsProvider>
          <LightEffectsProvider />
          <Header />
          <main>{children}</main>
          <Analytics />
        </LightSettingsProvider>
      </body>
    </html>
  )
}
