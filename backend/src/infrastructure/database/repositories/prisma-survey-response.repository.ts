import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SurveyAnswer,
  SurveyFormRevisionSnapshot,
  SurveyLocationRef,
  SurveyProcurementRef,
  SurveyResponse,
  SurveyResponseRespondentRef,
  SurveyResponseStatus,
} from '../../../domain/entities/survey.entity';
import {
  CreateSurveyResponseData,
  ListSurveyResponsesFilter,
  SurveyAnswerInput,
  SurveyResponseRepositoryPort,
} from '../../../application/ports/survey-response.repository.port';
import { parseRevisionFields } from '../../../application/services/survey-revision.serializer';
import { PrismaService } from '../prisma/prisma.service';

type ResponseRecord = {
  id: string;
  assignmentId: string;
  status: string;
  submittedAt: Date | null;
  visitDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  form: { id: string; title: string };
  assignment: {
    procurementPackage: { id: string; name: string };
  };
  formRevision: {
    id: string;
    version: number;
    fields: unknown;
    publishedAt: Date;
  };
  tehsil: { id: string; name: string };
  village: { id: string; name: string };
  settlement: { id: string; name: string } | null;
  respondent: { id: string; username: string; email: string };
  answers: { fieldId: string; value: unknown }[];
};

function mapRevisionSnapshot(
  revision: ResponseRecord['formRevision'],
): SurveyFormRevisionSnapshot {
  return new SurveyFormRevisionSnapshot(
    revision.id,
    revision.version,
    parseRevisionFields(revision.fields),
    revision.publishedAt,
  );
}

function mapResponse(record: ResponseRecord): SurveyResponse {
  return new SurveyResponse(
    record.id,
    record.assignmentId,
    { id: record.form.id, title: record.form.title },
    new SurveyProcurementRef(
      record.assignment.procurementPackage.id,
      record.assignment.procurementPackage.name,
    ),
    mapRevisionSnapshot(record.formRevision),
    record.status as SurveyResponseStatus,
    new SurveyLocationRef(record.tehsil.id, record.tehsil.name),
    new SurveyLocationRef(record.village.id, record.village.name),
    record.settlement
      ? new SurveyLocationRef(record.settlement.id, record.settlement.name)
      : null,
    new SurveyResponseRespondentRef(
      record.respondent.id,
      record.respondent.username,
      record.respondent.email,
    ),
    record.answers.map((a) => new SurveyAnswer(a.fieldId, a.value)),
    record.visitDate,
    record.submittedAt,
    record.createdAt,
    record.updatedAt,
  );
}

function answerCreateData(responseId: string, answers: SurveyAnswerInput[]) {
  return answers
    .filter((answer) => answer.value !== undefined)
    .map((answer) => ({
      responseId,
      fieldId: answer.fieldId,
      value:
        answer.value === null
          ? Prisma.JsonNull
          : (answer.value as Prisma.InputJsonValue),
    }));
}

@Injectable()
export class PrismaSurveyResponseRepository implements SurveyResponseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    form: { select: { id: true, title: true } },
    assignment: {
      select: {
        procurementPackage: { select: { id: true, name: true } },
      },
    },
    formRevision: {
      select: { id: true, version: true, fields: true, publishedAt: true },
    },
    tehsil: { select: { id: true, name: true } },
    village: { select: { id: true, name: true } },
    settlement: { select: { id: true, name: true } },
    respondent: { select: { id: true, username: true, email: true } },
    answers: { select: { fieldId: true, value: true } },
  };

  async findAll(filter?: ListSurveyResponsesFilter): Promise<SurveyResponse[]> {
    const records = await this.prisma.surveyResponse.findMany({
      where: {
        ...(filter?.tehsilId ? { tehsilId: filter.tehsilId } : {}),
        ...(filter?.formId ? { formId: filter.formId } : {}),
        ...(filter?.assignmentId ? { assignmentId: filter.assignmentId } : {}),
        ...(filter?.respondentId ? { respondentId: filter.respondentId } : {}),
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => mapResponse(r as ResponseRecord));
  }

  async findById(id: string): Promise<SurveyResponse | null> {
    const record = await this.prisma.surveyResponse.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? mapResponse(record) : null;
  }

  async create(data: CreateSurveyResponseData): Promise<SurveyResponse> {
    const record = await this.prisma.surveyResponse.create({
      data: {
        assignmentId: data.assignmentId,
        formId: data.formId,
        formRevisionId: data.formRevisionId,
        respondentId: data.respondentId,
        tehsilId: data.tehsilId,
        villageId: data.villageId,
        settlementId: data.settlementId ?? null,
        visitDate: data.visitDate ?? null,
      },
      include: this.include,
    });
    return mapResponse(record);
  }

  async saveDraftAnswers(
    id: string,
    answers: SurveyAnswerInput[],
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.surveyAnswer.deleteMany({ where: { responseId: id } });
      const rows = answerCreateData(id, answers);
      if (rows.length > 0) {
        await tx.surveyAnswer.createMany({ data: rows });
      }
      return tx.surveyResponse.update({
        where: { id },
        data: { updatedAt: new Date() },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async submit(
    id: string,
    answers: SurveyAnswerInput[],
    submittedAt: Date,
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.surveyAnswer.deleteMany({ where: { responseId: id } });
      const rows = answerCreateData(id, answers);
      if (rows.length > 0) {
        await tx.surveyAnswer.createMany({ data: rows });
      }
      return tx.surveyResponse.update({
        where: { id },
        data: { status: 'SUBMITTED', submittedAt },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async countByFormId(formId: string): Promise<number> {
    return this.prisma.surveyResponse.count({ where: { formId } });
  }
}
