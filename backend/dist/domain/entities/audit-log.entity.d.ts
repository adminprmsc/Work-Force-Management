export declare enum AuditAction {
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    USER_DELETED = "USER_DELETED",
    USER_ACTIVATED = "USER_ACTIVATED",
    USER_DEACTIVATED = "USER_DEACTIVATED",
    USER_CREDENTIALS_RESET = "USER_CREDENTIALS_RESET"
}
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
