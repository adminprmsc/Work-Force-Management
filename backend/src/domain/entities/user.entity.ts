export enum UserRole {
  SENIOR_MANAGER_ES = 'SENIOR_MANAGER_ES',
  RA_ENVIRONMENT_HO = 'RA_ENVIRONMENT_HO',
  RA_ES_TEHSIL = 'RA_ES_TEHSIL',
  WORLD_BANK_USER = 'WORLD_BANK_USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum OfficeType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  WORLD_BANK_OFFICE = 'WORLD_BANK_OFFICE',
  TEHSIL_OFFICE = 'TEHSIL_OFFICE',
}

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly officeId: string | null,
    public readonly officeName: string | null,
    public readonly officeType: OfficeType | null,
    public readonly tehsilName: string | null,
    public readonly createdById: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
