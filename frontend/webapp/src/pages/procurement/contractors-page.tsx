import { MasterEntityPanel } from "@/components/procurement/master-entity-panel"
import {
  useContractorsQuery,
  useCreateContractorMutation,
  useDeleteContractorMutation,
  useUpdateContractorMutation,
} from "@/hooks/api"

export function ContractorsPage() {
  const contractorsQuery = useContractorsQuery()
  const createContractorMutation = useCreateContractorMutation()
  const updateContractorMutation = useUpdateContractorMutation()
  const deleteContractorMutation = useDeleteContractorMutation()

  return (
    <MasterEntityPanel
      title="Contractors"
      description="Master list of contractors used when creating procurement packages"
      entityLabel="Contractor"
      query={contractorsQuery}
      createMutation={createContractorMutation}
      updateMutation={updateContractorMutation}
      deleteMutation={deleteContractorMutation}
    />
  )
}
