import type { ProcurementPackage } from "@/modules/api/types"
import type {
  PackageFieldReference,
  SurveyField,
  SurveyFieldBudgetEffect,
  SurveyFieldType,
} from "@/modules/api/survey-types"

export const PACKAGE_FIELD_REFERENCES: PackageFieldReference[] = [
  "packageName",
  "budgetAmount",
  "totalExpenses",
  "remainingBudget",
  "villageAllocatedBudget",
  "villageRemainingBudget",
  "contractorName",
  "consultantName",
  "tehsilName",
]

export const PACKAGE_FIELD_REFERENCE_LABELS: Record<
  PackageFieldReference,
  string
> = {
  packageName: "Package name",
  budgetAmount: "Total budget",
  totalExpenses: "Total expenses",
  remainingBudget: "Remaining budget",
  villageAllocatedBudget: "Village allocated budget",
  villageRemainingBudget: "Village remaining budget",
  contractorName: "Contractor name",
  consultantName: "Consultant name",
  tehsilName: "Tehsil name",
}

export const PACKAGE_FIELD_REFERENCE_FIELD_TYPES: Record<
  PackageFieldReference,
  SurveyFieldType
> = {
  packageName: "TEXT",
  budgetAmount: "NUMBER",
  totalExpenses: "NUMBER",
  remainingBudget: "NUMBER",
  villageAllocatedBudget: "NUMBER",
  villageRemainingBudget: "NUMBER",
  contractorName: "TEXT",
  consultantName: "TEXT",
  tehsilName: "TEXT",
}

export const BUDGET_EFFECT_LABELS: Record<SurveyFieldBudgetEffect, string> = {
  DEDUCT: "Deduct from package budget",
  ADD: "Add back to package budget (credit)",
}

export function packageReferencesForFieldType(
  type: SurveyFieldType,
): PackageFieldReference[] {
  return PACKAGE_FIELD_REFERENCES.filter(
    (reference) => PACKAGE_FIELD_REFERENCE_FIELD_TYPES[reference] === type,
  )
}

export function fieldIsPackageBound(field: {
  config?: {
    packageReference?: PackageFieldReference
    computedRemainingBudget?: boolean
    computedVillageRemainingBudget?: boolean
    computedVisitDeductions?: boolean
  } | null
}): boolean {
  return Boolean(
    field.config?.packageReference ||
      field.config?.computedRemainingBudget ||
      field.config?.computedVillageRemainingBudget ||
      field.config?.computedVisitDeductions,
  )
}

function villageBudgetContext(
  pkg: ProcurementPackage,
  villageId: string | null | undefined,
): { allocated: number; spent: number } | null {
  if (!villageId) return null
  const village = pkg.villages.find((v) => v.id === villageId)
  if (!village) return null
  return {
    allocated: Number(village.allocatedBudget),
    spent: Number(village.spent),
  }
}

export function computeVillageRemainingBudget(
  pkg: ProcurementPackage,
  villageId: string | null | undefined,
  fields: SurveyField[],
  answers: Record<string, unknown>,
): number {
  const context = villageBudgetContext(pkg, villageId)
  if (!context) return 0
  const inForm = sumBudgetEffectsFromAnswers(fields, answers)
  return context.allocated - context.spent - inForm
}

export function numericAnswerValue(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function sumBudgetEffectsFromAnswers(
  fields: SurveyField[],
  answers: Record<string, unknown>,
  options?: { effect?: SurveyFieldBudgetEffect },
): number {
  let total = 0
  for (const field of fields) {
    const effect = field.config?.budgetEffect
    if (!effect) continue
    if (options?.effect && effect !== options.effect) continue
    const value = numericAnswerValue(answers[field.id])
    total += effect === "DEDUCT" ? value : -value
  }
  return total
}

export function computeRemainingPackageBudget(
  pkg: ProcurementPackage,
  fields: SurveyField[],
  answers: Record<string, unknown>,
): number {
  const budget = Number(pkg.budgetAmount)
  const committed = Number(pkg.totalExpenses)
  const inForm = sumBudgetEffectsFromAnswers(fields, answers)
  return budget - committed - inForm
}

export function resolvePackageFieldValue(
  reference: PackageFieldReference,
  pkg: ProcurementPackage,
  fields?: SurveyField[],
  answers?: Record<string, unknown>,
  villageId?: string | null,
): string | number {
  switch (reference) {
    case "packageName":
      return pkg.name
    case "budgetAmount":
      return Number(pkg.budgetAmount)
    case "totalExpenses":
      if (fields && answers) {
        return Number(pkg.totalExpenses) + sumBudgetEffectsFromAnswers(fields, answers)
      }
      return Number(pkg.totalExpenses)
    case "remainingBudget":
      if (fields && answers) {
        return computeRemainingPackageBudget(pkg, fields, answers)
      }
      return Number(pkg.remainingBudget)
    case "villageAllocatedBudget":
      return villageBudgetContext(pkg, villageId)?.allocated ?? 0
    case "villageRemainingBudget":
      if (fields && answers) {
        return computeVillageRemainingBudget(pkg, villageId, fields, answers)
      }
      return villageBudgetContext(pkg, villageId)?.allocated ?? 0
    case "contractorName":
      return pkg.contractor.name
    case "consultantName":
      return pkg.consultant.name
    case "tehsilName":
      return pkg.tehsil.displayName || pkg.tehsil.name
    default:
      return ""
  }
}

export function resolveComputedFieldValue(
  field: SurveyField,
  pkg: ProcurementPackage,
  fields: SurveyField[],
  answers: Record<string, unknown>,
  villageId?: string | null,
): number | null {
  if (field.config?.computedRemainingBudget) {
    return computeRemainingPackageBudget(pkg, fields, answers)
  }
  if (field.config?.computedVillageRemainingBudget) {
    return computeVillageRemainingBudget(pkg, villageId, fields, answers)
  }
  if (field.config?.computedVisitDeductions) {
    return sumBudgetEffectsFromAnswers(fields, answers, { effect: "DEDUCT" })
  }
  return null
}

export function buildPackageFieldAnswers(
  fields: SurveyField[],
  pkg: ProcurementPackage,
  answers: Record<string, unknown> = {},
  villageId?: string | null,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const field of fields) {
    const reference = field.config?.packageReference
    if (reference) {
      result[field.id] = resolvePackageFieldValue(reference, pkg, fields, answers, villageId)
      continue
    }
    const computed = resolveComputedFieldValue(field, pkg, fields, answers, villageId)
    if (computed !== null) {
      result[field.id] = computed
    }
  }
  return result
}
