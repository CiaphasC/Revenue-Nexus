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
  title: "Lumen Studio - Design-grade UI. Motion-grade polish.",
  description: "A sophisticated demo showcasing React 19, Tailwind v4, and advanced cursor light effects",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
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
