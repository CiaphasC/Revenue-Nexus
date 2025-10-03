"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  addDays,
  differenceInMinutes,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { Clock3, Filter, MapPin, Users } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"
import { ACTIVITY_META } from "@/lib/constants/activity-meta"
import { parseWorkspaceServerEvent } from "@/lib/workspace/events"
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/app/calendario/actions"
import type { CalendarEventInput } from "@/lib/validators/calendar"
import {
  CalendarToolbar,
  type CalendarViewMode,
} from "@/components/calendar/calendar-toolbar"
import { MiniCalendar } from "@/components/calendar/mini-calendar"
import { EventModal } from "@/components/calendar/event-modal"
import { EventForm } from "@/components/calendar/event-form"

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]

const DEFAULT_CALENDARS = [
  { id: "mi-calendario", label: "Mi calendario", color: "#6366f1" },
  { id: "ventas", label: "Ventas", color: "#4f46e5" },
  { id: "clientes", label: "Clientes", color: "#0ea5e9" },
  { id: "equipo", label: "Equipo", color: "#14b8a6" },
  { id: "seguimiento", label: "Seguimiento", color: "#f59e0b" },
]

interface CalendarViewProps {
  initialEvents: CalendarEvent[]
}

interface CalendarMetadata {
  id: string
  label: string
  color: string
}

interface EventLayoutMeta {
  top: number
  height: number
  column: number
  columns: number
}

interface PositionedEvent {
  event: CalendarEvent
  position: EventLayoutMeta
}

function ensureDateTimeString(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : ""
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  const start = ensureDateTimeString(event.start ?? `${event.date}T${event.time ?? "09:00"}`)
  const end = ensureDateTimeString(event.end ?? start)

  return {
    ...event,
    start,
    end,
    date: start.slice(0, 10),
    time: event.allDay ? undefined : start.slice(11, 16),
    attendees: event.attendees ?? [],
  }
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => a.start.localeCompare(b.start))
}

function humanizeCalendarId(id: string) {
  return id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function withAlpha(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "")
  if (sanitized.length !== 6) {
    return hex
  }
  const alphaValue = Math.round(alpha * 255)
  const alphaHex = alphaValue.toString(16).padStart(2, "0")
  return `#${sanitized}${alphaHex}`
}

function getReadableTextColor(hexColor: string) {
  const hex = hexColor.replace("#", "")
  if (hex.length !== 6) return "#ffffff"
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#1f2937" : "#f8fafc"
}

function getEventPalette(event: CalendarEvent) {
  const fallback = ACTIVITY_META[event.type]?.calendarColor
  const fallbackColor = fallback?.includes("text") ? undefined : fallback
  const color = event.color ?? fallbackColor ?? "#6366f1"
  const border = withAlpha(color, 0.55)
  const background = `linear-gradient(135deg, ${withAlpha(color, 0.82)}, ${withAlpha(color, 0.42)})`
  const text = getReadableTextColor(color)
  return { color, border, background, text }
}

function getCalendarMetadata(events: CalendarEvent[]): CalendarMetadata[] {
  const map = new Map<string, CalendarMetadata>()
  DEFAULT_CALENDARS.forEach((calendar) => map.set(calendar.id, calendar))

  events.forEach((event) => {
    if (event.calendarId && !map.has(event.calendarId)) {
      map.set(event.calendarId, {
        id: event.calendarId,
        label: humanizeCalendarId(event.calendarId),
        color: event.color ?? "#6366f1",
      })
    }
  })

  return Array.from(map.values())
}

function getMonthLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function getWeekLabel(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  const startLabel = format(start, "d MMM", { locale: es })
  const endLabel = format(end, "d MMM yyyy", { locale: es })
  return `${startLabel} — ${endLabel}`
}

function getDayLabel(date: Date) {
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
}

function eventMatchesSearch(event: CalendarEvent, term: string) {
  if (!term) return true
  const normalized = term.toLowerCase()
  const haystack = [
    event.title,
    event.description,
    event.location,
    event.owner,
    event.organizer,
    ...(event.attendees ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalized)
}

function filterEvents(
  events: CalendarEvent[],
  calendars: Set<string>,
  term: string,
): CalendarEvent[] {
  return events.filter((event) => {
    const calendarKey = event.calendarId ?? event.type
    const inCalendar = calendars.size === 0 || calendars.has(calendarKey)
    return inCalendar && eventMatchesSearch(event, term)
  })
}

function clampMinutes(value: number) {
  return Math.max(0, Math.min(value, 24 * 60))
}

function layoutDayEvents(dayStart: Date, events: CalendarEvent[]): PositionedEvent[] {
  const items = events
    .map((event) => {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      const startMinutes = clampMinutes(differenceInMinutes(startDate, dayStart))
      const endMinutes = Math.max(
        startMinutes + 30,
        clampMinutes(differenceInMinutes(endDate, dayStart)),
      )
      return {
        event,
        startMinutes,
        endMinutes,
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)

  const clusters: {
    events: typeof items
  }[] = []

  items.forEach((item) => {
    let cluster = clusters.find((existing) =>
      existing.events.some(
        (other) =>
          !(item.endMinutes <= other.startMinutes || item.startMinutes >= other.endMinutes),
      ),
    )
    if (!cluster) {
      cluster = { events: [] }
      clusters.push(cluster)
    }
    cluster.events.push(item)
  })

  const placements: PositionedEvent[] = []

  clusters.forEach((cluster) => {
    const columns: { end: number }[] = []

    cluster.events.forEach((item) => {
      let columnIndex = columns.findIndex((column) => item.startMinutes >= column.end)
      if (columnIndex === -1) {
        columns.push({ end: item.endMinutes })
        columnIndex = columns.length - 1
      } else {
        columns[columnIndex].end = item.endMinutes
      }
      placements.push({
        event: item.event,
        position: {
          top: (item.startMinutes / (24 * 60)) * 100,
          height: ((item.endMinutes - item.startMinutes) / (24 * 60)) * 100,
          column: columnIndex,
          columns: 0, // filled later
        },
      })
    })

    const totalColumns = Math.max(columns.length, 1)
    placements
      .filter((placement) => cluster.events.some((item) => item.event.id === placement.event.id))
      .forEach((placement) => {
        placement.position.columns = totalColumns
      })
  })

  return placements
}

interface TimeGridProps {
  mode: Exclude<CalendarViewMode, "month">
  referenceDate: Date
  events: CalendarEvent[]
  onSelectSlot: (start: Date, end: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onEventDrop: (event: CalendarEvent, start: Date, end: Date) => void
  onEventResize: (event: CalendarEvent, start: Date, end: Date) => void
}

function TimeGrid({
  mode,
  referenceDate,
  events,
  onSelectSlot,
  onEventClick,
  onEventDrop,
  onEventResize,
}: TimeGridProps) {
  const dayCount = mode === "week" ? 7 : 1
  const start = mode === "week" ? startOfWeek(referenceDate, { weekStartsOn: 1 }) : startOfDay(referenceDate)
  const days = useMemo(() => Array.from({ length: dayCount }, (_, index) => addDays(start, index)), [dayCount, start])
  const dayRefs = useRef<(HTMLDivElement | null)[]>([])
  const draftRef = useRef<
    | {
        type: "create"
        dayIndex: number
        anchorMinutes: number
        currentMinutes: number
      }
    | {
        type: "resize"
        event: CalendarEvent
        dayIndex: number
        anchorMinutes: number
      }
    | null
  >(null)
  const dragEventRef = useRef<
    | {
        event: CalendarEvent
        duration: number
        offsetMinutes: number
      }
    | null
  >(null)
  const [preview, setPreview] = useState<{
    eventId?: string
    start: Date
    end: Date
    type: "create" | "move" | "resize"
  } | null>(null)

  const groupedEvents = useMemo(() => {
    return days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const byDay = events.filter((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        return isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
          (eventStart <= dayStart && eventEnd >= dayEnd)
      })

      const allDay = byDay.filter(
        (event) => event.allDay || differenceInMinutes(new Date(event.end), new Date(event.start)) >= 24 * 60,
      )
      const timed = byDay.filter((event) => !allDay.includes(event))

      const layout = layoutDayEvents(dayStart, timed)

      return {
        day,
        allDay,
        timed,
        layout,
      }
    })
  }, [days, events])

  const getMinutesFromPointer = useCallback((event: PointerEvent | DragEvent, dayIndex: number) => {
    const column = dayRefs.current[dayIndex]
    if (!column) return null
    const rect = column.getBoundingClientRect()
    const clientY = "clientY" in event ? event.clientY : 0
    const offset = clientY - rect.top
    const ratio = Math.min(Math.max(offset, 0), rect.height) / rect.height
    const minutes = Math.round((ratio * 24 * 60) / 15) * 15
    return clampMinutes(minutes)
  }, [])

  const resolveDayIndexFromEvent = useCallback(
    (event: PointerEvent | DragEvent) => {
      const clientX = "clientX" in event ? event.clientX : 0
      const index = dayRefs.current.findIndex((column) => {
        if (!column) return false
        const rect = column.getBoundingClientRect()
        return clientX >= rect.left && clientX <= rect.right
      })
      return index >= 0 ? index : 0
    },
    [],
  )

  const finalizeDraft = useCallback(() => {
    const draft = draftRef.current
    if (!draft || !preview) return

    if (draft.type === "create") {
      onSelectSlot(preview.start, preview.end)
    } else if (draft.type === "resize") {
      onEventResize(draft.event, preview.start, preview.end)
    }

    setPreview(null)
    draftRef.current = null
  }, [onEventResize, onSelectSlot, preview])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const draft = draftRef.current
      if (!draft) return
      const dayIndex = resolveDayIndexFromEvent(event)
      const minutes = getMinutesFromPointer(event, dayIndex)
      if (minutes === null) return
      const day = days[dayIndex]
      const dayStart = startOfDay(day)

      if (draft.type === "create") {
        const startMinutes = Math.min(draft.anchorMinutes, minutes)
        const endMinutes = Math.max(draft.anchorMinutes, minutes + 30)
        const startDate = new Date(dayStart.getTime() + startMinutes * 60 * 1000)
        const endDate = new Date(dayStart.getTime() + endMinutes * 60 * 1000)
        setPreview({ type: "create", start: startDate, end: endDate })
      } else if (draft.type === "resize") {
        const eventStart = new Date(draft.event.start)
        const eventDayStart = startOfDay(eventStart)
        const delta = Math.max(minutes, draft.anchorMinutes + 30)
        const endDate = new Date(eventDayStart.getTime() + delta * 60 * 1000)
        setPreview({
          type: "resize",
          eventId: draft.event.id,
          start: new Date(draft.event.start),
          end: endDate,
        })
      }
    }

    function handlePointerUp() {
      finalizeDraft()
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [days, finalizeDraft, getMinutesFromPointer, resolveDayIndexFromEvent])

  const handleColumnPointerDown = (dayIndex: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-event]") || (event.target as HTMLElement).closest("[data-resize-handle]")) {
      return
    }
    event.preventDefault()
    const minutes = getMinutesFromPointer(event.nativeEvent, dayIndex)
    if (minutes === null) return
    draftRef.current = { type: "create", dayIndex, anchorMinutes: minutes, currentMinutes: minutes }
    const day = days[dayIndex]
    const dayStart = startOfDay(day)
    const startDate = new Date(dayStart.getTime() + minutes * 60 * 1000)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    setPreview({ type: "create", start: startDate, end: endDate })
  }

  const handleResizePointerDown = (event: CalendarEvent, dayIndex: number) =>
    (pointerEvent: React.PointerEvent<HTMLDivElement>) => {
      pointerEvent.stopPropagation()
      const minutes = getMinutesFromPointer(pointerEvent.nativeEvent, dayIndex)
      if (minutes === null) return
      draftRef.current = {
        type: "resize",
        event,
        dayIndex,
        anchorMinutes: minutes,
      }
      setPreview({ type: "resize", eventId: event.id, start: new Date(event.start), end: new Date(event.end) })
    }

  const handleDragStart = (calendarEvent: CalendarEvent) => (dragEvent: React.DragEvent<HTMLDivElement>) => {
    const rect = dragEvent.currentTarget.getBoundingClientRect()
    const offsetY = dragEvent.clientY - rect.top
    const duration = Math.max(
      30,
      differenceInMinutes(new Date(calendarEvent.end), new Date(calendarEvent.start)),
    )
    const offsetMinutes = (offsetY / rect.height) * duration
    dragEvent.dataTransfer.setData("text/plain", calendarEvent.id)
    dragEvent.dataTransfer.effectAllowed = "move"
    dragEventRef.current = {
      event: calendarEvent,
      duration,
      offsetMinutes,
    }
    setPreview({
      type: "move",
      eventId: calendarEvent.id,
      start: new Date(calendarEvent.start),
      end: new Date(calendarEvent.end),
    })
  }

  const handleDragEnd = () => {
    if (preview?.type === "move" && dragEventRef.current) {
      onEventDrop(dragEventRef.current.event, preview.start, preview.end)
    }
    setPreview(null)
    dragEventRef.current = null
  }

  const handleDragOver = (dayIndex: number) => (dragEvent: React.DragEvent<HTMLDivElement>) => {
    const dragState = dragEventRef.current
    if (!dragState) return
    dragEvent.preventDefault()
    const minutes = getMinutesFromPointer(dragEvent, dayIndex)
    if (minutes === null) return
    const day = days[dayIndex]
    const dayStart = startOfDay(day)
    const startMinutes = clampMinutes(minutes - dragState.offsetMinutes)
    const startDate = new Date(dayStart.getTime() + startMinutes * 60 * 1000)
    const endDate = new Date(startDate.getTime() + dragState.duration * 60 * 1000)
    setPreview({ type: "move", eventId: dragState.event.id, start: startDate, end: endDate })
  }

  const handleDrop = (dragEvent: React.DragEvent<HTMLDivElement>) => {
    dragEvent.preventDefault()
    const dragState = dragEventRef.current
    if (dragState && preview?.type === "move") {
      onEventDrop(dragState.event, preview.start, preview.end)
    }
    setPreview(null)
    dragEventRef.current = null
  }

  return (
    <div className="relative rounded-2xl border border-border/50 bg-background/70 p-4 shadow-inner shadow-black/10 backdrop-blur">
      <div className="mb-3 grid grid-cols-[80px_1fr] gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Todo el día</div>
        <div className="flex flex-col gap-2">
          {groupedEvents.map((group, index) => (
            <div key={group.day.toISOString()} className="flex min-h-10 flex-wrap gap-2">
              {group.allDay.length ? (
                group.allDay.map((event) => {
                  const palette = getEventPalette(event)
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="group relative rounded-xl border px-3 py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        background: palette.background,
                        borderColor: palette.border,
                        color: palette.text,
                      }}
                    >
                      {event.title}
                    </button>
                  )
                })
              ) : index === 0 ? (
                <div className="rounded-lg border border-dashed border-border/40 px-3 py-2 text-xs text-muted-foreground">
                  Sin eventos de día completo
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <div className="relative flex flex-col gap-6 text-right text-xs text-muted-foreground">
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} className="relative h-[60px]">
              <span className="absolute -top-2 right-0 font-medium">{String(hour).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border/40">
          <div className={cn("grid h-[1440px]", mode === "week" ? "grid-cols-7" : "grid-cols-1")}> 
            {groupedEvents.map((group, dayIndex) => (
              <div
                key={group.day.toISOString()}
                ref={(element) => {
                  dayRefs.current[dayIndex] = element
                }}
                className="relative border-l border-border/30 bg-gradient-to-b from-background/60 to-background/80"
                onPointerDown={handleColumnPointerDown(dayIndex)}
                onDragOver={handleDragOver(dayIndex)}
                onDrop={handleDrop}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/30 bg-background/80 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <span>{format(group.day, "EEE d", { locale: es })}</span>
                </div>
                <div className="absolute inset-0">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={hour} className="h-[60px] border-b border-border/20" />
                  ))}
                </div>
                {group.layout.map(({ event, position }) => {
                  const palette = getEventPalette(event)
                  const isPreview = preview?.eventId === event.id && preview.type !== "create"
                  const startDate = isPreview && preview ? preview.start : new Date(event.start)
                  const endDate = isPreview && preview ? preview.end : new Date(event.end)
                  const dayStart = startOfDay(group.day)
                  const startPercent = (differenceInMinutes(startDate, dayStart) / (24 * 60)) * 100
                  const endPercent = (differenceInMinutes(endDate, dayStart) / (24 * 60)) * 100
                  const top = isPreview ? startPercent : position.top
                  const height = isPreview ? Math.max(endPercent - startPercent, 4) : position.height
                  const width = 100 / position.columns
                  const left = position.column * width

                  return (
                    <div
                      key={event.id}
                      data-event
                      draggable
                      onDragStart={handleDragStart(event)}
                      onDragEnd={handleDragEnd}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        onEventClick(event)
                      }}
                      className="group absolute flex flex-col overflow-hidden rounded-xl border text-xs shadow-lg transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:shadow-xl"
                      style={{
                        top: `${top}%`,
                        height: `${Math.max(height, 4)}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        background: palette.background,
                        borderColor: palette.border,
                        color: palette.text,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 p-2">
                        <div className="space-y-1">
                          <p className="font-semibold leading-tight text-sm">{event.title}</p>
                          <p className="text-[11px] opacity-80">
                            {format(startDate, "HH:mm", { locale: es })} — {format(endDate, "HH:mm", { locale: es })}
                          </p>
                        </div>
                        <Badge className="bg-background/20 text-[10px] font-semibold uppercase tracking-wide">
                          {event.calendarId ? humanizeCalendarId(event.calendarId) : event.type}
                        </Badge>
                      </div>
                      {event.location ? (
                        <div className="flex items-center gap-1 px-2 pb-2 text-[11px] opacity-80">
                          <MapPin className="size-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      ) : null}
                      <div
                        data-resize-handle
                        onPointerDown={handleResizePointerDown(event, dayIndex)}
                        className="mt-auto flex cursor-ns-resize items-center justify-center bg-black/10 py-0.5 text-[10px] tracking-wide uppercase"
                      >
                        Ajustar
                      </div>
                    </div>
                  )
                })}

                {preview && preview.type === "create" && isSameDay(group.day, preview.start) ? (
                  <div
                    className="absolute z-10 rounded-xl border border-dashed border-chart-1/70 bg-chart-1/10"
                    style={{
                      top: `${
                        (differenceInMinutes(preview.start, startOfDay(group.day)) / (24 * 60)) * 100
                      }%`,
                      height: `${
                        (differenceInMinutes(preview.end, startOfDay(group.day)) / (24 * 60)) * 100 -
                        (differenceInMinutes(preview.start, startOfDay(group.day)) / (24 * 60)) * 100
                      }%`,
                      left: "4%",
                      right: "4%",
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MonthGridProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSelectDay: (day: Date) => void
}

function MonthGrid({ date, events, onEventClick, onSelectDay }: MonthGridProps) {
  const firstDay = startOfWeek(startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)), {
    weekStartsOn: 1,
  })
  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(firstDay, weekIndex * 7 + dayIndex)),
  )

  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-4 shadow-inner shadow-black/10 backdrop-blur">
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {DAY_NAMES.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weeks.flat().map((day) => {
          const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day))
          const isCurrentMonth = day.getMonth() === date.getMonth()
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "group relative min-h-28 rounded-xl border border-border/30 bg-background/60 p-2 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                !isCurrentMonth && "opacity-40",
                isToday &&
                  "border-chart-1/70 bg-gradient-to-br from-chart-1/10 to-chart-2/10 shadow-chart-1/20",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  isToday ? "bg-chart-1 text-white" : "bg-background/80",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((event, index) => {
                  const palette = getEventPalette(event)
                  const rotation = ((index + event.id.charCodeAt(0)) % 4) - 2
                  return (
                    <div
                      key={event.id}
                      onClick={(eventClick) => {
                        eventClick.stopPropagation()
                        onEventClick(event)
                      }}
                      className="group/card relative cursor-pointer rounded-lg border px-2 py-1 text-[11px] shadow-md transition-all duration-200 hover:z-10 hover:-translate-y-1 hover:shadow-xl"
                      style={{
                        background: palette.background,
                        borderColor: palette.border,
                        color: palette.text,
                        transform: `rotate(${rotation}deg)` as string,
                      }}
                    >
                      <div className="truncate font-semibold">{event.title}</div>
                      {!event.allDay && event.time ? (
                        <div className="text-[10px] opacity-80">{event.time}</div>
                      ) : (
                        <div className="text-[10px] opacity-80">Todo el día</div>
                      )}
                    </div>
                  )
                })}
                {dayEvents.length > 3 ? (
                  <div className="rounded-lg border border-dashed border-border/40 bg-background/60 px-2 py-1 text-center text-[11px] text-muted-foreground">
                    +{dayEvents.length - 3} más
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarView({ initialEvents }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => sortEvents(initialEvents.map(normalizeEvent)))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [view, setView] = useState<CalendarViewMode>("week")
  const [search, setSearch] = useState("")
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formEvent, setFormEvent] = useState<CalendarEvent | null>(null)
  const [pendingCalendars, setPendingCalendars] = useState<Set<string>>(() => {
    const ids = new Set(initialEvents.map((event) => event.calendarId ?? event.type))
    return ids.size ? ids : new Set(DEFAULT_CALENDARS.map((calendar) => calendar.id))
  })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setEvents(sortEvents(initialEvents.map(normalizeEvent)))
  }, [initialEvents])

  useEffect(() => {
    const eventSource = new EventSource("/api/activity/stream")
    eventSource.onmessage = (event) => {
      const parsed = parseWorkspaceServerEvent(event.data)
      if (!parsed || parsed.kind !== "calendar") return

      if (parsed.payload.action === "created" || parsed.payload.action === "updated") {
        const incoming = normalizeEvent(parsed.payload.event)
        setEvents((previous) => {
          const next = previous.filter((item) => item.id !== incoming.id)
          next.push(incoming)
          return sortEvents(next)
        })
        if (incoming.calendarId) {
          const calendarId = incoming.calendarId
          setPendingCalendars((prev) => {
            if (prev.has(calendarId)) {
              return prev
            }
            const next = new Set(prev)
            next.add(calendarId)
            return next
          })
        }
      }

      if (parsed.payload.action === "deleted") {
        setEvents((previous) => previous.filter((event) => event.id !== parsed.payload.eventId))
      }
    }
    eventSource.onerror = () => eventSource.close()
    return () => eventSource.close()
  }, [])

  const calendars = useMemo(() => getCalendarMetadata(events), [events])

  useEffect(() => {
    setPendingCalendars((previous) => {
      if (previous.size) return previous
      return new Set(calendars.map((calendar) => calendar.id))
    })
  }, [calendars])

  const selectedCalendars = useMemo(() => pendingCalendars, [pendingCalendars])

  const filteredEvents = useMemo(
    () => filterEvents(events, selectedCalendars, search),
    [events, selectedCalendars, search],
  )

  const eventDates = useMemo(
    () => Array.from(new Set(filteredEvents.map((event) => new Date(event.start).toDateString()))).map(
      (value) => new Date(value),
    ),
    [filteredEvents],
  )

  const label = useMemo(() => {
    if (view === "day") return getDayLabel(selectedDate)
    if (view === "week") return getWeekLabel(selectedDate)
    return getMonthLabel(selectedDate)
  }, [selectedDate, view])

  const handleNavigate = (direction: "previous" | "next") => {
    setSelectedDate((current) => {
      if (view === "day") {
        return addDays(current, direction === "previous" ? -1 : 1)
      }
      if (view === "week") {
        return addDays(current, direction === "previous" ? -7 : 7)
      }
      return new Date(current.getFullYear(), current.getMonth() + (direction === "previous" ? -1 : 1), 1)
    })
  }

  const handleOpenCreate = useCallback(
    (start?: Date, end?: Date) => {
      setFormMode("create")
      const base = start ? new Date(start) : new Date(selectedDate)
      const startValue = ensureDateTimeString(start ? new Date(start) : base)
      const endValue = ensureDateTimeString(
        end ? new Date(end) : new Date(base.getTime() + 60 * 60 * 1000),
      )
      setFormEvent({
        id: "",
        title: "",
        description: "",
        type: "meeting",
        date: startValue.slice(0, 10),
        time: startValue.slice(11, 16),
        owner: "",
        start: startValue,
        end: endValue,
        attendees: [],
      })
      setIsFormOpen(true)
    },
    [selectedDate],
  )

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setActiveEvent(event)
    setIsModalOpen(true)
  }, [])

  const handleCreate = useCallback(
    async (payload: CalendarEventInput & { id?: string }) => {
      startTransition(async () => {
        const response = await createCalendarEventAction(payload)
        if (response.success && response.event) {
          setEvents((previous) =>
            sortEvents([
              ...previous.filter((item) => item.id !== response.event.id),
              normalizeEvent(response.event),
            ]),
          )
          setIsFormOpen(false)
        }
      })
    },
    [],
  )

  const handleUpdate = useCallback(
    async (payload: CalendarEventInput & { id?: string }) => {
      if (!payload.id) return
      startTransition(async () => {
        const response = await updateCalendarEventAction(payload as CalendarEventInput & { id: string })
        if (response.success && response.event) {
          setEvents((previous) =>
            sortEvents([
              ...previous.filter((item) => item.id !== response.event.id),
              normalizeEvent(response.event),
            ]),
          )
          setIsFormOpen(false)
        }
      })
    },
    [],
  )

  const handleDelete = useCallback(
    async (event: CalendarEvent) => {
      startTransition(async () => {
        await deleteCalendarEventAction(event.id)
        setEvents((previous) => previous.filter((item) => item.id !== event.id))
        setIsModalOpen(false)
      })
    },
    [],
  )

  const handleEventDrop = useCallback(
    (event: CalendarEvent, start: Date, end: Date) => {
      const payload: CalendarEventInput & { id: string } = {
        id: event.id,
        title: event.title,
        description: event.description,
        start: ensureDateTimeString(start),
        end: ensureDateTimeString(end),
        type: event.type,
        owner: event.owner,
        organizer: event.organizer,
        location: event.location,
        calendarId: event.calendarId ?? "mi-calendario",
        color: event.color,
        attendees: event.attendees ?? [],
        allDay: event.allDay,
      }
      handleUpdate(payload)
    },
    [handleUpdate],
  )

  const handleSlotCreate = useCallback(
    (start: Date, end: Date) => {
      handleOpenCreate(start, end)
    },
    [handleOpenCreate],
  )

  const handleToggleCalendar = (calendarId: string) => (checked: boolean) => {
    setPendingCalendars((previous) => {
      const next = new Set(previous)
      if (checked) {
        next.add(calendarId)
      } else {
        next.delete(calendarId)
      }
      return next
    })
  }

  const sidebar = (
    <aside className="flex flex-col gap-4">
      <MiniCalendar
        selectedDate={selectedDate}
        onSelect={(date) => setSelectedDate(date)}
        eventDates={eventDates}
      />
      <Card className="border border-border/40 bg-background/70 p-4 shadow-lg shadow-black/10 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4 text-chart-1" /> Mis calendarios
          </div>
          <Badge className="bg-chart-1/10 text-chart-1">{selectedCalendars.size}</Badge>
        </div>
        <ScrollArea className="max-h-72 space-y-2">
          {calendars.map((calendar) => (
            <label
              key={calendar.id}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-background/60 px-3 py-2 text-sm transition-all duration-200 hover:border-chart-1/40"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCalendars.has(calendar.id)}
                  onCheckedChange={(checked) => handleToggleCalendar(calendar.id)(Boolean(checked))}
                />
                <span>{calendar.label}</span>
              </div>
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: calendar.color }}
              />
            </label>
          ))}
        </ScrollArea>
      </Card>
      <Card className="border border-border/40 bg-background/70 p-4 shadow-lg shadow-black/10 backdrop-blur">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen rápido
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-chart-2" /> {filteredEvents.length} eventos visibles
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-chart-3" />
            {Array.from(
              new Set(
                filteredEvents.flatMap((event) => event.attendees ?? []),
              ),
            ).length}{" "}
            asistentes
          </div>
        </div>
      </Card>
    </aside>
  )

  return (
    <Card className="border border-border/40 bg-card/60 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {sidebar}
        <div className="space-y-6">
          <CalendarToolbar
            label={label}
            onNavigate={handleNavigate}
            onToday={() => setSelectedDate(new Date())}
            view={view}
            onViewChange={setView}
            search={search}
            onSearchChange={setSearch}
            onCreate={() => handleOpenCreate()}
          />
          {view === "month" ? (
            <MonthGrid
              date={selectedDate}
              events={filteredEvents}
              onEventClick={handleEventClick}
              onSelectDay={(day) => {
                setSelectedDate(day)
                setView("day")
              }}
            />
          ) : (
            <TimeGrid
              mode={view}
              referenceDate={selectedDate}
              events={filteredEvents}
              onSelectSlot={handleSlotCreate}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventDrop}
            />
          )}
        </div>
      </div>

      <EventModal
        event={activeEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEdit={(event) => {
          setIsModalOpen(false)
          setFormMode("edit")
          setFormEvent(event)
          setIsFormOpen(true)
        }}
        onDelete={handleDelete}
      />

      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        defaultEvent={formEvent ?? undefined}
        calendars={calendars}
        onSubmit={(values) => (formMode === "create" ? handleCreate(values) : handleUpdate(values))}
        submitting={isPending}
      />
    </Card>
  )
}
