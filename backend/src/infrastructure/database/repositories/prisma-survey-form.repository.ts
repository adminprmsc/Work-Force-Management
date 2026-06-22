import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SurveyField,
  SurveyFieldConfig,
  SurveyFieldType,
  SurveyForm,
  SurveyFormAuthorRef,
  SurveyFormBaselineField,
  SurveyStatus,
} from '../../../domain/entities/survey.entity';
import {
  CreateSurveyFormData,
  ListSurveyFormsFilter,
  SurveyFieldInput,
  SurveyFormBaselineFieldInput,
  SurveyFormRepositoryPort,
  UpdateSurveyFormData,
} from '../../../application/ports/survey-form.repository.port';
import { PrismaService } from '../prisma/prisma.service';

const surveyFormInclude = {
  createdBy: { select: { id: true, username: true, email: true } },
  fields: { orderBy: { order: 'asc' as const } },
  baselineFields: { orderBy: { order: 'asc' as const } },
  currentRevision: { select: { version: true } },
  _count: { select: { assignments: true, responses: true } },
} satisfies Prisma.SurveyFormInclude;

type SurveyFormWithRelations = Prisma.SurveyFormGetPayload<{
  include: typeof surveyFormInclude;
}>;

type PrismaFieldRecord = {
  id: string;
  type: string;
  label: string;
  helpText: string | null;
  required: boolean;
  order: number;
  config: Prisma.JsonValue | null;
};

type PrismaBaselineFieldRecord = PrismaFieldRecord & { writeOnce: boolean };

type SurveyFormRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  requiresPackageBaseline: boolean;
  baselineTitle: string | null;
  baselineDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; username: string; email: string };
  fields: PrismaFieldRecord[];
  baselineFields: PrismaBaselineFieldRecord[];
  currentRevision: { version: number } | null;
  _count: { assignments: number; responses: number };
};

function configToPrisma(
  config: SurveyFieldConfig | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (config === null || config === undefined) {
    return Prisma.JsonNull;
  }
  return config as unknown as Prisma.InputJsonValue;
}

function mapField(record: PrismaFieldRecord): SurveyField {
  return new SurveyField(
    record.id,
    record.type as SurveyFieldType,
    record.label,
    record.helpText,
    record.required,
    record.order,
    (record.config as SurveyFieldConfig | null) ?? null,
  );
}

function mapBaselineField(
  record: PrismaBaselineFieldRecord,
): SurveyFormBaselineField {
  return new SurveyFormBaselineField(
    record.id,
    record.type as SurveyFieldType,
    record.label,
    record.helpText,
    record.required,
    record.writeOnce,
    record.order,
    (record.config as SurveyFieldConfig | null) ?? null,
  );
}

function mapForm(record: SurveyFormRecord): SurveyForm {
  return new SurveyForm(
    record.id,
    record.title,
    record.description,
    record.status as SurveyStatus,
    record.requiresPackageBaseline,
    record.baselineTitle,
    record.baselineDescription,
    new SurveyFormAuthorRef(
      record.createdBy.id,
      record.createdBy.username,
      record.createdBy.email,
    ),
    record.fields.map(mapField),
    record.baselineFields.map(mapBaselineField),
    record._count.assignments,
    record._count.responses,
    record.currentRevision?.version ?? null,
    record.publishedAt,
    record.createdAt,
    record.updatedAt,
  );
}

function toSurveyFormRecord(record: SurveyFormWithRelations): SurveyFormRecord {
  return record;
}

function fieldCreateData(fields: SurveyFieldInput[]) {
  return fields.map((field) => ({
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? null,
    required: field.required,
    order: field.order,
    config: configToPrisma(field.config),
  }));
}

function baselineFieldCreateData(fields: SurveyFormBaselineFieldInput[]) {
  return fields.map((field) => ({
    ...(field.id ? { id: field.id } : {}),
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? null,
    required: field.required ?? false,
    writeOnce: field.writeOnce ?? false,
    order: field.order,
    config: configToPrisma(field.config),
  }));
}

async function syncBaselineFields(
  tx: Prisma.TransactionClient,
  formId: string,
  fields: SurveyFormBaselineFieldInput[],
): Promise<void> {
  const existing = await tx.surveyFormBaselineField.findMany({
    where: { formId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((field) => field.id));
  const keepIds = new Set<string>();

  for (const field of fields) {
    const data = {
      type: field.type,
      label: field.label,
      helpText: field.helpText ?? null,
      required: field.required ?? false,
      writeOnce: field.writeOnce ?? false,
      order: field.order,
      config: configToPrisma(field.config),
    };

    if (field.id && existingIds.has(field.id)) {
      await tx.surveyFormBaselineField.update({
        where: { id: field.id },
        data,
      });
      keepIds.add(field.id);
    } else {
      const created = await tx.surveyFormBaselineField.create({
        data: {
          ...(field.id ? { id: field.id } : {}),
          formId,
          ...data,
        },
        select: { id: true },
      });
      keepIds.add(created.id);
    }
  }

  const removeIds = existing
    .map((field) => field.id)
    .filter((id) => !keepIds.has(id));
  if (removeIds.length > 0) {
    await tx.procurementPackageBaselineAnswer.deleteMany({
      where: { formId, fieldId: { in: removeIds } },
    });
    await tx.surveyFormBaselineField.deleteMany({
      where: { id: { in: removeIds } },
    });
  }
}

@Injectable()
export class PrismaSurveyFormRepository implements SurveyFormRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = surveyFormInclude;

  async findAll(filter?: ListSurveyFormsFilter): Promise<SurveyForm[]> {
    const records = await this.prisma.surveyForm.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.formIds ? { id: { in: filter.formIds } } : {}),
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => mapForm(toSurveyFormRecord(record)));
  }

  async findById(id: string): Promise<SurveyForm | null> {
    const record = await this.prisma.surveyForm.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? mapForm(toSurveyFormRecord(record)) : null;
  }

  async create(data: CreateSurveyFormData): Promise<SurveyForm> {
    const record = await this.prisma.surveyForm.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        requiresPackageBaseline: data.requiresPackageBaseline ?? false,
        baselineTitle: data.baselineTitle ?? null,
        baselineDescription: data.baselineDescription ?? null,
        createdById: data.createdById,
        fields: { create: fieldCreateData(data.fields) },
        baselineFields: {
          create: baselineFieldCreateData(data.baselineFields ?? []),
        },
      },
      include: this.include,
    });
    return mapForm(toSurveyFormRecord(record));
  }

  async update(id: string, data: UpdateSurveyFormData): Promise<SurveyForm> {
    const record = await this.prisma.$transaction(async (tx) => {
      if (data.fields !== undefined) {
        await tx.surveyField.deleteMany({ where: { formId: id } });
        if (data.fields.length > 0) {
          await tx.surveyField.createMany({
            data: fieldCreateData(data.fields).map((field) => ({
              ...field,
              formId: id,
            })),
          });
        }
      }

      if (data.baselineFields !== undefined) {
        await syncBaselineFields(tx, id, data.baselineFields);
      }

      return tx.surveyForm.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.requiresPackageBaseline !== undefined
            ? { requiresPackageBaseline: data.requiresPackageBaseline }
            : {}),
          ...(data.baselineTitle !== undefined
            ? { baselineTitle: data.baselineTitle }
            : {}),
          ...(data.baselineDescription !== undefined
            ? { baselineDescription: data.baselineDescription }
            : {}),
        },
        include: this.include,
      });
    });

    return mapForm(toSurveyFormRecord(record));
  }

  async updateStatus(
    id: string,
    status: SurveyStatus,
    publishedAt?: Date | null,
  ): Promise<SurveyForm> {
    const record = await this.prisma.surveyForm.update({
      where: { id },
      data: {
        status,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
      include: this.include,
    });
    return mapForm(toSurveyFormRecord(record));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.surveyForm.delete({ where: { id } });
  }
}
