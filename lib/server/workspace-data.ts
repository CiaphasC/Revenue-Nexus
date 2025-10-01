import { unstable_cache } from "next/cache"
import { cache } from "react"

import { listActivities, listDeals, listKPIs, getDealById, listCalendarEvents } from "./workspace-store"
import type { Deal } from "@/lib/types"

export const getDeals = unstable_cache(
  async () => listDeals(),
  ["workspace-deals"],
  {
    tags: ["deals"],
  },
)

export const getActivities = unstable_cache(
  async () => listActivities(),
  ["workspace-activities"],
  {
    tags: ["activities"],
  },
)

export const getKPIs = unstable_cache(
  async () => listKPIs(),
  ["workspace-kpis"],
  {
    tags: ["kpis"],
  },
)

export const getCalendarEvents = unstable_cache(
  async () => listCalendarEvents(),
  ["workspace-calendar"],
  {
    tags: ["calendar-events"],
  },
)

export const getDeal = cache(async (dealId: string): Promise<Deal | null> => {
  return getDealById(dealId)
})

export const getPipelineSnapshot = unstable_cache(
  async () => {
    const deals = listDeals()
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)
    const weightedValue = deals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0)

    const byStage = deals.reduce<Record<string, number>>((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] ?? 0) + 1
      return acc
    }, {})

    return {
      totalValue,
      weightedValue,
      totalDeals: deals.length,
      byStage,
    }
  },
  ["workspace-pipeline"],
  {
    tags: ["deals", "pipeline"],
  },
)
