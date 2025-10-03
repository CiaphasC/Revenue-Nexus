import { Suspense } from "react"

import { Calendar } from "lucide-react"

import { CalendarClientView } from "@/components/calendar/calendar-client-view"
import { LoadingCalendar } from "@/components/calendar/loading"
import { getCalendarEvents } from "@/lib/server/workspace-data"

export default async function CalendarioPage() {
  const eventsPromise = getCalendarEvents()

  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl border border-chart-1/30 bg-gradient-to-br from-chart-1/20 to-chart-2/20 text-chart-1 shadow-md sm:size-14">
            <Calendar className="size-6 sm:size-7" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-chart-2">Agenda integrada</p>
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Calendario de actividades</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
              Consulta reuniones, entregas y hitos comerciales en un solo lugar.
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<LoadingCalendar />}>
        <CalendarPageContent eventsPromise={eventsPromise} />
      </Suspense>
    </main>
  )
}

async function CalendarPageContent({
  eventsPromise,
}: {
  eventsPromise: ReturnType<typeof getCalendarEvents>
}) {
  const events = await eventsPromise

  return <CalendarClientView initialEvents={events} />
}
