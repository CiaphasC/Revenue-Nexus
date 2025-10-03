"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { CalendarEvent } from "@/lib/types"
import {
  calendarEventFormSchema,
  type CalendarEventInput,
} from "@/lib/validators/calendar"

const formSchema = calendarEventFormSchema

type CalendarEventFormValues = z.infer<typeof formSchema>

interface CalendarMetadata {
  id: string
  label: string
  color: string
}

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  defaultEvent?: CalendarEvent | null
  calendars: CalendarMetadata[]
  onSubmit: (values: CalendarEventInput & { id?: string }) => Promise<void>
  submitting?: boolean
}

function toDateTimeInput(value: string | Date) {
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

const activityOptions: { value: CalendarEventInput["type"]; label: string }[] = [
  { value: "meeting", label: "Reunión" },
  { value: "deal", label: "Negocio" },
  { value: "call", label: "Llamada" },
  { value: "email", label: "Correo" },
]

export function EventForm({
  open,
  onOpenChange,
  mode,
  defaultEvent,
  calendars,
  onSubmit,
  submitting,
}: EventFormProps) {
  const firstCalendar = calendars[0]
  const form = useForm<CalendarEventFormValues>({
    resolver: zodResolver(formSchema),
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
      calendarId: defaultEvent?.calendarId ?? firstCalendar?.id ?? "mi-calendario",
      color: defaultEvent?.color ?? firstCalendar?.color ?? "#6366f1",
      attendeesText: defaultEvent?.attendees?.join(", ") ?? "",
      allDay: defaultEvent?.allDay ?? false,
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
      calendarId: defaultEvent?.calendarId ?? firstCalendar?.id ?? "mi-calendario",
      color: defaultEvent?.color ?? firstCalendar?.color ?? "#6366f1",
      attendeesText: defaultEvent?.attendees?.join(", ") ?? "",
      allDay: defaultEvent?.allDay ?? false,
    })
  }, [defaultEvent, firstCalendar?.color, firstCalendar?.id, form])

  const allDay = form.watch("allDay")

  useEffect(() => {
    if (allDay) {
      const currentStart = form.getValues("start")
      const startDate = new Date(currentStart || new Date())
      const startValue = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0,
        0,
      )
      const endValue = new Date(startValue.getTime() + 24 * 60 * 60 * 1000)
      form.setValue("start", toDateTimeInput(startValue))
      form.setValue("end", toDateTimeInput(endValue))
    }
  }, [allDay, form])

  const calendarId = form.watch("calendarId")

  useEffect(() => {
    const matched = calendars.find((item) => item.id === calendarId)
    if (matched && !defaultEvent?.color) {
      form.setValue("color", matched.color)
    }
  }, [calendarId, calendars, defaultEvent?.color, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    const attendees = values.attendeesText
      ? values.attendeesText.split(",").map((person) => person.trim()).filter(Boolean)
      : []

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
    }

    await onSubmit(payload)
  })

  const modeLabel = mode === "create" ? "Crear evento" : "Editar evento"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-border/40 bg-background/90 p-6 shadow-2xl shadow-chart-1/20 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">{modeLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="grid gap-4">
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
                      <SelectContent className="border-border/40 bg-background/90 backdrop-blur">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Notas, agenda o contexto del evento"
                      className="min-h-24 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className="rounded-xl" {...field} />
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
                      <Input type="datetime-local" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-3">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-semibold">Evento de todo el día</FormLabel>
                    <p className="text-xs text-muted-foreground">Oculta las horas y bloquea toda la jornada seleccionada.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre de la persona a cargo" className="rounded-xl" />
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
                      <Input {...field} placeholder="Quién convoca" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="attendeesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participantes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Separar por coma: Juan Perez, Ana Pérez"
                      className="min-h-20 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sala Prisma, Google Meet, etc." className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      <SelectContent className="border-border/40 bg-background/90 backdrop-blur">
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
                      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                        <Input type="color" className="size-10 rounded-md border border-border/40 p-1" value={field.value} onChange={field.onChange} />
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          className="rounded-lg"
                          placeholder="#6366f1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
