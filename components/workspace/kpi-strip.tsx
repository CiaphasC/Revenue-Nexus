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

export async function KpiStrip() {
  const kpis = await getKPIs()

  return (
    <section aria-label="Indicadores clave" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const trend = TREND_STYLES[kpi.trend ?? "neutral"] ?? TREND_STYLES.neutral
        const numericValue = typeof kpi.value === "number" ? kpi.value : undefined

        return (
          <Card key={kpi.label} className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60">
            <CardContent className="space-y-4 p-6">
              <header className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="font-serif text-3xl font-semibold text-foreground">
                  {numericValue !== undefined ? formatCurrency(numericValue) : kpi.value}
                </p>
              </header>

              {typeof kpi.change === "number" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={cn("flex items-center gap-1 font-medium", trend.tone)} aria-label={trend.label}>
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
