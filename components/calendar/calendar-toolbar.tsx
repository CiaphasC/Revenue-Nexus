"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"

export type CalendarViewMode = "day" | "week" | "month"

interface CalendarToolbarProps {
  label: string
  onNavigate: (direction: "previous" | "next") => void
  onToday: () => void
  view: CalendarViewMode
  onViewChange: (mode: CalendarViewMode) => void
  search: string
  onSearchChange: (value: string) => void
  onCreate: () => void
  className?: string
}

export function CalendarToolbar({
  label,
  onNavigate,
  onToday,
  view,
  onViewChange,
  search,
  onSearchChange,
  onCreate,
  className,
}: CalendarToolbarProps) {
  const searchPlaceholder = useMemo(() => {
    switch (view) {
      case "day":
        return "Buscar en el día"
      case "week":
        return "Buscar en la semana"
      default:
        return "Buscar eventos"
    }
  }, [view])

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/50 bg-background/60 p-4 shadow-lg shadow-black/5 backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label="Ir al periodo anterior"
            className="bg-background/80 backdrop-blur"
            onClick={() => onNavigate("previous")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Ir al siguiente periodo"
            className="bg-background/80 backdrop-blur"
            onClick={() => onNavigate("next")}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="secondary"
            className="hidden sm:inline-flex bg-chart-1/10 text-chart-1 shadow-md shadow-chart-1/20"
            onClick={onToday}
          >
            Hoy
          </Button>
          <div className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {label}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 bg-background/80 text-sm font-semibold shadow-inner shadow-white/5 backdrop-blur"
            onClick={onToday}
          >
            <CalendarDays className="size-4" />
            Hoy
          </Button>
          <Button
            className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-br from-chart-1/80 via-chart-1/60 to-chart-2/60 text-sm font-semibold text-white shadow-lg shadow-chart-1/30"
            onClick={onCreate}
          >
            <Plus className="size-4" /> Crear
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border-border/40 bg-background/70 pl-9 shadow-inner shadow-black/5 backdrop-blur"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && onViewChange(value as CalendarViewMode)}
          variant="outline"
          size="sm"
          className="w-full overflow-hidden rounded-xl border border-border/40 bg-background/70 text-sm shadow-inner shadow-black/5 backdrop-blur md:w-auto"
        >
          <ToggleGroupItem value="day" aria-label="Ver día">Día</ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Ver semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Ver mes">Mes</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Button
        className="sm:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-chart-1/90 via-chart-1/70 to-chart-2/70 py-6 text-base font-semibold text-white shadow-xl shadow-chart-1/30"
        onClick={onCreate}
      >
        <Plus className="size-5" /> Nuevo evento
      </Button>
    </div>
  )
}
