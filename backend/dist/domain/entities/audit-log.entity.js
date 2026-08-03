"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = exports.AUDIT_RESOURCE_TYPES = exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_CREATED"] = "USER_CREATED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["USER_DELETED"] = "USER_DELETED";
    AuditAction["USER_ACTIVATED"] = "USER_ACTIVATED";
    AuditAction["USER_DEACTIVATED"] = "USER_DEACTIVATED";
    AuditAction["USER_CREDENTIALS_RESET"] = "USER_CREDENTIALS_RESET";
    AuditAction["PACKAGE_CREATED"] = "PACKAGE_CREATED";
    AuditAction["PACKAGE_UPDATED"] = "PACKAGE_UPDATED";
    AuditAction["PACKAGE_DELETED"] = "PACKAGE_DELETED";
    AuditAction["PACKAGE_EXPENSE_CREATED"] = "PACKAGE_EXPENSE_CREATED";
    AuditAction["PACKAGE_EXPENSE_UPDATED"] = "PACKAGE_EXPENSE_UPDATED";
    AuditAction["PACKAGE_EXPENSE_DELETED"] = "PACKAGE_EXPENSE_DELETED";
    AuditAction["PACKAGE_BASELINE_SAVED"] = "PACKAGE_BASELINE_SAVED";
    AuditAction["SURVEY_ASSIGNMENT_CREATED"] = "SURVEY_ASSIGNMENT_CREATED";
    AuditAction["SURVEY_ASSIGNMENT_DELETED"] = "SURVEY_ASSIGNMENT_DELETED";
    AuditAction["SURVEY_ASSIGNMENT_UPDATED"] = "SURVEY_ASSIGNMENT_UPDATED";
    AuditAction["SURVEY_RESPONSE_SUBMITTED"] = "SURVEY_RESPONSE_SUBMITTED";
    AuditAction["SURVEY_RESPONSE_ACCEPTED"] = "SURVEY_RESPONSE_ACCEPTED";
    AuditAction["SURVEY_RESPONSE_REJECTED"] = "SURVEY_RESPONSE_REJECTED";
    AuditAction["SURVEY_RESPONSE_REVERTED"] = "SURVEY_RESPONSE_REVERTED";
    AuditAction["MOBILE_APP_UPLOADED"] = "MOBILE_APP_UPLOADED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
exports.AUDIT_RESOURCE_TYPES = {
    USER: 'user',
    PROCUREMENT_PACKAGE: 'procurement_package',
    MOBILE_APP_RELEASE: 'mobile_app_release',
};
class AuditLog {
    id;
    actorId;
    action;
    resourceType;
    resourceId;
    metadata;
    createdAt;
    actorEmail;
    actorUsername;
    constructor(id, actorId, action, resourceType, resourceId, metadata, createdAt, actorEmail, actorUsername) {
        this.id = id;
        this.actorId = actorId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.actorEmail = actorEmail;
        this.actorUsername = actorUsername;
    }
}
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.entity.js.map