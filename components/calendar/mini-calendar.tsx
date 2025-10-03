"use client"

import { useMemo } from "react"

import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MiniCalendarProps {
  selectedDate: Date
  onSelect: (date: Date) => void
  eventDates?: Date[]
  className?: string
}

export function MiniCalendar({ selectedDate, onSelect, eventDates = [], className }: MiniCalendarProps) {
  const modifiers = useMemo(() => ({
    hasEvent: eventDates,
  }), [eventDates])

  return (
    <Card
      className={cn(
        "border border-border/40 bg-background/70 p-3 shadow-lg shadow-black/5 backdrop-blur",
        className,
      )}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelect(date)}
        classNames={{
          root: "w-full",
          caption_label: "text-sm font-semibold tracking-tight text-foreground",
          day: "relative flex size-8 items-center justify-center text-xs font-medium",
        }}
        modifiers={modifiers}
        modifiersClassNames={{
          hasEvent:
            "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-chart-1",
        }}
      />
    </Card>
  )
}
