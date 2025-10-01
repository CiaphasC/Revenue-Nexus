"use client"

import { useState, useOptimistic } from "react"
import { deals as initialDeals } from "@/lib/data/mock-data"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewDealDialog } from "@/components/crm/new-deal-dialog"
import { DealCard } from "@/components/crm/deal-card"
import type { Deal } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/format"

const TAB_LABEL: Record<Deal["stage"], string> = {
  lead: "Prospectos",
  qualified: "Calificados",
  proposal: "Propuestas",
  negotiation: "Negociación",
  closed: "Cerrados",
}

export default function CRMPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [optimisticDeals, addOptimisticDeal] = useOptimistic(deals, (state, newDeal: Deal) => [newDeal, ...state])

  const handleDealCreated = (newDeal: Deal) => {
    addOptimisticDeal(newDeal)
    setDeals((previous) => [newDeal, ...previous])
  }

  const dealsByStage = optimisticDeals.reduce<Record<string, Deal[]>>((acc, deal) => {
    acc[deal.stage] = acc[deal.stage] ? [...acc[deal.stage], deal] : [deal]
    return acc
  }, {})

  const totalValue = optimisticDeals.reduce((sum, deal) => sum + deal.value, 0)
  const weightedValue = optimisticDeals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0)

  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-chart-2">Gestión comercial</div>
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">Micro CRM</h1>
          <p className="max-w-2xl text-muted-foreground">
            Visualiza tu pipeline, filtra oportunidades por etapa y crea nuevos negocios con respuestas optimistas en el
            acto.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="lg" className="w-full gap-2 md:w-auto">
          <Plus className="size-4" aria-hidden />
          Nuevo negocio
        </Button>
      </header>

      <section aria-label="Resumen del pipeline" className="mb-8 grid gap-4 rounded-2xl border border-border/40 bg-card/60 p-6 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="uppercase tracking-wider text-xs">Valor total</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(totalValue)}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-xs">Valor ponderado</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(Math.round(weightedValue))}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-xs">Oportunidades activas</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{optimisticDeals.length}</p>
        </div>
      </section>

      <Tabs defaultValue="all" className="w-full">
        <TabsList aria-label="Etapas del pipeline" className="mb-6 flex overflow-x-auto">
          <TabsTrigger value="all" className="min-w-[120px]">Todas</TabsTrigger>
          {Object.entries(TAB_LABEL).map(([stage, label]) => (
            <TabsTrigger key={stage} value={stage} className="min-w-[120px]">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {optimisticDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </TabsContent>

        {Object.entries(TAB_LABEL).map(([stage, label]) => (
          <TabsContent key={stage} value={stage} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {(dealsByStage[stage] ?? []).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
            {(!dealsByStage[stage] || dealsByStage[stage].length === 0) && (
              <p className="rounded-xl border border-dashed border-border/50 bg-background/40 p-6 text-sm text-muted-foreground">
                Aún no hay oportunidades en {label.toLowerCase()}.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <NewDealDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onDealCreated={handleDealCreated} />
    </main>
  )
}
