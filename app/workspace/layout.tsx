import type { ReactNode } from "react"
import { Suspense } from "react"

import { KpiStrip } from "@/components/workspace/kpi-strip"
import { PipelineSummary } from "@/components/workspace/pipeline-summary"
import { ActivityPanel } from "@/components/workspace/activity-panel"

interface WorkspaceLayoutProps {
  children: ReactNode
  crm: ReactNode
  insights: ReactNode
  modal: ReactNode
}

export default function WorkspaceLayout({ children, crm, insights, modal }: WorkspaceLayoutProps) {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border/40 bg-gradient-to-br from-card/80 via-card/60 to-card/30 px-8 py-10 text-foreground shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-chart-2">Workspace</p>
            <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Orquesta tu operación comercial</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Supervisa KPIs, mantén sincronizado el pipeline y revisa la actividad en vivo desde un hub diseñado para la
              toma de decisiones.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">Actualización en vivo</span>
              <p>Los cambios en el CRM, calendario y actividad se reflejan al instante gracias a react server actions.</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Atajos</span>
              <p>Selecciona un negocio del pipeline para ver detalles o crea uno nuevo desde la tarjeta lateral.</p>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiStrip />
      </Suspense>

      <div className="grid gap-8 xl:grid-cols-[ minmax(0,2fr)_minmax(320px,1fr) ]">
        <div className="space-y-8">
          {children}
          {crm}
        </div>
        <aside className="space-y-6">
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

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-28 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse"
        />
      ))}
    </div>
  )
}

function PipelineSkeleton() {
  return <div className="h-56 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse" />
}

function ActivitySkeleton() {
  return <div className="h-72 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm animate-pulse" />
}
