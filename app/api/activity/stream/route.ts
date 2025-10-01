import { NextResponse } from "next/server"

import { appendActivity, appendCalendarEvent } from "@/lib/server/workspace-store"
import type { Activity, CalendarEvent } from "@/lib/types"
import { emitWorkspaceEvent, subscribeWorkspaceEvents } from "@/lib/server/event-bus"
import type { WorkspaceServerEvent } from "@/lib/workspace/events"

export const runtime = "edge"

const encoder = new TextEncoder()

function buildActivityPayload(): Activity {
  const types: Activity["type"][] = ["deal", "meeting", "email", "call"]
  const type = types[Math.floor(Math.random() * types.length)]

  const titles: Record<Activity["type"], string> = {
    deal: "Actualización de negocio",
    meeting: "Reunión programada",
    email: "Email enviado",
    call: "Llamada registrada",
  }

  return {
    id: crypto.randomUUID(),
    type,
    title: `${titles[type]} • ${new Date().toLocaleTimeString("es-PE")}`,
    description: "Evento generado automáticamente",
    timestamp: "Hace instantes",
    user: "Sistema Lumen",
  }
}

function buildCalendarPayload(activity: Activity): CalendarEvent {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  return {
    id: crypto.randomUUID(),
    type: activity.type,
    title: activity.title,
    description: activity.description,
    date,
    time,
    owner: activity.user,
  }
}

function serializeEvent(event: WorkspaceServerEvent) {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function GET() {
  let heartbeatInterval: ReturnType<typeof setInterval> | undefined
  let generatorInterval: ReturnType<typeof setInterval> | undefined
  let unsubscribe: (() => void) | undefined

  const cleanup = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    if (generatorInterval) clearInterval(generatorInterval)
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = undefined
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: WorkspaceServerEvent | string) => {
        if (typeof event === "string") {
          controller.enqueue(encoder.encode(event))
          return
        }
        controller.enqueue(encoder.encode(serializeEvent(event)))
      }

      unsubscribe = subscribeWorkspaceEvents((event) => send(event))

      send({
        kind: "activity",
        payload: {
          id: crypto.randomUUID(),
          type: "email",
          title: "Canal en vivo conectado",
          description: "Recibirás actualizaciones del equipo en tiempo real",
          timestamp: "Ahora",
          user: "Sistema Lumen",
        },
      })

      heartbeatInterval = setInterval(() => {
        send(":keep-alive\n\n")
      }, 15000)

      generatorInterval = setInterval(() => {
        const activity = buildActivityPayload()
        appendActivity(activity)
        emitWorkspaceEvent({ kind: "activity", payload: activity })

        const calendarEvent = buildCalendarPayload(activity)
        appendCalendarEvent(calendarEvent)
        emitWorkspaceEvent({ kind: "calendar", payload: calendarEvent })
      }, 10000)
    },
    cancel() {
      cleanup()
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
