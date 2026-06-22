import { Injectable } from '@nestjs/common';
import { ProcurementPackage } from '../../domain/entities/procurement-package.entity';
import { subtractMoney } from '../../infrastructure/database/mappers/procurement-package.mapper';
import { PackageSurveyBudgetService } from './package-survey-budget.service';

@Injectable()
export class ProcurementPackageBudgetEnricher {
  constructor(
    private readonly surveyBudgetService: PackageSurveyBudgetService,
  ) {}

  async enrich(
    packages: ProcurementPackage[],
    options?: { excludeResponseId?: string },
  ): Promise<ProcurementPackage[]> {
    if (packages.length === 0) return packages;

    const totals = await this.surveyBudgetService.getSurveyExpenseTotals(
      packages.map((pkg) => pkg.id),
      options,
    );

    return packages.map((pkg) => {
      const totalExpenses = totals.get(pkg.id) ?? '0.00';
      return new ProcurementPackage(
        pkg.id,
        pkg.name,
        pkg.budgetAmount,
        totalExpenses,
        subtractMoney(pkg.budgetAmount, totalExpenses),
        pkg.contractor,
        pkg.consultant,
        pkg.tehsil,
        pkg.villages,
        [],
        pkg.createdAt,
        pkg.updatedAt,
      );
    });
  }

  async enrichOne(
    pkg: ProcurementPackage,
    options?: { excludeResponseId?: string },
  ): Promise<ProcurementPackage> {
    const [enriched] = await this.enrich([pkg], options);
    return enriched;
  }
}
