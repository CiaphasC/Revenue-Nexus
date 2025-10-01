"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { LightMode, LightSettings } from "@/lib/types"

const DEFAULT_SETTINGS: LightSettings = {
  mode: "spotlight",
  intensity: 0.7,
  radius: 300,
  blendMode: "screen",
  blur: 40,
  trail: false,
}

interface LightSettingsContextType {
  settings: LightSettings
  updateSettings: (partial: Partial<LightSettings>) => void
  setMode: (mode: LightMode) => void
}

const LightSettingsContext = createContext<LightSettingsContextType | undefined>(undefined)

export function LightSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LightSettings>(DEFAULT_SETTINGS)
  const [isClient, setIsClient] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem("lumen-light-settings")
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse stored settings:", e)
      }
    }
  }, [])

  // Save to localStorage when settings change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("lumen-light-settings", JSON.stringify(settings))
    }
  }, [settings, isClient])

  const updateSettings = (partial: Partial<LightSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }

  const setMode = (mode: LightMode) => {
    updateSettings({ mode })
  }

  return (
    <LightSettingsContext.Provider value={{ settings, updateSettings, setMode }}>
      {children}
    </LightSettingsContext.Provider>
  )
}

export function useLightSettings() {
  const context = useContext(LightSettingsContext)
  if (context === undefined) {
    throw new Error("useLightSettings must be used within a LightSettingsProvider")
  }
  return context
}
