import Link from "next/link"
import { notFound } from "next/navigation"
import { DollarSign, Calendar, User, Undo2 } from "lucide-react"

import { getDeal } from "@/lib/server/workspace-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
            <DollarSign className="size-5" />
            S/ {deal.value.toLocaleString("es-PE")}
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
          <Calendar className="size-4" />
          <span>Cierre estimado: {new Date(deal.closeDate).toLocaleDateString("es-PE")}</span>
        </div>
      </CardContent>
    </Card>
  )
}
