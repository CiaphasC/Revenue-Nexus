export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-xl border border-border/40 bg-background/40 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 rounded-xl border border-border/40 bg-background/40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
