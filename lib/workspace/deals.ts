import type { Deal } from "@/lib/types"

export const STAGE_LABELS: Record<Deal["stage"], string> = {
  lead: "Prospecto",
  qualified: "Calificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  closed: "Cerrado",
}

export function stageProbability(stage: Deal["stage"]): number {
  switch (stage) {
    case "lead":
      return 20
    case "qualified":
      return 40
    case "proposal":
      return 60
    case "negotiation":
      return 75
    case "closed":
      return 100
    default:
      return 20
  }
}
