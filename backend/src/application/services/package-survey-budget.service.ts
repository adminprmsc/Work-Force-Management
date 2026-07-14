import { Injectable } from '@nestjs/common';
import { SurveyResponseStatus } from '../../domain/entities/survey.entity';
import { parseRevisionFields } from './survey-revision.serializer';
import { sumBudgetEffectsFromAnswers } from './survey-budget.effects';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

interface AcceptedExpenseRow {
  assignment: { procurementPackageId: string };
  formRevision: { fields: unknown };
  answers: Array<{ fieldId: string; value: unknown }>;
}

interface AcceptedVillageExpenseRow extends AcceptedExpenseRow {
  villageId: string;
}

const acceptedExpenseSelect = {
  assignment: { select: { procurementPackageId: true } },
  formRevision: { select: { fields: true } },
  answers: { select: { fieldId: true, value: true } },
} as const;

const acceptedVillageExpenseSelect = {
  ...acceptedExpenseSelect,
  villageId: true,
} as const;

@Injectable()
export class PackageSurveyBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sum budget effects from accepted survey responses for a package.
   * DEDUCT fields increase total spend; ADD fields reduce it (credits/refunds).
   */
  async getSurveyExpenseTotals(
    packageIds: string[],
    options?: { excludeResponseId?: string },
  ): Promise<Map<string, string>> {
    if (packageIds.length === 0) return new Map();

    const responses = (await this.prisma.surveyResponse.findMany({
      where: {
        status: SurveyResponseStatus.ACCEPTED,
        ...(options?.excludeResponseId
          ? { id: { not: options.excludeResponseId } }
          : {}),
        assignment: { procurementPackageId: { in: packageIds } },
      },
      select: acceptedExpenseSelect,
    })) as AcceptedExpenseRow[];

    const totals = new Map<string, number>();
    for (const id of packageIds) {
      totals.set(id, 0);
    }

    for (const response of responses) {
      const packageId = response.assignment.procurementPackageId;
      const fields = parseRevisionFields(response.formRevision.fields);
      const delta = sumBudgetEffectsFromAnswers(fields, response.answers);
      totals.set(packageId, (totals.get(packageId) ?? 0) + delta);
    }

    return new Map(
      [...totals.entries()].map(([id, amount]) => [id, amount.toFixed(2)]),
    );
  }

  async getSurveyExpenseTotal(
    packageId: string,
    options?: { excludeResponseId?: string },
  ): Promise<string> {
    const map = await this.getSurveyExpenseTotals([packageId], options);
    return map.get(packageId) ?? '0.00';
  }

  /**
   * Sum budget effects from accepted survey responses for a package, grouped by
   * village. Lets us track how much of each village's allocation is spent.
   */
  async getVillageSurveyExpenseTotals(
    packageId: string,
    options?: { excludeResponseId?: string },
  ): Promise<Map<string, string>> {
    const responses = (await this.prisma.surveyResponse.findMany({
      where: {
        status: SurveyResponseStatus.ACCEPTED,
        ...(options?.excludeResponseId
          ? { id: { not: options.excludeResponseId } }
          : {}),
        assignment: { procurementPackageId: packageId },
      },
      select: acceptedVillageExpenseSelect,
    })) as AcceptedVillageExpenseRow[];

    const totals = new Map<string, number>();
    for (const response of responses) {
      const fields = parseRevisionFields(response.formRevision.fields);
      const delta = sumBudgetEffectsFromAnswers(fields, response.answers);
      totals.set(
        response.villageId,
        (totals.get(response.villageId) ?? 0) + delta,
      );
    }

    return new Map(
      [...totals.entries()].map(([id, amount]) => [id, amount.toFixed(2)]),
    );
  }
}
