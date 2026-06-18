"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalToMoneyString = decimalToMoneyString;
exports.subtractMoney = subtractMoney;
exports.mapExpenseRow = mapExpenseRow;
exports.mapPackageRecord = mapPackageRecord;
const tehsil_package_naming_1 = require("../../../domain/constants/tehsil-package-naming");
const procurement_package_entity_1 = require("../../../domain/entities/procurement-package.entity");
const contractor_entity_1 = require("../../../domain/entities/contractor.entity");
const consultant_entity_1 = require("../../../domain/entities/consultant.entity");
function decimalToMoneyString(value) {
    const numeric = Number.parseFloat(value.toString());
    if (Number.isNaN(numeric))
        return '0.00';
    return numeric.toFixed(2);
}
function subtractMoney(budget, spent) {
    const remaining = Number.parseFloat(budget) - Number.parseFloat(spent);
    return remaining.toFixed(2);
}
function mapExpenseRow(row) {
    return new procurement_package_entity_1.ProcurementPackageExpense(row.id, row.packageId, decimalToMoneyString(row.amount), row.description, row.expenseDate, {
        id: row.createdBy.id,
        username: row.createdBy.username,
        email: row.createdBy.email,
    }, row.createdAt, row.updatedAt);
}
function mapPackageRecord(record) {
    const totalExpenses = record.expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount.toString()), 0);
    const budgetAmount = decimalToMoneyString(record.budgetAmount);
    const totalExpensesStr = totalExpenses.toFixed(2);
    return new procurement_package_entity_1.ProcurementPackage(record.id, record.name, budgetAmount, totalExpensesStr, subtractMoney(budgetAmount, totalExpensesStr), new contractor_entity_1.Contractor(record.contractor.id, record.contractor.name, record.contractor.createdAt, record.contractor.updatedAt), new consultant_entity_1.Consultant(record.consultant.id, record.consultant.name, record.consultant.createdAt, record.consultant.updatedAt), new procurement_package_entity_1.ProcurementPackageTehsilRef(record.tehsil.id, record.tehsil.name, (0, tehsil_package_naming_1.getTehsilDisplayName)(record.tehsil.name)), record.villages.map((entry) => new procurement_package_entity_1.ProcurementPackageVillageRef(entry.village.id, entry.village.name)), record.expenses.map(mapExpenseRow), record.createdAt, record.updatedAt);
}
//# sourceMappingURL=procurement-package.mapper.js.map