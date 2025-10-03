import type { Activity, CalendarEvent, Deal, KPI } from "@/lib/types"
import { deals as seedDeals, recentActivities as seedActivities, kpis as seedKpis } from "@/lib/data/mock-data"
import { calendarEvents as seedCalendarEvents } from "@/lib/data/mock-calendar"

interface WorkspaceStore {
  deals: Deal[]
  activities: Activity[]
  kpis: KPI[]
  calendarEvents: CalendarEvent[]
}

declare global {
  var __WORKSPACE_STORE__: WorkspaceStore | undefined
}

function createInitialStore(): WorkspaceStore {
  return {
    deals: [...seedDeals],
    activities: [...seedActivities],
    kpis: [...seedKpis],
    calendarEvents: seedCalendarEvents.map(normalizeCalendarEvent),
  }
}

function ensureDateTimeString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function normalizeCalendarEvent(event: CalendarEvent): CalendarEvent {
  const tentativeStart = event.start ?? `${event.date}T${event.time ?? "09:00"}`
  const startDate = new Date(tentativeStart)
  const endReference = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000)

  const normalizedStart = ensureDateTimeString(startDate)
  const normalizedEnd = ensureDateTimeString(endReference)

  return {
    ...event,
    attendees: event.attendees ?? [],
    start: normalizedStart,
    end: normalizedEnd,
    date: event.date ?? normalizedStart.slice(0, 10),
    time: event.time ?? normalizedStart.slice(11, 16),
  }
}

export function getWorkspaceStore(): WorkspaceStore {
  if (!globalThis.__WORKSPACE_STORE__) {
    globalThis.__WORKSPACE_STORE__ = createInitialStore()
  }

  return globalThis.__WORKSPACE_STORE__
}

export function resetWorkspaceStore() {
  globalThis.__WORKSPACE_STORE__ = createInitialStore()
}

export function upsertDeal(deal: Deal) {
  const store = getWorkspaceStore()
  const existingIndex = store.deals.findIndex((item) => item.id === deal.id)

  if (existingIndex >= 0) {
    store.deals[existingIndex] = deal
  } else {
    store.deals = [deal, ...store.deals]
  }
}

export function appendActivity(activity: Activity) {
  const store = getWorkspaceStore()
  store.activities = [activity, ...store.activities].slice(0, 50)
}

export function appendCalendarEvent(event: CalendarEvent) {
  const store = getWorkspaceStore()
  const normalized = normalizeCalendarEvent(event)
  const existingIndex = store.calendarEvents.findIndex((item) => item.id === normalized.id)

  if (existingIndex >= 0) {
    store.calendarEvents[existingIndex] = normalized
  } else {
    store.calendarEvents = [normalized, ...store.calendarEvents]
  }
}

export function updateCalendarEvent(event: CalendarEvent) {
  const store = getWorkspaceStore()
  const normalized = normalizeCalendarEvent(event)
  const index = store.calendarEvents.findIndex((item) => item.id === normalized.id)

  if (index >= 0) {
    store.calendarEvents[index] = normalized
  }
}

export function deleteCalendarEvent(eventId: string) {
  const store = getWorkspaceStore()
  store.calendarEvents = store.calendarEvents.filter((event) => event.id !== eventId)
}

export function getDealById(dealId: string) {
  const store = getWorkspaceStore()
  return store.deals.find((deal) => deal.id === dealId) ?? null
}

export function listDeals() {
  return getWorkspaceStore().deals
}

export function listActivities() {
  return getWorkspaceStore().activities
}

export function listKPIs() {
  return getWorkspaceStore().kpis
}

export function listCalendarEvents() {
  return getWorkspaceStore()
    .calendarEvents.slice()
    .sort((a, b) => a.start.localeCompare(b.start))
}
