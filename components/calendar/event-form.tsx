"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { CalendarEvent } from "@/lib/types"
import {
  calendarEventFormSchema,
  type CalendarEventInput,
  type CalendarFormInput,
} from "@/lib/validators/calendar"

const activityOptions: { value: CalendarEventInput["type"]; label: string }[] = [
  { value: "meeting", label: "Reunión" },
  { value: "deal", label: "Negocio" },
  { value: "call", label: "Llamada" },
  { value: "email", label: "Correo" },
]

const recurrenceOptions = [
  { value: "none", label: "No repetir" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensualmente" },
] as const

interface CalendarMetadata {
  id: string
  label: string
  color: string
}

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  defaultEvent: CalendarEvent | null
  calendars: CalendarMetadata[]
  onSubmit: (values: CalendarEventInput & { id?: string }) => Promise<void>
  submitting?: boolean
  onDuplicate?: (event: CalendarEvent) => void
}

function toDateTimeInput(value: string | Date | undefined) {
  if (!value) {
    return ""
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toDateInput(value: string | Date | undefined) {
  if (!value) {
    return undefined
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function EventForm({
  open,
  onOpenChange,
  mode,
  defaultEvent,
  calendars,
  onSubmit,
  submitting,
  onDuplicate,
}: EventFormProps) {
  const form = useForm<CalendarFormInput>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: {
      id: defaultEvent?.id,
      title: defaultEvent?.title ?? "",
      description: defaultEvent?.description ?? "",
      start: toDateTimeInput(defaultEvent?.start ?? new Date()),
      end: toDateTimeInput(
        defaultEvent?.end ?? new Date(new Date().getTime() + 60 * 60 * 1000),
      ),
      type: defaultEvent?.type ?? "meeting",
      owner: defaultEvent?.owner ?? "",
      organizer: defaultEvent?.organizer ?? defaultEvent?.owner ?? "",
      location: defaultEvent?.location ?? "",
      calendarId: defaultEvent?.calendarId ?? calendars[0]?.id ?? "mi-calendario",
      color: defaultEvent?.color ?? calendars[0]?.color ?? "#6366f1",
      attendeesText: defaultEvent?.attendees?.join(", ") ?? "",
      allDay: defaultEvent?.allDay ?? false,
      recurrenceFrequency: defaultEvent?.recurrence?.frequency ?? "none",
      recurrenceInterval: defaultEvent?.recurrence?.interval ?? 1,
      recurrenceCount: defaultEvent?.recurrence?.count ?? undefined,
      recurrenceUntil: toDateInput(defaultEvent?.recurrence?.until),
    },
  })

  useEffect(() => {
    form.reset({
      id: defaultEvent?.id,
      title: defaultEvent?.title ?? "",
      description: defaultEvent?.description ?? "",
      start: toDateTimeInput(defaultEvent?.start ?? new Date()),
      end: toDateTimeInput(
        defaultEvent?.end ?? new Date(new Date().getTime() + 60 * 60 * 1000),
      ),
      type: defaultEvent?.type ?? "meeting",
      owner: defaultEvent?.owner ?? "",
      organizer: defaultEvent?.organizer ?? defaultEvent?.owner ?? "",
      location: defaultEvent?.location ?? "",
      calendarId: defaultEvent?.calendarId ?? calendars[0]?.id ?? "mi-calendario",
      color: defaultEvent?.color ?? calendars[0]?.color ?? "#6366f1",
      attendeesText: defaultEvent?.attendees?.join(", ") ?? "",
      allDay: defaultEvent?.allDay ?? false,
      recurrenceFrequency: defaultEvent?.recurrence?.frequency ?? "none",
      recurrenceInterval: defaultEvent?.recurrence?.interval ?? 1,
      recurrenceCount: defaultEvent?.recurrence?.count ?? undefined,
      recurrenceUntil: toDateInput(defaultEvent?.recurrence?.until),
    })
  }, [calendars, defaultEvent, form])

  const allDay = form.watch("allDay")
  const recurrenceFrequency = form.watch("recurrenceFrequency")

  useEffect(() => {
    if (allDay) {
      const currentStart = form.getValues("start")
      const startDate = currentStart ? new Date(currentStart) : new Date()
      const normalizedStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0,
        0,
      )
      const normalizedEnd = new Date(normalizedStart.getTime() + 24 * 60 * 60 * 1000)
      form.setValue("start", toDateTimeInput(normalizedStart))
      form.setValue("end", toDateTimeInput(normalizedEnd))
    }
  }, [allDay, form])

  const calendarId = form.watch("calendarId")

  useEffect(() => {
    if (!defaultEvent?.color) {
      const matched = calendars.find((calendar) => calendar.id === calendarId)
      if (matched) {
        form.setValue("color", matched.color)
      }
    }
  }, [calendarId, calendars, defaultEvent?.color, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    const attendees = values.attendeesText
      ? values.attendeesText.split(",").map((person) => person.trim()).filter(Boolean)
      : []

    const recurrence = values.recurrenceFrequency === "none"
      ? undefined
      : {
          frequency: values.recurrenceFrequency,
          interval: values.recurrenceInterval ?? 1,
          count: values.recurrenceCount ?? undefined,
          until: values.recurrenceUntil ?? undefined,
        }

    const payload: CalendarEventInput & { id?: string } = {
      id: values.id,
      title: values.title,
      description: values.description,
      start: values.start,
      end: values.end,
      type: values.type,
      owner: values.owner,
      organizer: values.organizer,
      location: values.location,
      calendarId: values.calendarId,
      color: values.color,
      attendees,
      allDay: values.allDay,
      recurrence,
    }

    await onSubmit(payload)
  })

  const modeLabel = mode === "create" ? "Crear evento" : "Editar evento"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-6 border border-border/40 bg-background/90 p-6 shadow-2xl shadow-black/10 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">{modeLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Reunión estratégica" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizador</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contacto" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="calendarId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendario</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calendars.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            {calendar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} type="color" className="h-10 w-16 rounded-lg" aria-label="Color del evento" />
                        <span className="text-xs text-muted-foreground">Personaliza el color del evento.</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sala o enlace" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attendeesText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participantes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Separar por comas" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Notas adicionales" className="min-h-24 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-4 rounded-xl border border-border/40 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Todo el día</p>
                  <p className="text-xs text-muted-foreground">Bloquea la jornada completa.</p>
                </div>
                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Evento de todo el día" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="recurrenceFrequency"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Repetición</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recurrenceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {recurrenceFrequency !== "none" ? (
                  <>
                    <FormField
                      control={form.control}
                      name="recurrenceInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intervalo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(event.target.value ? Number(event.target.value) : undefined)
                              }
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrenceCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeticiones</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(event.target.value ? Number(event.target.value) : undefined)
                              }
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrenceUntil"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Hasta</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value || undefined)}
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {mode === "edit" && defaultEvent && onDuplicate ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => onDuplicate(defaultEvent)}
              >
                Duplicar evento
              </Button>
            ) : null}
            <DialogFooter className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={submitting}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
