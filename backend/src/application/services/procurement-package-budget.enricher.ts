import { Injectable } from '@nestjs/common';
import {
  ProcurementPackage,
  ProcurementPackageVillageRef,
} from '../../domain/entities/procurement-package.entity';
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

    const villageTotalsByPackage = new Map<string, Map<string, string>>();
    await Promise.all(
      packages.map(async (pkg) => {
        villageTotalsByPackage.set(
          pkg.id,
          await this.surveyBudgetService.getVillageSurveyExpenseTotals(
            pkg.id,
            options,
          ),
        );
      }),
    );

    return packages.map((pkg) => {
      const totalExpenses = totals.get(pkg.id) ?? '0.00';
      const villageTotals =
        villageTotalsByPackage.get(pkg.id) ?? new Map<string, string>();
      const villages = pkg.villages.map((village) => {
        const spent = villageTotals.get(village.id) ?? '0.00';
        return new ProcurementPackageVillageRef(
          village.id,
          village.name,
          village.allocatedBudget,
          spent,
          subtractMoney(village.allocatedBudget, spent),
        );
      });
      return new ProcurementPackage(
        pkg.id,
        pkg.name,
        pkg.budgetAmount,
        totalExpenses,
        subtractMoney(pkg.budgetAmount, totalExpenses),
        pkg.contractor,
        pkg.consultant,
        pkg.tehsil,
        villages,
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
