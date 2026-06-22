import {
  PackageFieldReference,
  SurveyFieldType,
} from '../../domain/entities/survey.entity';

export const PACKAGE_FIELD_REFERENCES: PackageFieldReference[] = [
  'packageName',
  'budgetAmount',
  'totalExpenses',
  'remainingBudget',
  'contractorName',
  'consultantName',
  'tehsilName',
];

export const PACKAGE_FIELD_REFERENCE_LABELS: Record<
  PackageFieldReference,
  string
> = {
  packageName: 'Package name',
  budgetAmount: 'Total budget',
  totalExpenses: 'Total expenses',
  remainingBudget: 'Remaining budget',
  contractorName: 'Contractor name',
  consultantName: 'Consultant name',
  tehsilName: 'Tehsil name',
};

export const PACKAGE_FIELD_REFERENCE_FIELD_TYPES: Record<
  PackageFieldReference,
  SurveyFieldType.TEXT | SurveyFieldType.NUMBER
> = {
  packageName: SurveyFieldType.TEXT,
  budgetAmount: SurveyFieldType.NUMBER,
  totalExpenses: SurveyFieldType.NUMBER,
  remainingBudget: SurveyFieldType.NUMBER,
  contractorName: SurveyFieldType.TEXT,
  consultantName: SurveyFieldType.TEXT,
  tehsilName: SurveyFieldType.TEXT,
};

export function isPackageFieldReference(
  value: string,
): value is PackageFieldReference {
  return (PACKAGE_FIELD_REFERENCES as string[]).includes(value);
}
