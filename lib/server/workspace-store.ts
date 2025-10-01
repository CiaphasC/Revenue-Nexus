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
    calendarEvents: [...seedCalendarEvents],
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
  store.calendarEvents = [event, ...store.calendarEvents].slice(0, 60)
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
  return getWorkspaceStore().calendarEvents
}
