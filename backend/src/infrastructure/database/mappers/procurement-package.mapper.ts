import { getTehsilDisplayName } from '../../../domain/constants/tehsil-package-naming';
import {
  ProcurementPackage,
  ProcurementPackageExpense,
  ProcurementPackageTehsilRef,
  ProcurementPackageVillageRef,
} from '../../../domain/entities/procurement-package.entity';
import { Contractor } from '../../../domain/entities/contractor.entity';
import { Consultant } from '../../../domain/entities/consultant.entity';

export function decimalToMoneyString(
  value: { toString(): string } | string,
): string {
  const numeric = Number.parseFloat(value.toString());
  if (Number.isNaN(numeric)) return '0.00';
  return numeric.toFixed(2);
}

export function subtractMoney(budget: string, spent: string): string {
  const remaining = Number.parseFloat(budget) - Number.parseFloat(spent);
  return remaining.toFixed(2);
}

type ExpenseRow = {
  id: string;
  packageId: string;
  amount: { toString(): string };
  description: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    username: string;
    email: string;
  };
};

export type ProcurementPackageRecord = {
  id: string;
  name: string;
  budgetAmount: { toString(): string };
  contractorId: string;
  consultantId: string;
  tehsilId: string;
  createdAt: Date;
  updatedAt: Date;
  contractor: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  consultant: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  tehsil: {
    id: string;
    name: string;
  };
  villages: Array<{
    village: {
      id: string;
      name: string;
    };
  }>;
  expenses: ExpenseRow[];
};

export function mapExpenseRow(row: ExpenseRow): ProcurementPackageExpense {
  return new ProcurementPackageExpense(
    row.id,
    row.packageId,
    decimalToMoneyString(row.amount),
    row.description,
    row.expenseDate,
    {
      id: row.createdBy.id,
      username: row.createdBy.username,
      email: row.createdBy.email,
    },
    row.createdAt,
    row.updatedAt,
  );
}

export function mapPackageRecord(
  record: ProcurementPackageRecord,
): ProcurementPackage {
  const totalExpenses = record.expenses.reduce(
    (sum, expense) => sum + Number.parseFloat(expense.amount.toString()),
    0,
  );
  const budgetAmount = decimalToMoneyString(record.budgetAmount);
  const totalExpensesStr = totalExpenses.toFixed(2);

  return new ProcurementPackage(
    record.id,
    record.name,
    budgetAmount,
    totalExpensesStr,
    subtractMoney(budgetAmount, totalExpensesStr),
    new Contractor(
      record.contractor.id,
      record.contractor.name,
      record.contractor.createdAt,
      record.contractor.updatedAt,
    ),
    new Consultant(
      record.consultant.id,
      record.consultant.name,
      record.consultant.createdAt,
      record.consultant.updatedAt,
    ),
    new ProcurementPackageTehsilRef(
      record.tehsil.id,
      record.tehsil.name,
      getTehsilDisplayName(record.tehsil.name),
    ),
    record.villages.map(
      (entry) =>
        new ProcurementPackageVillageRef(entry.village.id, entry.village.name),
    ),
    record.expenses.map(mapExpenseRow),
    record.createdAt,
    record.updatedAt,
  );
}
