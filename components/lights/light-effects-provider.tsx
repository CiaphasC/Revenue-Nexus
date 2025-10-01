"use client"

import { useLightSettings } from "@/hooks/use-light-settings"
import { SpotlightLayer } from "./spotlight-layer"
import { AuroraLayer } from "./aurora-layer"
import { HighGlowLayer } from "./high-glow-layer"

export function LightEffectsProvider() {
  const { settings } = useLightSettings()

  if (settings.mode === "off") {
    return null
  }

  return (
    <>
      {settings.mode === "spotlight" && <SpotlightLayer settings={settings} />}
      {settings.mode === "aurora" && <AuroraLayer settings={settings} />}
      {settings.mode === "high-glow" && <HighGlowLayer settings={settings} />}
    </>
  )
}
