import { BadRequestException, Injectable } from '@nestjs/common';
import { ProcurementPackage } from '../../domain/entities/procurement-package.entity';
import {
  PRESENTATION_FIELD_TYPES,
  SurveyField,
  SurveyFieldType,
} from '../../domain/entities/survey.entity';
import { SurveyAnswerInput } from '../ports/survey-response.repository.port';
import { PackageFieldReferenceResolver } from './package-field-reference.resolver';

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isValidPakistaniMobile(raw: string): boolean {
  const cleaned = raw.replace(/[\s-]/g, '');
  return (
    /^03\d{9}$/.test(cleaned) ||
    /^\+923\d{9}$/.test(cleaned) ||
    /^00923\d{9}$/.test(cleaned) ||
    /^923\d{9}$/.test(cleaned)
  );
}

@Injectable()
export class SurveyAnswerValidator {
  constructor(
    private readonly packageFieldResolver: PackageFieldReferenceResolver,
  ) {}

  /**
   * Validates submitted answers against the form's field definitions.
   * Throws BadRequestException with all field errors aggregated.
   * Returns the cleaned answers to persist (presentational fields dropped).
   */
  validateForSubmit(
    fields: SurveyField[],
    answers: SurveyAnswerInput[],
    pkg?: ProcurementPackage | null,
  ): SurveyAnswerInput[] {
    const prepared =
      pkg !== undefined && pkg !== null
        ? this.packageFieldResolver.applyToAnswers(fields, answers, pkg)
        : answers;
    const errors: string[] = [];
    const fieldById = new Map(fields.map((field) => [field.id, field]));
    const answerByField = new Map<string, unknown>();

    for (const answer of prepared) {
      const field = fieldById.get(answer.fieldId);
      if (!field) {
        errors.push(`Answer references an unknown field (${answer.fieldId}).`);
        continue;
      }
      if (PRESENTATION_FIELD_TYPES.includes(field.type)) {
        continue;
      }
      answerByField.set(answer.fieldId, answer.value);
    }

    const cleaned: SurveyAnswerInput[] = [];

    for (const field of fields) {
      if (PRESENTATION_FIELD_TYPES.includes(field.type)) continue;

      const value = answerByField.get(field.id);

      if (isEmpty(value)) {
        if (field.required) {
          errors.push(`"${field.label}" is required.`);
        }
        continue;
      }

      const normalized = this.validateValue(field, value, errors);
      if (normalized !== undefined) {
        cleaned.push({ fieldId: field.id, value: normalized });
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return cleaned;
  }

  private validateValue(
    field: SurveyField,
    value: unknown,
    errors: string[],
  ): unknown {
    const label = field.label;
    const config = field.config ?? {};

    switch (field.type) {
      case SurveyFieldType.TEXT:
      case SurveyFieldType.PARAGRAPH: {
        if (typeof value !== 'string') {
          errors.push(`"${label}" must be text.`);
          return undefined;
        }
        const text = value.trim();
        if (config.minLength !== undefined && text.length < config.minLength) {
          errors.push(
            `"${label}" must be at least ${config.minLength} characters.`,
          );
        }
        if (config.maxLength !== undefined && text.length > config.maxLength) {
          errors.push(
            `"${label}" must be at most ${config.maxLength} characters.`,
          );
        }
        return text;
      }

      case SurveyFieldType.NUMBER: {
        const num = typeof value === 'string' ? Number(value) : value;
        if (typeof num !== 'number' || Number.isNaN(num)) {
          errors.push(`"${label}" must be a number.`);
          return undefined;
        }
        if (config.integer && !Number.isInteger(num)) {
          errors.push(`"${label}" must be a whole number.`);
        }
        if (config.min !== undefined && num < config.min) {
          errors.push(`"${label}" must be at least ${config.min}.`);
        }
        if (config.max !== undefined && num > config.max) {
          errors.push(`"${label}" must be at most ${config.max}.`);
        }
        return num;
      }

      case SurveyFieldType.DATE: {
        if (
          typeof value !== 'string' ||
          !DATE_REGEX.test(value) ||
          Number.isNaN(Date.parse(value))
        ) {
          errors.push(`"${label}" must be a valid date (YYYY-MM-DD).`);
          return undefined;
        }
        return value;
      }

      case SurveyFieldType.TIME: {
        if (typeof value !== 'string' || !TIME_REGEX.test(value)) {
          errors.push(`"${label}" must be a valid time (HH:mm).`);
          return undefined;
        }
        return value;
      }

      case SurveyFieldType.CNIC: {
        if (typeof value !== 'string' || !CNIC_REGEX.test(value.trim())) {
          errors.push(`"${label}" must be a valid CNIC (#####-#######-#).`);
          return undefined;
        }
        return value.trim();
      }

      case SurveyFieldType.CONTACT: {
        if (typeof value !== 'string' || !isValidPakistaniMobile(value)) {
          errors.push(`"${label}" must be a valid Pakistani mobile number.`);
          return undefined;
        }
        return value.trim();
      }

      case SurveyFieldType.EMAIL: {
        if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim())) {
          errors.push(`"${label}" must be a valid email address.`);
          return undefined;
        }
        return value.trim().toLowerCase();
      }

      case SurveyFieldType.MULTIPLE_CHOICE:
      case SurveyFieldType.DROPDOWN: {
        const allowed = new Set((config.options ?? []).map((o) => o.value));
        if (typeof value !== 'string' || !allowed.has(value)) {
          errors.push(`"${label}" has an invalid selection.`);
          return undefined;
        }
        return value;
      }

      case SurveyFieldType.CHECKBOXES: {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
          errors.push(`"${label}" must be a list of selections.`);
          return undefined;
        }
        const allowed = new Set((config.options ?? []).map((o) => o.value));
        const selections = value as string[];
        const unique = Array.from(new Set(selections));
        for (const selection of unique) {
          if (!allowed.has(selection)) {
            errors.push(`"${label}" has an invalid selection.`);
            return undefined;
          }
        }
        if (
          config.minSelected !== undefined &&
          unique.length < config.minSelected
        ) {
          errors.push(
            `"${label}" requires at least ${config.minSelected} selection(s).`,
          );
        }
        if (
          config.maxSelected !== undefined &&
          unique.length > config.maxSelected
        ) {
          errors.push(
            `"${label}" allows at most ${config.maxSelected} selection(s).`,
          );
        }
        return unique;
      }

      case SurveyFieldType.FILE:
      case SurveyFieldType.IMAGE: {
        const file = value as { url?: unknown; name?: unknown } | null;
        if (
          !file ||
          typeof file !== 'object' ||
          typeof file.url !== 'string' ||
          file.url.trim().length === 0
        ) {
          errors.push(`"${label}" must include an uploaded file reference.`);
          return undefined;
        }
        return value;
      }

      default:
        return value;
    }
  }
}
