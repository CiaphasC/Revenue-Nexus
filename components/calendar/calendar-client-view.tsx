"use client"

import type { MutableRefObject } from "react"
import { forwardRef, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react"
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { Virtuoso } from "react-virtuoso"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  Moon,
  Search,
  Sun,
  Users,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/app/calendario/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"
import { MiniCalendar } from "@/components/calendar/mini-calendar"
import { EventModal } from "@/components/calendar/event-modal"
import { EventForm } from "@/components/calendar/event-form"
import type { CalendarEventInput } from "@/lib/validators/calendar"

const MINUTES_PER_SLOT = 30
const SLOT_COUNT = (24 * 60) / MINUTES_PER_SLOT
const SLOT_HEIGHT = 56
const MIN_EVENT_MINUTES = 30

export type CalendarViewMode = "dia" | "semana" | "mes"

interface CalendarClientViewProps {
  initialEvents: CalendarEvent[]
}

interface CalendarMetadata {
  id: string
  label: string
  color: string
}

interface PositionedEventMeta {
  startMinute: number
  endMinute: number
  top: number
  height: number
  column: number
  columns: number
}

interface FilterState {
  term: string
  owner: string
  participant: string
  startDate: string | null
  endDate: string | null
  calendars: string[]
}

const ALL_OPTION_VALUE = "__all__"

interface OptimisticAction {
  type: "create" | "update" | "delete"
  payload: CalendarEvent
}

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  const start = parseISO(event.start)
  const end = parseISO(event.end)
  const safeStart = Number.isNaN(start.getTime()) ? startOfToday() : start
  const safeEnd = Number.isNaN(end.getTime()) ? addHoursSafe(safeStart, 1) : end

  return {
    ...event,
    start: safeStart.toISOString(),
    end: safeEnd.toISOString(),
    date: format(safeStart, "yyyy-MM-dd"),
    time: event.allDay ? undefined : format(safeStart, "HH:mm"),
    attendees: event.attendees ?? [],
  }
}

function addHoursSafe(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function uniqueOwners(events: CalendarEvent[]) {
  return Array.from(new Set(events.map((event) => event.owner).filter(Boolean))).sort()
}

function uniqueParticipants(events: CalendarEvent[]) {
  const participants = new Set<string>()
  for (const event of events) {
    for (const attendee of event.attendees ?? []) {
      participants.add(attendee)
    }
  }
  return Array.from(participants).sort()
}

function deriveCalendars(events: CalendarEvent[]): CalendarMetadata[] {
  const grouped = new Map<string, CalendarMetadata>()

  for (const event of events) {
    if (!event.calendarId) continue
    if (!grouped.has(event.calendarId)) {
      grouped.set(event.calendarId, {
        id: event.calendarId,
        label: humanize(event.calendarId),
        color: event.color ?? "#6366f1",
      })
    }
  }

  if (!grouped.size) {
    grouped.set("mi-calendario", {
      id: "mi-calendario",
      label: "Mi calendario",
      color: "#6366f1",
    })
  }

  return Array.from(grouped.values())
}

function humanize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function eventOccursInRange(event: CalendarEvent, start: Date, end: Date) {
  const eventStart = parseISO(event.start)
  const eventEnd = parseISO(event.end)

  return (
    isWithinInterval(eventStart, { start, end }) ||
    isWithinInterval(eventEnd, { start, end }) ||
    (eventStart <= start && eventEnd >= end)
  )
}

function expandRecurringEvent(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  if (!event.recurrence || event.recurrence.frequency === "none") {
    return [event]
  }

  const { frequency, interval = 1, count, until } = event.recurrence
  const firstStart = parseISO(event.start)
  const firstEnd = parseISO(event.end)
  const generated: CalendarEvent[] = []
  let occurrenceIndex = 0

  const limitDate = until ? parseISO(until) : rangeEnd
  let occurrenceStart = firstStart
  let occurrenceEnd = firstEnd

  while (
    occurrenceStart <= limitDate &&
    occurrenceStart <= rangeEnd &&
    (!count || occurrenceIndex < count)
  ) {
    if (occurrenceEnd >= rangeStart && occurrenceStart <= rangeEnd) {
      generated.push({
        ...event,
        start: occurrenceStart.toISOString(),
        end: occurrenceEnd.toISOString(),
        date: format(occurrenceStart, "yyyy-MM-dd"),
        time: event.allDay ? undefined : format(occurrenceStart, "HH:mm"),
      })
    }

    occurrenceIndex += 1

    switch (frequency) {
      case "daily":
        occurrenceStart = addDays(occurrenceStart, interval)
        occurrenceEnd = addDays(occurrenceEnd, interval)
        break
      case "weekly":
        occurrenceStart = addWeeks(occurrenceStart, interval)
        occurrenceEnd = addWeeks(occurrenceEnd, interval)
        break
      case "monthly":
        occurrenceStart = addMonths(occurrenceStart, interval)
        occurrenceEnd = addMonths(occurrenceEnd, interval)
        break
      default:
        return generated
    }
  }

  return generated
}

function filterEvents(
  events: CalendarEvent[],
  filters: FilterState,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const loweredTerm = filters.term.trim().toLowerCase()
  return events.filter((event) => {
    if (filters.calendars.length && event.calendarId && !filters.calendars.includes(event.calendarId)) {
      return false
    }

    if (filters.owner && event.owner !== filters.owner) {
      return false
    }

    if (
      filters.participant &&
      !(event.attendees ?? []).some((attendee) => attendee === filters.participant)
    ) {
      return false
    }

    if (filters.startDate && filters.endDate) {
      const startFilter = startOfDay(parseISO(filters.startDate))
      const endFilter = endOfDay(parseISO(filters.endDate))
      if (!eventOccursInRange(event, startFilter, endFilter)) {
        return false
      }
    }

    if (loweredTerm.length) {
      const haystack = [
        event.title,
        event.description,
        event.location,
        event.owner,
        ...(event.attendees ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!haystack.includes(loweredTerm)) {
        return false
      }
    }

    return eventOccursInRange(event, rangeStart, rangeEnd)
  })
}

function computeDayLayout(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
  const lanes: CalendarEvent[][] = []
  const meta = new Map<string, PositionedEventMeta>()

  for (const event of sorted) {
    const eventStart = parseISO(event.start)
    const eventEnd = parseISO(event.end)
    const startMinute = differenceInMinutes(eventStart, startOfDay(eventStart))
    const endMinute = Math.max(
      startMinute + MIN_EVENT_MINUTES,
      differenceInMinutes(eventEnd, startOfDay(eventStart)),
    )

    let assignedLane = lanes.findIndex((lane) => {
      const last = lane.at(-1)
      if (!last) return true
      return parseISO(last.end) <= eventStart
    })

    if (assignedLane === -1) {
      lanes.push([event])
      assignedLane = lanes.length - 1
    } else {
      lanes[assignedLane].push(event)
    }

    const minuteHeight = SLOT_HEIGHT / MINUTES_PER_SLOT
    const top = startMinute * minuteHeight
    const height = Math.max((endMinute - startMinute) * minuteHeight, minuteHeight * MIN_EVENT_MINUTES)

    meta.set(event.id, {
      startMinute,
      endMinute,
      top,
      height,
      column: assignedLane,
      columns: lanes.length,
    })
  }

  return meta
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

function useCurrentMinutes() {
  const [minutes, setMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined
    }

    const interval = setInterval(() => {
      const now = new Date()
      setMinutes(now.getHours() * 60 + now.getMinutes())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return minutes
}

export function CalendarClientView({ initialEvents }: CalendarClientViewProps) {
  const normalizedEvents = useMemo(() => initialEvents.map(normalizeEvent), [initialEvents])
  const [events, setEvents] = useState<CalendarEvent[]>(normalizedEvents)
  const [optimisticEvents, setOptimisticEvents] = useOptimistic(events, (
    state,
    action: OptimisticAction,
  ) => {
    switch (action.type) {
      case "create":
        return [...state, action.payload]
      case "update":
        return state.map((event) => (event.id === action.payload.id ? action.payload : event))
      case "delete":
        return state.filter((event) => event.id !== action.payload.id)
      default:
        return state
    }
  })
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<CalendarViewMode>("mes")
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null)
  const [filters, setFilters] = useState<FilterState>(() => ({
    term: "",
    owner: "",
    participant: "",
    startDate: null,
    endDate: null,
    calendars: [],
  }))
  const debouncedTerm = useDebouncedValue(filters.term)
  const { theme, setTheme } = useTheme()
  const currentMinutes = useCurrentMinutes()

  useEffect(() => {
    setEvents(normalizedEvents)
  }, [normalizedEvents])

  const calendars = useMemo(() => deriveCalendars(optimisticEvents), [optimisticEvents])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("calendar:selected-calendars")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[]
        setFilters((prev) => ({ ...prev, calendars: parsed }))
      } catch (error) {
        console.error(error)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      "calendar:selected-calendars",
      JSON.stringify(filters.calendars),
    )
  }, [filters.calendars])

  const owners = useMemo(() => uniqueOwners(optimisticEvents), [optimisticEvents])
  const participants = useMemo(
    () => uniqueParticipants(optimisticEvents),
    [optimisticEvents],
  )

  const rangeStart = useMemo(() => {
    if (viewMode === "mes") {
      return startOfWeek(startOfMonth(selectedDate), { locale: es })
    }
    if (viewMode === "semana") {
      return startOfWeek(selectedDate, { locale: es })
    }
    return startOfDay(selectedDate)
  }, [selectedDate, viewMode])

  const rangeEnd = useMemo(() => {
    if (viewMode === "mes") {
      return endOfWeek(endOfMonth(selectedDate), { locale: es })
    }
    if (viewMode === "semana") {
      return endOfWeek(selectedDate, { locale: es })
    }
    return endOfDay(selectedDate)
  }, [selectedDate, viewMode])

  const expandedEvents = useMemo(() => {
    const items: CalendarEvent[] = []
    for (const event of optimisticEvents) {
      const occurrences = expandRecurringEvent(event, rangeStart, rangeEnd)
      items.push(...occurrences)
    }
    return items
  }, [optimisticEvents, rangeStart, rangeEnd])

  const filteredEvents = useMemo(
    () =>
      filterEvents(
        expandedEvents,
        { ...filters, term: debouncedTerm },
        rangeStart,
        rangeEnd,
      ),
    [expandedEvents, filters, debouncedTerm, rangeStart, rangeEnd],
  )

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of filteredEvents) {
      const key = format(parseISO(event.start), "yyyy-MM-dd")
      const collection = map.get(key) ?? []
      collection.push(event)
      map.set(key, collection)
    }
    return map
  }, [filteredEvents])

  const layoutByDay = useMemo(() => {
    const map = new Map<string, Map<string, PositionedEventMeta>>()
    for (const [day, events] of eventsByDay) {
      map.set(day, computeDayLayout(events))
    }
    return map
  }, [eventsByDay])

  const visibleEventCount = filteredEvents.length

  const dayRange = useMemo(() => {
    if (viewMode === "semana") {
      return Array.from({ length: 7 }).map((_, index) => addDays(rangeStart, index))
    }
    return [selectedDate]
  }, [rangeStart, selectedDate, viewMode])

  const monthMatrix = useMemo(() => {
    if (viewMode !== "mes") return []
    const start = startOfWeek(startOfMonth(selectedDate), { locale: es })
    return Array.from({ length: 42 }).map((_, index) => addDays(start, index))
  }, [selectedDate, viewMode])

  const handleCreate = useCallback(() => {
    setFormMode("create")
    setEditingEvent(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setFormMode("edit")
    setFormOpen(true)
  }, [])

  const handleDuplicate = useCallback((event: CalendarEvent) => {
    const duplicated: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      title: `${event.title} (copia)`
        .replace(/\s+/g, " ")
        .trim(),
    }
    setEditingEvent(duplicated)
    setFormMode("create")
    setFormOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (values: CalendarEventInput & { id?: string }) => {
      if (formMode === "create") {
        startTransition(async () => {
          const result = await createCalendarEventAction(values)
          if (result.success) {
            setOptimisticEvents({ type: "create", payload: result.event })
            setEvents((prev) => [...prev, result.event])
          }
        })
      } else if (values.id) {
        startTransition(async () => {
          const result = await updateCalendarEventAction(values as CalendarEventInput & { id: string })
          if (result.success) {
            setOptimisticEvents({ type: "update", payload: result.event })
            setEvents((prev) => prev.map((event) => (event.id === result.event.id ? result.event : event)))
          }
        })
      }

      setFormOpen(false)
    },
    [formMode, setOptimisticEvents],
  )

  const handleDelete = useCallback(
    async (event: CalendarEvent) => {
      startTransition(async () => {
        const result = await deleteCalendarEventAction(event.id)
        if (result.success) {
          setOptimisticEvents({ type: "delete", payload: event })
          setEvents((prev) => prev.filter((item) => item.id !== event.id))
        }
      })
    },
    [setOptimisticEvents],
  )

  const onCalendarToggle = useCallback(
    (calendarId: string) => {
      setFilters((prev) => {
        const set = new Set(prev.calendars)
        if (set.has(calendarId)) {
          set.delete(calendarId)
        } else {
          set.add(calendarId)
        }
        return { ...prev, calendars: Array.from(set) }
      })
    },
    [],
  )

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (event.key.toLowerCase() === "n") {
        event.preventDefault()
        handleCreate()
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault()
        setSelectedDate(startOfToday())
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        navigate(-1)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        navigate(1)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleCreate, viewMode, selectedDate])

  const navigate = useCallback(
    (step: number) => {
      if (viewMode === "mes") {
        setSelectedDate((current) => addMonths(current, step))
      } else if (viewMode === "semana") {
        setSelectedDate((current) => addWeeks(current, step))
      } else {
        setSelectedDate((current) => addDays(current, step))
      }
    },
    [viewMode],
  )

  const mobileActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Abrir filtros" onClick={() => setDrawerOpen(true)}>
        <Filter className="size-4" />
      </Button>
      <Button variant="secondary" onClick={handleCreate} className="flex-1 min-w-[8rem]">
        Crear
      </Button>
    </div>
  )

  const themeToggle = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )

  return (
    <div className="@container/calendar grid gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-background/70 p-4 shadow-xl shadow-black/5 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Ir al periodo anterior"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Ir al periodo siguiente" onClick={() => navigate(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" onClick={() => setSelectedDate(startOfToday())}>
              Hoy
            </Button>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as CalendarViewMode)}
              className="ml-0 flex overflow-hidden rounded-xl border border-border/60"
            >
              <ToggleGroupItem value="dia" aria-label="Vista diaria" className="px-3 py-2 text-sm">
                Día
              </ToggleGroupItem>
              <ToggleGroupItem value="semana" aria-label="Vista semanal" className="px-3 py-2 text-sm">
                Semana
              </ToggleGroupItem>
              <ToggleGroupItem value="mes" aria-label="Vista mensual" className="px-3 py-2 text-sm">
                Mes
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
              <Input
                value={filters.term}
                onChange={(event) => setFilters((prev) => ({ ...prev, term: event.target.value }))}
                placeholder="Buscar eventos"
                className="h-10 w-64 rounded-xl pl-10"
                aria-label="Buscar eventos"
              />
            </div>
            {themeToggle}
            <Button className="hidden lg:flex" onClick={handleCreate}>
              Crear evento
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="rounded-full border-dashed">
            {visibleEventCount} eventos visibles
          </Badge>
          <Badge variant="secondary" className="rounded-full" aria-label="Calendarios activos">
            <CalendarDays className="mr-1 size-3" /> {filters.calendars.length || calendars.length} activos
          </Badge>
          <div className="flex items-center gap-1 text-xs">
            <KeyboardHint label="N" description="Nuevo" />
            <KeyboardHint label="T" description="Hoy" />
            <KeyboardHint label="←/→" description="Navegar" />
          </div>
        </div>
        <div className="lg:hidden">{mobileActions}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          <Card className="border-border/50 bg-background/70 p-4 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumen</p>
                <p className="font-serif text-xl font-semibold text-foreground">
                  {format(selectedDate, "MMMM yyyy", { locale: es })}
                </p>
              </div>
              <Badge variant="outline" className="gap-1 rounded-full text-xs">
                <Users className="size-3" /> {visibleEventCount}
              </Badge>
            </div>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              eventDates={filteredEvents.map((event) => parseISO(event.start))}
              className="mt-4"
            />
          </Card>
          <Card className="border-border/50 bg-background/70 p-4 shadow-lg shadow-black/5">
            <h2 className="text-sm font-semibold text-foreground">Filtros avanzados</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="filtro-owner">Responsable</Label>
                <Select
                  value={filters.owner || ALL_OPTION_VALUE}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, owner: value === ALL_OPTION_VALUE ? "" : value }))
                  }
                >
                  <SelectTrigger id="filtro-owner" className="mt-1 h-9 rounded-lg">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filtro-participante">Participante</Label>
                <Select
                  value={filters.participant || ALL_OPTION_VALUE}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, participant: value === ALL_OPTION_VALUE ? "" : value }))
                  }
                >
                  <SelectTrigger id="filtro-participante" className="mt-1 h-9 rounded-lg">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                    {participants.map((participant) => (
                      <SelectItem key={participant} value={participant}>
                        {participant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filtro-inicio">Desde</Label>
                <Input
                  id="filtro-inicio"
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, startDate: event.target.value || null }))
                  }
                  className="h-9 rounded-lg"
                />
                <Label htmlFor="filtro-fin">Hasta</Label>
                <Input
                  id="filtro-fin"
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, endDate: event.target.value || null }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
          </Card>
          <Card className="border-border/50 bg-background/70 p-4 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Calendarios</h2>
              <Badge variant="outline" className="rounded-full text-xs">
                {filters.calendars.length || calendars.length}
              </Badge>
            </div>
            <ScrollArea className="mt-3 h-44 pr-2">
              <div className="space-y-2">
                {calendars.map((calendar) => {
                  const active =
                    !filters.calendars.length || filters.calendars.includes(calendar.id)
                  return (
                    <button
                      key={calendar.id}
                      type="button"
                      onClick={() => onCalendarToggle(calendar.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                        active
                          ? "border-transparent bg-muted/40 text-foreground"
                          : "border-dashed border-border/60 text-muted-foreground hover:bg-muted/30",
                      )}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                          aria-hidden
                        />
                        {calendar.label}
                      </span>
                      <span className="text-xs font-medium">{active ? "Activo" : "Oculto"}</span>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        <section className="min-h-[480px] rounded-2xl border border-border/50 bg-background/80 p-4 shadow-xl shadow-black/5">
          {viewMode === "mes" ? (
            <MonthView
              days={monthMatrix}
              eventsByDay={eventsByDay}
              onSelectDay={(day) => setSelectedDate(day)}
              onSelectEvent={(event) => {
                setModalEvent(event)
              }}
              selectedDate={selectedDate}
            />
          ) : (
            <TimeGrid
              days={dayRange}
              eventsByDay={eventsByDay}
              layoutByDay={layoutByDay}
              onSelectEvent={(event) => setModalEvent(event)}
              currentMinutes={currentMinutes}
              viewMode={viewMode}
            />
          )}
        </section>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <span className="hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="max-w-sm">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              eventDates={filteredEvents.map((event) => parseISO(event.start))}
            />
            <div className="space-y-3">
              <Label htmlFor="movil-owner">Responsable</Label>
              <Select
                value={filters.owner || ALL_OPTION_VALUE}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, owner: value === ALL_OPTION_VALUE ? "" : value }))
                }
              >
                <SelectTrigger id="movil-owner" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="movil-participante">Participante</Label>
              <Select
                value={filters.participant || ALL_OPTION_VALUE}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, participant: value === ALL_OPTION_VALUE ? "" : value }))
                }
              >
                <SelectTrigger id="movil-participante" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant} value={participant}>
                      {participant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="movil-desde">Desde</Label>
                <Input
                  id="movil-desde"
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, startDate: event.target.value || null }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="movil-hasta">Hasta</Label>
                <Input
                  id="movil-hasta"
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, endDate: event.target.value || null }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Calendarios</h3>
              {calendars.map((calendar) => {
                const active =
                  !filters.calendars.length || filters.calendars.includes(calendar.id)
                return (
                  <button
                    key={calendar.id}
                    type="button"
                    onClick={() => onCalendarToggle(calendar.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm",
                      active
                        ? "border-transparent bg-muted/40 text-foreground"
                        : "border-dashed border-border/60 text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      {calendar.label}
                    </span>
                    <span className="text-xs">{active ? "Activo" : "Oculto"}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="border-t border-border/50 p-4">
            <Button className="w-full" onClick={handleCreate}>
              Crear evento
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <EventModal
        event={modalEvent}
        open={!!modalEvent}
        onOpenChange={(open) => !open && setModalEvent(null)}
        onEdit={(event) => {
          setModalEvent(null)
          handleEdit(event)
        }}
        onDelete={(event) => {
          setModalEvent(null)
          void handleDelete(event)
        }}
        onDuplicate={(event) => {
          setModalEvent(null)
          handleDuplicate(event)
        }}
      />

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        defaultEvent={editingEvent}
        calendars={calendars}
        onSubmit={handleSubmit}
        submitting={isPending}
        onDuplicate={handleDuplicate}
      />
    </div>
  )
}

function KeyboardHint({ label, description }: { label: string; description: string }) {
  return (
    <span className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
      <kbd className="font-mono text-[0.65rem] text-foreground">{label}</kbd>
      <span className="text-muted-foreground text-[0.65rem] uppercase tracking-wide">{description}</span>
    </span>
  )
}

interface TimeGridProps {
  days: Date[]
  eventsByDay: Map<string, CalendarEvent[]>
  layoutByDay: Map<string, Map<string, PositionedEventMeta>>
  onSelectEvent: (event: CalendarEvent) => void
  currentMinutes: number
  viewMode: CalendarViewMode
}

function TimeGrid({
  days,
  eventsByDay,
  layoutByDay,
  onSelectEvent,
  currentMinutes,
  viewMode,
}: TimeGridProps) {
  if (!days.length) {
    return null
  }
  const minuteHeight = SLOT_HEIGHT / MINUTES_PER_SLOT
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = scrollerRef.current
    if (!container) return
    const now = new Date()
    const todayIndex = days.findIndex((day) => isSameDay(day, now))
    if (todayIndex === -1) return
    const scrollTarget = Math.max(currentMinutes * minuteHeight - 200, 0)
    container.scrollTo({ top: scrollTarget, behavior: "smooth" })
  }, [days, currentMinutes, minuteHeight])

  return (
    <div className="relative h-[70vh] min-h-[520px]">
      <Virtuoso
        totalCount={SLOT_COUNT}
        itemContent={(index) => {
          const slotStart = index * MINUTES_PER_SLOT
          const slotEnd = slotStart + MINUTES_PER_SLOT
          const timeLabel = format(addMinutesToDay(days[0], slotStart), "HH:mm")

          return (
            <div className="grid grid-cols-[64px_1fr] border-b border-border/40" style={{ height: SLOT_HEIGHT }}>
              <div className="flex items-start justify-end pr-3 text-xs text-muted-foreground">
                <span aria-hidden>{timeLabel}</span>
              </div>
              <div className={cn("relative grid", viewMode === "semana" ? "grid-cols-7" : "grid-cols-1")}>
                {days.map((day, columnIndex) => {
                  const key = format(day, "yyyy-MM-dd")
                  const dayEvents = eventsByDay.get(key) ?? []
                  const layout = layoutByDay.get(key)
                  const isToday = isSameDay(day, new Date())
                  const currentLineVisible =
                    isToday && currentMinutes >= slotStart && currentMinutes < slotEnd

                  return (
                    <div
                      key={`${key}-${index}`}
                      className="relative border-l border-border/20 bg-gradient-to-b from-transparent via-transparent to-transparent hover:bg-muted/20 first:border-l-0"
                      role="presentation"
                    >
                      {dayEvents.map((event) => {
                        if (!layout?.has(event.id)) return null
                        const meta = layout.get(event.id)!
                        if (meta.startMinute < slotStart || meta.startMinute >= slotEnd) {
                          return null
                        }
                        const width = `${100 / meta.columns}%`
                        const left = `${(meta.column * 100) / meta.columns}%`
                        return (
                          <button
                            key={event.id}
                            type="button"
                            className="absolute z-10 flex flex-col gap-0.5 rounded-lg border border-border/40 bg-gradient-to-br from-primary/20 to-primary/10 px-2 py-1 text-left text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{
                              top: (meta.startMinute - slotStart) * minuteHeight,
                              height: meta.height,
                              left,
                              width,
                              background: event.color ? `${event.color}20` : undefined,
                              borderColor: event.color ? `${event.color}55` : undefined,
                            }}
                            onClick={() => onSelectEvent(event)}
                            aria-label={`${event.title} a las ${format(parseISO(event.start), "HH:mm")}`}
                          >
                            <span className="font-medium text-foreground">{event.title}</span>
                            {!event.allDay ? (
                              <span className="text-[0.65rem] text-muted-foreground">
                                {format(parseISO(event.start), "HH:mm")} · {event.owner}
                              </span>
                            ) : (
                              <span className="text-[0.65rem] text-muted-foreground">Todo el día</span>
                            )}
                          </button>
                        )
                      })}

                      {currentLineVisible ? (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                          style={{ top: (currentMinutes - slotStart) * minuteHeight }}
                        >
                          <span className="mr-1 size-2 rounded-full bg-destructive shadow" />
                          <div className="h-px flex-1 bg-destructive/70" />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }}
        components={{
          Scroller: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
            <div
              {...props}
              ref={(node) => {
                scrollerRef.current = node
                if (typeof ref === "function") {
                  ref(node)
                } else if (ref) {
                  ;(ref as MutableRefObject<HTMLDivElement | null>).current = node
                }
              }}
              className={cn("h-full overflow-y-auto", props.className)}
            />
          )),
        }}
      />
    </div>
  )
}

interface MonthViewProps {
  days: Date[]
  eventsByDay: Map<string, CalendarEvent[]>
  selectedDate: Date
  onSelectDay: (day: Date) => void
  onSelectEvent: (event: CalendarEvent) => void
}

function MonthView({ days, eventsByDay, selectedDate, onSelectDay, onSelectEvent }: MonthViewProps) {
  const grouped = useMemo(() => eventsByDay, [eventsByDay])

  return (
    <div className="grid h-full grid-cols-7 overflow-hidden rounded-xl border border-border/40">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd")
        const dayEvents = grouped.get(key) ?? []
        const isCurrentMonth = isSameMonth(day, selectedDate)
        const isToday = isSameDay(day, new Date())
        const visible = dayEvents.slice(0, 3)
        const remaining = dayEvents.length - visible.length

        return (
          <div
            key={key}
            className={cn(
              "flex flex-col border-b border-r border-border/30 bg-background/60 p-3 text-sm",
              !isCurrentMonth && "bg-muted/20 text-muted-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex size-8 items-center justify-center self-start rounded-full text-xs font-semibold",
                isToday
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-pressed={isSameDay(day, selectedDate)}
            >
              {format(day, "d")}
            </button>
            <div className="mt-2 space-y-1">
              {visible.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="flex w-full items-center gap-2 truncate rounded-lg border border-transparent bg-muted/40 px-2 py-1 text-left text-[0.7rem] hover:border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ borderColor: event.color ? `${event.color}66` : undefined }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: event.color ?? "#6366f1" }}
                    aria-hidden
                  />
                  <span className="truncate">{event.title}</span>
                </button>
              ))}
              {remaining > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      +{remaining} más
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-2">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-muted"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: event.color ?? "#6366f1" }}
                        />
                        <span className="truncate">{event.title}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function addMinutesToDay(date: Date, minutes: number) {
  const start = startOfDay(date)
  return new Date(start.getTime() + minutes * 60 * 1000)
}
