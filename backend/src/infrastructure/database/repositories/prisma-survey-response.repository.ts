import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SurveyAnswer,
  SurveyFormRevisionSnapshot,
  SurveyLocationRef,
  SurveyProcurementRef,
  SurveyResponse,
  SurveyResponseRespondentRef,
  SurveyResponseReviewAction,
  SurveyResponseReviewEvent,
  SurveyResponseStatus,
} from '../../../domain/entities/survey.entity';
import {
  CreateSurveyResponseData,
  FindResponseForSlotParams,
  ListSurveyResponsesFilter,
  ReviewSurveyResponseData,
  SurveyAnswerInput,
  SurveyResponseRepositoryPort,
  SurveySubmissionLocation,
} from '../../../application/ports/survey-response.repository.port';
import { parseRevisionFields } from '../../../application/services/survey-revision.serializer';
import { PrismaService } from '../prisma/prisma.service';

type UserRef = { id: string; username: string; email: string };

type ResponseRecord = {
  id: string;
  assignmentId: string;
  status: string;
  submittedAt: Date | null;
  lastEditedAt: Date | null;
  reviewedAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  revertedAt: Date | null;
  reviewRemarks: string | null;
  submittedLatitude: number | null;
  submittedLongitude: number | null;
  submittedLocationAccuracy: number | null;
  submittedLocationCapturedAt: Date | null;
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
  respondent: UserRef;
  acceptedBy: UserRef | null;
  rejectedBy: UserRef | null;
  revertedBy: UserRef | null;
  answers: { fieldId: string; value: unknown }[];
  reviewEvents: {
    id: string;
    action: string;
    remarks: string | null;
    createdAt: Date;
    actor: UserRef;
  }[];
};

function mapUserRef(user: UserRef | null): SurveyResponseRespondentRef | null {
  if (!user) return null;
  return new SurveyResponseRespondentRef(user.id, user.username, user.email);
}

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
    record.lastEditedAt,
    record.reviewedAt,
    record.acceptedAt,
    mapUserRef(record.acceptedBy),
    record.rejectedAt,
    mapUserRef(record.rejectedBy),
    record.revertedAt,
    mapUserRef(record.revertedBy),
    record.reviewRemarks,
    record.submittedLatitude,
    record.submittedLongitude,
    record.submittedLocationAccuracy,
    record.submittedLocationCapturedAt,
    record.reviewEvents.map(
      (event) =>
        new SurveyResponseReviewEvent(
          event.id,
          event.action as SurveyResponseReviewAction,
          new SurveyResponseRespondentRef(
            event.actor.id,
            event.actor.username,
            event.actor.email,
          ),
          event.remarks,
          event.createdAt,
        ),
    ),
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

type ReviewEventClient = {
  surveyResponseReviewEvent: {
    create(args: {
      data: {
        responseId: string;
        action: SurveyResponseReviewAction;
        actorId: string;
        remarks: string | null;
      };
    }): Promise<unknown>;
  };
};

async function createReviewEvent(
  client: ReviewEventClient,
  data: {
    responseId: string;
    action: SurveyResponseReviewAction;
    actorId: string;
    remarks?: string | null;
  },
): Promise<void> {
  await client.surveyResponseReviewEvent.create({
    data: {
      responseId: data.responseId,
      action: data.action,
      actorId: data.actorId,
      remarks: data.remarks ?? null,
    },
  });
}

const userSelect = { id: true, username: true, email: true } as const;

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
    respondent: { select: userSelect },
    acceptedBy: { select: userSelect },
    rejectedBy: { select: userSelect },
    revertedBy: { select: userSelect },
    answers: { select: { fieldId: true, value: true } },
    reviewEvents: {
      select: {
        id: true,
        action: true,
        remarks: true,
        createdAt: true,
        actor: { select: userSelect },
      },
      orderBy: { createdAt: 'asc' as const },
    },
  };

  async findAll(filter?: ListSurveyResponsesFilter): Promise<SurveyResponse[]> {
    const records = await this.prisma.surveyResponse.findMany({
      where: {
        ...(filter?.tehsilId ? { tehsilId: filter.tehsilId } : {}),
        ...(filter?.formId ? { formId: filter.formId } : {}),
        ...(filter?.assignmentId ? { assignmentId: filter.assignmentId } : {}),
        ...(filter?.respondentId ? { respondentId: filter.respondentId } : {}),
        ...(filter?.status
          ? { status: filter.status as SurveyResponseStatus }
          : {}),
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

  async findFirstForSlot(
    params: FindResponseForSlotParams,
  ): Promise<SurveyResponse | null> {
    const hasWindow = Boolean(params.createdFrom || params.createdTo);
    const record = await this.prisma.surveyResponse.findFirst({
      where: {
        assignmentId: params.assignmentId,
        villageId: params.villageId,
        settlementId: params.settlementId ?? null,
        status: { in: params.statuses },
        ...(hasWindow
          ? {
              createdAt: {
                ...(params.createdFrom ? { gte: params.createdFrom } : {}),
                ...(params.createdTo ? { lt: params.createdTo } : {}),
              },
            }
          : {}),
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
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
    const now = new Date();
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.surveyAnswer.deleteMany({ where: { responseId: id } });
      const rows = answerCreateData(id, answers);
      if (rows.length > 0) {
        await tx.surveyAnswer.createMany({ data: rows });
      }
      await createReviewEvent(tx, {
        responseId: id,
        action: SurveyResponseReviewAction.SAVED,
        actorId: (
          await tx.surveyResponse.findUniqueOrThrow({
            where: { id },
            select: { respondentId: true },
          })
        ).respondentId,
      });
      return tx.surveyResponse.update({
        where: { id },
        data: { lastEditedAt: now, updatedAt: now },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async submit(
    id: string,
    answers: SurveyAnswerInput[],
    submittedAt: Date,
    isResubmit: boolean,
    location: SurveySubmissionLocation,
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.surveyResponse.findUniqueOrThrow({
        where: { id },
        select: { respondentId: true },
      });
      await tx.surveyAnswer.deleteMany({ where: { responseId: id } });
      const rows = answerCreateData(id, answers);
      if (rows.length > 0) {
        await tx.surveyAnswer.createMany({ data: rows });
      }
      await createReviewEvent(tx, {
        responseId: id,
        action: isResubmit
          ? SurveyResponseReviewAction.RESUBMITTED
          : SurveyResponseReviewAction.SUBMITTED,
        actorId: existing.respondentId,
      });
      return tx.surveyResponse.update({
        where: { id },
        data: {
          status: SurveyResponseStatus.SUBMITTED,
          submittedAt,
          lastEditedAt: submittedAt,
          revertedAt: null,
          revertedById: null,
          reviewRemarks: null,
          submittedLatitude: location.latitude,
          submittedLongitude: location.longitude,
          submittedLocationAccuracy: location.accuracyMeters ?? null,
          submittedLocationCapturedAt: location.capturedAt,
          updatedAt: submittedAt,
        },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async accept(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      await createReviewEvent(tx, {
        responseId: id,
        action: SurveyResponseReviewAction.ACCEPTED,
        actorId: data.reviewerId,
        remarks: data.remarks ?? null,
      });
      return tx.surveyResponse.update({
        where: { id },
        data: {
          status: SurveyResponseStatus.ACCEPTED,
          reviewedAt: data.reviewedAt,
          acceptedAt: data.reviewedAt,
          acceptedById: data.reviewerId,
          reviewRemarks: data.remarks ?? null,
          updatedAt: data.reviewedAt,
        },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async reject(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      await createReviewEvent(tx, {
        responseId: id,
        action: SurveyResponseReviewAction.REJECTED,
        actorId: data.reviewerId,
        remarks: data.remarks ?? null,
      });
      return tx.surveyResponse.update({
        where: { id },
        data: {
          status: SurveyResponseStatus.REJECTED,
          reviewedAt: data.reviewedAt,
          rejectedAt: data.reviewedAt,
          rejectedById: data.reviewerId,
          reviewRemarks: data.remarks ?? null,
          updatedAt: data.reviewedAt,
        },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async revert(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse> {
    const record = await this.prisma.$transaction(async (tx) => {
      await createReviewEvent(tx, {
        responseId: id,
        action: SurveyResponseReviewAction.REVERTED,
        actorId: data.reviewerId,
        remarks: data.remarks ?? null,
      });
      return tx.surveyResponse.update({
        where: { id },
        data: {
          status: SurveyResponseStatus.REVERTED,
          reviewedAt: data.reviewedAt,
          revertedAt: data.reviewedAt,
          revertedById: data.reviewerId,
          reviewRemarks: data.remarks ?? null,
          updatedAt: data.reviewedAt,
        },
        include: this.include,
      });
    });
    return mapResponse(record);
  }

  async appendReviewEvent(
    responseId: string,
    action: SurveyResponseReviewAction,
    actorId: string,
    remarks?: string | null,
  ): Promise<void> {
    await createReviewEvent(this.prisma, {
      responseId,
      action,
      actorId,
      remarks: remarks ?? null,
    });
  }

  async countByFormId(formId: string): Promise<number> {
    return this.prisma.surveyResponse.count({ where: { formId } });
  }

  async deleteDraftsByFormId(formId: string): Promise<number> {
    const result = await this.prisma.surveyResponse.deleteMany({
      where: { formId, status: SurveyResponseStatus.DRAFT },
    });
    return result.count;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.surveyResponse.delete({ where: { id } });
  }
}
