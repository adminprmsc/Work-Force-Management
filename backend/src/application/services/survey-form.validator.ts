import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CHOICE_FIELD_TYPES,
  PRESENTATION_FIELD_TYPES,
  SurveyFieldConfig,
  SurveyFieldType,
} from '../../domain/entities/survey.entity';
import { isPackageFieldReference } from '../constants/package-field-references';
import { SurveyFieldInput } from '../ports/survey-form.repository.port';
import { PackageFieldReferenceResolver } from './package-field-reference.resolver';
import {
  isChoiceControllerType,
  normalizeVisibleWhen,
  stripVisibleWhenFromConfig,
} from './survey-field-visibility';

const VALID_FIELD_TYPES = new Set<string>(Object.values(SurveyFieldType));
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SurveyFormValidator {
  constructor(
    private readonly packageFieldResolver: PackageFieldReferenceResolver,
  ) {}
  /**
   * Validates and normalizes a form's field definitions. `forPublish` enforces
   * the stricter rules required before a form can collect responses.
   * Returns the normalized fields (trimmed, ordered 0..n).
   */
  validateAndNormalize(
    fields: SurveyFieldInput[],
    options: { forPublish: boolean },
  ): SurveyFieldInput[] {
    const errors: string[] = [];

    if (options.forPublish) {
      const answerable = fields.filter(
        (field) => !PRESENTATION_FIELD_TYPES.includes(field.type),
      );
      if (answerable.length === 0) {
        errors.push('A form must have at least one answerable field.');
      }
    }

    const normalized = [...fields]
      .sort((a, b) => a.order - b.order)
      .map((field, index) =>
        this.normalizeField(field, index, options, errors),
      );

    this.validateVisibleWhenRules(normalized, options, errors);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return normalized;
  }

  private normalizeField(
    field: SurveyFieldInput,
    index: number,
    options: { forPublish: boolean },
    errors: string[],
  ): SurveyFieldInput {
    const label = (field.label ?? '').trim();
    const position = index + 1;

    if (!VALID_FIELD_TYPES.has(field.type)) {
      errors.push(`Field ${position}: unsupported type "${field.type}".`);
    }

    if (!label) {
      errors.push(`Field ${position}: label is required.`);
    }

    if (field.id !== undefined && field.id !== null && field.id !== '') {
      if (!UUID_REGEX.test(field.id)) {
        errors.push(`Field ${position}: id must be a valid UUID.`);
      }
    }

    if (
      field.config?.packageReference &&
      !isPackageFieldReference(field.config.packageReference)
    ) {
      errors.push(`Field ${position}: unsupported package reference.`);
    }

    const config = this.normalizeConfig(field, position, options, errors);

    const input: SurveyFieldInput = {
      type: field.type,
      label,
      helpText: field.helpText ? field.helpText.trim() : null,
      required: PRESENTATION_FIELD_TYPES.includes(field.type)
        ? false
        : Boolean(field.required),
      order: index,
      config,
    };
    if (typeof field.id === 'string' && field.id.length > 0) {
      input.id = field.id;
    }
    return input;
  }

  private normalizeConfig(
    field: SurveyFieldInput,
    position: number,
    options: { forPublish: boolean },
    errors: string[],
  ): SurveyFieldConfig | null {
    const withPackage = this.packageFieldResolver.normalizeConfig(
      field.type,
      field.config,
      errors,
      position,
    );
    if (withPackage?.packageReference) {
      return stripVisibleWhenFromConfig(field.type, withPackage);
    }

    const config: SurveyFieldConfig = { ...(field.config ?? {}) };

    if (field.type === SurveyFieldType.SECTION_BREAK) {
      const visibleWhen = normalizeVisibleWhen(config.visibleWhen);
      if (visibleWhen) {
        config.visibleWhen = visibleWhen;
      } else {
        delete config.visibleWhen;
      }
      // Sections only carry visibility rules in config for now.
      const sectionConfig: SurveyFieldConfig = {};
      if (config.visibleWhen) {
        sectionConfig.visibleWhen = config.visibleWhen;
      }
      return Object.keys(sectionConfig).length > 0 ? sectionConfig : null;
    }

    delete config.visibleWhen;

    if (field.type === SurveyFieldType.NUMBER) {
      return this.normalizeNumberConfig(config, position, errors);
    }

    if (CHOICE_FIELD_TYPES.includes(field.type)) {
      const rawOptions = config.options ?? [];
      const cleaned = rawOptions
        .map((option) => ({
          value: (option?.value ?? '').toString().trim(),
          label: (option?.label ?? option?.value ?? '').toString().trim(),
        }))
        .filter((option) => option.value.length > 0);

      const seen = new Set<string>();
      for (const option of cleaned) {
        if (seen.has(option.value)) {
          errors.push(
            `Field ${position}: duplicate option value "${option.value}".`,
          );
        }
        seen.add(option.value);
      }

      if (cleaned.length === 0 && options.forPublish) {
        errors.push(`Field ${position}: at least one option is required.`);
      }

      config.options = cleaned;
    } else {
      delete config.options;
    }

    if (
      field.type === SurveyFieldType.TEXT ||
      field.type === SurveyFieldType.PARAGRAPH
    ) {
      if (
        config.minLength !== undefined &&
        config.maxLength !== undefined &&
        config.minLength > config.maxLength
      ) {
        errors.push(
          `Field ${position}: minLength cannot be greater than maxLength.`,
        );
      }
    }

    return Object.keys(config).length > 0 ? config : null;
  }

  private validateVisibleWhenRules(
    fields: SurveyFieldInput[],
    options: { forPublish: boolean },
    errors: string[],
  ): void {
    const byId = new Map(
      fields
        .filter((field) => typeof field.id === 'string')
        .map((field) => [field.id as string, field]),
    );

    for (let index = 0; index < fields.length; index++) {
      const field = fields[index];
      const rule = field.config?.visibleWhen;
      if (!rule) continue;

      const position = index + 1;
      if (field.type !== SurveyFieldType.SECTION_BREAK) {
        errors.push(
          `Field ${position}: visibleWhen is only allowed on section breaks.`,
        );
        continue;
      }

      if (!field.id) {
        errors.push(
          `Field ${position}: section with visibleWhen must include a stable field id.`,
        );
      }

      const controller = byId.get(rule.fieldId);
      if (!controller) {
        errors.push(
          `Field ${position}: visibleWhen references an unknown field.`,
        );
        continue;
      }

      if ((controller.order ?? 0) >= index) {
        errors.push(
          `Field ${position}: visibleWhen must reference a question that appears before this section.`,
        );
      }

      if (!isChoiceControllerType(controller.type)) {
        errors.push(
          `Field ${position}: visibleWhen controller must be a choice question (Yes/No, multiple choice, or dropdown).`,
        );
        continue;
      }

      const allowed = new Set(
        (controller.config?.options ?? []).map((option) => option.value),
      );
      const expected = Array.isArray(rule.equals) ? rule.equals : [rule.equals];
      for (const value of expected) {
        if (allowed.size > 0 && !allowed.has(value)) {
          errors.push(
            `Field ${position}: visibleWhen value "${value}" is not an option on the controlling question.`,
          );
        }
      }

      if (options.forPublish && allowed.size === 0) {
        errors.push(
          `Field ${position}: controlling question for visibleWhen needs options before publish.`,
        );
      }
    }
  }

  private normalizeNumberConfig(
    config: SurveyFieldConfig,
    position: number,
    errors: string[],
  ): SurveyFieldConfig | null {
    const next: SurveyFieldConfig = { ...config };

    if (
      next.computedRemainingBudget ||
      next.computedVillageRemainingBudget ||
      next.computedVisitDeductions
    ) {
      delete next.budgetEffect;
      delete next.packageReference;
      next.readOnly = true;
      return next;
    }

    if (next.budgetEffect) {
      if (next.budgetEffect !== 'DEDUCT' && next.budgetEffect !== 'ADD') {
        errors.push(`Field ${position}: invalid budget effect.`);
      }
      delete next.packageReference;
      delete next.computedRemainingBudget;
      delete next.computedVillageRemainingBudget;
      delete next.computedVisitDeductions;
      return Object.keys(next).length > 0 ? next : null;
    }

    delete next.computedRemainingBudget;
    delete next.computedVillageRemainingBudget;
    delete next.computedVisitDeductions;
    delete next.budgetEffect;

    if (
      next.min !== undefined &&
      next.max !== undefined &&
      next.min > next.max
    ) {
      errors.push(`Field ${position}: min cannot be greater than max.`);
    }

    return Object.keys(next).length > 0 ? next : null;
  }
}
