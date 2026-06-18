import { UserRole } from '../entities/user.entity';
export interface ProcurementActorContext {
    id: string;
    role: UserRole;
    tehsilId: string | null;
}
export declare function canManageProcurementMasters(role: UserRole): boolean;
export declare function canManageProcurementPackages(role: UserRole): boolean;
export declare function canReadProcurementPackages(role: UserRole): boolean;
export declare function canReadProcurementPackage(actor: ProcurementActorContext, tehsilId: string): boolean;
