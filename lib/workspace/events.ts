import type { Activity, CalendarEvent } from "@/lib/types"

export type WorkspaceServerEvent =
  | { kind: "activity"; payload: Activity }
  | { kind: "calendar"; payload: CalendarEvent }

export function parseWorkspaceServerEvent(raw: string): WorkspaceServerEvent | null {
  try {
    const parsed = JSON.parse(raw) as WorkspaceServerEvent
    if (parsed && (parsed.kind === "activity" || parsed.kind === "calendar")) {
      return parsed
    }
  } catch (error) {
    console.error("Evento SSE inválido", error)
  }
  return null
}
