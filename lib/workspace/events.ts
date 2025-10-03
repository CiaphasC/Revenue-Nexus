import type { Activity, CalendarEvent } from "@/lib/types"

export type CalendarStreamEvent =
  | { action: "created"; event: CalendarEvent }
  | { action: "updated"; event: CalendarEvent }
  | { action: "deleted"; eventId: string }

export type WorkspaceServerEvent =
  | { kind: "activity"; payload: Activity }
  | { kind: "calendar"; payload: CalendarStreamEvent }

export function parseWorkspaceServerEvent(raw: string): WorkspaceServerEvent | null {
  try {
    const parsed = JSON.parse(raw) as WorkspaceServerEvent
    if (!parsed) {
      return null
    }

    if (parsed.kind === "activity" && parsed.payload) {
      return parsed
    }

    if (parsed.kind === "calendar") {
      const payload = parsed.payload
      if (
        payload &&
        (payload.action === "created" || payload.action === "updated") &&
        (payload as Extract<typeof payload, { event: CalendarEvent }>).event
      ) {
        return parsed
      }

      if (payload && payload.action === "deleted" && "eventId" in payload) {
        return parsed
      }
    }
  } catch (error) {
    console.error("Evento SSE inválido", error)
  }
  return null
}
