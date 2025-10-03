export type LightMode = "off" | "spotlight" | "aurora" | "high-glow"

export interface CursorPosition {
  x: number
  y: number
}

export interface LightSettings {
  mode: LightMode
  intensity: number
  radius: number
  blendMode: "normal" | "screen" | "overlay" | "soft-light"
  blur: number
  trail: boolean
}

export interface Deal {
  id: string
  title: string
  company: string
  value: number
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed"
  probability: number
  closeDate: string
  contact: string
}

export interface Activity {
  id: string
  type: "deal" | "meeting" | "email" | "call"
  title: string
  description: string
  timestamp: string
  user: string
}

export interface KPI {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
}

export interface CalendarEvent {
  id: string
  type: Activity["type"]
  title: string
  description: string
  /**
   * Fecha base en formato YYYY-MM-DD para compatibilidad retro.
   * Se deriva de start cuando está disponible.
   */
  date: string
  /** Hora de inicio en formato HH:mm (24h). */
  time?: string
  owner: string
  /** Fecha y hora de inicio en ISO local (YYYY-MM-DDTHH:mm). */
  start: string
  /** Fecha y hora de fin en ISO local (YYYY-MM-DDTHH:mm). */
  end: string
  location?: string
  attendees?: string[]
  organizer?: string
  calendarId?: string
  color?: string
  allDay?: boolean
}
