import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Undo2 } from "lucide-react"

import { getDeal } from "@/lib/server/workspace-data"
import { Badge } from "@/components/ui/badge"
import { SolIcon } from "@/components/ui/sol-icon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils/format"

const stageLabels: Record<string, string> = {
  lead: "Prospecto",
  qualified: "Calificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  closed: "Cerrado",
}

export async function DealInspector({ dealId }: { dealId: string }) {
  const deal = await getDeal(dealId)

  if (!deal) {
    notFound()
  }

  return (
    <Card className="border-border/50 bg-card/70 backdrop-blur-xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-3xl">{deal.title}</CardTitle>
          <Badge variant="outline" className="text-sm">
            {stageLabels[deal.stage] ?? deal.stage}
          </Badge>
        </div>
        <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Undo2 className="size-4" /> Volver al workspace
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/40 bg-background/60 p-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-chart-1">
            <SolIcon className="size-5" aria-hidden />
            {formatCurrency(deal.value)}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Probabilidad: {deal.probability}%</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/40 bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa</p>
            <p className="mt-1 text-base font-medium">{deal.company}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacto</p>
            <p className="mt-1 text-base font-medium">{deal.contact}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
          <Calendar className="size-4" aria-hidden />
          <span>Cierre estimado: {formatDate(deal.closeDate)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
