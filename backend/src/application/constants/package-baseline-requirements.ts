export type PackageBaselineRequirement = {
  key: string;
  label: string;
  description: string;
  oneTime: boolean;
};

/** Fixed ESMP package baseline collected once per procurement package. */
export const PACKAGE_BASELINE_REQUIREMENTS: PackageBaselineRequirement[] = [
  {
    key: 'cesmpPlanSubmitted',
    label: 'C-ESMP plan submitted',
    description: 'Confirm the contractor has submitted the C-ESMP plan.',
    oneTime: true,
  },
  {
    key: 'hseStaffHired',
    label: 'HSE staff hired',
    description: 'Confirm HSE staff are in place for the package.',
    oneTime: true,
  },
  {
    key: 'mobilizationDate',
    label: 'Mobilization date',
    description:
      'Date work started on site. Recorded once and cannot be changed.',
    oneTime: true,
  },
];
