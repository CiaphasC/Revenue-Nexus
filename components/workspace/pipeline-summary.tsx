import { getPipelineSnapshot } from "@/lib/server/workspace-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/format"

const STAGE_LABELS: Record<string, string> = {
  lead: "Prospectos",
  qualified: "Calificados",
  proposal: "Propuestas",
  negotiation: "Negociación",
  closed: "Cerrados",
}

const STAGE_COLORS: Record<string, string> = {
  lead: "border-chart-3/50 bg-chart-3/10 text-chart-3",
  qualified: "border-chart-2/50 bg-chart-2/10 text-chart-2",
  proposal: "border-chart-1/50 bg-chart-1/10 text-chart-1",
  negotiation: "border-chart-4/50 bg-chart-4/10 text-chart-4",
  closed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
}

export async function PipelineSummary() {
  const snapshot = await getPipelineSnapshot()

  return (
    <Card className="rounded-2xl border border-border/40 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-2xl text-foreground">Pipeline snapshot</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Mide la salud de tu embudo y cuántas oportunidades hay por etapa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-chart-1/40 bg-chart-1/10 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-chart-1/80">Valor total</dt>
            <dd className="mt-2 text-2xl font-semibold text-chart-1">
              {formatCurrency(Math.round(snapshot.totalValue))}
            </dd>
          </div>
          <div className="rounded-xl border border-chart-2/40 bg-chart-2/10 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-chart-2/80">Valor ponderado</dt>
            <dd className="mt-2 text-2xl font-semibold text-chart-2">
              {formatCurrency(Math.round(snapshot.weightedValue))}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          {Object.entries(snapshot.byStage).map(([stage, count]) => (
            <Badge
              key={stage}
              variant="outline"
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${STAGE_COLORS[stage] ?? "border-border/40 bg-background/40 text-muted-foreground"}`}
            >
              {STAGE_LABELS[stage] ?? stage}: {count}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Total de negocios activos: <span className="font-semibold text-foreground">{snapshot.totalDeals}</span>
        </p>
      </CardContent>
    </Card>
  )
}
