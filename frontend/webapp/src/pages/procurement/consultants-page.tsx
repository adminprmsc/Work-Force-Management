import { MasterEntityPanel } from "@/components/procurement/master-entity-panel"
import {
  useConsultantsQuery,
  useCreateConsultantMutation,
  useDeleteConsultantMutation,
  useUpdateConsultantMutation,
} from "@/hooks/api"

export function ConsultantsPage() {
  const consultantsQuery = useConsultantsQuery()
  const createConsultantMutation = useCreateConsultantMutation()
  const updateConsultantMutation = useUpdateConsultantMutation()
  const deleteConsultantMutation = useDeleteConsultantMutation()

  return (
    <MasterEntityPanel
      title="Consultants"
      description="Master list of consultants used when creating procurement packages"
      entityLabel="Consultant"
      query={consultantsQuery}
      createMutation={createConsultantMutation}
      updateMutation={updateConsultantMutation}
      deleteMutation={deleteConsultantMutation}
    />
  )
}
