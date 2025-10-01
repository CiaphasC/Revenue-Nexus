"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CursorPosition } from "@/lib/types"

export function useCursorPosition(throttleMs = 16) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  const updatePosition = useCallback(
    (event: PointerEvent) => {
      const now = Date.now()

      if (now - lastUpdateRef.current < throttleMs) {
        return
      }

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: event.clientX, y: event.clientY })
        lastUpdateRef.current = now
      })
    },
    [throttleMs],
  )

  useEffect(() => {
    window.addEventListener("pointermove", updatePosition)

    return () => {
      window.removeEventListener("pointermove", updatePosition)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [updatePosition])

  return position
}
