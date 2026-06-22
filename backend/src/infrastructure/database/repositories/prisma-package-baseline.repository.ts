import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SurveyFieldConfig,
  SurveyFieldType,
  SurveyFormBaselineField,
} from '../../../domain/entities/survey.entity';
import {
  PackageBaselineAnswerInput,
  PackageBaselineCompletion,
  PackageBaselineRepositoryPort,
  PackageFormBaselineState,
} from '../../../application/ports/package-baseline.repository.port';
import {
  completionKey,
  isBaselineComplete,
} from '../../../application/services/package-baseline.completion';
import { PrismaService } from '../prisma/prisma.service';

type BaselineFieldRecord = {
  id: string;
  type: string;
  label: string;
  helpText: string | null;
  required: boolean;
  writeOnce: boolean;
  order: number;
  config: unknown;
};

type AnswerRecord = {
  fieldId: string;
  value: unknown;
  updatedAt: Date;
  submittedBy: { id: string; username: string; email: string } | null;
};

function mapBaselineField(
  record: BaselineFieldRecord,
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

function buildState(
  packageId: string,
  form: {
    id: string;
    title: string;
    baselineTitle: string | null;
    baselineDescription: string | null;
    baselineFields: BaselineFieldRecord[];
  },
  answers: AnswerRecord[],
): PackageFormBaselineState {
  const answerMap = new Map<string, unknown>();
  for (const answer of answers) {
    answerMap.set(answer.fieldId, answer.value);
  }

  const fields = form.baselineFields.map(mapBaselineField);
  const latest = answers.reduce<Date | null>((max, answer) => {
    if (!max || answer.updatedAt > max) return answer.updatedAt;
    return max;
  }, null);

  const submitter = answers.find((a) => a.submittedBy)?.submittedBy ?? null;
  const complete = isBaselineComplete(fields, answerMap);

  return {
    packageId,
    formId: form.id,
    formTitle: form.title,
    baselineTitle: form.baselineTitle,
    baselineDescription: form.baselineDescription,
    fields,
    answers: answers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
    isBaselineComplete: complete,
    submittedAt: complete ? latest : null,
    submittedBy: complete ? submitter : null,
    updatedAt: latest,
  };
}

@Injectable()
export class PrismaPackageBaselineRepository implements PackageBaselineRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly formInclude = {
    baselineFields: { orderBy: { order: 'asc' as const } },
  } as const;

  async getState(
    packageId: string,
    formId: string,
  ): Promise<PackageFormBaselineState | null> {
    const form = await this.prisma.surveyForm.findUnique({
      where: { id: formId },
      select: {
        id: true,
        title: true,
        baselineTitle: true,
        baselineDescription: true,
        requiresPackageBaseline: true,
        baselineFields: this.formInclude.baselineFields,
      },
    });
    if (!form || !form.requiresPackageBaseline) return null;

    const answers = await this.prisma.procurementPackageBaselineAnswer.findMany(
      {
        where: { packageId, formId },
        select: {
          fieldId: true,
          value: true,
          updatedAt: true,
          submittedBy: {
            select: { id: true, username: true, email: true },
          },
        },
      },
    );

    return buildState(packageId, form, answers);
  }

  async saveAnswers(
    packageId: string,
    formId: string,
    answers: PackageBaselineAnswerInput[],
    submittedById: string,
  ): Promise<PackageFormBaselineState> {
    const now = new Date();
    await this.prisma.$transaction(
      answers.map((answer) =>
        this.prisma.procurementPackageBaselineAnswer.upsert({
          where: {
            packageId_fieldId: { packageId, fieldId: answer.fieldId },
          },
          create: {
            packageId,
            formId,
            fieldId: answer.fieldId,
            value: answer.value as Prisma.InputJsonValue,
            submittedById,
          },
          update: {
            value: answer.value as Prisma.InputJsonValue,
            submittedById,
            updatedAt: now,
          },
        }),
      ),
    );

    const state = await this.getState(packageId, formId);
    if (!state) {
      throw new Error('Baseline state unavailable after save');
    }
    return state;
  }

  async getCompletionBatch(
    pairs: { packageId: string; formId: string }[],
  ): Promise<Map<string, PackageBaselineCompletion>> {
    const result = new Map<string, PackageBaselineCompletion>();
    if (pairs.length === 0) return result;

    const formIds = [...new Set(pairs.map((p) => p.formId))];
    const packageIds = [...new Set(pairs.map((p) => p.packageId))];

    const forms = await this.prisma.surveyForm.findMany({
      where: { id: { in: formIds }, requiresPackageBaseline: true },
      select: {
        id: true,
        baselineFields: this.formInclude.baselineFields,
      },
    });
    const fieldsByForm = new Map(
      forms.map((form) => [form.id, form.baselineFields.map(mapBaselineField)]),
    );

    const answers = await this.prisma.procurementPackageBaselineAnswer.findMany(
      {
        where: {
          packageId: { in: packageIds },
          formId: { in: formIds },
        },
        select: { packageId: true, formId: true, fieldId: true, value: true },
      },
    );

    const answersByKey = new Map<string, Map<string, unknown>>();
    for (const answer of answers) {
      const key = completionKey(answer.packageId, answer.formId);
      if (!answersByKey.has(key)) answersByKey.set(key, new Map());
      answersByKey.get(key)!.set(answer.fieldId, answer.value);
    }

    for (const pair of pairs) {
      const key = completionKey(pair.packageId, pair.formId);
      const fields = fieldsByForm.get(pair.formId) ?? [];
      const answerMap: Map<string, unknown> =
        answersByKey.get(key) ?? new Map<string, unknown>();
      result.set(key, {
        isBaselineComplete: isBaselineComplete(fields, answerMap),
      });
    }

    return result;
  }

  async isBaselineComplete(
    packageId: string,
    formId: string,
  ): Promise<boolean> {
    const batch = await this.getCompletionBatch([{ packageId, formId }]);
    return (
      batch.get(completionKey(packageId, formId))?.isBaselineComplete ?? false
    );
  }
}
