export declare enum AuditAction {
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    USER_DELETED = "USER_DELETED",
    USER_ACTIVATED = "USER_ACTIVATED",
    USER_DEACTIVATED = "USER_DEACTIVATED",
    USER_CREDENTIALS_RESET = "USER_CREDENTIALS_RESET",
    PACKAGE_CREATED = "PACKAGE_CREATED",
    PACKAGE_UPDATED = "PACKAGE_UPDATED",
    PACKAGE_DELETED = "PACKAGE_DELETED",
    PACKAGE_EXPENSE_CREATED = "PACKAGE_EXPENSE_CREATED",
    PACKAGE_EXPENSE_UPDATED = "PACKAGE_EXPENSE_UPDATED",
    PACKAGE_EXPENSE_DELETED = "PACKAGE_EXPENSE_DELETED",
    PACKAGE_BASELINE_SAVED = "PACKAGE_BASELINE_SAVED",
    SURVEY_ASSIGNMENT_CREATED = "SURVEY_ASSIGNMENT_CREATED",
    SURVEY_ASSIGNMENT_DELETED = "SURVEY_ASSIGNMENT_DELETED",
    SURVEY_ASSIGNMENT_UPDATED = "SURVEY_ASSIGNMENT_UPDATED",
    SURVEY_RESPONSE_SUBMITTED = "SURVEY_RESPONSE_SUBMITTED",
    SURVEY_RESPONSE_ACCEPTED = "SURVEY_RESPONSE_ACCEPTED",
    SURVEY_RESPONSE_REJECTED = "SURVEY_RESPONSE_REJECTED",
    SURVEY_RESPONSE_REVERTED = "SURVEY_RESPONSE_REVERTED",
    MOBILE_APP_UPLOADED = "MOBILE_APP_UPLOADED"
}
export declare const AUDIT_RESOURCE_TYPES: {
    readonly USER: "user";
    readonly PROCUREMENT_PACKAGE: "procurement_package";
    readonly MOBILE_APP_RELEASE: "mobile_app_release";
};
export declare class AuditLog {
    readonly id: string;
    readonly actorId: string;
    readonly action: AuditAction;
    readonly resourceType: string;
    readonly resourceId: string | null;
    readonly metadata: Record<string, unknown> | null;
    readonly createdAt: Date;
    readonly actorEmail?: string | undefined;
    readonly actorUsername?: string | undefined;
    constructor(id: string, actorId: string, action: AuditAction, resourceType: string, resourceId: string | null, metadata: Record<string, unknown> | null, createdAt: Date, actorEmail?: string | undefined, actorUsername?: string | undefined);
}
