export function LoadingCalendar() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-32 rounded-2xl bg-muted/40 animate-pulse" aria-hidden />
        <div className="h-32 rounded-2xl bg-muted/40 animate-pulse" aria-hidden />
        <div className="h-32 rounded-2xl bg-muted/40 animate-pulse" aria-hidden />
      </div>
      <div className="rounded-2xl border border-border/40 bg-background/60 p-6 shadow-lg shadow-black/5 backdrop-blur">
        <div className="mb-4 h-8 w-1/3 rounded-full bg-muted/40 animate-pulse" aria-hidden />
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 rounded-xl bg-muted/30 animate-pulse" aria-hidden />
          ))}
        </div>
      </div>
    </div>
  )
}
