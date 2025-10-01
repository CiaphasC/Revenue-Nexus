import { DealInspector } from "@/components/workspace/deal-inspector"

export default function DealDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-5xl">
      <DealInspector dealId={params.id} />
    </div>
  )
}
