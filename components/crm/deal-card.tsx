"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, User } from "lucide-react"
import type { Deal } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/format"

interface DealCardProps {
  deal: Deal
  isPending?: boolean
}

const STAGE_LABEL: Record<Deal["stage"], string> = {
  lead: "Prospecto",
  qualified: "Calificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  closed: "Cerrado",
}

export function DealCard({ deal, isPending = false }: DealCardProps) {
  const stageTone = (() => {
    switch (deal.stage) {
      case "lead":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20"
      case "qualified":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20"
      case "proposal":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20"
      case "negotiation":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20"
      case "closed":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  })()

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/50 bg-card/60 transition-shadow",
        isPending && "opacity-60",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-chart-1/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{deal.title}</h3>
          <Badge variant="outline" className={cn("text-xs capitalize", stageTone)}>
            {STAGE_LABEL[deal.stage] ?? deal.stage}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{deal.company}</p>
      </CardHeader>
      <CardContent className="relative space-y-3 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <DollarSign className="size-4 text-chart-1" aria-hidden="true" />
          <span className="font-semibold">{formatCurrency(deal.value)}</span>
          <span className="text-muted-foreground">
            Probabilidad {deal.probability.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4" aria-hidden="true" />
          <span>{deal.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-4" aria-hidden="true" />
          <span>{formatDate(deal.closeDate)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
