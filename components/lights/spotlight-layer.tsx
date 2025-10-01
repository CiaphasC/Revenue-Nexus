"use client"

import { useCursorPosition } from "@/hooks/use-cursor-position"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { LightSettings } from "@/lib/types"

interface SpotlightLayerProps {
  settings: LightSettings
}

export function SpotlightLayer({ settings }: SpotlightLayerProps) {
  const position = useCursorPosition(16)
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion || settings.mode === "off") {
    return null
  }

  const { intensity, radius, blur } = settings

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
      style={{
        background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, 
          oklch(0.70 0.19 240 / ${intensity * 0.15}), 
          transparent ${blur}%)`,
        mixBlendMode: settings.blendMode,
      }}
    />
  )
}
