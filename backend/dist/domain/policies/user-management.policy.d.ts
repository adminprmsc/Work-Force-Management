import { UserRole, OfficeType } from '../entities/user.entity';
export declare function canCreateRole(actorRole: UserRole, targetRole: UserRole): boolean;
export declare function canManageUser(actorRole: UserRole): boolean;
export declare function canDeleteUser(actorRole: UserRole): boolean;
export declare function requiredOfficeTypeForRole(role: UserRole): OfficeType | null;
export declare function roleRequiresOffice(role: UserRole): boolean;
