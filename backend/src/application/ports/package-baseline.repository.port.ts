import { SurveyFormBaselineField } from '../../domain/entities/survey.entity';

export type PackageBaselineAnswerInput = {
  fieldId: string;
  value: unknown;
};

export type PackageBaselineCompletion = {
  isBaselineComplete: boolean;
};

export type PackageFormBaselineState = {
  packageId: string;
  formId: string;
  formTitle: string;
  baselineTitle: string | null;
  baselineDescription: string | null;
  fields: SurveyFormBaselineField[];
  answers: { fieldId: string; value: unknown }[];
  isBaselineComplete: boolean;
  submittedAt: Date | null;
  submittedBy: { id: string; username: string; email: string } | null;
  updatedAt: Date | null;
};

export type PackageBaselineFormSummary = {
  formId: string;
  formTitle: string;
  baselineTitle: string | null;
  isBaselineComplete: boolean;
};

export abstract class PackageBaselineRepositoryPort {
  abstract getState(
    packageId: string,
    formId: string,
  ): Promise<PackageFormBaselineState | null>;

  abstract saveAnswers(
    packageId: string,
    formId: string,
    answers: PackageBaselineAnswerInput[],
    submittedById: string,
  ): Promise<PackageFormBaselineState>;

  abstract getCompletionBatch(
    pairs: { packageId: string; formId: string }[],
  ): Promise<Map<string, PackageBaselineCompletion>>;

  abstract isBaselineComplete(
    packageId: string,
    formId: string,
  ): Promise<boolean>;
}

export const PACKAGE_BASELINE_REPOSITORY = Symbol(
  'PACKAGE_BASELINE_REPOSITORY',
);
