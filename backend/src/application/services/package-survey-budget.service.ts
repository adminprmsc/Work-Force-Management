import { Injectable } from '@nestjs/common';
import { parseRevisionFields } from './survey-revision.serializer';
import { sumBudgetEffectsFromAnswers } from './survey-budget.effects';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class PackageSurveyBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sum budget effects from submitted survey responses for a package.
   * DEDUCT fields increase total spend; ADD fields reduce it (credits/refunds).
   */
  async getSurveyExpenseTotals(
    packageIds: string[],
    options?: { excludeResponseId?: string },
  ): Promise<Map<string, string>> {
    if (packageIds.length === 0) return new Map();

    const responses = await this.prisma.surveyResponse.findMany({
      where: {
        status: 'SUBMITTED',
        ...(options?.excludeResponseId
          ? { id: { not: options.excludeResponseId } }
          : {}),
        assignment: { procurementPackageId: { in: packageIds } },
      },
      select: {
        assignment: { select: { procurementPackageId: true } },
        formRevision: { select: { fields: true } },
        answers: { select: { fieldId: true, value: true } },
      },
    });

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
}
