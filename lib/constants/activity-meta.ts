import type { Activity } from "@/lib/types"
import { SolIcon } from "@/components/ui/sol-icon"
import type { LucideIcon } from "lucide-react"
import { Activity as ActivityIcon, Target, Users } from "lucide-react"

interface ActivityMeta {
  icon: LucideIcon
  calendarColor: string
  badgeColor: string
}

export const ACTIVITY_META: Record<Activity["type"], ActivityMeta> = {
  deal: {
    icon: SolIcon,
    calendarColor: "bg-chart-1/20 border-chart-1/40 text-chart-1",
    badgeColor: "text-chart-1",
  },
  meeting: {
    icon: Users,
    calendarColor: "bg-chart-2/20 border-chart-2/40 text-chart-2",
    badgeColor: "text-chart-2",
  },
  email: {
    icon: ActivityIcon,
    calendarColor: "bg-chart-3/20 border-chart-3/40 text-chart-3",
    badgeColor: "text-chart-3",
  },
  call: {
    icon: Target,
    calendarColor: "bg-chart-4/20 border-chart-4/40 text-chart-4",
    badgeColor: "text-chart-4",
  },
}
