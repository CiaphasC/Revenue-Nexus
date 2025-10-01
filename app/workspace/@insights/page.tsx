import { getPipelineSnapshot } from "@/lib/server/workspace-data"

export default async function WorkspaceInsightsSlot() {
  const snapshot = await getPipelineSnapshot()

  const closingSoon = snapshot.totalDeals > 0 ? Math.max(1, Math.round(snapshot.totalDeals * 0.2)) : 0

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
      <h3 className="font-serif text-xl font-semibold">Insights rápidos</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">{closingSoon}</span> negocios deberían cerrar esta semana para alcanzar el forecast.
        </li>
        <li>
          El pipeline ponderado equivale al <span className="font-medium text-foreground">{Math.round((snapshot.weightedValue / snapshot.totalValue) * 100) || 0}%</span> del total.
        </li>
        <li>
          Etapas activas: {Object.keys(snapshot.byStage).length} — revisa la pestaña CRM para redistribuir esfuerzos.
        </li>
      </ul>
    </div>
  )
}
