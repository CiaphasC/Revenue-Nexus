import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActivities } from "@/lib/server/workspace-data"
import { LiveActivityStream } from "./live-activity-stream"

export async function ActivityPanel() {
  const activities = await getActivities()

  return (
    <Card className="rounded-2xl border border-border/40 bg-card/60">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-foreground">Actividad en tiempo real</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Seguimos los movimientos más recientes del equipo y los mostramos al instante mediante streaming.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Iniciando stream...</p>}>
          <LiveActivityStream initialActivities={activities.slice(0, 12)} />
        </Suspense>
      </CardContent>
    </Card>
  )
}
