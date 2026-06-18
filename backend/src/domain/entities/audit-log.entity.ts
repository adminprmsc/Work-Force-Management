export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_CREDENTIALS_RESET = 'USER_CREDENTIALS_RESET',
}

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly actorId: string,
    public readonly action: AuditAction,
    public readonly resourceType: string,
    public readonly resourceId: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly actorEmail?: string,
    public readonly actorUsername?: string,
  ) {}
}
