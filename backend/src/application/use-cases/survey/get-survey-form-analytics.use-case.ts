import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CHOICE_FIELD_TYPES,
  PRESENTATION_FIELD_TYPES,
  SurveyField,
  SurveyFieldType,
  SurveyResponseStatus,
} from '../../../domain/entities/survey.entity';
import {
  canFillSurveyResponses,
  canReadSurveys,
} from '../../../domain/policies/survey-access.policy';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../presentation/auth/types/auth.types';
import {
  SURVEY_FORM_REPOSITORY,
  SurveyFormRepositoryPort,
} from '../../ports/survey-form.repository.port';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import {
  CesmpAnalyticsService,
  CesmpFormInsights,
} from '../../services/cesmp-analytics.service';

export interface SurveyFormAnalyticsSummary {
  totalResponses: number;
  submitted: number;
  draft: number;
  assignmentCount: number;
  packageCount: number;
}

export interface SurveyFormAnalyticsTehsilRow {
  tehsilId: string;
  tehsilName: string;
  submitted: number;
  draft: number;
  total: number;
}

export interface SurveyFormAnalyticsVillageRow {
  villageId: string;
  villageName: string;
  tehsilId: string;
  tehsilName: string;
  submitted: number;
  draft: number;
  total: number;
}

export interface SurveyFormAnalyticsPackageRow {
  packageId: string;
  packageName: string;
  tehsilId: string;
  tehsilName: string;
  submitted: number;
  draft: number;
  total: number;
}

export interface SurveyFormAnalyticsTimePoint {
  date: string;
  count: number;
}

export interface SurveyFormAnalyticsFieldBreakdown {
  fieldId: string;
  label: string;
  type: SurveyFieldType;
  answeredCount: number;
  choiceCounts?: Record<string, number>;
  numeric?: {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}

export interface SurveyFormAnalyticsFieldMeta {
  id: string;
  label: string;
  type: SurveyFieldType;
  order: number;
  required: boolean;
}

export interface SurveyFormAnalytics {
  form: {
    id: string;
    title: string;
    description: string | null;
    status: string;
  };
  filter: {
    procurementPackageId: string | null;
    procurementPackageName: string | null;
    submittedFrom: string | null;
    submittedTo: string | null;
  };
  fields: SurveyFormAnalyticsFieldMeta[];
  summary: SurveyFormAnalyticsSummary;
  byTehsil: SurveyFormAnalyticsTehsilRow[];
  byVillage: SurveyFormAnalyticsVillageRow[];
  byProcurementPackage: SurveyFormAnalyticsPackageRow[];
  submissionsOverTime: SurveyFormAnalyticsTimePoint[];
  fieldBreakdown: SurveyFormAnalyticsFieldBreakdown[];
  cesmpInsights?: CesmpFormInsights | null;
}

export interface SurveyFormAnalyticsFilterInput {
  procurementPackageId?: string | null;
  submittedFrom?: string | null;
  submittedTo?: string | null;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function buildSubmittedAtFilter(
  submittedFrom?: string | null,
  submittedTo?: string | null,
): Prisma.DateTimeFilter | null {
  const from = parseDateParam(submittedFrom);
  const to = parseDateParam(submittedTo);
  if (!from && !to) return null;
  if (from && to && from.getTime() > to.getTime()) {
    throw new BadRequestException(
      'submittedFrom must be on or before submittedTo',
    );
  }
  return {
    ...(from ? { gte: startOfUtcDay(from) } : {}),
    ...(to ? { lte: endOfUtcDay(to) } : {}),
  };
}

function subDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function buildSubmissionSeries(
  submittedAtValues: (Date | null)[],
  days = 90,
): SurveyFormAnalyticsTimePoint[] {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = formatDateKey(subDays(today, days - 1 - i));
    buckets.set(date, 0);
  }
  for (const submittedAt of submittedAtValues) {
    if (!submittedAt) continue;
    const key = formatDateKey(submittedAt);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

function aggregateChoiceValue(
  counts: Record<string, number>,
  value: unknown,
): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      const key = String(item).trim();
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return;
  }
  if (typeof value === 'object') return;
  if (typeof value === 'string') {
    const key = value.trim();
    if (key) counts[key] = (counts[key] ?? 0) + 1;
    return;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    const key = String(value).trim();
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
}

function buildFieldBreakdown(
  fields: SurveyField[],
  answers: { fieldId: string; value: unknown }[],
): SurveyFormAnalyticsFieldBreakdown[] {
  const answersByField = new Map<string, unknown[]>();
  for (const answer of answers) {
    const list = answersByField.get(answer.fieldId) ?? [];
    list.push(answer.value);
    answersByField.set(answer.fieldId, list);
  }

  return fields
    .filter((field) => !PRESENTATION_FIELD_TYPES.includes(field.type))
    .map((field) => {
      const values = answersByField.get(field.id) ?? [];
      const answeredCount = values.filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          !(typeof value === 'string' && value.trim() === '') &&
          !(Array.isArray(value) && value.length === 0),
      ).length;

      const breakdown: SurveyFormAnalyticsFieldBreakdown = {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answeredCount,
      };

      if (CHOICE_FIELD_TYPES.includes(field.type)) {
        const choiceCounts: Record<string, number> = {};
        for (const value of values) {
          aggregateChoiceValue(choiceCounts, value);
        }
        breakdown.choiceCounts = choiceCounts;
      } else if (field.type === SurveyFieldType.NUMBER) {
        const numbers = values
          .map((value) => (typeof value === 'number' ? value : Number(value)))
          .filter((value) => Number.isFinite(value));
        if (numbers.length > 0) {
          const sum = numbers.reduce((acc, value) => acc + value, 0);
          breakdown.numeric = {
            count: numbers.length,
            sum,
            avg: sum / numbers.length,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
          };
        }
      }

      return breakdown;
    });
}

function buildFieldMeta(fields: SurveyField[]): SurveyFormAnalyticsFieldMeta[] {
  return fields
    .filter((field) => !PRESENTATION_FIELD_TYPES.includes(field.type))
    .map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      order: field.order,
      required: field.required,
    }));
}

@Injectable()
export class GetSurveyFormAnalyticsUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly prisma: PrismaService,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly cesmpAnalytics: CesmpAnalyticsService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    formId: string,
    filterInput: SurveyFormAnalyticsFilterInput = {},
  ): Promise<SurveyFormAnalytics> {
    const procurementPackageId = filterInput.procurementPackageId ?? null;
    const submittedFrom = filterInput.submittedFrom ?? null;
    const submittedTo = filterInput.submittedTo ?? null;
    const submittedAtFilter = buildSubmittedAtFilter(
      submittedFrom,
      submittedTo,
    );
    const hasDateFilter = submittedAtFilter !== null;
    const actor = await this.scopeResolver.resolve(user);
    if (!canReadSurveys(actor.role) || canFillSurveyResponses(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    let selectedPackageName: string | null = null;
    if (procurementPackageId) {
      const assignment = await this.prisma.surveyAssignment.findFirst({
        where: { formId, procurementPackageId },
        select: {
          procurementPackage: { select: { id: true, name: true } },
        },
      });
      if (!assignment) {
        throw new NotFoundException(
          'This form is not assigned to the selected procurement package',
        );
      }
      selectedPackageName = assignment.procurementPackage.name;
    }

    const responseWhere: Prisma.SurveyResponseWhereInput = {
      formId,
      ...(procurementPackageId ? { assignment: { procurementPackageId } } : {}),
      ...(hasDateFilter
        ? {
            status: SurveyResponseStatus.SUBMITTED,
            submittedAt: { not: null, ...submittedAtFilter },
          }
        : {}),
    };

    const [
      statusGroups,
      tehsilStatusGroups,
      villageStatusGroups,
      allAssignmentGroups,
      submittedResponses,
      answers,
      assignmentCount,
      allAssignments,
    ] = await Promise.all([
      this.prisma.surveyResponse.groupBy({
        by: ['status'],
        where: responseWhere,
        _count: { _all: true },
      }),
      this.prisma.surveyResponse.groupBy({
        by: ['tehsilId', 'status'],
        where: responseWhere,
        _count: { _all: true },
      }),
      this.prisma.surveyResponse.groupBy({
        by: ['villageId', 'status'],
        where: responseWhere,
        _count: { _all: true },
      }),
      this.prisma.surveyResponse.groupBy({
        by: ['assignmentId', 'status'],
        where: { formId },
        _count: { _all: true },
      }),
      this.prisma.surveyResponse.findMany({
        where: hasDateFilter
          ? responseWhere
          : {
              ...responseWhere,
              status: SurveyResponseStatus.SUBMITTED,
              submittedAt: { not: null },
            },
        select: { submittedAt: true },
      }),
      this.prisma.surveyAnswer.findMany({
        where: {
          response: hasDateFilter
            ? responseWhere
            : {
                ...responseWhere,
                status: SurveyResponseStatus.SUBMITTED,
              },
        },
        select: { fieldId: true, value: true },
      }),
      this.prisma.surveyAssignment.count({
        where: {
          formId,
          ...(procurementPackageId ? { procurementPackageId } : {}),
        },
      }),
      this.prisma.surveyAssignment.findMany({
        where: { formId },
        select: {
          id: true,
          tehsilId: true,
          tehsil: { select: { id: true, name: true } },
          procurementPackage: { select: { id: true, name: true } },
        },
      }),
    ]);

    const submitted =
      statusGroups.find((row) => row.status === 'SUBMITTED')?._count._all ?? 0;
    const draft =
      statusGroups.find((row) => row.status === 'DRAFT')?._count._all ?? 0;

    const tehsilIds = [
      ...new Set(tehsilStatusGroups.map((row) => row.tehsilId)),
    ];
    const villageIds = [
      ...new Set(villageStatusGroups.map((row) => row.villageId)),
    ];

    const [tehsils, villages] = await Promise.all([
      tehsilIds.length
        ? this.prisma.tehsil.findMany({
            where: { id: { in: tehsilIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      villageIds.length
        ? this.prisma.village.findMany({
            where: { id: { in: villageIds } },
            select: {
              id: true,
              name: true,
              tehsilId: true,
              tehsil: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const tehsilNameById = new Map(tehsils.map((row) => [row.id, row.name]));
    const villageById = new Map(villages.map((row) => [row.id, row]));

    const tehsilAccumulator = new Map<
      string,
      { submitted: number; draft: number }
    >();
    for (const row of tehsilStatusGroups) {
      const current = tehsilAccumulator.get(row.tehsilId) ?? {
        submitted: 0,
        draft: 0,
      };
      if (row.status === 'SUBMITTED') {
        current.submitted += row._count._all;
      } else {
        current.draft += row._count._all;
      }
      tehsilAccumulator.set(row.tehsilId, current);
    }

    const byTehsil: SurveyFormAnalyticsTehsilRow[] = [
      ...tehsilAccumulator.entries(),
    ]
      .map(([tehsilId, counts]) => ({
        tehsilId,
        tehsilName: tehsilNameById.get(tehsilId) ?? 'Unknown tehsil',
        submitted: counts.submitted,
        draft: counts.draft,
        total: counts.submitted + counts.draft,
      }))
      .sort((a, b) => b.total - a.total);

    const villageAccumulator = new Map<
      string,
      { submitted: number; draft: number }
    >();
    for (const row of villageStatusGroups) {
      const current = villageAccumulator.get(row.villageId) ?? {
        submitted: 0,
        draft: 0,
      };
      if (row.status === 'SUBMITTED') {
        current.submitted += row._count._all;
      } else {
        current.draft += row._count._all;
      }
      villageAccumulator.set(row.villageId, current);
    }

    const byVillage: SurveyFormAnalyticsVillageRow[] = [
      ...villageAccumulator.entries(),
    ]
      .map(([villageId, counts]) => {
        const village = villageById.get(villageId);
        return {
          villageId,
          villageName: village?.name ?? 'Unknown village',
          tehsilId: village?.tehsilId ?? '',
          tehsilName: village?.tehsil.name ?? 'Unknown tehsil',
          submitted: counts.submitted,
          draft: counts.draft,
          total: counts.submitted + counts.draft,
        };
      })
      .sort((a, b) => b.total - a.total);

    const packageAccumulator = new Map<string, SurveyFormAnalyticsPackageRow>();
    for (const assignment of allAssignments) {
      const packageId = assignment.procurementPackage.id;
      if (!packageAccumulator.has(packageId)) {
        packageAccumulator.set(packageId, {
          packageId,
          packageName: assignment.procurementPackage.name,
          tehsilId: assignment.tehsil.id,
          tehsilName: assignment.tehsil.name,
          submitted: 0,
          draft: 0,
          total: 0,
        });
      }
    }

    const assignmentById = new Map(
      allAssignments.map((assignment) => [assignment.id, assignment]),
    );
    for (const row of allAssignmentGroups) {
      const assignment = assignmentById.get(row.assignmentId);
      if (!assignment) continue;
      const packageId = assignment.procurementPackage.id;
      const current = packageAccumulator.get(packageId);
      if (!current) continue;
      if (row.status === 'SUBMITTED') {
        current.submitted += row._count._all;
      } else {
        current.draft += row._count._all;
      }
      current.total = current.submitted + current.draft;
    }

    const byProcurementPackage = [...packageAccumulator.values()].sort(
      (a, b) => b.total - a.total,
    );

    const cesmpInsights = await this.cesmpAnalytics.build(
      formId,
      form.title,
      form.fields,
      form.baselineFields,
      {
        procurementPackageId,
        submittedFrom: parseDateParam(submittedFrom),
        submittedTo: parseDateParam(submittedTo),
      },
    );

    return {
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
      },
      filter: {
        procurementPackageId: procurementPackageId ?? null,
        procurementPackageName: selectedPackageName,
        submittedFrom,
        submittedTo,
      },
      fields: buildFieldMeta(form.fields),
      summary: {
        totalResponses: submitted + draft,
        submitted,
        draft,
        assignmentCount,
        packageCount: packageAccumulator.size,
      },
      byTehsil,
      byVillage,
      byProcurementPackage,
      submissionsOverTime: buildSubmissionSeries(
        submittedResponses.map((row) => row.submittedAt),
      ),
      fieldBreakdown: buildFieldBreakdown(
        form.fields,
        answers.map((row) => ({
          fieldId: row.fieldId,
          value: row.value,
        })),
      ),
      cesmpInsights,
    };
  }
}
