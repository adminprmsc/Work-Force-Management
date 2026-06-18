"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canCreateRole = canCreateRole;
exports.canManageUser = canManageUser;
exports.canDeleteUser = canDeleteUser;
exports.requiredOfficeTypeForRole = requiredOfficeTypeForRole;
exports.roleRequiresOffice = roleRequiresOffice;
const user_entity_1 = require("../entities/user.entity");
const CREATABLE_ROLES = {
    [user_entity_1.UserRole.SENIOR_MANAGER_ES]: [
        user_entity_1.UserRole.SENIOR_MANAGER_ES,
        user_entity_1.UserRole.RA_ENVIRONMENT_HO,
        user_entity_1.UserRole.RA_ES_TEHSIL,
        user_entity_1.UserRole.WORLD_BANK_USER,
    ],
    [user_entity_1.UserRole.RA_ENVIRONMENT_HO]: [],
    [user_entity_1.UserRole.RA_ES_TEHSIL]: [],
    [user_entity_1.UserRole.WORLD_BANK_USER]: [],
};
function canCreateRole(actorRole, targetRole) {
    return CREATABLE_ROLES[actorRole].includes(targetRole);
}
function canManageUser(actorRole) {
    return actorRole === user_entity_1.UserRole.SENIOR_MANAGER_ES;
}
function canDeleteUser(actorRole) {
    return actorRole === user_entity_1.UserRole.SENIOR_MANAGER_ES;
}
function requiredOfficeTypeForRole(role) {
    switch (role) {
        case user_entity_1.UserRole.RA_ENVIRONMENT_HO:
            return user_entity_1.OfficeType.HEAD_OFFICE;
        case user_entity_1.UserRole.WORLD_BANK_USER:
            return user_entity_1.OfficeType.WORLD_BANK_OFFICE;
        case user_entity_1.UserRole.RA_ES_TEHSIL:
            return user_entity_1.OfficeType.TEHSIL_OFFICE;
        default:
            return null;
    }
}
function roleRequiresOffice(role) {
    return requiredOfficeTypeForRole(role) !== null;
}
//# sourceMappingURL=user-management.policy.js.map