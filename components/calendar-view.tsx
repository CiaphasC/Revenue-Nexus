"use client"

import { useEffect, useMemo, useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"
import { ACTIVITY_META } from "@/lib/constants/activity-meta"
import { parseWorkspaceServerEvent } from "@/lib/workspace/events"

interface CalendarViewProps {
  initialEvents: CalendarEvent[]
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const buildKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

export function CalendarView({ initialEvents }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(() => new Date())

  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  useEffect(() => {
    const eventSource = new EventSource("/api/activity/stream")

    eventSource.onmessage = (event) => {
      const parsed = parseWorkspaceServerEvent(event.data)
      if (!parsed || parsed.kind !== "calendar") {
        return
      }
      const calendarEvent = parsed.payload
      setEvents((previous) => {
        if (previous.some((existing) => existing.id === calendarEvent.id)) {
          return previous
        }
        return [calendarEvent, ...previous].slice(0, 120)
      })
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    events.forEach((event) => {
      const key = event.date
      const existing = map.get(key) ?? []
      existing.push(event)
      map.set(key, existing)
    })

    return map
  }, [events])

  const sortedEventsForDay = (year: number, month: number, day: number) => {
    const key = buildKey(year, month, day)
    const dayEvents = eventsByDate.get(key) ?? []

    return [...dayEvents].sort((a, b) => {
      const timeA = a.time ?? "00:00"
      const timeB = b.time ?? "00:00"
      return timeA.localeCompare(timeB)
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, month, year }
  }

  const { daysInMonth, startingDayOfWeek, month, year } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const today = new Date()
  const todayKey = buildKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <Card className="border-border/50 bg-card/50 p-4 sm:p-6 backdrop-blur-sm transition-all duration-300 shadow-xl">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-serif text-2xl font-bold text-balance sm:text-3xl">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/30"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/30"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DAY_NAMES.map((day) => (
          <div key={day} className="p-1 text-center text-xs font-semibold text-muted-foreground sm:p-2 sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-16 sm:min-h-24" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dateKey = buildKey(year, month, day)
          const dayEvents = sortedEventsForDay(year, month, day)
          const isToday = dateKey === todayKey

          return (
            <div
              key={dateKey}
              className={cn(
                "group relative min-h-16 rounded-lg border border-border/50 bg-background/50 p-1 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-chart-1/50 hover:shadow-xl hover:shadow-chart-1/20 sm:min-h-24 sm:p-2",
                isToday && "border-chart-1 bg-gradient-to-br from-chart-1/10 to-chart-2/10 shadow-lg shadow-chart-1/30",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex size-5 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 sm:mb-2 sm:size-6 sm:text-sm",
                  isToday
                    ? "bg-chart-1 text-white shadow-lg shadow-chart-1/50 animate-pulse"
                    : "text-foreground group-hover:bg-accent",
                )}
              >
                {day}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                {dayEvents.slice(0, 2).map((event, idx) => {
                  const meta = ACTIVITY_META[event.type]
                  const Icon = meta.icon
                  const rotation = ((idx + event.id.charCodeAt(0)) % 4) - 2

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "group/card relative rounded border p-1 text-[10px] shadow-md transition-all duration-300 hover:z-10 hover:scale-110 hover:shadow-xl sm:p-1.5 sm:text-xs",
                        meta.calendarColor,
                      )}
                      style={{ transform: `rotate(${rotation}deg)` }}
                    >
                      <div className="flex items-start gap-1">
                        <div className="mt-0.5 shrink-0 transition-transform duration-300 group-hover/card:scale-125">
                          <Icon className="size-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold leading-tight">{event.title}</div>
                          <div className="hidden truncate text-[10px] opacity-80 sm:block">{event.description}</div>
                          {event.time && <div className="text-[10px] opacity-80 sm:hidden">{event.time}</div>}
                        </div>
                      </div>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-300 group-hover/card:translate-x-full group-hover/card:opacity-100" />
                    </div>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="hidden rounded bg-accent/50 px-1 py-0.5 text-center text-[10px] font-medium text-muted-foreground transition-all duration-300 hover:bg-accent sm:block">
                    +{dayEvents.length - 2} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
