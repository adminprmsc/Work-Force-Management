import type {
  ProcurementPackage,
  UpdateProcurementPackageInput,
  VillageAllocationInput,
} from "@/modules/api/types"

export type PackageFormState = {
  name: string
  cluster: string
  code: string
  budgetAmount: string
  contractorId: string
  consultantId: string
  tehsilId: string
  villageIds: string[]
  allocations: Record<string, string>
}

export const emptyPackageForm = (): PackageFormState => ({
  name: "",
  cluster: "",
  code: "",
  budgetAmount: "",
  contractorId: "",
  consultantId: "",
  tehsilId: "",
  villageIds: [],
  allocations: {},
})

export function packageToForm(pkg: ProcurementPackage): PackageFormState {
  return {
    name: pkg.name,
    cluster: "",
    code: "",
    budgetAmount: pkg.budgetAmount,
    contractorId: pkg.contractor.id,
    consultantId: pkg.consultant.id,
    tehsilId: pkg.tehsil.id,
    villageIds: pkg.villages.map((village) => village.id),
    allocations: Object.fromEntries(
      pkg.villages.map((village) => [village.id, village.allocatedBudget]),
    ),
  }
}

/**
 * Split a budget equally across villages (in whole cents), distributing the
 * remainder cents onto the first villages so the parts sum exactly to the total.
 */
export function equalSplitAllocations(
  budget: number,
  villageIds: string[],
): Record<string, string> {
  const result: Record<string, string> = {}
  const n = villageIds.length
  if (n === 0) return result
  if (!Number.isFinite(budget) || budget < 0) {
    for (const id of villageIds) result[id] = "0.00"
    return result
  }
  const totalCents = Math.round(budget * 100)
  const base = Math.floor(totalCents / n)
  const remainder = totalCents - base * n
  villageIds.forEach((id, index) => {
    const cents = base + (index < remainder ? 1 : 0)
    result[id] = (cents / 100).toFixed(2)
  })
  return result
}

function sameIdList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((id, index) => id === sortedB[index])
}

function allocationsUnchanged(
  pkg: ProcurementPackage,
  villageIds: string[],
  allocations: Record<string, string>,
): boolean {
  const existing = Object.fromEntries(
    pkg.villages.map((village) => [village.id, Number.parseFloat(village.allocatedBudget)]),
  )
  return villageIds.every((id) => {
    const next = Number.parseFloat(allocations[id] ?? "0")
    const prev = existing[id] ?? Number.NaN
    return Number.isFinite(next) && Number.isFinite(prev) && Math.abs(next - prev) <= 0.01
  })
}

/** Build a partial update payload so unchanged package state is left alone. */
export function buildPackageUpdateInput(
  pkg: ProcurementPackage,
  form: PackageFormState,
  effectiveAllocations: Record<string, string>,
): UpdateProcurementPackageInput {
  const input: UpdateProcurementPackageInput = {}
  const nextName = form.name.trim()
  if (nextName && nextName !== pkg.name) {
    input.name = nextName
  }

  const budgetAmount = Number.parseFloat(form.budgetAmount)
  const budgetChanged =
    Number.isFinite(budgetAmount) &&
    Math.abs(budgetAmount - Number.parseFloat(pkg.budgetAmount)) > 0.01

  if (budgetChanged) {
    input.budgetAmount = budgetAmount
  }

  if (form.contractorId && form.contractorId !== pkg.contractor.id) {
    input.contractorId = form.contractorId
  }

  if (form.consultantId && form.consultantId !== pkg.consultant.id) {
    input.consultantId = form.consultantId
  }

  const existingVillageIds = pkg.villages.map((village) => village.id)
  const villagesChanged = !sameIdList(form.villageIds, existingVillageIds)
  const allocChanged =
    villagesChanged ||
    budgetChanged ||
    !allocationsUnchanged(pkg, form.villageIds, effectiveAllocations)

  if (villagesChanged) {
    input.villageIds = form.villageIds
  }

  if (allocChanged) {
    const villageAllocations: VillageAllocationInput[] = form.villageIds.map((villageId) => ({
      villageId,
      allocatedBudget: Number.parseFloat(effectiveAllocations[villageId]) || 0,
    }))
    input.villageAllocations = villageAllocations
    if (!input.villageIds) {
      input.villageIds = form.villageIds
    }
  }

  return input
}
