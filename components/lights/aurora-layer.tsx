"use client"

import { useCursorPosition } from "@/hooks/use-cursor-position"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { LightSettings } from "@/lib/types"

interface AuroraLayerProps {
  settings: LightSettings
}

export function AuroraLayer({ settings }: AuroraLayerProps) {
  const position = useCursorPosition(16)
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion || settings.mode !== "aurora") {
    return null
  }

  const { intensity, radius } = settings

  return (
    <>
      {/* Primary blob following cursor */}
      <div
        className="pointer-events-none fixed z-40 transition-all duration-700 ease-out"
        style={{
          left: position.x,
          top: position.y,
          width: radius * 2,
          height: radius * 2,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, 
            oklch(0.70 0.19 240 / ${intensity * 0.3}), 
            oklch(0.70 0.15 280 / ${intensity * 0.2}), 
            transparent 70%)`,
          filter: `blur(${settings.blur}px)`,
          mixBlendMode: settings.blendMode,
        }}
      />

      {/* Secondary blob with offset */}
      <div
        className="pointer-events-none fixed z-40 transition-all duration-1000 ease-out"
        style={{
          left: position.x + 100,
          top: position.y - 50,
          width: radius * 1.5,
          height: radius * 1.5,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, 
            oklch(0.65 0.18 200 / ${intensity * 0.25}), 
            transparent 70%)`,
          filter: `blur(${settings.blur * 1.2}px)`,
          mixBlendMode: settings.blendMode,
        }}
      />

      {/* Tertiary blob with different offset */}
      <div
        className="pointer-events-none fixed z-40 transition-all duration-1200 ease-out"
        style={{
          left: position.x - 80,
          top: position.y + 60,
          width: radius * 1.3,
          height: radius * 1.3,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, 
            oklch(0.68 0.16 320 / ${intensity * 0.2}), 
            transparent 70%)`,
          filter: `blur(${settings.blur * 1.5}px)`,
          mixBlendMode: settings.blendMode,
        }}
      />
    </>
  )
}
