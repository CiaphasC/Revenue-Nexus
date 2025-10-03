"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import {
  appendCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/server/workspace-store"
import { emitWorkspaceEvent } from "@/lib/server/event-bus"
import type { CalendarEvent, CalendarRecurrenceRule } from "@/lib/types"
import {
  calendarEventSchema,
  type CalendarEventInput,
} from "@/lib/validators/calendar"

function ensureDateTimeString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function normalizeRecurrence(rule?: CalendarRecurrenceRule) {
  if (!rule || rule.frequency === "none") {
    return undefined
  }

  const until = rule.until ? new Date(rule.until) : undefined

  return {
    frequency: rule.frequency,
    interval: rule.interval && Number.isFinite(rule.interval) ? rule.interval : 1,
    count: rule.count,
    until: until ? ensureDateTimeString(until) : undefined,
  }
}

function buildEventPayload(input: CalendarEventInput & { id: string }): CalendarEvent {
  const startDate = new Date(input.start)
  const endDate = new Date(input.end)
  const attendees = input.attendees?.filter((item) => item.trim().length > 0) ?? []

  const normalizedStart = ensureDateTimeString(startDate)
  const normalizedEnd = ensureDateTimeString(endDate)

  return {
    id: input.id,
    type: input.type,
    title: input.title,
    description: input.description ?? "",
    date: normalizedStart.slice(0, 10),
    time: input.allDay ? undefined : normalizedStart.slice(11, 16),
    owner: input.owner,
    start: normalizedStart,
    end: normalizedEnd,
    organizer: input.organizer ?? input.owner,
    location: input.location,
    attendees,
    calendarId: input.calendarId,
    color: input.color,
    allDay: input.allDay ?? false,
    recurrence: normalizeRecurrence(input.recurrence),
  }
}

function revalidateCalendar() {
  revalidateTag("calendar-events")
  revalidatePath("/calendario")
  revalidatePath("/workspace")
}

export async function createCalendarEventAction(input: CalendarEventInput) {
  const parsed = calendarEventSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const payload = buildEventPayload({ id: crypto.randomUUID(), ...parsed.data })

  appendCalendarEvent(payload)
  emitWorkspaceEvent({
    kind: "calendar",
    payload: { action: "created", event: payload },
  })
  revalidateCalendar()

  return {
    success: true as const,
    event: payload,
  }
}

export async function updateCalendarEventAction(input: CalendarEventInput & { id: string }) {
  const parsed = calendarEventSchema.safeParse(input)

  if (!parsed.success || !parsed.data.id) {
    return {
      success: false as const,
      errors: parsed.success ? { id: ["Evento no encontrado"] } : parsed.error.flatten().fieldErrors,
    }
  }

  const payload = buildEventPayload(parsed.data)

  updateCalendarEvent(payload)
  emitWorkspaceEvent({
    kind: "calendar",
    payload: { action: "updated", event: payload },
  })
  revalidateCalendar()

  return {
    success: true as const,
    event: payload,
  }
}

export async function deleteCalendarEventAction(eventId: string) {
  if (!eventId) {
    return { success: false as const, error: "Evento inválido" }
  }

  deleteCalendarEvent(eventId)
  emitWorkspaceEvent({
    kind: "calendar",
    payload: { action: "deleted", eventId },
  })
  revalidateCalendar()

  return { success: true as const }
}
