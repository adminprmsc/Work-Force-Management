export type PackageComplianceFlags = {
  isMobilized: boolean;
  isBaselineComplete: boolean;
};

type ComplianceRow = {
  mobilizationDate: Date | null;
  cesmpPlanSubmitted: boolean | null;
  hseStaffHired: boolean | null;
} | null;

export function complianceFlagsFromRow(
  compliance: ComplianceRow,
): PackageComplianceFlags {
  const isMobilized = compliance?.mobilizationDate != null;
  const isBaselineComplete =
    compliance?.cesmpPlanSubmitted != null &&
    compliance?.hseStaffHired != null &&
    isMobilized;
  return { isMobilized, isBaselineComplete };
}
