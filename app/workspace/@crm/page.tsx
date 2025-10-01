import { WorkspaceCrmPanel } from "@/components/workspace/crm-panel"
import { getDeals } from "@/lib/server/workspace-data"

export default async function WorkspaceCrmSlot() {
  const deals = await getDeals()

  return <WorkspaceCrmPanel initialDeals={deals} />
}
