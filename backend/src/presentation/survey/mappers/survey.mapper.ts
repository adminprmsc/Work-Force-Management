import {
  SurveyAssignment,
  SurveyField,
  SurveyForm,
  SurveyFormBaselineField,
  SurveyResponse,
} from '../../../domain/entities/survey.entity';

function toFieldResponse(field: SurveyField) {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    order: field.order,
    config: field.config,
  };
}

function toBaselineFieldResponse(field: SurveyFormBaselineField) {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    writeOnce: field.writeOnce,
    order: field.order,
    config: field.config,
  };
}

function toRevisionResponse(revision: {
  id: string;
  version: number;
  fields: SurveyField[];
  publishedAt: Date;
}) {
  return {
    id: revision.id,
    version: revision.version,
    fields: revision.fields.map(toFieldResponse),
    publishedAt: revision.publishedAt,
  };
}

export function toSurveyFormResponse(form: SurveyForm) {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    status: form.status,
    requiresPackageBaseline: form.requiresPackageBaseline,
    baselineTitle: form.baselineTitle,
    baselineDescription: form.baselineDescription,
    createdBy: {
      id: form.createdBy.id,
      username: form.createdBy.username,
      email: form.createdBy.email,
    },
    fields: form.fields.map(toFieldResponse),
    baselineFields: form.baselineFields.map(toBaselineFieldResponse),
    assignmentCount: form.assignmentCount,
    responseCount: form.responseCount,
    currentRevisionVersion: form.currentRevisionVersion,
    publishedAt: form.publishedAt,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

export function toSurveyAssignmentResponse(assignment: SurveyAssignment) {
  return {
    id: assignment.id,
    formId: assignment.formId,
    formTitle: assignment.formTitle,
    requiresPackageBaseline: assignment.requiresPackageBaseline,
    formRevision: toRevisionResponse(assignment.formRevision),
    tehsil: { id: assignment.tehsil.id, name: assignment.tehsil.name },
    procurementPackage: {
      id: assignment.procurementPackage.id,
      name: assignment.procurementPackage.name,
      isMobilized: assignment.procurementPackage.isMobilized,
      isBaselineComplete: assignment.procurementPackage.isBaselineComplete,
    },
    frequency: assignment.frequency,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    assignedById: assignment.assignedById,
    instructions: assignment.instructions,
    responseCount: assignment.responseCount,
    createdAt: assignment.createdAt,
  };
}

export function toSurveyResponseResponse(response: SurveyResponse) {
  return {
    id: response.id,
    assignmentId: response.assignmentId,
    form: response.form,
    procurementPackage: {
      id: response.procurementPackage.id,
      name: response.procurementPackage.name,
    },
    formRevision: toRevisionResponse(response.formRevision),
    status: response.status,
    tehsil: { id: response.tehsil.id, name: response.tehsil.name },
    village: { id: response.village.id, name: response.village.name },
    settlement: response.settlement
      ? { id: response.settlement.id, name: response.settlement.name }
      : null,
    respondent: {
      id: response.respondent.id,
      username: response.respondent.username,
      email: response.respondent.email,
    },
    answers: response.answers.map((answer) => ({
      fieldId: answer.fieldId,
      value: answer.value,
    })),
    visitDate: response.visitDate,
    submittedAt: response.submittedAt,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}
