"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

import {
  appendActivity,
  appendCalendarEvent,
  getDealById,
  upsertDeal,
} from "@/lib/server/workspace-store"
import { formatCurrency as formatCurrencyIntl } from "@/lib/utils/format"
import type { Activity, CalendarEvent, Deal } from "@/lib/types"
import { STAGE_LABELS, stageProbability } from "@/lib/workspace/deals"
import { emitWorkspaceEvent } from "@/lib/server/event-bus"

const dealStages = ["lead", "qualified", "proposal", "negotiation", "closed"] as const

const createDealSchema = z.object({
  title: z.string().min(3),
  company: z.string().min(2),
  value: z.coerce.number().min(0),
  stage: z.enum(dealStages),
  contact: z.string().min(2),
  closeDate: z.string().min(4),
})

const formatDealCurrency = (value: number) => formatCurrencyIntl(value)

export async function createDealAction(formData: FormData) {
  const parsed = createDealSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Revisa los campos del formulario",
      issues: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  const newDeal: Deal = {
    id: crypto.randomUUID(),
    title: data.title,
    company: data.company,
    value: data.value,
    stage: data.stage,
    probability: stageProbability(data.stage),
    closeDate: data.closeDate,
    contact: data.contact,
  }

  upsertDeal(newDeal)

  const activity: Activity = {
    id: crypto.randomUUID(),
    type: data.stage === "closed" ? "deal" : "email",
    title: data.stage === "closed" ? `Negocio cerrado: ${data.title}` : `Nuevo negocio: ${data.title}`,
    description: `${data.company} • ${formatDealCurrency(data.value)}`,
    timestamp: "Justo ahora",
    user: "Automatización",
  }

  appendActivity(activity)
  emitWorkspaceEvent({ kind: "activity", payload: activity })

  const calendarEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    type: "deal",
    title: data.title,
    description: `${data.company} • ${formatDealCurrency(data.value)}`,
    date: data.closeDate,
    time: "09:00",
    owner: data.contact,
    start: `${data.closeDate}T09:00`,
    end: `${data.closeDate}T10:00`,
    organizer: data.contact,
    calendarId: "ventas",
  }

  appendCalendarEvent(calendarEvent)
  emitWorkspaceEvent({
    kind: "calendar",
    payload: { action: "created", event: calendarEvent },
  })

  revalidateTag("deals")
  revalidateTag("activities")
  revalidateTag("pipeline")
  revalidateTag("calendar-events")
  revalidatePath("/workspace")

  return {
    success: true as const,
    deal: newDeal,
  }
}

const updateDealStageSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(dealStages),
})

export async function updateDealStageAction(formData: FormData) {
  const parsed = updateDealStageSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      success: false as const,
      error: "No se pudo actualizar la etapa",
    }
  }

  const { id, stage } = parsed.data
  const existing = getDealById(id)

  if (!existing) {
    return {
      success: false as const,
      error: "El negocio ya no existe",
    }
  }

  const updatedDeal: Deal = {
    ...existing,
    stage,
    probability: stageProbability(stage),
  }

  upsertDeal(updatedDeal)

  const activity: Activity = {
    id: crypto.randomUUID(),
    type: "deal",
    title: `Etapa actualizada: ${existing.title}`,
    description: `Ahora en ${stage.toUpperCase()}`,
    timestamp: "Justo ahora",
    user: "Automatización",
  }

  appendActivity(activity)
  emitWorkspaceEvent({ kind: "activity", payload: activity })

  const milestoneTime = new Date()
  const formattedDate = milestoneTime.toISOString().slice(0, 10)
  const formattedTime = `${String(milestoneTime.getHours()).padStart(2, "0")}:${String(
    milestoneTime.getMinutes(),
  ).padStart(2, "0")}`
  const endTime = new Date(milestoneTime.getTime() + 45 * 60 * 1000)
  const formattedEnd = `${String(endTime.getHours()).padStart(2, "0")}:${String(
    endTime.getMinutes(),
  ).padStart(2, "0")}`

  const calendarEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    type: stage === "closed" ? "deal" : "meeting",
    title: `${existing.title} → ${STAGE_LABELS[stage]}`,
    description: `${existing.company} • ${formatDealCurrency(existing.value)}`,
    date: formattedDate,
    time: formattedTime,
    owner: existing.contact,
    start: `${formattedDate}T${formattedTime}`,
    end: `${formattedDate}T${formattedEnd}`,
    organizer: existing.contact,
    calendarId: stage === "closed" ? "ventas" : "equipo",
  }

  appendCalendarEvent(calendarEvent)
  emitWorkspaceEvent({
    kind: "calendar",
    payload: { action: "created", event: calendarEvent },
  })

  revalidateTag("deals")
  revalidateTag("activities")
  revalidateTag("pipeline")
  revalidateTag("calendar-events")
  revalidatePath("/workspace")

  return {
    success: true as const,
    deal: updatedDeal,
  }
}
