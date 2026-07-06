export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SurveyResponseStatus = 'DRAFT' | 'SUBMITTED';
export type SurveyFrequency = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type SurveyFieldType =
  | 'TEXT'
  | 'PARAGRAPH'
  | 'CHECKBOXES'
  | 'MULTIPLE_CHOICE'
  | 'DATE'
  | 'DROPDOWN'
  | 'TIME'
  | 'NUMBER'
  | 'CNIC'
  | 'EMAIL'
  | 'CONTACT'
  | 'FILE'
  | 'IMAGE'
  | 'SECTION_BREAK';

export type SurveyFieldOption = {
  value: string;
  label: string;
};

export type SurveyFieldConfig = {
  options?: SurveyFieldOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  minSelected?: number;
  maxSelected?: number;
  accept?: string;
  maxSizeMb?: number;
  packageReference?: string;
  readOnly?: boolean;
  snapshotOnSubmit?: boolean;
  budgetEffect?: 'DEDUCT' | 'ADD';
  computedRemainingBudget?: boolean;
  computedVisitDeductions?: boolean;
};

export type SurveyField = {
  id: string;
  type: SurveyFieldType;
  label: string;
  helpText: string | null;
  required: boolean;
  order: number;
  config: SurveyFieldConfig | null;
};

export type SurveyFormBaselineField = SurveyField & {
  writeOnce: boolean;
};

export type SurveyFormRevision = {
  id: string;
  version: number;
  fields: SurveyField[];
  publishedAt: string;
};

export type SurveyAssignment = {
  id: string;
  formId: string;
  formTitle: string;
  requiresPackageBaseline: boolean;
  formRevision: SurveyFormRevision;
  tehsil: { id: string; name: string };
  procurementPackage: {
    id: string;
    name: string;
    isMobilized: boolean;
    isBaselineComplete: boolean;
  };
  frequency: SurveyFrequency;
  startDate: string;
  endDate: string;
  assignedById: string;
  instructions: string | null;
  responseCount: number;
  createdAt: string;
};

export type SurveyAnswer = {
  fieldId: string;
  value: unknown;
};

export type SurveyResponse = {
  id: string;
  assignmentId: string;
  form: { id: string; title: string };
  procurementPackage: { id: string; name: string };
  formRevision: SurveyFormRevision;
  status: SurveyResponseStatus;
  tehsil: { id: string; name: string };
  village: { id: string; name: string };
  settlement: { id: string; name: string } | null;
  respondent: { id: string; username: string; email: string };
  answers: SurveyAnswer[];
  visitDate: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StartSurveyResponseInput = {
  assignmentId: string;
  villageId: string;
  settlementId?: string | null;
  visitDate?: string | null;
};

export type SaveSurveyResponseInput = {
  answers: SurveyAnswer[];
};

export type SurveyResponsesFilter = {
  formId?: string;
  tehsilId?: string;
  assignmentId?: string;
};

export type Tehsil = {
  id: string;
  name: string;
  villageCount: number;
  createdAt: string;
};

export type Village = {
  id: string;
  name: string;
  tehsilId: string;
  settlementCount: number;
  createdAt: string;
};

export type Settlement = {
  id: string;
  name: string;
  villageId: string;
  createdAt: string;
};

export type ProcurementPackageRef = {
  id: string;
  name: string;
  displayName?: string;
};

export type ProcurementPackage = {
  id: string;
  name: string;
  budgetAmount: string;
  totalExpenses: string;
  remainingBudget: string;
  contractor: ProcurementPackageRef;
  consultant: ProcurementPackageRef;
  tehsil: ProcurementPackageRef & { displayName: string };
  villages: ProcurementPackageRef[];
  createdAt: string;
  updatedAt: string;
};

export type PackageFormBaseline = {
  packageId: string;
  formId: string;
  formTitle: string;
  baselineTitle: string | null;
  baselineDescription: string | null;
  fields: SurveyFormBaselineField[];
  answers: SurveyAnswer[];
  isBaselineComplete: boolean;
  isMobilized: boolean;
  submittedAt: string | null;
  submittedBy: { id: string; username: string; email: string } | null;
  updatedAt: string | null;
};

export type SavePackageBaselineInput = {
  answers: SurveyAnswer[];
};
