import { Injectable } from '@nestjs/common';
import { ProcurementPackage } from '../../domain/entities/procurement-package.entity';
import {
  PackageFieldReference,
  SurveyField,
  SurveyFieldConfig,
} from '../../domain/entities/survey.entity';
import { PACKAGE_FIELD_REFERENCE_FIELD_TYPES } from '../constants/package-field-references';
import { SurveyAnswerInput } from '../ports/survey-response.repository.port';
import {
  computeRemainingPackageBudget,
  sumBudgetEffectsFromAnswers,
} from './survey-budget.effects';

@Injectable()
export class PackageFieldReferenceResolver {
  resolve(
    reference: PackageFieldReference,
    pkg: ProcurementPackage,
    fields?: SurveyField[],
    answers?: SurveyAnswerInput[],
  ): unknown {
    switch (reference) {
      case 'packageName':
        return pkg.name;
      case 'budgetAmount':
        return Number(pkg.budgetAmount);
      case 'totalExpenses':
        if (fields && answers) {
          const inForm = sumBudgetEffectsFromAnswers(fields, answers);
          return Number(pkg.totalExpenses) + inForm;
        }
        return Number(pkg.totalExpenses);
      case 'remainingBudget':
        if (fields && answers) {
          return computeRemainingPackageBudget(
            pkg.budgetAmount,
            pkg.totalExpenses,
            fields,
            answers,
          );
        }
        return Number(pkg.remainingBudget);
      case 'contractorName':
        return pkg.contractor.name;
      case 'consultantName':
        return pkg.consultant.name;
      case 'tehsilName':
        return pkg.tehsil.displayName || pkg.tehsil.name;
      default:
        return null;
    }
  }

  isPackageBoundField(field: SurveyField): boolean {
    return Boolean(field.config?.packageReference);
  }

  applyToAnswers(
    fields: SurveyField[],
    answers: SurveyAnswerInput[],
    pkg: ProcurementPackage,
  ): SurveyAnswerInput[] {
    const answerByField = new Map(
      answers.map((answer) => [answer.fieldId, answer.value]),
    );

    for (const field of fields) {
      const reference = field.config?.packageReference;
      if (!reference) continue;

      const expectedType = PACKAGE_FIELD_REFERENCE_FIELD_TYPES[reference];
      if (field.type !== expectedType) continue;

      answerByField.set(
        field.id,
        this.resolve(reference, pkg, fields, answers),
      );
    }

    for (const field of fields) {
      if (field.config?.computedRemainingBudget) {
        answerByField.set(
          field.id,
          computeRemainingPackageBudget(
            pkg.budgetAmount,
            pkg.totalExpenses,
            fields,
            answers,
          ),
        );
      }
      if (field.config?.computedVisitDeductions) {
        answerByField.set(
          field.id,
          sumBudgetEffectsFromAnswers(fields, answers, { effect: 'DEDUCT' }),
        );
      }
    }

    return Array.from(answerByField.entries()).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));
  }

  normalizeConfig(
    fieldType: SurveyField['type'],
    config: SurveyFieldConfig | null | undefined,
    errors: string[],
    position: number,
  ): SurveyFieldConfig | null {
    const next: SurveyFieldConfig = { ...(config ?? {}) };
    const reference = next.packageReference;

    if (!reference) {
      delete next.packageReference;
      delete next.readOnly;
      delete next.snapshotOnSubmit;
      return Object.keys(next).length > 0 ? next : null;
    }

    const expectedType = PACKAGE_FIELD_REFERENCE_FIELD_TYPES[reference];
    if (fieldType !== expectedType) {
      errors.push(
        `Field ${position}: "${reference}" must use a ${expectedType} field.`,
      );
    }

    next.readOnly = true;
    if (next.snapshotOnSubmit === undefined) {
      next.snapshotOnSubmit = true;
    }

    delete next.options;
    delete next.minSelected;
    delete next.maxSelected;

    return next;
  }
}
