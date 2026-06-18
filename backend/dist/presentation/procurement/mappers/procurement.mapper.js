"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toContractorResponse = toContractorResponse;
exports.toConsultantResponse = toConsultantResponse;
exports.toProcurementPackageExpenseResponse = toProcurementPackageExpenseResponse;
exports.toProcurementPackageResponse = toProcurementPackageResponse;
function toContractorResponse(contractor) {
    return {
        id: contractor.id,
        name: contractor.name,
        createdAt: contractor.createdAt,
        updatedAt: contractor.updatedAt,
    };
}
function toConsultantResponse(consultant) {
    return {
        id: consultant.id,
        name: consultant.name,
        createdAt: consultant.createdAt,
        updatedAt: consultant.updatedAt,
    };
}
function toProcurementPackageExpenseResponse(expense) {
    return {
        id: expense.id,
        packageId: expense.packageId,
        amount: expense.amount,
        description: expense.description,
        expenseDate: expense.expenseDate,
        createdBy: expense.createdBy,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
    };
}
function toProcurementPackageResponse(pkg) {
    return {
        id: pkg.id,
        name: pkg.name,
        budgetAmount: pkg.budgetAmount,
        totalExpenses: pkg.totalExpenses,
        remainingBudget: pkg.remainingBudget,
        contractor: {
            id: pkg.contractor.id,
            name: pkg.contractor.name,
        },
        consultant: {
            id: pkg.consultant.id,
            name: pkg.consultant.name,
        },
        tehsil: {
            id: pkg.tehsil.id,
            name: pkg.tehsil.name,
            displayName: pkg.tehsil.displayName,
        },
        villages: pkg.villages.map((village) => ({
            id: village.id,
            name: village.name,
        })),
        expenses: pkg.expenses.map(toProcurementPackageExpenseResponse),
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
    };
}
//# sourceMappingURL=procurement.mapper.js.map