"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementPackage = exports.ProcurementPackageExpense = exports.ProcurementPackageTehsilRef = exports.ProcurementPackageVillageRef = void 0;
class ProcurementPackageVillageRef {
    id;
    name;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
exports.ProcurementPackageVillageRef = ProcurementPackageVillageRef;
class ProcurementPackageTehsilRef {
    id;
    name;
    displayName;
    constructor(id, name, displayName) {
        this.id = id;
        this.name = name;
        this.displayName = displayName;
    }
}
exports.ProcurementPackageTehsilRef = ProcurementPackageTehsilRef;
class ProcurementPackageExpense {
    id;
    packageId;
    amount;
    description;
    expenseDate;
    createdBy;
    createdAt;
    updatedAt;
    constructor(id, packageId, amount, description, expenseDate, createdBy, createdAt, updatedAt) {
        this.id = id;
        this.packageId = packageId;
        this.amount = amount;
        this.description = description;
        this.expenseDate = expenseDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ProcurementPackageExpense = ProcurementPackageExpense;
class ProcurementPackage {
    id;
    name;
    budgetAmount;
    totalExpenses;
    remainingBudget;
    contractor;
    consultant;
    tehsil;
    villages;
    expenses;
    createdAt;
    updatedAt;
    constructor(id, name, budgetAmount, totalExpenses, remainingBudget, contractor, consultant, tehsil, villages, expenses, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.budgetAmount = budgetAmount;
        this.totalExpenses = totalExpenses;
        this.remainingBudget = remainingBudget;
        this.contractor = contractor;
        this.consultant = consultant;
        this.tehsil = tehsil;
        this.villages = villages;
        this.expenses = expenses;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ProcurementPackage = ProcurementPackage;
//# sourceMappingURL=procurement-package.entity.js.map