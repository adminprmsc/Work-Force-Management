import { UserRole, OfficeType } from '../entities/user.entity';
export type UserAdminActor = {
    role: UserRole;
    canManageUsers?: boolean;
};
export declare function isUserAdmin(actor: UserAdminActor): boolean;
export declare function canCreateRole(actor: UserAdminActor, targetRole: UserRole): boolean;
export declare function canManageUser(actor: UserAdminActor): boolean;
export declare function canAdministerTarget(actor: UserAdminActor, targetRole: UserRole): boolean;
export declare function canDeleteUser(actor: UserAdminActor, targetRole: UserRole): boolean;
export declare function canChangeRole(actor: UserAdminActor, targetRole: UserRole): boolean;
export declare function canGrantUserAdmin(actor: UserAdminActor, targetRole: UserRole): boolean;
export declare function creatableRolesFor(actor: UserAdminActor): UserRole[];
export declare function requiredOfficeTypeForRole(role: UserRole): OfficeType | null;
export declare function roleRequiresOffice(role: UserRole): boolean;
