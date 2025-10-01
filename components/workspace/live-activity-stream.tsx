"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { ACTIVITY_META } from "@/lib/constants/activity-meta"
import { parseWorkspaceServerEvent } from "@/lib/workspace/events"
import type { Activity } from "@/lib/types"

interface LiveActivityStreamProps {
  initialActivities: Activity[]
}

export function LiveActivityStream({ initialActivities }: LiveActivityStreamProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)

  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  useEffect(() => {
    const eventSource = new EventSource("/api/activity/stream")

    eventSource.onmessage = (event) => {
      const parsed = parseWorkspaceServerEvent(event.data)
      if (!parsed || parsed.kind !== "activity") {
        return
      }

      const activity = parsed.payload
      setActivities((previous) => {
        if (previous.some((item) => item.id === activity.id)) {
          return previous
        }
        return [activity, ...previous].slice(0, 25)
      })
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <ul className="space-y-3">
      {activities.map((activity) => {
        const meta = ACTIVITY_META[activity.type]
        const Icon = meta.icon

        return (
          <li
            key={activity.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-4 shadow-sm",
              "transition-all duration-200 hover:border-chart-1/40 hover:bg-background/80",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg bg-placeholder transition-transform duration-200",
                  meta.calendarColor,
                  "group-hover:scale-105",
                )}
                aria-hidden
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-medium leading-tight text-foreground">{activity.title}</h3>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground/80">
                  {activity.user} · {activity.timestamp}
                </p>
              </div>
            </div>
          </li>
        )}
      )}
    </ul>
  )
}
