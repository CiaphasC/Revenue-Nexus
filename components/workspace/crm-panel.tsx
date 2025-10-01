"use client"

import { useMemo, useState, useTransition, useOptimistic } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DealCard } from "@/components/crm/deal-card"
import type { Deal } from "@/lib/types"
import { WorkspaceNewDealDialog } from "./workspace-new-deal-dialog"
import { createDealAction, updateDealStageAction } from "@/app/workspace/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STAGE_LABELS, stageProbability } from "@/lib/workspace/deals"

interface WorkspaceCrmPanelProps {
  initialDeals: Deal[]
}

type OptimisticAction =
  | { type: "add"; deal: Deal }
  | { type: "replace"; id: string; deal: Deal }
  | { type: "remove"; id: string }

export function WorkspaceCrmPanel({ initialDeals }: WorkspaceCrmPanelProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [optimisticDeals, dispatchOptimistic] = useOptimistic(deals, (state: Deal[], action: OptimisticAction) => {
    switch (action.type) {
      case "add":
        return [action.deal, ...state]
      case "replace":
        return state.map((deal) => (deal.id === action.id ? action.deal : deal))
      case "remove":
        return state.filter((deal) => deal.id !== action.id)
      default:
        return state
    }
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({})
  const [isCreating, startCreateTransition] = useTransition()
  const [isUpdatingStage, startStageTransition] = useTransition()

  const markPending = (id: string, value: boolean) => {
    setPendingIds((previous) => ({ ...previous, [id]: value }))
  }

  const handleCreate = async (formData: FormData) => {
    const stage = (formData.get("stage") as Deal["stage"]) ?? "lead"
    const tempId = `temp-${crypto.randomUUID()}`
    const optimisticDeal: Deal = {
      id: tempId,
      title: String(formData.get("title") ?? "Nuevo negocio"),
      company: String(formData.get("company") ?? ""),
      value: Number(formData.get("value") ?? 0),
      stage,
      probability: stageProbability(stage),
      closeDate: String(formData.get("closeDate") ?? new Date().toISOString()),
      contact: String(formData.get("contact") ?? ""),
    }

    dispatchOptimistic({ type: "add", deal: optimisticDeal })
    markPending(tempId, true)

    return await new Promise<{ success: boolean; error?: string }>((resolve) => {
      startCreateTransition(async () => {
        const result = await createDealAction(formData)

        if (result.success) {
          setDeals((previous) => [result.deal, ...previous])
          dispatchOptimistic({ type: "replace", id: tempId, deal: result.deal })
          markPending(tempId, false)
          resolve({ success: true })
        } else {
          dispatchOptimistic({ type: "remove", id: tempId })
          markPending(tempId, false)
          resolve({ success: false, error: result.error ?? "No se pudo crear el negocio" })
        }
      })
    })
  }

  const handleStageChange = (deal: Deal, nextStage: Deal["stage"]) => {
    const optimisticDeal: Deal = {
      ...deal,
      stage: nextStage,
      probability: stageProbability(nextStage),
    }

    dispatchOptimistic({ type: "replace", id: deal.id, deal: optimisticDeal })
    markPending(deal.id, true)

    startStageTransition(async () => {
      const payload = new FormData()
      payload.append("id", deal.id)
      payload.append("stage", nextStage)

      const result = await updateDealStageAction(payload)

      if (result.success) {
        setDeals((previous) => previous.map((item) => (item.id === deal.id ? result.deal : item)))
        dispatchOptimistic({ type: "replace", id: deal.id, deal: result.deal })
      } else {
        dispatchOptimistic({ type: "replace", id: deal.id, deal })
      }

      markPending(deal.id, false)
    })
  }

  const sortedDeals = useMemo(() => optimisticDeals, [optimisticDeals])
  const stageTotals = useMemo(() => {
    return sortedDeals.reduce<Record<string, number>>((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] ?? 0) + 1
      return acc
    }, {})
  }, [sortedDeals])

  return (
    <section aria-labelledby="pipeline-heading" className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-chart-2">Pipeline CRM</p>
          <h2 id="pipeline-heading" className="font-serif text-3xl font-semibold text-foreground">
            Gestiona tus oportunidades
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa los deals activos y actualiza su etapa sin salir de la vista. Los cambios se replican en el calendario
            y la actividad en vivo.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="lg" className="w-full gap-2 sm:w-auto">
          <Plus className="size-4" aria-hidden />
          Nuevo negocio
        </Button>
      </header>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {Object.entries(STAGE_LABELS).map(([key, label]) => (
          <span key={key} className="rounded-full border border-border/40 bg-background/40 px-3 py-1">
            {label}: <strong className="text-foreground">{stageTotals[key] ?? 0}</strong>
          </span>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {sortedDeals.map((deal) => {
          const isPending = pendingIds[deal.id] ?? false
          const isOptimistic = deal.id.startsWith("temp-")

          const card = <DealCard key={deal.id} deal={deal} isPending={isPending || isOptimistic} />

          return (
            <article key={deal.id} className="space-y-3">
              {isOptimistic ? (
                card
              ) : (
                <Link href={`/workspace/deal/${deal.id}`} prefetch className="block focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2">
                  {card}
                </Link>
              )}

              <div className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/70 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Etapa</span>
                <Select
                  value={deal.stage}
                  disabled={isPending || isOptimistic || isUpdatingStage}
                  onValueChange={(value) => handleStageChange(deal, value as Deal["stage"])}
                >
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </article>
          )
        })}
      </div>

      <WorkspaceNewDealDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreate}
        isPending={isCreating}
      />
    </section>
  )
}
