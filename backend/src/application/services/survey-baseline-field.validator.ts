import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SurveyField,
  SurveyFormBaselineField,
} from '../../domain/entities/survey.entity';
import { SurveyFormBaselineFieldInput } from '../ports/survey-form.repository.port';
import { SurveyAnswerValidator } from './survey-answer.validator';

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

@Injectable()
export class SurveyBaselineFieldValidator {
  constructor(private readonly answerValidator: SurveyAnswerValidator) {}

  validateAndNormalize(
    fields: SurveyFormBaselineFieldInput[],
    options: { forPublish: boolean; requiresBaseline: boolean },
  ): SurveyFormBaselineFieldInput[] {
    if (!options.requiresBaseline) {
      return [];
    }

    const errors: string[] = [];
    if (options.forPublish && fields.length === 0) {
      errors.push(
        'Add at least one package baseline field before publishing a village monitoring form.',
      );
    }

    const normalized = [...fields]
      .sort((a, b) => a.order - b.order)
      .map((field, index) => {
        const label = (field.label ?? '').trim();
        if (!label) {
          errors.push(`Baseline field ${index + 1}: label is required.`);
        }
        return {
          ...field,
          label,
          helpText: field.helpText?.trim() || null,
          required: Boolean(field.required),
          writeOnce: Boolean(field.writeOnce),
          order: index,
        };
      });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return normalized;
  }

  validateAnswers(
    fields: SurveyFormBaselineField[],
    answers: { fieldId: string; value: unknown }[],
    existingAnswers: Map<string, unknown>,
  ): { fieldId: string; value: unknown }[] {
    const asSurveyFields = fields.map(
      (field) =>
        new SurveyField(
          field.id,
          field.type,
          field.label,
          field.helpText,
          field.required,
          field.order,
          field.config,
        ),
    );

    const locked = new Set<string>();
    for (const field of fields) {
      if (field.writeOnce && !isEmpty(existingAnswers.get(field.id))) {
        locked.add(field.id);
      }
    }

    const mutableAnswers = answers.filter((a) => !locked.has(a.fieldId));
    const cleaned = this.answerValidator.validateForSubmit(
      asSurveyFields,
      mutableAnswers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
    );

    const merged = new Map<string, unknown>();
    for (const [fieldId, value] of existingAnswers) {
      if (locked.has(fieldId)) merged.set(fieldId, value);
    }
    for (const answer of cleaned) {
      merged.set(answer.fieldId, answer.value);
    }

    return fields
      .filter((f) => merged.has(f.id))
      .map((f) => ({ fieldId: f.id, value: merged.get(f.id) }));
  }
}
