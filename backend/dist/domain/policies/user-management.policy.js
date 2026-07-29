"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserAdmin = isUserAdmin;
exports.canCreateRole = canCreateRole;
exports.canManageUser = canManageUser;
exports.canAdministerTarget = canAdministerTarget;
exports.canDeleteUser = canDeleteUser;
exports.canChangeRole = canChangeRole;
exports.canGrantUserAdmin = canGrantUserAdmin;
exports.creatableRolesFor = creatableRolesFor;
exports.requiredOfficeTypeForRole = requiredOfficeTypeForRole;
exports.roleRequiresOffice = roleRequiresOffice;
const user_entity_1 = require("../entities/user.entity");
const SM_CREATABLE_ROLES = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
    user_entity_1.UserRole.RA_ES_TEHSIL,
    user_entity_1.UserRole.WORLD_BANK_USER,
];
const RA_HO_ADMIN_CREATABLE_ROLES = [
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
    user_entity_1.UserRole.RA_ES_TEHSIL,
    user_entity_1.UserRole.WORLD_BANK_USER,
];
function isUserAdmin(actor) {
    if (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES)
        return true;
    return (actor.role === user_entity_1.UserRole.RA_ENVIRONMENT_HO && Boolean(actor.canManageUsers));
}
function canCreateRole(actor, targetRole) {
    if (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES) {
        return SM_CREATABLE_ROLES.includes(targetRole);
    }
    if (actor.role === user_entity_1.UserRole.RA_ENVIRONMENT_HO && actor.canManageUsers) {
        return RA_HO_ADMIN_CREATABLE_ROLES.includes(targetRole);
    }
    return false;
}
function canManageUser(actor) {
    return isUserAdmin(actor);
}
function canAdministerTarget(actor, targetRole) {
    if (!isUserAdmin(actor))
        return false;
    if (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES)
        return true;
    return targetRole !== user_entity_1.UserRole.SENIOR_MANAGER_ES;
}
function canDeleteUser(actor, targetRole) {
    return canAdministerTarget(actor, targetRole);
}
function canChangeRole(actor, targetRole) {
    return (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES &&
        SM_CREATABLE_ROLES.includes(targetRole));
}
function canGrantUserAdmin(actor, targetRole) {
    return (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES &&
        targetRole === user_entity_1.UserRole.RA_ENVIRONMENT_HO);
}
function creatableRolesFor(actor) {
    if (actor.role === user_entity_1.UserRole.SENIOR_MANAGER_ES)
        return [...SM_CREATABLE_ROLES];
    if (actor.role === user_entity_1.UserRole.RA_ENVIRONMENT_HO && actor.canManageUsers) {
        return [...RA_HO_ADMIN_CREATABLE_ROLES];
    }
    return [];
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