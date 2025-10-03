"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarClock, MapPin, Trash2, User, Users } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CalendarEvent } from "@/lib/types"

interface EventModalProps {
  event: CalendarEvent | null
  open: boolean
  onOpenChange: (value: boolean) => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (event: CalendarEvent) => void
}

function formatSchedule(event: CalendarEvent) {
  const start = new Date(event.start)
  const end = new Date(event.end)

  const dateText = format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
  const hoursText = `${format(start, "HH:mm", { locale: es })} - ${format(end, "HH:mm", { locale: es })}`

  return {
    dateText,
    hoursText,
  }
}

export function EventModal({ event, open, onOpenChange, onEdit, onDelete }: EventModalProps) {
  if (!event) {
    return null
  }

  const { dateText, hoursText } = formatSchedule(event)
  const attendees = event.attendees ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/40 bg-background/80 p-6 shadow-2xl shadow-chart-1/20 backdrop-blur">
        <DialogHeader className="space-y-2">
          <Badge
            className="w-fit bg-chart-1/20 text-chart-1 shadow-sm shadow-chart-1/30"
            style={event.color ? { backgroundColor: `${event.color}22`, color: event.color } : undefined}
          >
            {event.calendarId ? event.calendarId.replace(/-/g, " ") : event.type}
          </Badge>
          <DialogTitle className="font-serif text-2xl text-balance text-foreground">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {event.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 p-3">
            <CalendarClock className="mt-0.5 size-5 text-chart-1" />
            <div>
              <p className="text-sm font-semibold capitalize text-foreground">{dateText}</p>
              {event.allDay ? (
                <p className="text-sm text-muted-foreground">Todo el día</p>
              ) : (
                <p className="text-sm text-muted-foreground">{hoursText}</p>
              )}
            </div>
          </div>
          {event.location ? (
            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 p-3">
              <MapPin className="mt-0.5 size-5 text-chart-2" />
              <div>
                <p className="text-sm font-semibold text-foreground">Ubicación</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 p-3">
              <User className="mt-0.5 size-5 text-chart-3" />
              <div>
                <p className="text-sm font-semibold text-foreground">Organiza</p>
                <p className="text-sm text-muted-foreground">{event.organizer ?? event.owner}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 p-3">
              <Users className="mt-0.5 size-5 text-chart-4" />
              <div>
                <p className="text-sm font-semibold text-foreground">Participantes</p>
                {attendees.length ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {attendees.map((person) => (
                      <li key={person} className="leading-tight">
                        {person}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin asistentes</p>
                )}
              </div>
            </div>
          </div>
          {event.owner ? (
            <div className="rounded-xl border border-dashed border-chart-2/40 bg-chart-2/10 p-3 text-sm text-chart-2">
              Responsable: <span className="font-medium text-chart-2/90">{event.owner}</span>
            </div>
          ) : null}
        </div>
        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full gap-2 border border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(event)}
          >
            <Trash2 className="size-4" /> Eliminar
          </Button>
          <Button className="w-full" onClick={() => onEdit(event)}>
            Editar evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
