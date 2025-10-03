import { act, fireEvent, render, screen } from "@testing-library/react"

import { CalendarClientView } from "@/components/calendar/calendar-client-view"
import type { CalendarEvent } from "@/lib/types"

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}))

jest.mock("react-virtuoso", () => ({
  Virtuoso: ({ totalCount, itemContent }: { totalCount: number; itemContent: (index: number) => React.ReactNode }) => (
    <div data-testid="virtuoso-mock">
      {Array.from({ length: Math.min(totalCount, 6) }).map((_, index) => (
        <div key={index}>{itemContent(index)}</div>
      ))}
    </div>
  ),
}))

jest.mock("@/app/calendario/actions", () => ({
  createCalendarEventAction: jest.fn().mockResolvedValue({ success: true, event: baseMockEvent("new") }),
  updateCalendarEventAction: jest.fn().mockResolvedValue({ success: true, event: baseMockEvent("updated") }),
  deleteCalendarEventAction: jest.fn().mockResolvedValue({ success: true }),
}))

function baseMockEvent(id: string): CalendarEvent {
  return {
    id,
    type: "meeting",
    title: "Mock",
    description: "",
    date: "2024-06-01",
    owner: "Ana",
    start: "2024-06-01T09:00",
    end: "2024-06-01T10:00",
    attendees: [],
    calendarId: "ventas",
    organizer: "Ana",
    location: "",
    color: "#6366f1",
    allDay: false,
  }
}

global.crypto = {
  randomUUID: () => "test-id",
} as Crypto

describe("CalendarClientView", () => {
  const baseEvents: CalendarEvent[] = [
    {
      id: "1",
      type: "meeting",
      title: "Reunión con ventas",
      description: "Revisión semanal",
      date: "2024-06-01",
      time: "09:00",
      owner: "Ana",
      start: "2024-06-01T09:00",
      end: "2024-06-01T10:00",
      attendees: ["Luis"],
      calendarId: "ventas",
      organizer: "Ana",
      location: "Sala 1",
      color: "#6366f1",
      allDay: false,
    },
    {
      id: "2",
      type: "call",
      title: "Llamada con proveedor",
      description: "Negociación",
      date: "2024-06-02",
      time: "13:00",
      owner: "Luis",
      start: "2024-06-02T13:00",
      end: "2024-06-02T14:00",
      attendees: ["Ana"],
      calendarId: "ventas",
      organizer: "Luis",
      location: "Remoto",
      color: "#0ea5e9",
      allDay: false,
    },
  ]

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2024-06-01T08:00:00Z"))
    window.localStorage.clear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it("muestra la cuenta de eventos filtrada", async () => {
    render(<CalendarClientView initialEvents={baseEvents} />)

    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes("2 eventos visibles") ?? false).length,
    ).toBeGreaterThan(0)

    fireEvent.change(screen.getByPlaceholderText(/buscar eventos/i), {
      target: { value: "proveedor" },
    })

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes("1 eventos visibles") ?? false).length,
    ).toBeGreaterThan(0)
  })

  it("permite cambiar a la vista semanal", async () => {
    render(<CalendarClientView initialEvents={baseEvents} />)

    fireEvent.click(screen.getByRole("radio", { name: /vista semanal/i }))

    await act(async () => {
      jest.advanceTimersByTime(50)
    })

    expect(screen.getByRole("radio", { name: /vista semanal/i })).toHaveAttribute("data-state", "on")
  })
})
