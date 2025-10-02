import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, Dot, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"
import { getKPIs } from "@/lib/server/workspace-data"

const TREND_STYLES: Record<string, { icon: ReactNode; tone: string; label: string }> = {
  up: {
    icon: <ArrowUp className="size-4" aria-hidden />,
    tone: "text-chart-2",
    label: "Tendencia al alza",
  },
  down: {
    icon: <ArrowDown className="size-4" aria-hidden />,
    tone: "text-destructive",
    label: "Tendencia a la baja",
  },
  neutral: {
    icon: <TrendingUp className="size-4" aria-hidden />,
    tone: "text-muted-foreground",
    label: "Tendencia estable",
  },
}

const KPI_ACCENTS: Record<string, string> = {
  Ingresos: "border-chart-1/40 bg-chart-1/10",
  "Negocios Activos": "border-chart-2/40 bg-chart-2/10",
  "Tasa de Conversión": "border-chart-3/40 bg-chart-3/10",
  "Tamaño Promedio": "border-chart-4/40 bg-chart-4/10",
  "Valor del Pipeline": "border-chart-5/40 bg-chart-5/10",
  "Puntuación NPS": "border-amber-400/40 bg-amber-400/10",
}

export async function KpiStrip() {
  const kpis = await getKPIs()

  return (
    <section aria-label="Indicadores clave" className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const trend = TREND_STYLES[kpi.trend ?? "neutral"] ?? TREND_STYLES.neutral
        const numericValue = typeof kpi.value === "number" ? kpi.value : undefined
        const accent = KPI_ACCENTS[kpi.label] ?? "border-border/40 bg-card/60"

        return (
          <Card
            key={kpi.label}
            className={cn("relative h-full min-h-[8rem] overflow-hidden rounded-2xl border bg-card py-0", accent)}
          >
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <header className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground/90">
                  {kpi.label}
                </p>
                <p className="font-serif text-3xl font-semibold text-foreground">
                  {numericValue !== undefined ? formatCurrency(numericValue) : kpi.value}
                </p>
              </header>

              {typeof kpi.change === "number" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={cn("flex items-center gap-1 font-medium", trend.tone)}
                    aria-label={trend.label}
                    role="status"
                  >
                    {trend.icon}
                    {kpi.change > 0 ? "+" : ""}
                    {kpi.change}%
                  </span>
                  <Dot className="size-4 text-border" aria-hidden />
                  <span>vs. mes anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
