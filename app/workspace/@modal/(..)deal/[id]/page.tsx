import Link from "next/link"
import { X } from "lucide-react"

import { DealInspector } from "@/components/workspace/deal-inspector"

export default async function WorkspaceDealModal({ params }: { params: { id: string } }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/50 bg-background/95 p-6 shadow-2xl">
        <Link
          href="/workspace"
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="size-5" />
          <span className="sr-only">Cerrar</span>
        </Link>
        <DealInspector dealId={params.id} />
      </div>
    </div>
  )
}
