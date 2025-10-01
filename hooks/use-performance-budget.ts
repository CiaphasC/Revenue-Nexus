"use client"

import { useState, useEffect } from "react"

export function usePerformanceBudget() {
  const [canUseWebGL, setCanUseWebGL] = useState(false)
  const [hardwareConcurrency, setHardwareConcurrency] = useState(1)

  useEffect(() => {
    // Check for WebGL support
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    setCanUseWebGL(!!gl)

    // Check hardware concurrency
    setHardwareConcurrency(navigator.hardwareConcurrency || 1)
  }, [])

  return {
    canUseWebGL,
    hardwareConcurrency,
    canUseHighGlow: canUseWebGL && hardwareConcurrency >= 4,
  }
}
