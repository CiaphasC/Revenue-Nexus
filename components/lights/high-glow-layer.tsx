"use client"

import { useEffect, useRef } from "react"
import { useCursorPosition } from "@/hooks/use-cursor-position"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { usePerformanceBudget } from "@/hooks/use-performance-budget"
import type { LightSettings } from "@/lib/types"

interface HighGlowLayerProps {
  settings: LightSettings
}

export function HighGlowLayer({ settings }: HighGlowLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const position = useCursorPosition(16)
  const prefersReducedMotion = useReducedMotion()
  const { canUseHighGlow } = usePerformanceBudget()

  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion || !canUseHighGlow || settings.mode !== "high-glow") {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    updateSize()
    window.addEventListener("resize", updateSize)

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create radial gradient at cursor position
      const gradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, settings.radius)

      gradient.addColorStop(0, `rgba(120, 119, 198, ${settings.intensity * 0.4})`)
      gradient.addColorStop(0.5, `rgba(120, 119, 198, ${settings.intensity * 0.2})`)
      gradient.addColorStop(1, "rgba(120, 119, 198, 0)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", updateSize)
    }
  }, [position, settings, prefersReducedMotion, canUseHighGlow])

  if (prefersReducedMotion || !canUseHighGlow || settings.mode !== "high-glow") {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        mixBlendMode: settings.blendMode,
        filter: `blur(${settings.blur}px)`,
      }}
    />
  )
}
