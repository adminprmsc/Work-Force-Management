"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_CREATED"] = "USER_CREATED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["USER_DELETED"] = "USER_DELETED";
    AuditAction["USER_ACTIVATED"] = "USER_ACTIVATED";
    AuditAction["USER_DEACTIVATED"] = "USER_DEACTIVATED";
    AuditAction["USER_CREDENTIALS_RESET"] = "USER_CREDENTIALS_RESET";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
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