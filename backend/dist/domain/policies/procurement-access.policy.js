"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageProcurementMasters = canManageProcurementMasters;
exports.canManageProcurementPackages = canManageProcurementPackages;
exports.canReadProcurementPackages = canReadProcurementPackages;
exports.canReadProcurementPackage = canReadProcurementPackage;
const user_entity_1 = require("../entities/user.entity");
const PROCUREMENT_MANAGERS = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
];
const PROCUREMENT_READERS = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
    user_entity_1.UserRole.WORLD_BANK_USER,
    user_entity_1.UserRole.RA_ES_TEHSIL,
];
function canManageProcurementMasters(role) {
    return PROCUREMENT_MANAGERS.includes(role);
}
function canManageProcurementPackages(role) {
    return PROCUREMENT_MANAGERS.includes(role);
}
function canReadProcurementPackages(role) {
    return PROCUREMENT_READERS.includes(role);
}
function canReadProcurementPackage(actor, tehsilId) {
    if (!canReadProcurementPackages(actor.role)) {
        return false;
    }
    if (actor.role === user_entity_1.UserRole.RA_ES_TEHSIL) {
        return actor.tehsilId === tehsilId;
    }
    return true;
}
//# sourceMappingURL=procurement-access.policy.js.map