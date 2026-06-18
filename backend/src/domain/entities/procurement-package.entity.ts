import { Contractor } from './contractor.entity';
import { Consultant } from './consultant.entity';

export class ProcurementPackageVillageRef {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class ProcurementPackageTehsilRef {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayName: string,
  ) {}
}

export class ProcurementPackageExpense {
  constructor(
    public readonly id: string,
    public readonly packageId: string,
    public readonly amount: string,
    public readonly description: string | null,
    public readonly expenseDate: Date,
    public readonly createdBy: {
      id: string;
      username: string;
      email: string;
    },
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class ProcurementPackage {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly budgetAmount: string,
    public readonly totalExpenses: string,
    public readonly remainingBudget: string,
    public readonly contractor: Contractor,
    public readonly consultant: Consultant,
    public readonly tehsil: ProcurementPackageTehsilRef,
    public readonly villages: ProcurementPackageVillageRef[],
    public readonly expenses: ProcurementPackageExpense[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
