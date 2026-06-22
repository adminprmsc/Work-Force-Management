export class ComplianceUserRef {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
  ) {}
}

export class ProcurementPackageCompliance {
  constructor(
    public readonly packageId: string,
    public readonly cesmpPlanSubmitted: boolean | null,
    public readonly hseStaffHired: boolean | null,
    public readonly mobilizationDate: Date | null,
    public readonly baselineSubmittedAt: Date | null,
    public readonly baselineSubmittedBy: ComplianceUserRef | null,
    public readonly isMobilized: boolean,
    public readonly isBaselineComplete: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
