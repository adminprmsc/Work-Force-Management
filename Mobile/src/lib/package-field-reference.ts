import type { ProcurementPackage, SurveyField } from '@/modules/api/types';

// Mirrors the backend PackageFieldReferenceResolver so package-bound, read-only
// fields (e.g. remaining budget) show their value live in the app instead of
// waiting for the server to resolve them on save/submit.

function villageBudgetContext(
  pkg: ProcurementPackage,
  villageId: string | null | undefined,
): { allocated: number; spent: number } | null {
  if (!villageId) return null;
  const village = pkg.villages.find((v) => v.id === villageId);
  if (!village) return null;
  return {
    allocated: Number(village.allocatedBudget),
    spent: Number(village.spent),
  };
}

export function numericAnswerValue(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sumBudgetEffectsFromAnswers(
  fields: SurveyField[],
  answers: Record<string, unknown>,
  options?: { effect?: 'DEDUCT' | 'ADD' },
): number {
  let total = 0;
  for (const field of fields) {
    const effect = field.config?.budgetEffect;
    if (!effect) continue;
    if (options?.effect && effect !== options.effect) continue;
    const value = numericAnswerValue(answers[field.id]);
    total += effect === 'DEDUCT' ? value : -value;
  }
  return total;
}

export function computeRemainingPackageBudget(
  pkg: ProcurementPackage,
  fields: SurveyField[],
  answers: Record<string, unknown>,
): number {
  const budget = Number(pkg.budgetAmount);
  const committed = Number(pkg.totalExpenses);
  const inForm = sumBudgetEffectsFromAnswers(fields, answers);
  return budget - committed - inForm;
}

export function computeVillageRemainingBudget(
  pkg: ProcurementPackage,
  villageId: string | null | undefined,
  fields: SurveyField[],
  answers: Record<string, unknown>,
): number {
  const context = villageBudgetContext(pkg, villageId);
  if (!context) return 0;
  const inForm = sumBudgetEffectsFromAnswers(fields, answers);
  return context.allocated - context.spent - inForm;
}

export function resolvePackageFieldValue(
  reference: string,
  pkg: ProcurementPackage,
  fields: SurveyField[],
  answers: Record<string, unknown>,
  villageId?: string | null,
): string | number {
  switch (reference) {
    case 'packageName':
      return pkg.name;
    case 'budgetAmount':
      return Number(pkg.budgetAmount);
    case 'totalExpenses':
      return Number(pkg.totalExpenses) + sumBudgetEffectsFromAnswers(fields, answers);
    case 'remainingBudget':
      return computeRemainingPackageBudget(pkg, fields, answers);
    case 'villageAllocatedBudget':
      return villageBudgetContext(pkg, villageId)?.allocated ?? 0;
    case 'villageRemainingBudget':
      return computeVillageRemainingBudget(pkg, villageId, fields, answers);
    case 'contractorName':
      return pkg.contractor.name;
    case 'consultantName':
      return pkg.consultant.name;
    case 'tehsilName':
      return pkg.tehsil.displayName || pkg.tehsil.name;
    default:
      return '';
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
    return computeRemainingPackageBudget(pkg, fields, answers);
  }
  if (field.config?.computedVillageRemainingBudget) {
    return computeVillageRemainingBudget(pkg, villageId, fields, answers);
  }
  if (field.config?.computedVisitDeductions) {
    return sumBudgetEffectsFromAnswers(fields, answers, { effect: 'DEDUCT' });
  }
  return null;
}

// Resolve every package-bound / computed field for the given package + answers.
export function buildPackageFieldAnswers(
  fields: SurveyField[],
  pkg: ProcurementPackage,
  answers: Record<string, unknown> = {},
  villageId?: string | null,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const reference = field.config?.packageReference;
    if (reference) {
      result[field.id] = resolvePackageFieldValue(reference, pkg, fields, answers, villageId);
      continue;
    }
    const computed = resolveComputedFieldValue(field, pkg, fields, answers, villageId);
    if (computed !== null) {
      result[field.id] = computed;
    }
  }
  return result;
}
