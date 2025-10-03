import type { ReactNode } from "react"
import { Suspense } from "react"

import { KpiStrip } from "@/components/workspace/kpi-strip"
import { PipelineSummary } from "@/components/workspace/pipeline-summary"
import { ActivityPanel } from "@/components/workspace/activity-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkspaceLayoutProps {
  children: ReactNode
  crm: ReactNode
  insights: ReactNode
  modal: ReactNode
}

export default function WorkspaceLayout({ children, crm, insights, modal }: WorkspaceLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-16">
      <section className="rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/60 to-card/30 px-8 py-10 text-foreground shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-chart-2">Workspace</p>
            <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Orquesta tu operación comercial</h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Supervisa KPIs, mantén sincronizado el pipeline y revisa la actividad en vivo desde un hub diseñado para la toma de decisiones.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiStrip />
      </Suspense>

      <div className="grid gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-12">
          {children}
          {crm}
        </div>
        <aside className="space-y-6">
          <InsightsCard />
          <Suspense fallback={<PipelineSkeleton />}>
            <PipelineSummary />
          </Suspense>
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivityPanel />
          </Suspense>
          {insights}
        </aside>
      </div>

      {modal}
    </div>
  )
}

function InsightsCard() {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">Centro de control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0 text-sm text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">Actualización en vivo</p>
          <p className="mt-1">
            Los cambios en el CRM, calendario y actividad se reflejan al instante gracias a react server actions.
          </p>
        </div>
        <div className="border-t border-border/40 pt-4">
          <p className="font-semibold text-foreground">Atajos</p>
          <p className="mt-1">Selecciona un negocio del pipeline para ver detalles o crea uno nuevo desde la tarjeta lateral.</p>
        </div>
      </CardContent>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[8rem] rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse"
        />
      ))}
    </div>
  )
}

function PipelineSkeleton() {
  return <div className="h-56 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse" />
}

function ActivitySkeleton() {
  return <div className="h-80 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse" />
}
