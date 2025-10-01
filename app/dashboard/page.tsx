import type { ReactNode } from "react"

import { kpis, recentActivities } from "@/lib/data/mock-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SolIcon } from "@/components/ui/sol-icon"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, TrendingUp, Users, Target, Award, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"

const ACTIVITY_LABEL: Record<string, { icon: ReactNode; tone: string }> = {
  deal: { icon: <SolIcon className="size-4" aria-hidden />, tone: "text-chart-1" },
  meeting: { icon: <Users className="size-4" aria-hidden />, tone: "text-chart-2" },
  email: { icon: <Activity className="size-4" aria-hidden />, tone: "text-chart-3" },
  call: { icon: <Target className="size-4" aria-hidden />, tone: "text-chart-4" },
}

const KPI_TREND_ICON: Record<string, ReactNode> = {
  up: <ArrowUp className="size-4 text-chart-2" aria-hidden />,
  down: <ArrowDown className="size-4 text-destructive" aria-hidden />,
  neutral: <TrendingUp className="size-4 text-muted-foreground" aria-hidden />,
}

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-chart-1">Resumen ejecutivo</p>
        <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">Panel de control</h1>
        <p className="max-w-2xl text-muted-foreground">
          Supervisa indicadores críticos y accede a la actividad reciente de tu equipo en un entorno pensado para la lectura y la acción.
        </p>
      </header>

      <section aria-label="Indicadores clave" className="mb-12">
        <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => {
            const trend = kpi.trend ?? "neutral"
            const Icon = KPI_TREND_ICON[trend] ?? KPI_TREND_ICON.neutral

            return (
              <Card key={kpi.label} className="h-full border-border/40 bg-card/60">
                <CardHeader className="pb-3">
                  <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {kpi.label}
                  </CardDescription>
                  <CardTitle className="font-serif text-3xl font-semibold text-foreground">
                    {typeof kpi.value === "number" ? formatCurrency(kpi.value) : kpi.value}
                  </CardTitle>
                </CardHeader>
                {typeof kpi.change === "number" && (
                  <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                    {Icon}
                    <span
                      className={cn(
                        "font-medium",
                        trend === "up" && "text-chart-2",
                        trend === "down" && "text-destructive",
                      )}
                      aria-label={
                        trend === "up"
                          ? "Tendencia al alza"
                          : trend === "down"
                            ? "Tendencia a la baja"
                            : "Tendencia estable"
                      }
                    >
                      {kpi.change > 0 ? "+" : ""}
                      {kpi.change}%
                    </span>
                    <span>vs. mes anterior</span>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </dl>
      </section>

      <section aria-labelledby="activity-heading">
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle id="activity-heading" className="font-serif text-2xl text-foreground">
                Actividad reciente
              </CardTitle>
              <CardDescription className="max-w-xl text-muted-foreground">
                Últimos movimientos del pipeline y puntos de contacto relevantes.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-wider">
              <Award className="size-4 text-chart-1" aria-hidden />
              Equipo destacado
            </Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivities.map((activity) => {
                const meta = ACTIVITY_LABEL[activity.type] ?? ACTIVITY_LABEL.email

                return (
                  <li
                    key={activity.id}
                    className="flex items-start gap-4 rounded-xl border border-border/40 bg-background/60 p-4 shadow-sm transition-colors hover:border-chart-1/40"
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted",
                        meta.tone,
                      )}
                      aria-hidden
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold leading-tight text-foreground">{activity.title}</p>
                        <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground/80">
                        {activity.user} • {activity.timestamp}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
