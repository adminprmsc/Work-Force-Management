"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toContractorResponse = toContractorResponse;
exports.toConsultantResponse = toConsultantResponse;
exports.toProcurementPackageExpenseResponse = toProcurementPackageExpenseResponse;
exports.toProcurementPackageResponse = toProcurementPackageResponse;
exports.toPackageFormBaselineResponse = toPackageFormBaselineResponse;
exports.toPackageBaselineFormSummaryResponse = toPackageBaselineFormSummaryResponse;
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
function toPackageFormBaselineResponse(state) {
    return {
        packageId: state.packageId,
        formId: state.formId,
        formTitle: state.formTitle,
        baselineTitle: state.baselineTitle,
        baselineDescription: state.baselineDescription,
        fields: state.fields.map((field) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            helpText: field.helpText,
            required: field.required,
            writeOnce: field.writeOnce,
            order: field.order,
            config: field.config,
        })),
        answers: state.answers,
        isBaselineComplete: state.isBaselineComplete,
        isMobilized: state.isBaselineComplete,
        submittedAt: state.submittedAt,
        submittedBy: state.submittedBy,
        updatedAt: state.updatedAt,
    };
}
function toPackageBaselineFormSummaryResponse(summary) {
    return {
        formId: summary.formId,
        formTitle: summary.formTitle,
        baselineTitle: summary.baselineTitle,
        isBaselineComplete: summary.isBaselineComplete,
    };
}
//# sourceMappingURL=procurement.mapper.js.map