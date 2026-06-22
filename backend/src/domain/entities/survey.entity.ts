export enum SurveyStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum SurveyFieldType {
  TEXT = 'TEXT',
  PARAGRAPH = 'PARAGRAPH',
  CHECKBOXES = 'CHECKBOXES',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DATE = 'DATE',
  DROPDOWN = 'DROPDOWN',
  TIME = 'TIME',
  NUMBER = 'NUMBER',
  CNIC = 'CNIC',
  EMAIL = 'EMAIL',
  CONTACT = 'CONTACT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SECTION_BREAK = 'SECTION_BREAK',
}

export enum SurveyResponseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export enum SurveyFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/** Field types that carry no answer (presentational only). */
export const PRESENTATION_FIELD_TYPES: SurveyFieldType[] = [
  SurveyFieldType.SECTION_BREAK,
];

/** Field types backed by a fixed list of options. */
export const CHOICE_FIELD_TYPES: SurveyFieldType[] = [
  SurveyFieldType.MULTIPLE_CHOICE,
  SurveyFieldType.DROPDOWN,
  SurveyFieldType.CHECKBOXES,
];

export interface SurveyFieldOption {
  value: string;
  label: string;
}

/** References a value on the assignment's procurement package. */
export type PackageFieldReference =
  | 'packageName'
  | 'budgetAmount'
  | 'totalExpenses'
  | 'remainingBudget'
  | 'contractorName'
  | 'consultantName'
  | 'tehsilName';

/** How a NUMBER field affects the procurement package budget when submitted. */
export type SurveyFieldBudgetEffect = 'DEDUCT' | 'ADD';

/** Type-specific configuration persisted as JSON on each field. */
export interface SurveyFieldConfig {
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
  packageReference?: PackageFieldReference;
  /** When true with packageReference, the field is read-only in the form UI. */
  readOnly?: boolean;
  /** Snapshot package value into answers on save/submit (default true). */
  snapshotOnSubmit?: boolean;
  /** Submitted answers adjust package spend (DEDUCT) or credit it (ADD). */
  budgetEffect?: SurveyFieldBudgetEffect;
  /** Read-only field: allocated budget minus committed and in-form deductions. */
  computedRemainingBudget?: boolean;
  /** Read-only field: sum of in-form DEDUCT budget fields. */
  computedVisitDeductions?: boolean;
}

export class SurveyField {
  constructor(
    public readonly id: string,
    public readonly type: SurveyFieldType,
    public readonly label: string,
    public readonly helpText: string | null,
    public readonly required: boolean,
    public readonly order: number,
    public readonly config: SurveyFieldConfig | null,
  ) {}
}

export class SurveyFormBaselineField {
  constructor(
    public readonly id: string,
    public readonly type: SurveyFieldType,
    public readonly label: string,
    public readonly helpText: string | null,
    public readonly required: boolean,
    public readonly writeOnce: boolean,
    public readonly order: number,
    public readonly config: SurveyFieldConfig | null,
  ) {}
}

export class SurveyFormAuthorRef {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
  ) {}
}

export class SurveyForm {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: SurveyStatus,
    public readonly requiresPackageBaseline: boolean,
    public readonly baselineTitle: string | null,
    public readonly baselineDescription: string | null,
    public readonly createdBy: SurveyFormAuthorRef,
    public readonly fields: SurveyField[],
    public readonly baselineFields: SurveyFormBaselineField[],
    public readonly assignmentCount: number,
    public readonly responseCount: number,
    public readonly currentRevisionVersion: number | null,
    public readonly publishedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Frozen published snapshot used by assignments and responses. */
export class SurveyFormRevisionSnapshot {
  constructor(
    public readonly id: string,
    public readonly version: number,
    public readonly fields: SurveyField[],
    public readonly publishedAt: Date,
  ) {}
}

export class SurveyFormRevision extends SurveyFormRevisionSnapshot {
  constructor(
    id: string,
    public readonly formId: string,
    version: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly requiresPackageBaseline: boolean,
    public readonly baselineTitle: string | null,
    public readonly baselineDescription: string | null,
    fields: SurveyField[],
    public readonly baselineFields: SurveyFormBaselineField[],
    publishedAt: Date,
    public readonly createdAt: Date,
  ) {
    super(id, version, fields, publishedAt);
  }
}

export class SurveyTehsilRef {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class SurveyProcurementRef {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly isMobilized: boolean = false,
    public readonly isBaselineComplete: boolean = false,
  ) {}
}

export class SurveyAssignment {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly formTitle: string,
    public readonly requiresPackageBaseline: boolean,
    public readonly formRevision: SurveyFormRevisionSnapshot,
    public readonly tehsil: SurveyTehsilRef,
    public readonly procurementPackage: SurveyProcurementRef,
    public readonly frequency: SurveyFrequency,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly assignedById: string,
    public readonly instructions: string | null,
    public readonly responseCount: number,
    public readonly createdAt: Date,
  ) {}
}

export class SurveyAnswer {
  constructor(
    public readonly fieldId: string,
    public readonly value: unknown,
  ) {}
}

export class SurveyResponseRespondentRef {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
  ) {}
}

export class SurveyLocationRef {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class SurveyResponse {
  constructor(
    public readonly id: string,
    public readonly assignmentId: string,
    public readonly form: { id: string; title: string },
    public readonly procurementPackage: SurveyProcurementRef,
    public readonly formRevision: SurveyFormRevisionSnapshot,
    public readonly status: SurveyResponseStatus,
    public readonly tehsil: SurveyLocationRef,
    public readonly village: SurveyLocationRef,
    public readonly settlement: SurveyLocationRef | null,
    public readonly respondent: SurveyResponseRespondentRef,
    public readonly answers: SurveyAnswer[],
    public readonly visitDate: Date | null,
    public readonly submittedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
