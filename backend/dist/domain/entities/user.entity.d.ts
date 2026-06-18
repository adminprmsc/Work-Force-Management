export declare enum UserRole {
    SENIOR_MANAGER_ES = "SENIOR_MANAGER_ES",
    RA_ENVIRONMENT_HO = "RA_ENVIRONMENT_HO",
    RA_ES_TEHSIL = "RA_ES_TEHSIL",
    WORLD_BANK_USER = "WORLD_BANK_USER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare enum OfficeType {
    HEAD_OFFICE = "HEAD_OFFICE",
    WORLD_BANK_OFFICE = "WORLD_BANK_OFFICE",
    TEHSIL_OFFICE = "TEHSIL_OFFICE"
}
export declare class User {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly password: string;
    readonly role: UserRole;
    readonly status: UserStatus;
    readonly officeId: string | null;
    readonly officeName: string | null;
    readonly officeType: OfficeType | null;
    readonly tehsilName: string | null;
    readonly createdById: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, email: string, username: string, password: string, role: UserRole, status: UserStatus, officeId: string | null, officeName: string | null, officeType: OfficeType | null, tehsilName: string | null, createdById: string | null, createdAt: Date, updatedAt: Date);
}
