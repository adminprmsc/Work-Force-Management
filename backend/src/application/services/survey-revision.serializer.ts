import {
  SurveyField,
  SurveyFieldConfig,
  SurveyFieldType,
  SurveyForm,
  SurveyFormBaselineField,
  SurveyFormRevision,
} from '../../domain/entities/survey.entity';

type RevisionFieldJson = {
  id: string;
  type: string;
  label: string;
  helpText?: string | null;
  required: boolean;
  order: number;
  config?: SurveyFieldConfig | null;
  writeOnce?: boolean;
};

export function serializeRevisionFields(
  fields: SurveyField[],
): RevisionFieldJson[] {
  return fields.map((field) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    order: field.order,
    config: field.config,
  }));
}

export function serializeRevisionBaselineFields(
  fields: SurveyFormBaselineField[],
): RevisionFieldJson[] {
  return fields.map((field) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    writeOnce: field.writeOnce,
    order: field.order,
    config: field.config,
  }));
}

export function parseRevisionFields(raw: unknown): SurveyField[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const field = item as RevisionFieldJson;
    return new SurveyField(
      field.id,
      field.type as SurveyFieldType,
      field.label,
      field.helpText ?? null,
      Boolean(field.required),
      field.order,
      (field.config as SurveyFieldConfig | null) ?? null,
    );
  });
}

export function parseRevisionBaselineFields(
  raw: unknown,
): SurveyFormBaselineField[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const field = item as RevisionFieldJson;
    return new SurveyFormBaselineField(
      field.id,
      field.type as SurveyFieldType,
      field.label,
      field.helpText ?? null,
      Boolean(field.required),
      Boolean(field.writeOnce),
      field.order,
      (field.config as SurveyFieldConfig | null) ?? null,
    );
  });
}

export function revisionFromForm(
  record: {
    id: string;
    formId: string;
    version: number;
    title: string;
    description: string | null;
    requiresPackageBaseline: boolean;
    baselineTitle: string | null;
    baselineDescription: string | null;
    fields: unknown;
    baselineFields: unknown;
    publishedAt: Date;
    createdAt: Date;
  },
): SurveyFormRevision {
  return new SurveyFormRevision(
    record.id,
    record.formId,
    record.version,
    record.title,
    record.description,
    record.requiresPackageBaseline,
    record.baselineTitle,
    record.baselineDescription,
    parseRevisionFields(record.fields),
    parseRevisionBaselineFields(record.baselineFields),
    record.publishedAt,
    record.createdAt,
  );
}

export function revisionSnapshotFromForm(form: SurveyForm): {
  title: string;
  description: string | null;
  requiresPackageBaseline: boolean;
  baselineTitle: string | null;
  baselineDescription: string | null;
  fields: RevisionFieldJson[];
  baselineFields: RevisionFieldJson[];
} {
  return {
    title: form.title,
    description: form.description,
    requiresPackageBaseline: form.requiresPackageBaseline,
    baselineTitle: form.baselineTitle,
    baselineDescription: form.baselineDescription,
    fields: serializeRevisionFields(form.fields),
    baselineFields: serializeRevisionBaselineFields(form.baselineFields),
  };
}
