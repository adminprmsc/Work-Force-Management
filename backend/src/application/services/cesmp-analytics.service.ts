import { Injectable } from '@nestjs/common';
import {
  SurveyField,
  SurveyFormBaselineField,
} from '../../domain/entities/survey.entity';
import { parseRevisionFields } from './survey-revision.serializer';
import { numericAnswerValue } from './survey-budget.effects';
import { PackageSurveyBudgetService } from './package-survey-budget.service';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

export const CESMP_FORM_TITLE_MARKER = 'C-ESMP Village Monitoring Checklist';

const FIELD_PATTERNS = {
  ppeWearing: 'wearing appropriate ppe',
  ppeCondition: 'ppe is in good condition',
  noiseLevel: 'average level of noise',
  noiseReduction: 'noise reduction measures',
  dustLevel: 'fugitive dust',
  dustReduction: 'water is sprinkled',
  budgetPpe: 'utilized from ppes head',
  budgetHse: 'utilized from hse head',
  budgetMonitoring: 'environmental monitoring head',
  trainingTitle: 'title of training',
  trainingParticipants: 'number of participants',
  trainingVenue: 'venue of training',
  trainingAudience: 'target audience',
} as const;

const BASELINE_PATTERNS = {
  hseStaff: 'hse) staff hired',
  cesmpPlan: 'c-esmp) submitted',
} as const;

export interface CesmpPatternInsight {
  label: string;
  counts: Record<string, number>;
  total: number;
}

export interface CesmpPackageInsight {
  packageId: string;
  packageName: string;
  tehsilName: string;
  contractorName: string;
  consultantName: string;
  budgetAllocated: number;
  budgetUtilized: number;
  budgetRemaining: number;
  utilizationRate: number;
  villagesCovered: number;
  siteVisitsSubmitted: number;
  hseStaffHired: boolean | null;
  cesmpPlanSubmitted: boolean | null;
  budgetByHead: {
    ppe: number;
    hse: number;
    environmentalMonitoring: number;
  };
}

export interface CesmpBudgetUtilizationInsight {
  totalAllocated: number;
  totalUtilized: number;
  totalRemaining: number;
  overallUtilizationRate: number;
  byHead: {
    ppe: number;
    hse: number;
    environmentalMonitoring: number;
  };
}

export interface CesmpTrainingInsight {
  responsesWithTraining: number;
  totalParticipants: number;
  topTrainings: Array<{ title: string; count: number; participants: number }>;
  venues: Record<string, number>;
}

export interface CesmpFormInsights {
  summary: {
    totalContractors: number;
    totalProcurementPackages: number;
    totalVillageCoverage: number;
    totalSiteVisitsSubmitted: number;
    hseStaffHiredPackages: number;
    hseStaffHiredRate: number;
    cesmpPlanSubmittedPackages: number;
  };
  packages: CesmpPackageInsight[];
  ppeCompliance: {
    wearingRate: CesmpPatternInsight;
    goodCondition: CesmpPatternInsight;
  };
  noise: {
    level: CesmpPatternInsight;
    reductionMeasures: CesmpPatternInsight;
  };
  dust: {
    level: CesmpPatternInsight;
    reductionMeasures: CesmpPatternInsight;
  };
  budget: CesmpBudgetUtilizationInsight;
  training: CesmpTrainingInsight;
}

export interface CesmpAnalyticsFilter {
  procurementPackageId?: string | null;
  submittedFrom?: Date | null;
  submittedTo?: Date | null;
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

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function findFieldId(
  fields: SurveyField[],
  pattern: string,
): string | undefined {
  const needle = pattern.toLowerCase();
  return fields.find((field) => normalizeLabel(field.label).includes(needle))
    ?.id;
}

function findBaselineFieldId(
  fields: SurveyFormBaselineField[],
  pattern: string,
): string | undefined {
  const needle = pattern.toLowerCase();
  return fields.find((field) => normalizeLabel(field.label).includes(needle))
    ?.id;
}

function isYesValue(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (value === true) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'true') return true;
    if (normalized === 'no' || normalized === 'false') return false;
  }
  return null;
}

function aggregateChoice(counts: Record<string, number>, value: unknown): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        const key = item.trim();
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return;
  }
  if (typeof value === 'string' && value.trim()) {
    const key = value.trim();
    counts[key] = (counts[key] ?? 0) + 1;
  }
}

function buildPatternInsight(
  label: string,
  counts: Record<string, number>,
): CesmpPatternInsight {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return { label, counts, total };
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

@Injectable()
export class CesmpAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packageSurveyBudget: PackageSurveyBudgetService,
  ) {}

  isCesmpForm(title: string): boolean {
    return title.includes('C-ESMP');
  }

  async build(
    formId: string,
    formTitle: string,
    formFields: SurveyField[],
    baselineFields: SurveyFormBaselineField[],
    filter: CesmpAnalyticsFilter = {},
  ): Promise<CesmpFormInsights | null> {
    const procurementPackageId = filter.procurementPackageId ?? null;
    const submittedFrom = filter.submittedFrom ?? null;
    const submittedTo = filter.submittedTo ?? null;
    const hasDateFilter = Boolean(submittedFrom || submittedTo);
    if (!this.isCesmpForm(formTitle)) return null;

    const assignments = await this.prisma.surveyAssignment.findMany({
      where: {
        formId,
        ...(procurementPackageId ? { procurementPackageId } : {}),
      },
      select: {
        procurementPackage: {
          select: {
            id: true,
            name: true,
            budgetAmount: true,
            tehsil: { select: { name: true } },
            contractor: { select: { name: true } },
            consultant: { select: { name: true } },
          },
        },
      },
    });

    const packageMap = new Map<
      string,
      (typeof assignments)[number]['procurementPackage']
    >();
    for (const assignment of assignments) {
      packageMap.set(
        assignment.procurementPackage.id,
        assignment.procurementPackage,
      );
    }
    const packageIds = [...packageMap.keys()];
    if (packageIds.length === 0) {
      return this.emptyInsights();
    }

    const [responses, baselineAnswers, surveyExpenseTotals] = await Promise.all(
      [
        this.prisma.surveyResponse.findMany({
          where: {
            formId,
            status: 'SUBMITTED',
            ...(hasDateFilter
              ? {
                  submittedAt: {
                    not: null,
                    ...(submittedFrom
                      ? { gte: startOfUtcDay(submittedFrom) }
                      : {}),
                    ...(submittedTo ? { lte: endOfUtcDay(submittedTo) } : {}),
                  },
                }
              : {}),
            assignment: {
              procurementPackageId: { in: packageIds },
            },
          },
          select: {
            villageId: true,
            answers: { select: { fieldId: true, value: true } },
            formRevision: { select: { fields: true } },
            assignment: { select: { procurementPackageId: true } },
          },
        }),
        this.prisma.procurementPackageBaselineAnswer.findMany({
          where: { formId, packageId: { in: packageIds } },
          select: { packageId: true, fieldId: true, value: true },
        }),
        this.packageSurveyBudget.getSurveyExpenseTotals(packageIds),
      ],
    );

    const hseFieldId = findBaselineFieldId(
      baselineFields,
      BASELINE_PATTERNS.hseStaff,
    );
    const cesmpFieldId = findBaselineFieldId(
      baselineFields,
      BASELINE_PATTERNS.cesmpPlan,
    );

    const baselineByPackage = new Map<
      string,
      { hseStaffHired: boolean | null; cesmpPlanSubmitted: boolean | null }
    >();
    for (const packageId of packageIds) {
      baselineByPackage.set(packageId, {
        hseStaffHired: null,
        cesmpPlanSubmitted: null,
      });
    }
    for (const answer of baselineAnswers) {
      const row = baselineByPackage.get(answer.packageId);
      if (!row) continue;
      if (hseFieldId && answer.fieldId === hseFieldId) {
        row.hseStaffHired = isYesValue(answer.value);
      }
      if (cesmpFieldId && answer.fieldId === cesmpFieldId) {
        row.cesmpPlanSubmitted = isYesValue(answer.value);
      }
    }

    const ppeWearing = buildPatternInsight('PPE wearing compliance', {});
    const ppeCondition = buildPatternInsight('PPE condition & fit', {});
    const noiseLevel = buildPatternInsight('Noise level at site', {});
    const noiseReduction = buildPatternInsight('Noise reduction measures', {});
    const dustLevel = buildPatternInsight('Fugitive dust level', {});
    const dustReduction = buildPatternInsight(
      'Dust control (water sprinkling)',
      {},
    );

    const budgetByHead = { ppe: 0, hse: 0, environmentalMonitoring: 0 };
    const packageStats = new Map<
      string,
      {
        villages: Set<string>;
        visits: number;
        budgetByHead: {
          ppe: number;
          hse: number;
          environmentalMonitoring: number;
        };
      }
    >();
    for (const packageId of packageIds) {
      packageStats.set(packageId, {
        villages: new Set(),
        visits: 0,
        budgetByHead: { ppe: 0, hse: 0, environmentalMonitoring: 0 },
      });
    }

    const trainingMap = new Map<
      string,
      { count: number; participants: number }
    >();
    const venueCounts: Record<string, number> = {};
    let responsesWithTraining = 0;
    let totalParticipants = 0;

    for (const response of responses) {
      const packageId = response.assignment.procurementPackageId;
      const stats = packageStats.get(packageId);
      if (!stats) continue;

      stats.visits += 1;
      stats.villages.add(response.villageId);

      const fields = parseRevisionFields(response.formRevision.fields);
      const answerByField = new Map(
        response.answers.map((answer) => [answer.fieldId, answer.value]),
      );

      const pick = (pattern: string) => {
        const fieldId = findFieldId(fields, pattern);
        return fieldId ? answerByField.get(fieldId) : undefined;
      };

      aggregateChoice(ppeWearing.counts, pick(FIELD_PATTERNS.ppeWearing));
      aggregateChoice(ppeCondition.counts, pick(FIELD_PATTERNS.ppeCondition));
      aggregateChoice(noiseLevel.counts, pick(FIELD_PATTERNS.noiseLevel));
      aggregateChoice(
        noiseReduction.counts,
        pick(FIELD_PATTERNS.noiseReduction),
      );
      aggregateChoice(dustLevel.counts, pick(FIELD_PATTERNS.dustLevel));
      aggregateChoice(dustReduction.counts, pick(FIELD_PATTERNS.dustReduction));

      const ppeSpend = numericAnswerValue(pick(FIELD_PATTERNS.budgetPpe));
      const hseSpend = numericAnswerValue(pick(FIELD_PATTERNS.budgetHse));
      const monitoringSpend = numericAnswerValue(
        pick(FIELD_PATTERNS.budgetMonitoring),
      );
      stats.budgetByHead.ppe += ppeSpend;
      stats.budgetByHead.hse += hseSpend;
      stats.budgetByHead.environmentalMonitoring += monitoringSpend;
      budgetByHead.ppe += ppeSpend;
      budgetByHead.hse += hseSpend;
      budgetByHead.environmentalMonitoring += monitoringSpend;

      const trainingTitle = pick(FIELD_PATTERNS.trainingTitle);
      const participants = numericAnswerValue(
        pick(FIELD_PATTERNS.trainingParticipants),
      );
      const venue = pick(FIELD_PATTERNS.trainingVenue);
      if (
        (typeof trainingTitle === 'string' && trainingTitle.trim()) ||
        participants > 0
      ) {
        responsesWithTraining += 1;
        totalParticipants += participants;
        const title =
          typeof trainingTitle === 'string' && trainingTitle.trim()
            ? trainingTitle.trim()
            : 'Unspecified training';
        const existing = trainingMap.get(title) ?? {
          count: 0,
          participants: 0,
        };
        existing.count += 1;
        existing.participants += participants;
        trainingMap.set(title, existing);
        if (typeof venue === 'string' && venue.trim()) {
          const venueKey = venue.trim();
          venueCounts[venueKey] = (venueCounts[venueKey] ?? 0) + 1;
        }
      }
    }

    ppeWearing.total = Object.values(ppeWearing.counts).reduce(
      (a, b) => a + b,
      0,
    );
    ppeCondition.total = Object.values(ppeCondition.counts).reduce(
      (a, b) => a + b,
      0,
    );
    noiseLevel.total = Object.values(noiseLevel.counts).reduce(
      (a, b) => a + b,
      0,
    );
    noiseReduction.total = Object.values(noiseReduction.counts).reduce(
      (a, b) => a + b,
      0,
    );
    dustLevel.total = Object.values(dustLevel.counts).reduce(
      (a, b) => a + b,
      0,
    );
    dustReduction.total = Object.values(dustReduction.counts).reduce(
      (a, b) => a + b,
      0,
    );

    const contractors = new Set<string>();
    let totalAllocated = 0;
    let totalUtilized = 0;
    let hseStaffHiredPackages = 0;
    let cesmpPlanSubmittedPackages = 0;
    const allVillages = new Set<string>();

    const packages: CesmpPackageInsight[] = packageIds.map((packageId) => {
      const pkg = packageMap.get(packageId)!;
      const stats = packageStats.get(packageId)!;
      const baseline = baselineByPackage.get(packageId);
      const allocated = Number(pkg.budgetAmount);
      const utilized = Number(surveyExpenseTotals.get(packageId) ?? 0);
      const remaining = Math.max(allocated - utilized, 0);

      contractors.add(pkg.contractor.name);
      totalAllocated += allocated;
      totalUtilized += utilized;
      if (baseline?.hseStaffHired === true) hseStaffHiredPackages += 1;
      if (baseline?.cesmpPlanSubmitted === true)
        cesmpPlanSubmittedPackages += 1;
      for (const villageId of stats.villages) {
        allVillages.add(villageId);
      }

      return {
        packageId,
        packageName: pkg.name,
        tehsilName: pkg.tehsil.name,
        contractorName: pkg.contractor.name,
        consultantName: pkg.consultant.name,
        budgetAllocated: allocated,
        budgetUtilized: utilized,
        budgetRemaining: remaining,
        utilizationRate: pct(utilized, allocated),
        villagesCovered: stats.villages.size,
        siteVisitsSubmitted: stats.visits,
        hseStaffHired: baseline?.hseStaffHired ?? null,
        cesmpPlanSubmitted: baseline?.cesmpPlanSubmitted ?? null,
        budgetByHead: { ...stats.budgetByHead },
      };
    });

    packages.sort((a, b) => b.budgetUtilized - a.budgetUtilized);

    const topTrainings = [...trainingMap.entries()]
      .map(([title, data]) => ({
        title,
        count: data.count,
        participants: data.participants,
      }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 8);

    return {
      summary: {
        totalContractors: contractors.size,
        totalProcurementPackages: packageIds.length,
        totalVillageCoverage: allVillages.size,
        totalSiteVisitsSubmitted: responses.length,
        hseStaffHiredPackages,
        hseStaffHiredRate: pct(hseStaffHiredPackages, packageIds.length),
        cesmpPlanSubmittedPackages,
      },
      packages,
      ppeCompliance: {
        wearingRate: ppeWearing,
        goodCondition: ppeCondition,
      },
      noise: {
        level: noiseLevel,
        reductionMeasures: noiseReduction,
      },
      dust: {
        level: dustLevel,
        reductionMeasures: dustReduction,
      },
      budget: {
        totalAllocated,
        totalUtilized,
        totalRemaining: Math.max(totalAllocated - totalUtilized, 0),
        overallUtilizationRate: pct(totalUtilized, totalAllocated),
        byHead: budgetByHead,
      },
      training: {
        responsesWithTraining,
        totalParticipants,
        topTrainings,
        venues: venueCounts,
      },
    };
  }

  private emptyInsights(): CesmpFormInsights {
    const emptyPattern = (label: string): CesmpPatternInsight => ({
      label,
      counts: {},
      total: 0,
    });
    return {
      summary: {
        totalContractors: 0,
        totalProcurementPackages: 0,
        totalVillageCoverage: 0,
        totalSiteVisitsSubmitted: 0,
        hseStaffHiredPackages: 0,
        hseStaffHiredRate: 0,
        cesmpPlanSubmittedPackages: 0,
      },
      packages: [],
      ppeCompliance: {
        wearingRate: emptyPattern('PPE wearing compliance'),
        goodCondition: emptyPattern('PPE condition & fit'),
      },
      noise: {
        level: emptyPattern('Noise level at site'),
        reductionMeasures: emptyPattern('Noise reduction measures'),
      },
      dust: {
        level: emptyPattern('Fugitive dust level'),
        reductionMeasures: emptyPattern('Dust control (water sprinkling)'),
      },
      budget: {
        totalAllocated: 0,
        totalUtilized: 0,
        totalRemaining: 0,
        overallUtilizationRate: 0,
        byHead: { ppe: 0, hse: 0, environmentalMonitoring: 0 },
      },
      training: {
        responsesWithTraining: 0,
        totalParticipants: 0,
        topTrainings: [],
        venues: {},
      },
    };
  }
}
